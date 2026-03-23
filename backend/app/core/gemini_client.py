"""
Shared Gemini client for all text AI tasks.
Uses google-genai with Vertex AI backend.
"""

import re
import json

from google import genai
from google.genai import types
from app.core.config import settings
from app.core.gcp_auth import get_credentials

_client: genai.Client | None = None


def get_gemini_client() -> genai.Client:
    """Return a singleton Gemini client backed by Vertex AI."""
    global _client
    if _client is None:
        credentials = get_credentials()
        _client = genai.Client(
            vertexai=True,
            project=settings.GCP_PROJECT_ID,
            location=settings.GCP_LOCATION,
            credentials=credentials,
        )
    return _client


def gemini_text(prompt: str, system_instruction: str = None, temperature: float = 0.7) -> str:
    """Simple helper: send a text prompt to Gemini and return the text response."""
    client = get_gemini_client()

    config = types.GenerateContentConfig(
        temperature=temperature,
        response_modalities=["TEXT"],
    )
    if system_instruction:
        config.system_instruction = system_instruction

    response = client.models.generate_content(
        model=settings.GEMINI_TEXT_MODEL,
        contents=prompt,
        config=config,
    )
    return response.text


def gemini_json(prompt: str, system_instruction: str = None, temperature: float = 0.7) -> str:
    """Send a text prompt to Gemini requesting JSON output. Returns the raw text (caller parses)."""
    client = get_gemini_client()

    config = types.GenerateContentConfig(
        temperature=temperature,
        response_mime_type="application/json",
        response_modalities=["TEXT"],
    )
    if system_instruction:
        config.system_instruction = system_instruction

    response = client.models.generate_content(
        model=settings.GEMINI_TEXT_MODEL,
        contents=prompt,
        config=config,
    )
    return response.text


def gemini_grounded_text(prompt: str, system_instruction: str = None, temperature: float = 0.7) -> str:
    """Send a prompt to Gemini with Google Search grounding. Returns plain text response."""
    client = get_gemini_client()

    config = types.GenerateContentConfig(
        temperature=temperature,
        response_modalities=["TEXT"],
        tools=[types.Tool(google_search=types.GoogleSearch())],
    )
    if system_instruction:
        config.system_instruction = system_instruction

    response = client.models.generate_content(
        model=settings.GEMINI_TEXT_MODEL,
        contents=prompt,
        config=config,
    )
    return response.text or ""


def gemini_grounded_json(prompt: str, system_instruction: str = None, temperature: float = 0.5) -> str:
    """Send a prompt to Gemini with Google Search grounding enabled.

    Google Search grounding is incompatible with response_mime_type=application/json,
    so we request plain text and extract the JSON block from the response.
    Returns the raw JSON string (caller parses).
    """
    client = get_gemini_client()

    config = types.GenerateContentConfig(
        temperature=temperature,
        response_modalities=["TEXT"],
        tools=[types.Tool(google_search=types.GoogleSearch())],
    )
    if system_instruction:
        config.system_instruction = system_instruction

    response = client.models.generate_content(
        model=settings.GEMINI_TEXT_MODEL,
        contents=prompt,
        config=config,
    )

    text = response.text or ""

    # Extract the first JSON object or array from the response
    match = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", text)
    if match:
        return match.group(0)

    # Fallback: strip markdown code fences if present
    text = re.sub(r"^```(?:json)?\s*", "", text.strip())
    text = re.sub(r"\s*```$", "", text.strip())
    return text


def gemini_vision(prompt: str, image_bytes: bytes, mime_type: str = "image/jpeg", temperature: float = 0.7) -> str:
    """Send an image + text prompt to Gemini. Returns text response."""
    client = get_gemini_client()

    parts = [
        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
        types.Part.from_text(text=prompt),
    ]

    config = types.GenerateContentConfig(
        temperature=temperature,
        response_modalities=["TEXT"],
    )

    response = client.models.generate_content(
        model=settings.GEMINI_TEXT_MODEL,
        contents=parts,
        config=config,
    )
    return response.text


def gemini_vision_json(prompt: str, image_bytes: bytes, mime_type: str = "image/jpeg", temperature: float = 0.7) -> str:
    """Send an image + text prompt to Gemini requesting JSON output."""
    client = get_gemini_client()

    parts = [
        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
        types.Part.from_text(text=prompt),
    ]

    config = types.GenerateContentConfig(
        temperature=temperature,
        response_mime_type="application/json",
        response_modalities=["TEXT"],
    )

    response = client.models.generate_content(
        model=settings.GEMINI_TEXT_MODEL,
        contents=parts,
        config=config,
    )
    return response.text
