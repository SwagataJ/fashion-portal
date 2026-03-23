import json
from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def generate_design_concept(
    category: str,
    occasion: str,
    price_segment: str,
    trend_inspiration: str,
) -> dict:
    prompt = f"""You are an expert fashion designer and AI design assistant. Generate a comprehensive design concept for a fashion collection.

Design Parameters:
- Category: {category}
- Occasion: {occasion}
- Price Segment: {price_segment}
- Trend Inspiration: {trend_inspiration}

Return a valid JSON object with exactly this structure:
{{
  "moodboard_description": "A detailed 2-3 paragraph description of the overall mood, aesthetic vision, and target customer lifestyle",
  "color_palette": [
    {{"name": "Color Name", "hex": "#RRGGBB", "description": "Why this color works for this collection"}},
    {{"name": "Color Name", "hex": "#RRGGBB", "description": "Why this color works for this collection"}},
    {{"name": "Color Name", "hex": "#RRGGBB", "description": "Why this color works for this collection"}},
    {{"name": "Color Name", "hex": "#RRGGBB", "description": "Why this color works for this collection"}},
    {{"name": "Color Name", "hex": "#RRGGBB", "description": "Why this color works for this collection"}}
  ],
  "fabric_suggestions": [
    {{"name": "Fabric Name", "reason": "Why this fabric is ideal", "care": "Care instructions"}},
    {{"name": "Fabric Name", "reason": "Why this fabric is ideal", "care": "Care instructions"}},
    {{"name": "Fabric Name", "reason": "Why this fabric is ideal", "care": "Care instructions"}}
  ],
  "style_attributes": ["attribute1", "attribute2", "attribute3", "attribute4", "attribute5"],
  "tech_pack_content": "Detailed technical specification including construction notes, measurement guidelines, hardware details, finishing techniques, stitching specifications, lining details, closure types, labeling requirements, and production quality notes (minimum 300 words)"
}}

Ensure hex colors are valid 6-digit hex codes starting with #. Make the content professional, specific, and fashion-industry accurate."""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "You are a professional fashion design AI. Always return valid JSON.",
            },
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.8,
    )

    return json.loads(response.choices[0].message.content)
