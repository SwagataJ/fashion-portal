import json
from pathlib import Path
from app.core.gemini_client import gemini_json, gemini_vision_json

CATALOG_SCHEMA = """{
  "seo_title": "SEO-optimized product title (max 60 characters, include key search terms)",
  "description": "Compelling 150-word product description highlighting style, fit, occasion suitability, and unique features",
  "bullet_features": ["Feature point 1", "Feature point 2", "Feature point 3", "Feature point 4", "Feature point 5"],
  "keywords": ["kw1", "kw2", "kw3", "kw4", "kw5", "kw6", "kw7", "kw8", "kw9", "kw10"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"],
  "confidence_score": 0.92
}"""


async def generate_product_catalog(
    product_name: str,
    department: str,
    category: str,
    attributes: str,
    image_path: str = None,
) -> dict:
    base_instruction = f"""Generate professional e-commerce catalog content for this fashion product.

Product Details:
- Product Name: {product_name}
- Department: {department}
- Category: {category}
- Attributes/Description: {attributes}

Return a valid JSON object with this exact structure:
{CATALOG_SCHEMA}

Make the content professional, engaging, and optimized for fashion e-commerce SEO."""

    system = "You are a professional fashion e-commerce copywriter and SEO specialist. Always return valid JSON."

    if image_path and Path(image_path).exists():
        with open(image_path, "rb") as f:
            image_data = f.read()
        ext = Path(image_path).suffix.lower()
        mime_type = "image/jpeg" if ext in [".jpg", ".jpeg"] else "image/png"

        raw = gemini_vision_json(
            prompt=base_instruction + "\nUse visual details from the product image to enhance and personalize the catalog content.",
            image_bytes=image_data,
            mime_type=mime_type,
            temperature=0.7,
        )
    else:
        raw = gemini_json(
            prompt=base_instruction,
            system_instruction=system,
            temperature=0.7,
        )

    return json.loads(raw)
