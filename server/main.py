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
from model import simulate_transaction
import pickle
import face_recognition
import base64
import io
from PIL import Image
import numpy as np
from db import reset_db, insert_trans, update_trans, get_cust, set_locked
import base64
import io
from pydub import AudioSegment

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
known_encodings = pickle.load(open("known_encodings.pkl", "rb"))


@app.post("/upload-image")
async def upload_image(request: Request):
    try:
        data = await request.json()
        image_url = data.get("image_url")
        cc_num = data.get("cc_num")
        if not image_url or not cc_num:
            return JSONResponse(
                status_code=400,
                content={"error": "Image URL and transaction ID are required"},
            )

        decoded_data = base64.b64decode(image_url)
        unknown_image = Image.open(io.BytesIO(decoded_data))
        unknown_image_np = np.array(unknown_image)

        # Get the face encoding of the unknown image
        unknown_encoding = face_recognition.face_encodings(unknown_image_np)[0]

        # Compare the unknown face encoding with the known faces encodings
        distances = face_recognition.face_distance(known_encodings, unknown_encoding)

        if distances.mean() < 0.4:
            # Set account lock status to "no"
            await set_locked(cc_num, "no")

            # Match found
            return JSONResponse(status_code=200, content={"success": "Match Found"})
        else:
            return JSONResponse(status_code=400, content={"error": "No match found"})

    except Exception as e:
        return JSONResponse(
            status_code=500, content={"error": f"Failed to upload image: {str(e)}"}
        )


@app.post("/insert-transaction")
async def get_transaction(request: Request):
    try:
        data = await request.json()
        mode = data.get("mode")

        # Determine fraud level based on mode
        match mode:
            case "0":
                mode = "regular"  # No fraud
            case "1":
                mode = "low_fraud"  # Low risk fraud
            case "2":
                mode = "high_fraud"  # High risk fraud
            case _:
                mode = "regular"  # Default to no fraud

        print("Mode:", mode)
        details, risk_score = simulate_transaction(mode)
        if risk_score < 0.4:
            # No fraud detected

            # Here insert transaction into db with fraud false
            await insert_trans(
                int(details.get("cc_num")),
                details.get("merchant"),
                details.get("category"),
                int(details.get("amt")),
                int(details.get("merch_lat")),
                int(details.get("merch_long")),
                "false",
            )

            return JSONResponse(
                status_code=200,
                content={"success": "Transaction inserted successfully"},
            )

        elif risk_score < 0.7:
            # Low Fraud
            print("Low Fraud")
            # Here insert transaction into db with fraud pending
            data = await insert_trans(
                int(details.get("cc_num")),
                details.get("merchant"),
                details.get("category"),
                int(details.get("amt")),
                int(details.get("merch_lat")),
                int(details.get("merch_long")),
                "pending",
            )
            print("Transaction inserted:", data)

            customer = await get_cust(int(data[0].get("cc_num")))
            print("Customer:", customer)
            transaction_details = data[0]
            print("Transaction details:", transaction_details)

            # Set user locked status to false
            await set_locked(data[0].get("cc_num"), "pending low")

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
            data = await insert_trans(
                int(details.get("cc_num")),
                details.get("merchant"),
                details.get("category"),
                int(details.get("amt")),
                int(details.get("merch_lat")),
                int(details.get("merch_long")),
                "pending",
            )

            customer = await get_cust(int(data[0].get("cc_num")))
            transaction_details = data[0]

            # Set user locked status to true
            await set_locked(data[0].get("cc_num"), "pending high")

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
            if request_json["interaction_type"] == "call_details":
                mode = request_json["call"]["metadata"]["mode"]
                transaction_details = request_json["call"]["metadata"][
                    "transaction_details"
                ]
                user_details = request_json["call"]["metadata"]["user_details"]
                llm_client = LlmClient(mode, transaction_details, user_details)
                print("LLM client created")
                async for event in llm_client.draft_begin_message():
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

                request_obj = ResponseRequiredRequest(
                    interaction_type=request_json["interaction_type"],
                    response_id=response_id,
                    transcript=transcript,
                )
                async for event in llm_client.draft_response(request_obj):
                    try:
                        await websocket.send_json(event.__dict__)
                    except Exception as e:
                        print(
                            f"Error sending event via WebSocket: {e} for call_id: {call_id}"
                        )
                    if request_obj.response_id < response_id:
                        print("New response needed, abandoning current draft.")
                        break

        async for data in websocket.iter_json():
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


@app.post("/audio")
async def process_audio(request: Request):
    try:
        # Get the audio file from the request
        form = await request.form()
        audio_file = form.get("audio")

        if not audio_file:
            return JSONResponse(
                status_code=400, content={"error": "No audio file provided"}
            )

        # Read the contents of the uploaded file
        audio_data = await audio_file.read()

        # Use an in-memory bytes buffer
        audio_io = io.BytesIO(audio_data)

        # Load the audio using pydub
        audio_segment = AudioSegment.from_wav(audio_io)

        # Export the audio as a WAV file
        audio_segment.export("output.wav", format="wav")

        return JSONResponse(
            status_code=200, content={"message": "Audio file processed successfully"}
        )

    except Exception as e:
        print(f"Error in process_audio: {e}")
        return JSONResponse(
            status_code=500, content={"error": f"Error processing audio: {str(e)}"}
        )


@app.delete("/reset")
async def reset():
    await reset_db()
    return JSONResponse(
        status_code=200, content={"success": "Database reset successfully"}
    )
