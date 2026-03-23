"""
CAD Flatlay generation service.
Given a front image, back image, or both, generates clean CAD-style technical
flatlay renders for front and back views. If one view is not provided the AI
imagines it from the supplied image.
"""

import uuid
from pathlib import Path

from google.genai import types

from app.core.config import settings
from app.core.gemini_client import get_gemini_client


_CAD_STYLE = (
    "Pure white background. "
    "Technical fashion CAD line drawing — clean black ink outlines only, no fill, no shading, no colour. "
    "Flat technical illustration style as used in garment spec sheets and tech packs. "
    "Garment laid perfectly flat, symmetric, straight. "
    "All construction details drawn as precise lines: seams, topstitching, stitch lines, "
    "collar, buttons, buttonholes, zips, pockets, pocket flaps, pleats, darts, hems, waistband, cuffs, and trims. "
    "No model, no mannequin, no shadows, no texture fills, no gradients. "
    "Thin consistent line weight throughout. "
    "Style: professional fashion technical sketch, engineering drawing quality."
)


def _guess_mime(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    return {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }.get(ext, "image/jpeg")


def _save_image(data: bytes, mime_type: str, prefix: str) -> str:
    ext = mime_type.split("/")[-1]
    if ext == "jpeg":
        ext = "jpg"
    generated_dir = Path(settings.GENERATED_DIR) / "cad_flatlays"
    generated_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{prefix}_{uuid.uuid4().hex}.{ext}"
    (generated_dir / filename).write_bytes(data)
    return f"http://localhost:8000/generated/cad_flatlays/{filename}"


def _extract_image_url(response) -> str | None:
    for part in response.candidates[0].content.parts:
        if part.inline_data and part.inline_data.mime_type.startswith("image/"):
            return _save_image(part.inline_data.data, part.inline_data.mime_type, "cad")
    return None


def _generate_view(
    ref_bytes: bytes,
    ref_mime: str,
    ref_label: str,
    view: str,
    imagined: bool,
) -> str | None:
    """Generate a single CAD flatlay view (front or back)."""
    client = get_gemini_client()

    if imagined:
        instruction = (
            f"The image above shows the {ref_label} of a garment. "
            f"Based on this, generate a CAD technical flatlay showing the {view} view. "
            f"Infer what the {view} would look like from the design details visible in the {ref_label}. "
            f"Use the same fabric colour, texture, and construction style."
        )
    else:
        instruction = (
            f"The image above shows the {ref_label} of a garment. "
            f"Generate a clean CAD technical flatlay of exactly this {view} view. "
            f"Faithfully reproduce the colour, fabric, print, and all visible construction details."
        )

    prompt = f"{instruction} {_CAD_STYLE}"

    parts = [
        types.Part.from_text(text=f"[{ref_label} reference]:"),
        types.Part.from_bytes(data=ref_bytes, mime_type=ref_mime),
        types.Part.from_text(text=prompt),
    ]

    try:
        response = client.models.generate_content(
            model=settings.GENAI_MODEL_ID,
            contents=parts,
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )
        return _extract_image_url(response)
    except Exception as e:
        print(f"CAD flatlay generation failed ({view}): {e}")
        return None


def generate_cad_flatlays(
    front_bytes: bytes | None,
    front_filename: str | None,
    back_bytes: bytes | None,
    back_filename: str | None,
) -> dict:
    """
    Generate front and back CAD flatlay images.

    Rules:
    - If front provided → generate front CAD from it directly; if no back → imagine back from front.
    - If back provided → generate back CAD from it directly; if no front → imagine front from back.
    - If both provided → generate each from its own reference.
    """
    front_mime = _guess_mime(front_filename) if front_filename else "image/jpeg"
    back_mime = _guess_mime(back_filename) if back_filename else "image/jpeg"

    front_url: str | None = None
    back_url: str | None = None

    if front_bytes and back_bytes:
        # Both provided — each view uses its own reference
        front_url = _generate_view(front_bytes, front_mime, "front", "front", imagined=False)
        back_url = _generate_view(back_bytes, back_mime, "back", "back", imagined=False)

    elif front_bytes:
        # Only front provided
        front_url = _generate_view(front_bytes, front_mime, "front", "front", imagined=False)
        back_url = _generate_view(front_bytes, front_mime, "front", "back", imagined=True)

    elif back_bytes:
        # Only back provided
        back_url = _generate_view(back_bytes, back_mime, "back", "back", imagined=False)
        front_url = _generate_view(back_bytes, back_mime, "back", "front", imagined=True)

    return {"front_url": front_url, "back_url": back_url}
