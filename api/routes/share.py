import uuid
import structlog
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from data.supabase_client import (
    create_shared_report_in_supabase,
    get_shared_report_from_supabase,
    get_analysis_from_supabase
)
import data.database as local_db

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["Share Reports"])

class ShareRequest(BaseModel):
    title: Optional[str] = None
    is_public: bool = True

@router.post("/api/analysis/{analysis_id}/share")
def share_analysis(analysis_id: str, req: ShareRequest):
    """Generates a public share token and permalink for an analysis report."""
    # Verify analysis exists in Supabase or SQLite
    analysis = get_analysis_from_supabase(analysis_id)
    if not analysis:
        # Fallback to local DB
        local_rec = local_db.get_analysis(analysis_id)
        if not local_rec:
            raise HTTPException(status_code=404, detail="Analysis report not found.")
        # Ensure analysis exists in Supabase so foreign key constraint succeeds
        from data.supabase_client import sync_analysis_to_supabase
        sync_analysis_to_supabase(local_rec)
        analysis = local_rec

    token = uuid.uuid4().hex[:16]
    title = req.title or (analysis.get("result") or {}).get("title") or analysis.get("raw_text", "Startup Analysis")[:60]
    
    share_record = {
        "analysis_id": analysis_id,
        "token": token,
        "title": title,
        "is_active": True,
        "views_count": 0
    }
    
    created = create_shared_report_in_supabase(share_record)
    share_url = f"/share/{token}"

    return {
        "status": "success",
        "token": token,
        "share_url": share_url,
        "title": title
    }

@router.get("/api/share/{token}")
def get_shared_report(token: str):
    """Fetches public report data for the given token."""
    shared = get_shared_report_from_supabase(token)
    if not shared:
        raise HTTPException(status_code=404, detail="Shared report not found or link has expired.")

    analysis_id = shared.get("analysis_id")
    analysis = shared.get("analyses")
    if not analysis and analysis_id:
        analysis = get_analysis_from_supabase(analysis_id) or local_db.get_analysis(analysis_id)

    if not analysis:
        raise HTTPException(status_code=404, detail="Underlying analysis content no longer available.")

    return {
        "token": token,
        "title": shared.get("title"),
        "created_at": shared.get("created_at"),
        "views_count": shared.get("views_count", 1),
        "analysis": {
            "id": analysis.get("id"),
            "raw_text": analysis.get("raw_text"),
            "context_tags": analysis.get("context_tags"),
            "status": analysis.get("status"),
            "result": analysis.get("result"),
            "created_at": analysis.get("created_at")
        }
    }
