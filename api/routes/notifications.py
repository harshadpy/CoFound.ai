import structlog
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from data.supabase_client import (
    get_notifications_from_supabase,
    mark_notifications_read_in_supabase,
    create_notification_in_supabase
)

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str = "info" # info, success, warning, analysis_complete
    link: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

@router.get("")
def list_notifications(user_id: str = "default_user", limit: int = 30):
    """Fetches user notifications ordered by creation time descending."""
    notifs = get_notifications_from_supabase(user_id=user_id, limit=limit)
    unread_count = sum(1 for n in notifs if not n.get("is_read"))
    return {
        "notifications": notifs,
        "unread_count": unread_count,
        "total": len(notifs)
    }

@router.post("")
def create_notification(data: NotificationCreate, user_id: str = "default_user"):
    """Manually or programmatically trigger a system notification."""
    notif_data = {
        "user_id": user_id,
        "title": data.title,
        "message": data.message,
        "type": data.type,
        "link": data.link,
        "metadata": data.metadata or {},
        "is_read": False
    }
    result = create_notification_in_supabase(notif_data)
    return {"status": "success", "notification": result}

@router.post("/{notification_id}/read")
def mark_read(notification_id: str, user_id: str = "default_user"):
    """Marks a single notification as read."""
    success = mark_notifications_read_in_supabase(user_id=user_id, notif_id=notification_id)
    return {"status": "success" if success else "failed"}

@router.post("/read-all")
def mark_all_read(user_id: str = "default_user"):
    """Marks all notifications for this user as read."""
    success = mark_notifications_read_in_supabase(user_id=user_id)
    return {"status": "success" if success else "failed"}
