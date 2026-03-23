from pydantic import BaseModel
from typing import Optional


class CopilotMessage(BaseModel):
    role: str
    content: str


class CopilotChatInput(BaseModel):
    messages: list[CopilotMessage]
    context: Optional[str] = None


class CopilotChatOutput(BaseModel):
    response: str
    suggestions: list[str] = []
