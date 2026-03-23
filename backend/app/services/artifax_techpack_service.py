import json
from app.core.gemini_client import gemini_json


async def generate_techpack(
    style_name: str,
    style_code: str,
    category: str,
    fabric_details: str,
    color_description: str,
    key_features: str,
    target_market: str,
) -> dict:
    prompt = f"""You are a senior technical designer at a global fashion brand with 20 years of production experience.

Create a complete, production-ready tech pack for manufacturing:

Product Information:
- Style Name: {style_name}
- Style Code: {style_code}
- Category: {category}
- Fabric: {fabric_details}
- Color: {color_description}
- Key Features: {key_features}
- Target Market: {target_market}

Return valid JSON with REALISTIC, SPECIFIC technical details (not generic placeholders):
{{
  "style_name": "{style_name}",
  "style_code": "{style_code}",
  "season": "SS25",
  "category": "{category}",
  "fabric_details": "Full fabric composition (e.g., 95% cotton 5% elastane, 180 GSM, jersey knit, pre-washed, enzyme-treated), sourcing country, MOQ per colorway",
  "construction_notes": "Detailed construction: seam types, panel joining sequence, reinforcement areas, pocket construction method, interlining placement and attachment method, pressing requirements",
  "stitch_type": "Main body: 4-thread overlock @ 12 SPI. Topstitch: 2-thread chain @ 8 SPI. Hem: cover stitch. Seam allowance: 1cm throughout except armhole 1.5cm. All raw edges serged.",
  "trim_details": "Button: specs. Zipper: specs. Labels: specs. Hang tag: specs.",
  "bom_table": [
    {{"item": "Main Fabric", "description": "Fabric specs", "quantity": "1.8m per unit (M size)", "supplier_note": "Pre-approved supplier only"}},
    {{"item": "Lining Fabric", "description": "Lining specs", "quantity": "0.5m per unit", "supplier_note": "Match colorway"}},
    {{"item": "Interlining", "description": "Fusible interlining grade", "quantity": "0.3m per unit", "supplier_note": ""}},
    {{"item": "Main Button", "description": "Button specs", "quantity": "5 per unit + 1 spare", "supplier_note": "Approved article only"}},
    {{"item": "Zipper", "description": "Zipper specs", "quantity": "1 per unit", "supplier_note": "YKK only"}},
    {{"item": "Main Label", "description": "Brand woven label", "quantity": "1 per unit", "supplier_note": "Artwork from brand"}},
    {{"item": "Care Label", "description": "Printed care label", "quantity": "1 per unit", "supplier_note": "Country of origin must be stated"}},
    {{"item": "Hang Tag", "description": "Cardboard hang tag", "quantity": "1 per unit", "supplier_note": "Attach with ribbon at collar"}}
  ],
  "size_spec_chart": [
    {{"size": "XS", "chest": "82cm", "waist": "64cm", "hips": "88cm", "length": "Xcm", "shoulder": "37cm"}},
    {{"size": "S", "chest": "86cm", "waist": "68cm", "hips": "92cm", "length": "Xcm", "shoulder": "38.5cm"}},
    {{"size": "M", "chest": "90cm", "waist": "72cm", "hips": "96cm", "length": "Xcm", "shoulder": "40cm"}},
    {{"size": "L", "chest": "96cm", "waist": "78cm", "hips": "102cm", "length": "Xcm", "shoulder": "41.5cm"}},
    {{"size": "XL", "chest": "102cm", "waist": "84cm", "hips": "108cm", "length": "Xcm", "shoulder": "43cm"}},
    {{"size": "XXL", "chest": "110cm", "waist": "92cm", "hips": "116cm", "length": "Xcm", "shoulder": "45cm"}}
  ],
  "care_instructions": "Machine wash 30°C gentle cycle. Do not tumble dry. Iron at medium heat inside out. Do not bleach.",
  "packaging_instructions": "Individual polybag 30x40cm. Garment folded to 25x30cm. Tissue paper wrap for premium.",
  "quality_standards": "Measurement tolerance: ±0.5cm on critical measurements, ±1cm on length. Color fastness: minimum Grade 4 ISO 105-C06."
}}

Replace all 'Xcm' placeholders with appropriate realistic measurements for this {category}. Make all specs specific and production-accurate."""

    raw = gemini_json(
        prompt=prompt,
        system_instruction="You are a senior technical designer. Return valid JSON with realistic, production-specific details.",
        temperature=0.4,
    )
    return json.loads(raw)
