import os
import asyncio
from dotenv import load_dotenv
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from concurrent.futures import TimeoutError as ConnectionTimeoutError
from retell import Retell
from custom_types import (
    ConfigResponse,
    ResponseRequiredRequest,
)
from llm import LlmClient
from supabase import create_client, Client

from db import insert_trans, set_locked, get_cust

load_dotenv(override=True)
app = FastAPI()
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

retell = Retell(api_key=os.environ["RETELL_API_KEY"])
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://default.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "defaultSupabaseKey")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


@app.post("/insert-transaction")
async def get_transaction(request: Request):
    try:
        data = await request.json()
        mode = data.get("mode")

        # Use ml model to detect fraud
        mode = 0

        if mode < 0.4:
            # No fraud detected

            # Here insert transaction into db with fraud false
            await insert_trans(
                data.get("cc_num"),
                data.get("merchant"),
                data.get("category"),
                data.get("amt"),
                data.get("merch_lat"),
                data.get("merch_long"),
                "false",
            )
            return JSONResponse(
                status_code=200,
                content={"success": "Transaction inserted successfully"},
            )

        elif mode < 0.7:
            # Low Fraud

            # Here insert transaction into db with fraud pending
            data = await insert_trans(
                data.get("cc_num"),
                data.get("merchant"),
                data.get("category"),
                data.get("amt"),
                data.get("merch_lat"),
                data.get("merch_long"),
                "pending",
            )

            customer = await get_cust(data.get("cc_num"))
            transaction_details = data.get("data")

            # Set user locked status to false
            await set_locked(data.get("cc_num"), "pending low")

            retell.call.create_phone_call(
                from_number="+13192504307",
                to_number="+19095725988",
                metadata={
                    "mode": 0,
                    "transaction_details": transaction_details,
                    "user_details": customer,
                },
            )

            # Call the user to confirm fraud
            return JSONResponse(
                status_code=200,
                content={"success": "Transaction inserted successfully"},
            )
        else:
            # High Fraud

            # Here insert transaaction into db with fraud pending
            await insert_trans(
                data.get("cc_num"),
                data.get("merchant"),
                data.get("category"),
                data.get("amt"),
                data.get("merch_lat"),
                data.get("merch_long"),
                "pending",
            )

            customer = await get_cust(data.get("cc_num"))
            transaction_details = data.get("data")

            # Set user locked status to true
            await set_locked(data.get("cc_num"), "pending high")

            retell.call.create_phone_call(
                from_number="+13192504307",
                to_number="+19095725988",
                metadata={
                    "mode": 1,
                    "transaction_details": transaction_details,
                    "user_details": customer,
                },
            )

            # Call the user to confirm fraud
            return JSONResponse(
                status_code=200,
                content={"success": "Transaction inserted successfully"},
            )

    except Exception as e:
        print(f"Error in get_transaction: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


# WebSocket server for exchanging messages with the Retell server.
@app.websocket("/llm-websocket/{call_id}")
async def websocket_handler(websocket: WebSocket, call_id: str):
    try:
        await websocket.accept()
        llm_client = None

        # Send configuration to the Retell server
        config = ConfigResponse(
            response_type="config",
            config={
                "auto_reconnect": True,
                "call_details": True,
            },
            response_id=1,
        )
        await websocket.send_json(config.__dict__)
        response_id = 0

        async def handle_message(request_json):
            nonlocal response_id
            nonlocal llm_client
            print("Received message:", request_json)  # Debug: log received message
            if request_json["interaction_type"] == "call_details":
                print("Call details received:", request_json)
                mode = request_json["call"]["metadata"]["mode"]
                transaction_details = request_json["call"]["metadata"][
                    "transaction_details"
                ]
                user_details = request_json["call"]["metadata"]["user_details"]
                print(
                    "mode:",
                    mode,
                    "transaction_details:",
                    transaction_details,
                    "user_details:",
                    user_details,
                )
                llm_client = LlmClient(mode, transaction_details, user_details)
                print("LLM client created")
                async for event in llm_client.draft_begin_message():
                    print(
                        "Sending draft begin message:", event.__dict__
                    )  # Debug: log draft message
                    await websocket.send_json(event.__dict__)
                return
            if request_json["interaction_type"] == "ping_pong":
                pong_response = {
                    "response_type": "ping_pong",
                    "timestamp": request_json["timestamp"],
                }
                print("Sending ping pong response:", pong_response)
                await websocket.send_json(pong_response)
                return
            if request_json.get("interaction_type") == "update_only":
                print("Update only interaction received, ignoring.")
                return
            if request_json["interaction_type"] in [
                "response_required",
                "reminder_required",
            ]:
                response_id = request_json["response_id"]
                transcript = request_json.get("transcript", [])
                last_content = (
                    transcript[-1].get("content")
                    if transcript
                    else "No transcript content"
                )
                print(
                    f"Received interaction_type={request_json['interaction_type']}, response_id={response_id}, last_transcript={last_content}"
                )

                request_obj = ResponseRequiredRequest(
                    interaction_type=request_json["interaction_type"],
                    response_id=response_id,
                    transcript=transcript,
                )
                async for event in llm_client.draft_response(request_obj):
                    try:
                        print("Sending response event:", event.__dict__)
                        await websocket.send_json(event.__dict__)
                    except Exception as e:
                        print(
                            f"Error sending event via WebSocket: {e} for call_id: {call_id}"
                        )
                    if request_obj.response_id < response_id:
                        print("New response needed, abandoning current draft.")
                        break

        async for data in websocket.iter_json():
            print("WebSocket received data:", data)
            asyncio.create_task(handle_message(data))

    except WebSocketDisconnect:
        print(f"LLM WebSocket disconnected for {call_id}")
    except ConnectionTimeoutError as e:
        print(f"Connection timeout error for {call_id}: {e}")
    except Exception as e:
        print(f"Error in LLM WebSocket: {e} for call_id: {call_id}")
        await websocket.close(1011, "Server error")
    finally:
        print(f"LLM WebSocket connection closed for {call_id}")
