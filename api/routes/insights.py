from typing import Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel
import data.cache as cache

router = APIRouter(tags=["Catalog & Cache Insights"])

# ─────────────────────────────────────────────────────
# Curated Catalog Feeds
# ─────────────────────────────────────────────────────

@router.get("/api/trends")
def get_trends():
    return [
        {"id": 1, "name": "Compound AI Systems", "growth": "+450%", "sentiment": "positive", "category": "Tech"},
        {"id": 2, "name": "Sustainable Supply Chain", "growth": "+120%", "sentiment": "positive", "category": "Logistics"},
        {"id": 3, "name": "Hyper-Personalization", "growth": "+85%", "sentiment": "neutral", "category": "Consumer"},
        {"id": 4, "name": "Remote Health Monitoring", "growth": "+200%", "sentiment": "positive", "category": "Health"},
        {"id": 5, "name": "Voice-First Interfaces", "growth": "+150%", "sentiment": "mixed", "category": "Tech"},
        {"id": 6, "name": "FinOps Tools", "growth": "+300%", "sentiment": "positive", "category": "Finance"}
    ]

@router.get("/api/competitors")
def get_competitors():
    return [
        {
            "id": 1, "name": "RecruitAI", "overlap": 85, "saturation": 90, 
            "differentiator": "Enterprise Focus", "pricing": "$50k/yr", "logo": "R"
        },
        {
            "id": 2, "name": "SourceBot", "overlap": 60, "saturation": 45, 
            "differentiator": "Chrome Extension", "pricing": "$29/mo", "logo": "S"
        },
        {
            "id": 3, "name": "TalentFlow", "overlap": 40, "saturation": 70, 
            "differentiator": "ATS Integration", "pricing": "$199/mo", "logo": "T"
        },
        {
            "id": 4, "name": "HireFast", "overlap": 25, "saturation": 30, 
            "differentiator": "Speed", "pricing": "Freemium", "logo": "H"
        },
        {
            "id": 5, "name": "AutoHunter", "overlap": 75, "saturation": 65, 
            "differentiator": "Email Automation", "pricing": "$499/mo", "logo": "A"
        }
    ]

@router.get("/api/market-gaps")
def get_market_gaps():
    return {
        "heatmap": [
            { "painPoint": "Manual Data Entry", "segments": [{"val": 90, "label": "High"}, {"val": 40, "label": "Low"}, {"val": 65, "label": "Med"}] },
            { "painPoint": "Compliance Risk", "segments": [{"val": 20, "label": "Low"}, {"val": 85, "label": "High"}, {"val": 50, "label": "Med"}] },
            { "painPoint": "Integration Friction", "segments": [{"val": 75, "label": "High"}, {"val": 30, "label": "Low"}, {"val": 60, "label": "Med"}] },
            { "painPoint": "Cost Sensitivity", "segments": [{"val": 95, "label": "High"}, {"val": 10, "label": "Low"}, {"val": 55, "label": "Med"}] },
        ],
        "segments": ["SMBs / Founders", "Enterprise", "Mid-Market Agencies"],
        "gap_chart": [
            { "name": "Auto-Sourcing", "gap": 85, "current": 30 },
            { "name": "Pricing Transparency", "gap": 70, "current": 40 },
            { "name": "MobileFirst UX", "gap": 60, "current": 20 },
            { "name": "Open API", "gap": 50, "current": 80 },
        ]
    }

@router.get("/api/ideation")
def get_ideation():
    return [
        {
            "id": 1,
            "title": "AI-Powered Technical Co-Founder",
            "description": "An autonomous AI agent that handles boilerplate code, project scaffolding, and initial architecture design for non-technical founders.",
            "targetAudience": "Non-technical founders, early-stage startups",
            "revenueModel": "SaaS Subscription ($49-$199/mo)",
            "feasibility": 85,
            "innovation": 90,
            "impact": 80,
            "status": "High Potential"
        },
        {
            "id": 2,
            "title": "Automated Competitor Tracking API",
            "description": "A developer-first API that actively scrapes and summarizes competitor pricing changes, feature releases, and market positioning.",
            "targetAudience": "Product managers, growth teams, VC analysts",
            "revenueModel": "API Usage Based ($0.05/request)",
            "feasibility": 90,
            "innovation": 75,
            "impact": 85,
            "status": "Quick Win"
        }
    ]

# ─────────────────────────────────────────────────────
# Cache Telemetry & Management Endpoints
# ─────────────────────────────────────────────────────

@router.get("/api/cache/stats")
def get_cache_statistics():
    """Returns real-time metrics on cache entries, validity, and namespace breakdowns."""
    return cache.get_cache_stats()

@router.post("/api/cache/purge")
def purge_cache_entries(namespace: Optional[str] = Query(default=None, description="Optional namespace to purge")):
    """Purges cached entries across all namespaces or a specific namespace."""
    deleted_count = cache.purge_cache(namespace=namespace)
    return {"status": "purged", "namespace": namespace or "all", "deleted_count": deleted_count}

# ─────────────────────────────────────────────────────
# Cloud-Synced Saved Insights (Supabase)
# ─────────────────────────────────────────────────────

from data.supabase_client import (
    save_insight_to_supabase,
    list_insights_from_supabase,
    delete_insight_from_supabase,
    update_insight_note_in_supabase
)

class SavedInsightPayload(BaseModel):
    id: str
    type: str
    title: str
    content: dict | list | str
    founder_note: Optional[str] = None
    analysis_id: Optional[str] = None
    user_id: Optional[str] = "default_user"

class NoteUpdatePayload(BaseModel):
    founder_note: str

@router.get("/api/saved-insights")
def get_saved_insights(user_id: str = "default_user"):
    """Fetches user's saved insights from Supabase PostgreSQL."""
    items = list_insights_from_supabase(user_id=user_id)
    # Map founder_note to founderNote for frontend compatibility
    for item in items:
        if "founder_note" in item and "founderNote" not in item:
            item["founderNote"] = item["founder_note"]
    return {"status": "success", "insights": items}

@router.post("/api/saved-insights")
def save_insight_endpoint(insight: SavedInsightPayload):
    """Saves or updates an insight directly in Supabase."""
    data = {
        "id": insight.id,
        "user_id": insight.user_id or "default_user",
        "analysis_id": insight.analysis_id,
        "type": insight.type,
        "title": insight.title,
        "content": insight.content,
        "founder_note": insight.founder_note
    }
    saved = save_insight_to_supabase(data)
    return {"status": "success", "insight": saved}

@router.delete("/api/saved-insights/{insight_id}")
def delete_insight_endpoint(insight_id: str):
    """Deletes an insight from Supabase."""
    success = delete_insight_from_supabase(insight_id)
    return {"status": "success" if success else "failed"}

@router.put("/api/saved-insights/{insight_id}/note")
def update_insight_note(insight_id: str, payload: NoteUpdatePayload):
    """Updates founder note on a saved insight in Supabase."""
    success = update_insight_note_in_supabase(insight_id, payload.founder_note)
    return {"status": "success" if success else "failed"}


