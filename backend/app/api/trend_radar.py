import json
import logging
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from app.core.gemini_client import gemini_grounded_json
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.trend_radar import (
    TrendAnalyzeInput,
    TrendScoutInput,
    BrandCompareInput,
    TrendRadarOutput,
)
from app.services.google_trends_service import build_trends_context

logger = logging.getLogger(__name__)

router = APIRouter(tags=["trend-radar"])


def _trend_system() -> str:
    today = date.today()
    return (
        f"Today's date is {today.strftime('%B %d, %Y')}. "
        "The current active fashion season is SS26 (Spring/Summer 2026). "
        "AW25 (Autumn/Winter 2025) is also in market. SS25 and earlier are past seasons. "
        "When the user refers to 'current', 'now', or 'latest' trends, always ground your response "
        "in SS26 and AW25 — never reference SS24 or earlier as current. "
        "You are an expert fashion trend analyst with deep knowledge of global fashion markets, "
        "runway shows, street style, social media trends, and retail data. "
        "Always return valid JSON matching the requested schema exactly."
    )


@router.post("/analyze", response_model=TrendRadarOutput)
def analyze_trends(
    body: TrendAnalyzeInput,
    current_user: User = Depends(get_current_user),
):
    gt_context = build_trends_context(body.category, body.market)
    prompt = (
        f"{gt_context}"
        f"Analyze current fashion trends for {body.category} in the {body.season} season "
        f"for the {body.market} market. "
        f"Use the Google Trends data above to calibrate trend scores and identify rising momentum.\n\n"
        f"Return a JSON object with:\n"
        f'- "trends": array of 8-12 trend objects, each with:\n'
        f'  - "name": trend name\n'
        f'  - "category": one of "color", "silhouette", "fabric", "print", "fit"\n'
        f'  - "score": 0-100 trend strength score\n'
        f'  - "growth": one of "rising", "stable", "declining"\n'
        f'  - "description": 1-2 sentence description\n'
        f'  - "color_hex": hex color code if category is "color", else null\n'
        f'- "summary": 2-3 sentence overall trend summary\n'
        f'- "season": "{body.season}"'
    )

    try:
        raw = gemini_grounded_json(prompt, system_instruction=_trend_system())
        data = json.loads(raw)
        return TrendRadarOutput(**data)
    except json.JSONDecodeError as e:
        logger.exception("Failed to parse trend analysis JSON")
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {e}")
    except Exception as e:
        logger.exception("Trend analysis failed")
        raise HTTPException(status_code=500, detail=f"Trend analysis failed: {str(e)}")


@router.post("/scout")
def scout_trends(
    body: TrendScoutInput,
    current_user: User = Depends(get_current_user),
):
    category_filter = f" in the {body.category} category" if body.category else ""
    market_filter = f" for the {body.market} market" if body.market else ""
    gt_context = build_trends_context(body.category or body.query, body.market or "global")

    prompt = (
        f"{gt_context}"
        f'Discover fashion trends matching this query: "{body.query}"{category_filter}{market_filter}. '
        f"Use the Google Trends data above to identify which of these trends have real search momentum.\n\n"
        f"Return a JSON object with:\n"
        f'- "trends": array of 5-8 matching trend objects with name, category, score, growth, description, color_hex\n'
        f'- "summary": brief summary of findings\n'
        f'- "season": best matching season code (e.g. "SS26" or "AW26")'
    )

    try:
        raw = gemini_grounded_json(prompt, system_instruction=_trend_system())
        data = json.loads(raw)
        return data
    except json.JSONDecodeError as e:
        logger.exception("Failed to parse scout JSON")
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {e}")
    except Exception as e:
        logger.exception("Trend scouting failed")
        raise HTTPException(status_code=500, detail=f"Trend scouting failed: {str(e)}")


@router.post("/compare")
def compare_brands(
    body: BrandCompareInput,
    current_user: User = Depends(get_current_user),
):
    brands_str = ", ".join(body.brands)
    prompt = (
        f"Compare the brand positioning and trend adoption of these fashion brands: {brands_str} "
        f"in the {body.category} category.\n\n"
        f"Return a JSON object with:\n"
        f'- "brands": array of brand objects, each with:\n'
        f'  - "name": brand name\n'
        f'  - "positioning": brief positioning statement\n'
        f'  - "price_segment": "budget", "mid", "premium", or "luxury"\n'
        f'  - "trend_score": 0-100 how trend-forward they are\n'
        f'  - "key_trends": array of trend names they are adopting\n'
        f'  - "strengths": array of 2-3 strengths\n'
        f'  - "gaps": array of 2-3 opportunity gaps\n'
        f'- "summary": 2-3 sentence comparative summary'
    )

    try:
        raw = gemini_grounded_json(prompt, system_instruction=_trend_system())
        data = json.loads(raw)
        return data
    except json.JSONDecodeError as e:
        logger.exception("Failed to parse brand compare JSON")
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {e}")
    except Exception as e:
        logger.exception("Brand comparison failed")
        raise HTTPException(status_code=500, detail=f"Brand comparison failed: {str(e)}")


@router.get("/top")
def get_top_trends(current_user: User = Depends(get_current_user)):
    gt_context = build_trends_context("fashion", "global")
    prompt = (
        f"{gt_context}"
        "Return the top 5 most impactful fashion trends right now across all categories. "
        "Use the Google Trends data above to ensure scores reflect actual consumer search momentum.\n\n"
        "Return a JSON object with:\n"
        '- "trends": array of 5 trend objects with name, category, score, growth, description, color_hex\n'
        '- "summary": brief 1-sentence summary\n'
        '- "season": current season code'
    )

    try:
        raw = gemini_grounded_json(prompt, system_instruction=_trend_system())
        data = json.loads(raw)
        return data
    except json.JSONDecodeError as e:
        logger.exception("Failed to parse top trends JSON")
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {e}")
    except Exception as e:
        logger.exception("Top trends fetch failed")
        raise HTTPException(status_code=500, detail=f"Top trends failed: {str(e)}")
