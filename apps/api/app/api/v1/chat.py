from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.services.agent import agent_service

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[dict] | None = []


@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Agentic chat endpoint that uses Gemini to call tools and answer shopping queries.
    """
    try:
        full_response = ""
        async for chunk in agent_service.chat_stream(request.message, request.history):
            full_response += chunk
        return {"response": full_response}
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Streaming version of the agentic chat.
    """
    try:
        return StreamingResponse(
            agent_service.chat_stream(request.message, request.history),
            media_type="text/event-stream",
        )
    except Exception as e:
        print(f"Chat Stream Error: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e
