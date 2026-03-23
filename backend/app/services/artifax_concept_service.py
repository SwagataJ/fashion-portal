import uuid
import json
from pathlib import Path

from google.genai import types
from app.core.config import settings
from app.core.gemini_client import get_gemini_client, gemini_json, gemini_vision_json


async def generate_concept_images(
    concept_description: str,
    category: str,
    style: str,
    colors: str,
    count: int = 2,
) -> list:
    """Generate product concept images using Nano Banana (Vertex AI Gemini)."""

    base_prompt = (
        f"High-end fashion design concept visualization.\n"
        f"Concept: {concept_description}\n"
        f"{f'Category: {category}' if category else ''}\n"
        f"{f'Style direction: {style}' if style else ''}\n"
        f"{f'Color palette: {colors}' if colors else ''}\n"
        "Style: Detailed fashion design illustration, professional fashion rendering, "
        "clean studio presentation, pure white background, high-end fashion magazine quality, "
        "sharp linework, sophisticated aesthetic."
    )

    images = []
    actual_count = min(count, 2)

    variations = [
        "Front view, full garment clearly visible, fashion illustration style",
        "Slightly angled 3/4 view, emphasizing silhouette and key design details",
    ]

    client = get_gemini_client()

    for i in range(actual_count):
        variation = variations[i] if i < len(variations) else ""
        full_prompt = f"{base_prompt}\nView: {variation}"

        try:
            response = client.models.generate_content(
                model=settings.GENAI_MODEL_ID,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["TEXT", "IMAGE"],
                ),
            )

            for part in response.candidates[0].content.parts:
                if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                    ext = part.inline_data.mime_type.split("/")[-1]
                    filename = f"concept_{uuid.uuid4()}.{ext}"
                    generated_dir = Path(settings.GENERATED_DIR)
                    generated_dir.mkdir(exist_ok=True)

                    (generated_dir / filename).write_bytes(part.inline_data.data)
                    images.append(f"http://localhost:8000/generated/{filename}")
                    break
        except Exception as e:
            print(f"Concept image generation failed: {e}")

    return images


async def generate_color_palette(
    concept: str, mood: str, season: str, count: int = 5
) -> dict:
    """Generate a cohesive fashion color palette using Gemini."""

    prompt = f"""You are a professional fashion colorist and creative director.

Generate a cohesive color palette for:
- Concept/Collection: {concept}
- Mood: {mood or 'sophisticated and modern'}
- Season: {season or 'current season'}
- Number of colors: {count}

Return valid JSON:
{{
  "palette_name": "An evocative, poetic name for this color palette",
  "mood_description": "2-3 sentences describing the emotional feeling, atmosphere, and visual story this palette tells",
  "palette": [
    {{"name": "Color Name", "hex": "#RRGGBB", "description": "The emotional role and character of this color", "usage": "primary"}},
    {{"name": "Color Name", "hex": "#RRGGBB", "description": "Description", "usage": "secondary"}},
    {{"name": "Color Name", "hex": "#RRGGBB", "description": "Description", "usage": "accent"}},
    {{"name": "Color Name", "hex": "#RRGGBB", "description": "Description", "usage": "neutral"}},
    {{"name": "Color Name", "hex": "#RRGGBB", "description": "Description", "usage": "highlight"}}
  ]
}}

Ensure colors are: sophisticated, commercially viable, work together as a cohesive collection palette."""

    raw = gemini_json(
        prompt=prompt,
        system_instruction="You are a professional fashion colorist. Return valid JSON only.",
        temperature=0.8,
    )
    return json.loads(raw)


async def extract_colors_from_image(image_path: str) -> dict:
    """Extract a fashion color palette from an uploaded image using Gemini vision."""

    with open(image_path, "rb") as f:
        image_data = f.read()

    ext = Path(image_path).suffix.lower()
    mime_type = "image/jpeg" if ext in [".jpg", ".jpeg"] else "image/png"

    prompt = """Analyze this image and extract a fashion color palette from it.

Return valid JSON:
{
  "palette_name": "Evocative palette name inspired by the image colors",
  "mood_description": "2-3 sentences describing the mood and aesthetic of this color combination for fashion use",
  "palette": [
    {"name": "Color Name", "hex": "#RRGGBB", "description": "Description of this color's role", "usage": "primary/secondary/accent/neutral/highlight"},
    ...
  ]
}

Extract 5 significant colors. Use accurate hex values that match what you see."""

    raw = gemini_vision_json(
        prompt=prompt,
        image_bytes=image_data,
        mime_type=mime_type,
    )
    return json.loads(raw)
