import json
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
from typing import Optional
from socket_manager import manager
from llm import LlmClient  # or use .llm_with_func_calling


load_dotenv(override=True)
app = FastAPI()
origins = [
    "http://localhost:3000",  # Your React frontend
    # Add other origins if needed
    # "https://yourdomain.com",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
retell = Retell(api_key=os.environ["RETELL_API_KEY"])

