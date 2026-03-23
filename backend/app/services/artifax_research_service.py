import json
from app.core.gemini_client import gemini_json


async def generate_trend_analysis(
    category: str, season: str, region: str, style_keywords: str
) -> dict:
    prompt = f"""You are a senior fashion trend analyst at a global trend forecasting agency.

Analyze current fashion trends for:
- Category: {category}
- Season: {season}
- Region: {region}
- Style Keywords: {style_keywords or 'general market'}

Return a valid JSON object:
{{
  "trend_summary": "Comprehensive 3-4 paragraph trend analysis covering macro aesthetics, key design directions, consumer sentiment, and market momentum",
  "key_silhouettes": [
    "Silhouette 1 — description of shape and styling",
    "Silhouette 2 — description of shape and styling",
    "Silhouette 3 — description",
    "Silhouette 4 — description",
    "Silhouette 5 — description"
  ],
  "key_fabrics": [
    "Fabric 1: name, weight, texture, why it's trending",
    "Fabric 2: name, weight, texture, why it's trending",
    "Fabric 3: name, weight, texture, why it's trending",
    "Fabric 4: name, weight, texture, why it's trending"
  ],
  "key_colors": [
    {{"name": "Color Name", "hex": "#RRGGBB", "season_relevance": "Why this color dominates this season"}},
    {{"name": "Color Name", "hex": "#RRGGBB", "season_relevance": "Why this color dominates this season"}},
    {{"name": "Color Name", "hex": "#RRGGBB", "season_relevance": "Why this color dominates this season"}},
    {{"name": "Color Name", "hex": "#RRGGBB", "season_relevance": "Why this color dominates this season"}},
    {{"name": "Color Name", "hex": "#RRGGBB", "season_relevance": "Why this color dominates this season"}}
  ],
  "market_insight": "Write ONE plain paragraph covering target demographics, purchasing behavior, pricing sensitivity, channel preference, and commercial opportunities"
}}

IMPORTANT: trend_summary and market_insight must be plain strings, NOT nested objects."""

    raw = gemini_json(
        prompt=prompt,
        system_instruction="You are a professional fashion trend analyst at a top forecasting agency. Always return valid JSON only.",
        temperature=0.7,
    )
    return json.loads(raw)


async def generate_competitor_analysis(brand_name: str, category: str) -> dict:
    prompt = f"""You are a fashion industry competitive intelligence analyst.

Conduct a thorough competitive analysis:
- Brand: {brand_name}
- Category: {category}

Return valid JSON:
{{
  "pricing_range": "Write ONE plain paragraph covering entry price, average price, premium range, currency values, and tier positioning. Must be a string, not an object.",
  "common_attributes": [
    "Design attribute 1 commonly found in their line",
    "Design attribute 2",
    "Design attribute 3",
    "Design attribute 4",
    "Design attribute 5",
    "Design attribute 6"
  ],
  "design_gaps": [
    "Gap 1: what they don't offer and why that's an opportunity",
    "Gap 2: underserved style direction or size segment",
    "Gap 3: material or sustainability gap",
    "Gap 4: occasion or lifestyle gap"
  ],
  "opportunity_suggestions": [
    "Opportunity 1: specific actionable design/market opportunity",
    "Opportunity 2: pricing or positioning opportunity",
    "Opportunity 3: product development opportunity",
    "Opportunity 4: collaboration or channel opportunity"
  ],
  "market_position": "Write ONE plain paragraph covering brand positioning, target customer, brand equity, distribution channels, and competitive moat"
}}

IMPORTANT: pricing_range and market_position must be plain strings, NOT nested objects."""

    raw = gemini_json(
        prompt=prompt,
        system_instruction="You are a fashion market researcher. Return valid JSON only.",
        temperature=0.7,
    )
    return json.loads(raw)


async def generate_runway_analysis(season: str, region: str) -> dict:
    prompt = f"""You are a fashion journalist and runway analyst covering the global fashion weeks.

Analyze the {season} runway shows from {region}.

Return valid JSON:
{{
  "top_silhouettes": [
    "Silhouette 1: shape description and which houses led this",
    "Silhouette 2: shape description and key designers",
    "Silhouette 3: emerging silhouette with commercial potential",
    "Silhouette 4: description",
    "Silhouette 5: description"
  ],
  "dominant_colors": [
    {{"name": "Color Name", "hex": "#RRGGBB", "designers": "Key designers who championed this"}},
    {{"name": "Color Name", "hex": "#RRGGBB", "designers": "Key designers"}},
    {{"name": "Color Name", "hex": "#RRGGBB", "designers": "Key designers"}},
    {{"name": "Color Name", "hex": "#RRGGBB", "designers": "Key designers"}},
    {{"name": "Color Name", "hex": "#RRGGBB", "designers": "Key designers"}}
  ],
  "fabric_direction": [
    "Fabric trend 1: material, treatment, drape quality, key looks",
    "Fabric trend 2: description",
    "Fabric trend 3: sustainable or innovative material direction",
    "Fabric trend 4: texture or finish direction"
  ],
  "commercial_translation": "Write ONE plain paragraph explaining how runway trends translate to ready-to-wear and high-street",
  "key_trends": [
    "Trend 1: name and description",
    "Trend 2: name and description",
    "Trend 3: name and description",
    "Trend 4: name and description",
    "Trend 5: name and description",
    "Trend 6: name and description"
  ]
}}"""

    raw = gemini_json(
        prompt=prompt,
        system_instruction="You are a fashion runway analyst. Return valid JSON only.",
        temperature=0.7,
    )
    return json.loads(raw)
