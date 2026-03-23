import uuid
from pathlib import Path

from google.genai import types
from app.core.config import settings
from app.core.gemini_client import get_gemini_client, gemini_vision

BACKGROUND_PROMPTS = {
    "white_studio": "pure white seamless studio background, professional high-key lighting",
    "lifestyle": "modern lifestyle interior setting, warm ambient natural lighting",
    "gradient": "smooth gradient background from soft lavender to warm cream, professional studio lighting",
    "outdoor": "elegant outdoor lifestyle setting with soft bokeh, natural golden hour light",
    "minimal": "minimalist light grey background, soft diffused studio lighting, subtle drop shadow",
}

STYLE_PROMPTS = {
    "Studio": "professional catalog photography, clean studio lighting, sharp product focus, fashion e-commerce style",
    "Lifestyle": "lifestyle fashion photography, natural feel, editorial magazine style, authentic atmosphere",
    "Editorial": "high fashion editorial photography, dramatic artistic lighting, luxury magazine quality",
    "E-commerce": "clean e-commerce product photography, perfectly even lighting, consistent white or light background",
}


async def generate_enhanced_product_image(
    image_path: str,
    background_type: str,
    shooting_style: str,
) -> str:
    with open(image_path, "rb") as f:
        image_data = f.read()

    ext = Path(image_path).suffix.lower()
    mime_type = "image/jpeg" if ext in [".jpg", ".jpeg"] else "image/png"

    # Step 1: Describe the product using Gemini vision
    description_prompt = (
        "Describe this fashion product in precise detail for a professional photo shoot. "
        "Include: exact garment type, colors, fabric texture appearance, cut/silhouette, "
        "pattern details, design elements, embellishments, hardware, and overall style aesthetic."
    )

    product_description = gemini_vision(
        prompt=description_prompt,
        image_bytes=image_data,
        mime_type=mime_type,
    )

    background_desc = BACKGROUND_PROMPTS.get(
        background_type, "professional studio background"
    )
    style_desc = STYLE_PROMPTS.get(shooting_style, "professional fashion photography")

    generation_prompt = (
        f"Professional fashion product photography: {product_description}\n\n"
        f"Background: {background_desc}\n"
        f"Photography style: {style_desc}\n"
        "Quality requirements: Ultra high-end fashion photography, tack sharp focus, "
        "perfect color accuracy, flawless professional retouching, no imperfections.\n"
        "Important: Product only, no mannequins, no people. "
        "Ghost mannequin or flat lay presentation, product perfectly styled and arranged. "
        "Feature only the single most prominent garment in the image — exclude all other clothing items, accessories, or background products."
    )

    # Step 2: Generate enhanced image with Nano Banana (Vertex AI Gemini)
    try:
        client = get_gemini_client()

        parts = [
            types.Part.from_bytes(data=image_data, mime_type=mime_type),
            types.Part.from_text(text=generation_prompt),
        ]

        response = client.models.generate_content(
            model=settings.GENAI_MODEL_ID,
            contents=parts,
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )

        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                img_ext = part.inline_data.mime_type.split("/")[-1]
                filename = f"{uuid.uuid4()}.{img_ext}"
                generated_dir = Path(settings.GENERATED_DIR)
                generated_dir.mkdir(exist_ok=True)

                (generated_dir / filename).write_bytes(part.inline_data.data)
                return filename

        raise RuntimeError("No image returned from Gemini model")

    except Exception as e:
        print(f"Photogenix image generation failed: {e}")
        raise
