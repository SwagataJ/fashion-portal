import uuid
from pathlib import Path

from google.genai import types
from app.core.config import settings
from app.core.gemini_client import get_gemini_client

ANGLE_DESCRIPTIONS = {
    "Front": "straight-on front view, full garment visible",
    "Back": "rear back view showing full back construction",
    "Side": "clean 45-degree side profile view",
    "Detail": "extreme close-up macro shot focusing on fabric texture, stitching, and embellishment details",
    "Flat": "professional flat-lay product photography on pure white surface from directly above",
}


async def generate_product_visualization(attributes: dict, angle: str = "Front") -> dict:
    """Generate a detailed product visualization using Nano Banana (Vertex AI Gemini)."""

    garment_type = attributes.get("garment_type", "garment")
    sleeve_length = attributes.get("sleeve_length", "")
    neck_type = attributes.get("neck_type", "")
    fit = attributes.get("fit", "")
    fabric_texture = attributes.get("fabric_texture", "")
    print_pattern = attributes.get("print_pattern", "Solid")
    color = attributes.get("color", "")
    length = attributes.get("length", "")
    additional = attributes.get("additional_details", "")

    angle_desc = ANGLE_DESCRIPTIONS.get(angle, "front view")

    prompt = (
        f"Professional fashion product visualization for commercial catalog:\n\n"
        f"Garment: {garment_type}\n"
        f"Sleeve: {sleeve_length}\n"
        f"Neckline: {neck_type}\n"
        f"Fit: {fit}\n"
        f"Length: {length}\n"
        f"Fabric: {fabric_texture}\n"
        f"Pattern: {print_pattern}\n"
        f"Color: {color}\n"
        f"{f'Special details: {additional}' if additional else ''}\n\n"
        f"View: {angle_desc}\n\n"
        "Presentation: Ghost mannequin or flat lay on a pure white background. "
        "Professional e-commerce product photography lighting. "
        "Sharp focus on all construction details. "
        "High-end fashion catalog quality. "
        "No people, no faces, no skin."
    )

    try:
        client = get_gemini_client()

        response = client.models.generate_content(
            model=settings.GENAI_MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )

        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                ext = part.inline_data.mime_type.split("/")[-1]
                filename = f"viz_{uuid.uuid4()}.{ext}"
                generated_dir = Path(settings.GENERATED_DIR)
                generated_dir.mkdir(exist_ok=True)

                (generated_dir / filename).write_bytes(part.inline_data.data)

                return {
                    "image_url": f"http://localhost:8000/generated/{filename}",
                    "angle": angle,
                    "prompt_used": prompt[:300],
                }

        raise RuntimeError("No image returned from Gemini model")

    except Exception as e:
        print(f"Visualization generation failed: {e}")
        return {
            "image_url": None,
            "angle": angle,
            "prompt_used": prompt[:300],
            "error": str(e),
        }
