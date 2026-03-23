"""
Google Trends service using pytrends.
Fetches real-time interest data for fashion keywords to ground trend analysis.
"""

import time
import logging
from typing import Optional
from pytrends.request import TrendReq

logger = logging.getLogger(__name__)

# Fashion category → seed keywords for Google Trends
_CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "womenswear": ["women fashion 2026", "women clothing trends", "women style"],
    "menswear":   ["men fashion 2026", "men clothing trends", "men style"],
    "streetwear": ["streetwear 2026", "street style trends", "urban fashion"],
    "luxury":     ["luxury fashion 2026", "designer clothing trends", "haute couture"],
    "denim":      ["denim trends 2026", "jeans fashion", "denim styles"],
    "outerwear":  ["outerwear trends 2026", "jacket fashion", "coat trends"],
    "footwear":   ["footwear trends 2026", "shoe fashion", "sneaker trends"],
    "accessories":["accessories trends 2026", "bag trends", "jewelry fashion"],
    "swimwear":   ["swimwear trends 2026", "bikini fashion", "resort wear"],
    "activewear": ["activewear trends 2026", "athleisure fashion", "sportswear style"],
    "ethnicwear": ["ethnic fashion 2026", "traditional wear trends", "ethnic clothing"],
    "kidswear":   ["kids fashion 2026", "children clothing trends", "kidswear"],
}

_DEFAULT_KEYWORDS = ["fashion trends 2026", "clothing trends", "style 2026", "SS26 fashion"]

# Map market names to geo codes
_MARKET_GEO: dict[str, str] = {
    "global": "",
    "us": "US",
    "uk": "GB",
    "europe": "GB",  # pytrends doesn't support multi-country; UK as EU proxy
    "india": "IN",
    "france": "FR",
    "italy": "IT",
    "japan": "JP",
    "china": "CN",
    "australia": "AU",
}


def _get_geo(market: str) -> str:
    return _MARKET_GEO.get(market.lower(), "")


def _build_keywords(category: str) -> list[str]:
    cat_lower = category.lower()
    for key, kws in _CATEGORY_KEYWORDS.items():
        if key in cat_lower or cat_lower in key:
            return kws
    return _DEFAULT_KEYWORDS


def fetch_interest_over_time(category: str, market: str = "global") -> dict:
    """
    Fetch 90-day interest-over-time data for the given category.
    Returns a dict with keyword scores and rising/breakout queries.
    """
    keywords = _build_keywords(category)[:5]  # pytrends max 5
    geo = _get_geo(market)

    try:
        pt = TrendReq(hl="en-US", tz=0, timeout=(10, 25), retries=2, backoff_factor=0.5)
        pt.build_payload(keywords, cat=0, timeframe="today 3-m", geo=geo)

        interest_df = pt.interest_over_time()
        related = pt.related_queries()

        # Summarise average interest per keyword
        scores: dict[str, int] = {}
        if not interest_df.empty:
            for kw in keywords:
                if kw in interest_df.columns:
                    scores[kw] = int(interest_df[kw].mean())

        # Collect rising queries (breakout terms)
        rising_terms: list[str] = []
        for kw in keywords:
            if kw in related and related[kw].get("rising") is not None:
                df = related[kw]["rising"]
                if not df.empty:
                    rising_terms.extend(df["query"].head(5).tolist())

        # Top queries by value
        top_terms: list[str] = []
        for kw in keywords:
            if kw in related and related[kw].get("top") is not None:
                df = related[kw]["top"]
                if not df.empty:
                    top_terms.extend(df["query"].head(5).tolist())

        return {
            "keywords": keywords,
            "average_interest": scores,
            "rising_queries": list(dict.fromkeys(rising_terms))[:15],
            "top_queries": list(dict.fromkeys(top_terms))[:15],
            "geo": geo or "Global",
        }

    except Exception as e:
        logger.warning(f"Google Trends fetch failed for '{category}': {e}")
        return {
            "keywords": keywords,
            "average_interest": {},
            "rising_queries": [],
            "top_queries": [],
            "geo": geo or "Global",
            "error": str(e),
        }


def fetch_interest_by_region(category: str) -> dict:
    """Return interest-by-region breakdown for a category."""
    keywords = _build_keywords(category)[:1]  # one keyword for region map
    try:
        pt = TrendReq(hl="en-US", tz=0, timeout=(10, 25), retries=2, backoff_factor=0.5)
        pt.build_payload(keywords, cat=0, timeframe="today 3-m", geo="")
        region_df = pt.interest_by_region(resolution="COUNTRY", inc_low_vol=False)
        if region_df.empty:
            return {}
        top_countries = (
            region_df[keywords[0]]
            .sort_values(ascending=False)
            .head(10)
            .to_dict()
        )
        return {k: int(v) for k, v in top_countries.items()}
    except Exception as e:
        logger.warning(f"Google Trends region fetch failed: {e}")
        return {}


def build_trends_context(category: str, market: str = "global") -> str:
    """
    Build a plain-text context block from Google Trends data to inject into
    Gemini prompts so it has real signal data alongside its training knowledge.
    """
    data = fetch_interest_over_time(category, market)

    if data.get("error") and not data["average_interest"]:
        return ""  # silently skip if Trends is unavailable

    lines = [
        f"=== REAL-TIME GOOGLE TRENDS DATA (last 90 days, {data['geo']}) ===",
        f"Keywords tracked: {', '.join(data['keywords'])}",
    ]

    if data["average_interest"]:
        lines.append("Average search interest (0–100):")
        for kw, score in data["average_interest"].items():
            lines.append(f"  • {kw}: {score}")

    if data["rising_queries"]:
        lines.append(f"Breakout / rising queries: {', '.join(data['rising_queries'])}")

    if data["top_queries"]:
        lines.append(f"Top related queries: {', '.join(data['top_queries'])}")

    lines.append("Use this data to inform your trend scores and identify which trends are genuinely gaining momentum right now.")
    lines.append("=== END GOOGLE TRENDS DATA ===\n")

    return "\n".join(lines)
