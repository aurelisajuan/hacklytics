import json
import os
import uuid 
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
from typing import Optional
from socket_manager import manager
from llm import LlmClient
from supabase import create_client, Client
from datetime import datetime

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
                transaction_details = request_json["call"]["metadata"]["transaction_details"]
                user_details = request_json["call"]["metadata"]["user_details"]
                print("mode:", mode, "transaction_details:", transaction_details, "user_details:", user_details)
                llm_client = LlmClient(mode, transaction_details, user_details)
                print("LLM client created")
                async for event in llm_client.draft_begin_message():
                    print("Sending draft begin message:", event.__dict__)  # Debug: log draft message
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
            if request_json["interaction_type"] in ["response_required", "reminder_required"]:
                response_id = request_json["response_id"]
                transcript = request_json.get("transcript", [])
                last_content = transcript[-1].get("content") if transcript else "No transcript content"
                print(f"Received interaction_type={request_json['interaction_type']}, response_id={response_id}, last_transcript={last_content}")

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
                        print(f"Error sending event via WebSocket: {e} for call_id: {call_id}")
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


def insert_trans(cc_num: str, merchant: str, category: str, amt: float, merch_lat: float, merch_long: float):
    """
    Insert a transaction into the database.

    Parameters:
        cc_num (str): Credit card number (linked to customer)
        merchant (str): Merchant name
        category (str): Transaction category
        amt (float): Transaction amount
        merch_lat (float): Merchant latitude
        merch_long (float): Merchant longitude

    Returns:
        dict: Success or error message.
    """
    try:
        print("Checking for customer with cc_num:", cc_num)
        customer_query = supabase.table("customer").select("*").eq("cc", cc_num).maybe_single().execute()
        print("Customer query response:", customer_query)
        customer = customer_query.data

        if not customer:
            error_message = f"Customer with cc_num {cc_num} not found"
            print(error_message)
            return {"error": error_message}
        
        user_id = customer["id"]
        print("Customer found, user_id:", user_id)

        trans_num = str(uuid.uuid4())
        trans_time = datetime.now().isoformat()
        new_transaction = {
            "trans_num": trans_num,
            "trans_date": trans_time.split("T")[0],  # YYYY-MM-DD
            "trans_time": trans_time,  # Full timestamp
            "merchant": merchant,
            "category": category,
            "amt": amt,
            "merch_lat": merch_lat,
            "merch_long": merch_long,
            "is_fraud": "no",
            "cc_num": cc_num,
            "user_id": user_id,
        }
        print("Inserting new transaction:", new_transaction)

        insert_response = supabase.table("transactions").insert(new_transaction).execute()

        print("Insert response:", insert_response)

        response_data = insert_response.get("data")
        if not response_data:
            return {"error": "No data returned from insert. Possibly an error occurred."}

        print("Insert response:", insert_response)

        if insert_response.error:
            error_message = f"Error inserting transaction: {insert_response.error}"
            print(error_message)
            return {"error": error_message}
        
        success_message = f"Transaction inserted successfully: {new_transaction}"
        print(success_message)
        return {"success": success_message, "data": insert_response.data}
    
    except Exception as e:
        error_message = f"Exception in insert_trans: {e}"
        print(error_message)
        return {"error": error_message}
    

# Run test
response = insert_trans(
    cc_num="3502088871723054",  
    merchant="fraud_Altenwerth-Kilback",
    category="home",
    amt=27.12,
    merch_lat=38.0298,
    merch_long=-77.0793
)
print("Final insert_trans response:", response)
