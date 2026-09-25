import os
from typing import Dict, Any, List, Optional
import structlog
from config.config import settings

logger = structlog.get_logger(__name__)

_supabase_client = None

def get_supabase_client():
    """Initializes and returns the singleton Supabase client."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not settings.supabase_url or not settings.supabase_anon_key:
        logger.warning("Supabase credentials not configured in settings. Falling back to local mode.")
        return None

    try:
        from supabase import create_client, Client
        _supabase_client = create_client(settings.supabase_url, settings.supabase_anon_key)
        logger.info("Supabase client successfully initialized", url=settings.supabase_url)
        return _supabase_client
    except Exception as e:
        logger.error("Failed to initialize Supabase client", error=str(e))
        return None

# ── User Operations ──────────────────────────────────────────────────────────
def get_user_profile(user_id: str = "default_user") -> Optional[Dict[str, Any]]:
    client = get_supabase_client()
    if not client:
        return None
    try:
        res = client.table("users").select("*").eq("id", user_id).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        return None
    except Exception as e:
        logger.error("Supabase get_user_profile failed", error=str(e))
        return None

def upsert_user_profile(user_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    client = get_supabase_client()
    if not client:
        return None
    try:
        res = client.table("users").upsert(user_data).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        return user_data
    except Exception as e:
        logger.error("Supabase upsert_user_profile failed", error=str(e))
        return None

# ── Analysis Operations ──────────────────────────────────────────────────────
def sync_analysis_to_supabase(record: Dict[str, Any]) -> bool:
    client = get_supabase_client()
    if not client:
        return False
    try:
        data = {
            "id": record["id"],
            "user_id": record.get("user_id", "default_user"),
            "raw_text": record.get("raw_text", ""),
            "context_tags": record.get("context_tags", {}),
            "status": record.get("status", "pending"),
            "progress_percentage": record.get("progress_percentage", 0),
            "agent_statuses": record.get("agent_statuses", {}),
            "agent_metrics": record.get("agent_metrics", {}),
            "result": record.get("result"),
            "error": record.get("error")
        }
        client.table("analyses").upsert(data).execute()
        return True
    except Exception as e:
        logger.warning("Supabase sync_analysis failed", error=str(e))
        return False

def get_analysis_from_supabase(analysis_id: str) -> Optional[Dict[str, Any]]:
    client = get_supabase_client()
    if not client:
        return None
    try:
        res = client.table("analyses").select("*").eq("id", analysis_id).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        return None
    except Exception as e:
        logger.error("Supabase get_analysis failed", error=str(e))
        return None

# ── Saved Insights Operations ────────────────────────────────────────────────
def save_insight_to_supabase(insight: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    client = get_supabase_client()
    if not client:
        return None
    try:
        import uuid
        payload = dict(insight)
        if "id" not in payload:
            payload["id"] = f"insight-{uuid.uuid4().hex[:10]}"
        if "data_json" not in payload and "content" in payload:
            payload["data_json"] = payload["content"]
        if "content" not in payload and "data_json" in payload:
            payload["content"] = payload["data_json"]
            
        res = client.table("saved_insights").upsert(payload).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        return payload
    except Exception as e:
        logger.error("Supabase save_insight failed", error=str(e))
        return None

def list_insights_from_supabase(user_id: str = "default_user") -> List[Dict[str, Any]]:
    client = get_supabase_client()
    if not client:
        return []
    try:
        res = client.table("saved_insights").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return res.data or []
    except Exception as e:
        logger.error("Supabase list_insights failed", error=str(e))
        return []

def delete_insight_from_supabase(insight_id: str) -> bool:
    client = get_supabase_client()
    if not client:
        return False
    try:
        client.table("saved_insights").delete().eq("id", insight_id).execute()
        return True
    except Exception as e:
        logger.error("Supabase delete_insight failed", error=str(e))
        return False

def update_insight_note_in_supabase(insight_id: str, note: str) -> bool:
    client = get_supabase_client()
    if not client:
        return False
    try:
        client.table("saved_insights").update({"founder_note": note}).eq("id", insight_id).execute()
        return True
    except Exception as e:
        logger.error("Supabase update_insight_note failed", error=str(e))
        return False


# ── Notification Operations ──────────────────────────────────────────────────
def create_notification_in_supabase(notif: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    client = get_supabase_client()
    if not client:
        return None
    try:
        import uuid
        payload = dict(notif)
        if "id" not in payload:
            payload["id"] = f"notif-{uuid.uuid4().hex[:12]}"
        res = client.table("notifications").insert(payload).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        return payload
    except Exception as e:
        logger.error("Supabase create_notification failed", error=str(e))
        return None

def get_notifications_from_supabase(user_id: str = "default_user", limit: int = 30) -> List[Dict[str, Any]]:
    client = get_supabase_client()
    if not client:
        return []
    try:
        res = client.table("notifications").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
        return res.data or []
    except Exception as e:
        logger.error("Supabase get_notifications failed", error=str(e))
        return []

def mark_notifications_read_in_supabase(user_id: str = "default_user", notif_id: Optional[str] = None) -> bool:
    client = get_supabase_client()
    if not client:
        return False
    try:
        query = client.table("notifications").update({"is_read": True}).eq("user_id", user_id)
        if notif_id:
            query = query.eq("id", notif_id)
        query.execute()
        return True
    except Exception as e:
        logger.error("Supabase mark_notifications_read failed", error=str(e))
        return False

# ── Shared Reports Permalinks ────────────────────────────────────────────────
def create_shared_report_in_supabase(share_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    client = get_supabase_client()
    if not client:
        return None
    try:
        payload = dict(share_data)
        payload.setdefault("user_id", "default_user")
        res = client.table("shared_reports").insert(payload).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        return payload
    except Exception as e:
        logger.error("Supabase create_shared_report failed", error=str(e))
        return None
    except Exception as e:
        logger.error("Supabase create_shared_report failed", error=str(e))
        return None

def get_shared_report_from_supabase(token: str) -> Optional[Dict[str, Any]]:
    client = get_supabase_client()
    if not client:
        return None
    try:
        res = client.table("shared_reports").select("*, analyses(*)").eq("token", token).eq("is_active", True).execute()
        if res.data and len(res.data) > 0:
            # Increment view count in background
            client.table("shared_reports").update({"views_count": (res.data[0].get("views_count") or 0) + 1}).eq("token", token).execute()
            return res.data[0]
        return None
    except Exception as e:
        logger.error("Supabase get_shared_report failed", error=str(e))
        return None
