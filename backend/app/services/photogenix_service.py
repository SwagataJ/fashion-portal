import uuid
from pathlib import Path

from google.genai import types
from app.core.config import settings
from app.core.gemini_client import get_gemini_client, gemini_vision

SCENE_PROMPTS = {
    "studio":          "clean professional studio, seamless backdrop",
    "outdoor":         "outdoor natural setting, soft daylight",
    "urban_street":    "urban street environment, city backdrop",
    "luxury_interior": "opulent luxury interior, marble and gold accents",
    "runway":          "fashion runway, dramatic spotlights",
    "beach":           "beach setting, soft golden hour light",
    "cafe":            "cosy café interior, warm ambient light",
    "rooftop":         "city rooftop at dusk, skyline backdrop",
    "boutique":        "high-end fashion boutique interior",
    "desert":          "desert landscape, warm sun-baked hues",
    "editorial":       "editorial studio, artistic moody atmosphere",
}

LIGHTING_PROMPTS = {
    "Softbox":          "soft even softbox studio lighting",
    "Natural Daylight": "crisp natural daylight, soft shadows",
    "Warm Golden":      "warm golden hour light, sun-kissed glow",
    "Dramatic":         "dramatic chiaroscuro lighting, deep shadows",
    "High-Fashion":     "high-fashion strobe lighting, crisp and punchy",
    "Moody":            "moody low-key atmospheric lighting",
}

CAMERA_PROMPTS = {
    "Full Body":      "full body shot from head to toe",
    "Close-up":       "close-up upper-body shot",
    "Editorial Crop": "editorial three-quarter crop",
    "E-commerce":     "clean front-facing e-commerce shot",
    "3/4 Angle":      "three-quarter angle view",
}

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


async def generate_on_model_image(
    image_path: str,
    # Model Studio params
    gender: str = "female",
    age_range: str = "25-30",
    ethnicity: str = "diverse",
    body_type: str = "slim",
    pose: str = "standing",
    expression: str = "natural",
    shoot_mood: str = "editorial",
    # Scene Builder params
    background_type: str = "studio",
    lighting: str = "Softbox",
    camera_angle: str = "Full Body",
    warmth: float = 0.5,
    custom_scene_prompt: str = "",
) -> str:
    """Generate an on-model visualisation by dressing an AI model in the uploaded garment
    inside an AI-generated scene, using Model Studio + Scene Builder parameters."""

    with open(image_path, "rb") as f:
        image_data = f.read()

    ext = Path(image_path).suffix.lower()
    mime_type = "image/jpeg" if ext in [".jpg", ".jpeg"] else "image/png"

    # Step 1: Describe the garment
    product_description = gemini_vision(
        prompt=(
            "Describe this fashion garment in precise detail for a professional photo shoot. "
            "Include: exact garment type, colors, fabric texture, cut/silhouette, pattern, "
            "design elements, embellishments, and overall style aesthetic. Be specific and concise."
        ),
        image_bytes=image_data,
        mime_type=mime_type,
    )

    # Step 2: Build scene + model descriptors
    scene_desc = SCENE_PROMPTS.get(background_type, "professional studio")
    lighting_desc = LIGHTING_PROMPTS.get(lighting, "professional studio lighting")
    camera_desc = CAMERA_PROMPTS.get(camera_angle, "full body shot")
    warmth_desc = "warm tones" if warmth > 0.6 else ("cool tones" if warmth < 0.4 else "neutral tones")

    scene_full = custom_scene_prompt.strip() if custom_scene_prompt else (
        f"{scene_desc}, {lighting_desc}, {warmth_desc}"
    )

    generation_prompt = (
        f"High-end fashion editorial photograph.\n\n"
        f"Model: {gender}, age {age_range}, {ethnicity} ethnicity, {body_type} build, "
        f"{pose} pose, {expression} expression.\n\n"
        f"Garment: The model is wearing the following garment — {product_description}\n\n"
        f"Scene: {scene_full}\n"
        f"Camera: {camera_desc}\n"
        f"Mood: {shoot_mood}\n\n"
        "Quality: Ultra high-end fashion photography, magazine-quality, "
        "perfect lighting, professional retouching, 4K resolution. "
        "The garment must be clearly visible, faithfully rendered, and worn naturally on the model. "
        "No logos, no watermarks."
    )

    # Step 3: Generate with product image as visual reference
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
                filename = f"onmodel_{uuid.uuid4()}.{img_ext}"
                generated_dir = Path(settings.GENERATED_DIR)
                generated_dir.mkdir(exist_ok=True)
                (generated_dir / filename).write_bytes(part.inline_data.data)
                return filename

        raise RuntimeError("No image returned from Gemini model")

    except Exception as e:
        print(f"On-model generation failed: {e}")
        raise
