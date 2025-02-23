from dotenv import load_dotenv

load_dotenv()

from openai import AsyncOpenAI
from typing import List, Dict, Any
import os
from custom_types import (
    ResponseRequiredRequest,
    ResponseResponse,
    Utterance,
    ToolCallInvocationResponse,
    ToolCallResultResponse,
    AgentInterruptResponse,
)
from db import update_trans, set_locked
from prompts import (
    authorization_agent_prompt,
    fraud_agent_prompt,
)
import json


class LlmClient:
    def __init__(self, mode: int, transaction_details: str, user_details: str):
        """
        Initialize LLM client

        Args:
            mode (int): Mode 0 = Authorization Agent, Mode 1 = Fraud Agent
            transaction_details (str): Transaction details in format:
                {
                    merchant: string;
                    category: string;
                    trans_num: string;
                    trans_date: string;
                    trans_time: string;
                    amt: number;
                    merch_lat: number;
                    merch_long: number;
                    is_fraud: string;
                    cc_num: string;
                    user_id: string;
                }
            user_details (str): Customer details in format:
                {
                    first_name: string;
                    last_name: string;
                    cc: string;
                    street: string;
                    city: string;
                    state: string;
                    zip: number;
                    lat: number;
                    long: number;
                    job: string;
                    dob: string;
                    gender: string;
                    is_locked: boolean;
                }
        """
        self.client = AsyncOpenAI(
            api_key=os.environ["OPENAI_API_KEY"],
        )
        # Mode 0 = Authorization Agent, Mode 1 = Fraud Agent
        self.mode = mode
        self.transaction_details = transaction_details
        self.user_details = user_details

    async def draft_begin_message(self):
        print("Drafting begin message")
        messages = [
            {
                "role": "system",
                "content": (
                    authorization_agent_prompt if self.mode == 0 else fraud_agent_prompt
                ),
            },
            {
                "role": "user",
                "content": f"(Here are the details of the transaction: {self.transaction_details}. Here are the details of the user: {self.user_details}. What is the first thing you say to the user?)",
            },
        ]

        stream = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            stream=True,
        )
        print("Stream created")

        async for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                response = ResponseResponse(
                    response_id=0,
                    content=chunk.choices[0].delta.content,
                    content_complete=False,
                    end_call=False,
                )
                yield response

        response = ResponseResponse(
            response_id=0,
            content="",
            content_complete=True,
            end_call=False,
        )

        yield response

    def convert_transcript_to_openai_messages(self, transcript: List[Utterance]):
        messages = []
        for utterance in transcript:
            if utterance.role == "agent":
                messages.append({"role": "assistant", "content": utterance.content})
            else:
                messages.append({"role": "user", "content": utterance.content})
        return messages

    def prepare_prompt(self, request: ResponseRequiredRequest):
        prompt = [
            {
                "role": "system",
                "content": (
                    authorization_agent_prompt if self.mode == 0 else fraud_agent_prompt
                ),
            },
            {
                "role": "user",
                "content": f"(Here are the details of the transaction: {self.transaction_details}. Here are the details of the user: {self.user_details}. What is the first thing you say to the user?)",
            },
        ]
        transcript_messages = self.convert_transcript_to_openai_messages(
            request.transcript
        )
        for message in transcript_messages:
            prompt.append(message)

        if request.interaction_type == "reminder_required":
            prompt.append(
                {
                    "role": "user",
                    "content": "(Now the user has not responded in a while, you would say:)",
                }
            )
        return prompt

    def prepare_functions(self) -> List[Dict[str, Any]]:
        """
        Define the available function calls for the assistant.
        """
        end_call_function = {
            "type": "function",
            "function": {
                "name": "hangup",
                "description": "End the call with a custom message",
                "parameters": {
                    "type": "object",
                    "properties": {"message": {"type": "string"}},
                    "required": ["message"],
                },
            },
        }

        if self.mode == 0:
            return [
                {
                    "type": "function",
                    "function": {
                        "name": "authorize",
                        "description": "Record whether user authorized the transaction",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "response": {"type": "string", "enum": ["yes", "no"]}
                            },
                            "required": ["response"],
                        },
                    },
                },
                end_call_function,
            ]
        elif self.mode == 1:
            return [
                {
                    "type": "function",
                    "function": {
                        "name": "confirmFraud",
                        "description": "Confirm that the transaction is fraudulent",
                    },
                },
                end_call_function,
            ]

    async def draft_response(self, request: ResponseRequiredRequest):
        # Initialize conversation with the user prompt.
        conversation = self.prepare_prompt(request)
        response_id = request.response_id
        print("Functions:", self.prepare_functions())

        # Loop until no new tool calls are generated.
        while True:
            func_calls = {}
            stream = await self.client.chat.completions.create(
                model="gpt-4o-mini",  # Or use a 3.5 model for speed.
                messages=conversation,
                stream=True,
                tools=self.prepare_functions(),
            )
            tool_calls = False
            # Process streaming response.
            async for chunk in stream:
                if not chunk.choices:
                    continue

                delta = chunk.choices[0].delta

                # Accumulate function call parts.
                if delta.tool_calls:
                    tool_calls = True
                    for tc in delta.tool_calls:
                        idx = tc.index
                        if idx not in func_calls:
                            func_calls[idx] = tc
                        else:
                            func_calls[idx].function.arguments += (
                                tc.function.arguments or ""
                            )

                # Yield any text content.
                if delta.content and not tool_calls:
                    yield ResponseResponse(
                        response_id=response_id,
                        content=delta.content,
                        content_complete=False,
                        end_call=False,
                    )

            print("Accumulated function calls:", func_calls)

            # If no tool calls were made, we're done.
            if not func_calls:
                break

            # Process each tool call (handle multiple calls if present).
            new_messages = []
            for idx in sorted(func_calls.keys()):
                fc = func_calls[idx]

                # Append the assistant message that originally triggered the function call.
                new_messages.append(
                    {"role": "assistant", "tool_calls": [fc], "content": ""}
                )

                try:
                    args = json.loads(fc.function.arguments)
                except Exception:
                    args = {}

                print("Processing function call:", fc.function.name)
                yield ToolCallInvocationResponse(
                    tool_call_id=fc.id,
                    name=fc.function.name,
                    arguments=fc.function.arguments,
                )

                # Process the function call and append a tool response.
                if fc.function.name == "hangup":
                    print("Hangup:", args.get("message", ""))
                    yield ResponseResponse(
                        response_id=response_id,
                        content=args.get("message", ""),
                        content_complete=True,
                        end_call=True,
                    )
                    yield ToolCallResultResponse(
                        tool_call_id=fc.id,
                        content=args.get("message", ""),
                    )
                    return
                elif fc.function.name == "authorize":
                    response = args.get("response")
                    output = f"Authorization recorded as: {response}"
                    print("Output:", output)

                    # Set is_fraud to "no" in the db
                    await update_trans(
                        self.transaction_details.get("trans_num"),
                        {"is_fraud": "yes" if response == "no" else "no"},
                    )

                    if response == "no":
                        await set_locked(
                            self.transaction_details.get("cc_num"),
                            "yes",
                        )

                    new_messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": fc.id,
                            "content": output,
                        }
                    )
                    yield ToolCallResultResponse(
                        tool_call_id=fc.id,
                        content=output,
                    )
                elif fc.function.name == "confirmFraud":
                    output = "Fraud confirmation recorded"
                    print("Output:", output)

                    # Set is_fraud to "yes" in the db
                    await update_trans(
                        self.transaction_details.get("trans_num"),
                        {"is_fraud": "yes"},
                    )

                    await set_locked(
                        self.transaction_details.get("cc_num"),
                        "yes",
                    )

                    new_messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": fc.id,
                            "content": output,
                        }
                    )
                    yield ToolCallResultResponse(
                        tool_call_id=fc.id,
                        content=output,
                    )

            # Extend the conversation with the tool call responses.
            conversation.extend(new_messages)

        # After all rounds, yield a final complete response.
        yield ResponseResponse(
            response_id=response_id,
            content="",
            content_complete=True,
            end_call=False,
        )
