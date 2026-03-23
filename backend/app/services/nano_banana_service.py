"""
Nano Banana generation service — powered by Google Vertex AI (Gemini).
Generates visual merchandising mockups using multimodal image generation.
Supports fixture-aware generation with garment images.
"""

import uuid
from pathlib import Path

from google.genai import types

from app.core.config import settings
from app.core.gemini_client import get_gemini_client
from sqlalchemy.orm import Session
from app.models.vm_tower import DesignIntent, VMLayout, ConceptLock, Fixture, ProductRange


def generate_mockup(db: Session, layout_id: int, user_id: int, custom_prompt: str = None) -> VMLayout:
    """Legacy: generate mockup without fixture."""
    return generate_mockup_with_fixture(db, layout_id, user_id, custom_prompt=custom_prompt)


def generate_mockup_with_fixture(
    db: Session,
    layout_id: int,
    user_id: int,
    custom_prompt: str = None,
    fixture_id: int = None,
    garment_product_ids: list[int] = None,
    designer_instructions: str = None,
) -> VMLayout:
    layout = db.query(VMLayout).filter(
        VMLayout.id == layout_id,
        VMLayout.user_id == user_id
    ).first()
    if not layout:
        return None

    intent = db.query(DesignIntent).filter(DesignIntent.id == layout.intent_id).first()
    lock = db.query(ConceptLock).filter(
        ConceptLock.intent_id == layout.intent_id,
        ConceptLock.is_active == 1
    ).first()

    fixture = None
    if fixture_id:
        fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()

    garment_products = []
    if garment_product_ids:
        garment_products = db.query(ProductRange).filter(
            ProductRange.id.in_(garment_product_ids)
        ).all()

    # Auto-include ALL products for this intent when none were explicitly selected
    # This ensures individual product images are always sent alongside range images
    all_products = db.query(ProductRange).filter(
        ProductRange.intent_id == layout.intent_id
    ).all()
    if not garment_products and all_products:
        garment_products = all_products

    # Build prompt — now includes product catalog details
    prompt = _build_mockup_prompt(intent, layout, lock, custom_prompt, fixture, designer_instructions, garment_products)
    layout.mockup_prompt = prompt

    # Collect range images from intent if no fixture was specified
    range_image_urls = []
    if not fixture and intent:
        raw_items = intent.key_piece_priority or []
        range_image_urls = [
            item["image_url"] for item in raw_items
            if isinstance(item, dict) and item.get("type") == "range_image" and item.get("image_url")
        ]

    # Generate image
    if fixture and fixture.image_url and garment_products:
        # Fixture-aware: send fixture image + garment images
        image_path = _call_nano_banana_with_images(prompt, fixture, garment_products)
    elif fixture and fixture.image_url:
        # Fixture image only, no garment images
        image_path = _call_nano_banana_with_fixture(prompt, fixture)
    elif range_image_urls or garment_products:
        # Use range images + product images as visual context
        image_path = _call_nano_banana_with_range(prompt, range_image_urls, garment_products)
    else:
        # Text-only prompt
        image_path = _call_nano_banana(prompt)

    if image_path:
        layout.mockup_image_url = image_path

    db.commit()
    db.refresh(layout)
    return layout


def _build_mockup_prompt(
    intent: DesignIntent,
    layout: VMLayout,
    lock: ConceptLock = None,
    custom_prompt: str = None,
    fixture: Fixture = None,
    designer_instructions: str = None,
    products: list[ProductRange] = None,
) -> str:
    if custom_prompt:
        base = custom_prompt
    else:
        base = f"Professional visual merchandising display for a {intent.target_store_type} fashion store"

    layout_desc = ""
    if layout.layout_type == "wall_story":
        layout_desc = "wall-mounted display with shelving and hanging products"
    elif layout.layout_type == "fixture":
        layout_desc = "center table fixture with folded and styled garments"
    elif layout.layout_type == "mannequin":
        layout_desc = "styled mannequins showcasing complete outfits"
    elif layout.layout_type == "focal_display":
        layout_desc = "spotlight focal display at store entrance"

    color_str = ", ".join(intent.color_flow or ["neutral"])

    mood_map = {
        "minimal": "clean, minimal, Scandinavian-inspired",
        "premium": "luxury, premium, high-end retail",
        "vibrant": "colorful, energetic, bold",
        "relaxed": "casual, relaxed, approachable",
    }
    mood_desc = mood_map.get(intent.visual_mood, "professional")

    prompt = (
        f"{base}. "
        f"Theme: {intent.theme}, Season: {intent.season}. "
        f"Layout: {layout_desc}. "
        f"Color palette: {color_str}. "
        f"Style: {mood_desc} aesthetic. "
    )

    # Add specific product descriptions so the model knows exactly what garments to show
    if products:
        product_lines = []
        for p in products[:15]:  # Limit to avoid prompt overflow
            desc = p.name
            if p.color:
                desc += f" ({p.color})"
            if p.category:
                desc += f" [{p.category}]"
            if p.fabric:
                desc += f" — {p.fabric}"
            product_lines.append(f"  • {desc}")
        prompt += (
            "EXACT GARMENTS TO DISPLAY (these are the actual products in this collection — "
            "show ONLY these items, matching their colours and styles precisely):\n"
            + "\n".join(product_lines) + "\n"
        )

    # Add fixture context
    if fixture:
        prompt += f"Fixture: {fixture.name} ({fixture.fixture_type}"
        if fixture.dimensions:
            prompt += f", {fixture.dimensions}"
        prompt += "). "
        if fixture.position_labels:
            prompt += f"Product positions: {', '.join(fixture.position_labels)}. "
        if fixture.hidden_prompt:
            prompt += f"{fixture.hidden_prompt}. "

    # Add designer instructions
    if designer_instructions:
        prompt += f"Designer instructions: {designer_instructions}. "

    prompt += "Photorealistic retail interior photography, professional lighting, high-end visual merchandising, editorial quality."

    return prompt


def _call_nano_banana_with_range(prompt: str, range_urls: list[str], products: list[ProductRange]) -> str | None:
    """Send range images + product images + prompt (no fixture)."""
    try:
        client = get_gemini_client()
        parts = []

        for url in range_urls:
            try:
                img_bytes = _read_image(url)
                mime = _guess_mime(url)
                parts.append(types.Part.from_text(text="[Range Reference]:"))
                parts.append(types.Part.from_bytes(data=img_bytes, mime_type=mime))
            except Exception:
                continue

        for product in (products or []):
            if not product.image_url:
                continue
            try:
                garment_bytes = _read_image(product.image_url)
                garment_mime = _guess_mime(product.image_url)
                label = product.name
                if product.color:
                    label += f" — {product.color}"
                if product.category:
                    label += f" ({product.category})"
                parts.append(types.Part.from_text(text=f"[Product: {label}]:"))
                parts.append(types.Part.from_bytes(data=garment_bytes, mime_type=garment_mime))
            except Exception:
                continue

        if not parts:
            return _call_nano_banana(prompt)

        parts.append(types.Part.from_text(text=(
            "CRITICAL REQUIREMENT: The images above are the EXACT garments in this collection. "
            "Generate a VM display mockup that features these SPECIFIC garments — reproduce their "
            "precise colours, patterns, silhouettes, and fabric textures faithfully. "
            "Do NOT invent, replace, or substitute any garments with generic items. "
            "The mockup must look like a real store display containing exactly these products.\n\n"
            + prompt
        )))

        response = client.models.generate_content(
            model=settings.GENAI_MODEL_ID,
            contents=parts,
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )
        return _extract_image(response)
    except Exception as e:
        print(f"Nano Banana range generation failed: {e}")
        return None


def _call_nano_banana(prompt: str) -> str | None:
    """Text-only prompt generation."""
    try:
        client = get_gemini_client()
        parts = [types.Part.from_text(text=prompt)]
        response = client.models.generate_content(
            model=settings.GENAI_MODEL_ID,
            contents=parts,
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )
        return _extract_image(response)
    except Exception as e:
        print(f"Nano Banana generation failed: {e}")
        return None


def _call_nano_banana_with_fixture(prompt: str, fixture: Fixture) -> str | None:
    """Send fixture image + text prompt."""
    try:
        client = get_gemini_client()
        parts = []

        # Add fixture image
        fixture_bytes = _read_image(fixture.image_url)
        fixture_mime = _guess_mime(fixture.image_url)
        parts.append(types.Part.from_text(text="[Fixture Background]:"))
        parts.append(types.Part.from_bytes(data=fixture_bytes, mime_type=fixture_mime))

        # Add prompt
        parts.append(types.Part.from_text(text=prompt))

        response = client.models.generate_content(
            model=settings.GENAI_MODEL_ID,
            contents=parts,
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )
        return _extract_image(response)
    except Exception as e:
        print(f"Nano Banana fixture generation failed: {e}")
        return None


def _call_nano_banana_with_images(prompt: str, fixture: Fixture, products: list[ProductRange]) -> str | None:
    """Send fixture image + garment images + text prompt (full multimodal)."""
    try:
        client = get_gemini_client()
        parts = []

        # Add fixture image
        fixture_bytes = _read_image(fixture.image_url)
        fixture_mime = _guess_mime(fixture.image_url)
        parts.append(types.Part.from_text(text="[Fixture Background]:"))
        parts.append(types.Part.from_bytes(data=fixture_bytes, mime_type=fixture_mime))

        # Add garment images with labels
        position_labels = fixture.position_labels or []
        for i, product in enumerate(products):
            if not product.image_url:
                continue
            try:
                garment_bytes = _read_image(product.image_url)
                garment_mime = _guess_mime(product.image_url)
                label = position_labels[i] if i < len(position_labels) else f"Position {i + 1}"
                parts.append(types.Part.from_text(text=f"[{label} — {product.name}]:"))
                parts.append(types.Part.from_bytes(data=garment_bytes, mime_type=garment_mime))
            except Exception:
                continue

        # Add prompt
        parts.append(types.Part.from_text(text=(
            "CRITICAL REQUIREMENT: The garment images above show the ACTUAL products to place "
            "in this VM display. You MUST reproduce each garment's exact colours, patterns, and "
            "silhouette as labelled. Place them on the fixture shown in [Fixture Background], "
            "matching each garment to its labelled position. Do NOT invent or substitute any items.\n\n"
            + prompt
        )))

        response = client.models.generate_content(
            model=settings.GENAI_MODEL_ID,
            contents=parts,
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )
        return _extract_image(response)
    except Exception as e:
        print(f"Nano Banana multimodal generation failed: {e}")
        return None


def _extract_image(response) -> str | None:
    """Extract image from Gemini response and save to disk."""
    for part in response.candidates[0].content.parts:
        if part.inline_data and part.inline_data.mime_type.startswith("image/"):
            ext = part.inline_data.mime_type.split("/")[-1]
            filename = f"mockup_{uuid.uuid4().hex}.{ext}"
            generated_dir = Path(settings.GENERATED_DIR) / "vm_mockups"
            generated_dir.mkdir(parents=True, exist_ok=True)
            filepath = generated_dir / filename
            filepath.write_bytes(part.inline_data.data)
            return f"/generated/vm_mockups/{filename}"
    print("No image returned from Gemini model")
    return None


def _read_image(rel_url: str) -> bytes:
    """Read image bytes from local storage path."""
    # Strip leading slash and convert URL to file path
    clean = rel_url.lstrip("/")
    abs_path = Path(clean)
    if not abs_path.exists():
        # Try from backend root
        abs_path = Path(settings.UPLOAD_DIR).parent / clean
    return abs_path.read_bytes()


def _guess_mime(path: str) -> str:
    ext = Path(path).suffix.lower()
    return {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }.get(ext, "image/png")
