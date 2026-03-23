import json
from datetime import date

from app.core.gemini_client import gemini_grounded_json
from app.services.google_trends_service import build_trends_context


def _system() -> str:
    today = date.today()
    return (
        f"Today's date is {today.strftime('%B %d, %Y')}. "
        "Season context: SS26 (Spring/Summer 2026) is the current in-market season. "
        "AW25 (Autumn/Winter 2025) is also currently in retail. "
        "AW26 (Autumn/Winter 2026) is the next upcoming season — designers are showing and buyers are planning for it now. "
        "SS25 and earlier are past seasons. "
        "When a query references AW26, treat it as forward-looking planning intelligence. "
        "Always ground your response in current real-world data — never fabricate brand names, "
        "designer collections, or trend information. "
        "Return valid JSON only."
    )


async def generate_trend_analysis(
    category: str, season: str, region: str, style_keywords: str
) -> dict:
    gt_context = build_trends_context(category, region)

    prompt = f"""{gt_context}
You are a senior fashion trend analyst at a global trend forecasting agency.
Use the Google Trends data above alongside live web sources to ground your analysis in real consumer signals.

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

    raw = gemini_grounded_json(prompt=prompt, system_instruction=_system(), temperature=0.7)
    return json.loads(raw)


async def generate_competitor_analysis(brand_name: str, category: str) -> dict:
    gt_context = build_trends_context(category, "global")

    prompt = f"""{gt_context}
You are a fashion industry competitive intelligence analyst.
Use live web sources and the Google Trends data above to provide accurate, current intelligence.

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

    raw = gemini_grounded_json(prompt=prompt, system_instruction=_system(), temperature=0.7)
    return json.loads(raw)


async def generate_runway_analysis(season: str, region: str) -> dict:
    gt_context = build_trends_context("fashion", region)

    prompt = f"""{gt_context}
You are a fashion journalist and runway analyst covering the global fashion weeks.
Search the web for actual {season} runway coverage from {region} — designer show reports,
Vogue, WWD, Business of Fashion, and fashion week recaps.
Use the Google Trends data above to identify which runway directions are gaining real consumer traction.

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

    raw = gemini_grounded_json(prompt=prompt, system_instruction=_system(), temperature=0.7)
    return json.loads(raw)
