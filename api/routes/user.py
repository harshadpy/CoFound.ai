import os
import structlog
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from data.supabase_client import get_user_profile, upsert_user_profile

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/user", tags=["User & Settings"])

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

class ApiKeysUpdate(BaseModel):
    openai_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None

class PlanUpdate(BaseModel):
    plan: str = Field(..., description="free, pro, enterprise")

def mask_key(key: Optional[str]) -> Optional[str]:
    if not key or len(key) < 8:
        return "••••••••" if key else None
    return f"{key[:4]}••••••••{key[-4:]}"

@router.get("/profile")
def get_profile(user_id: str = "default_user"):
    """Fetches user profile and configured key status from Supabase."""
    profile = get_user_profile(user_id)
    if not profile:
        if user_id == "default_user":
            return {
                "id": "default_user",
                "email": "harshad@cofound.ai",
                "full_name": "Harshad",
                "plan": "pro",
                "avatar_url": None,
                "has_custom_keys": False,
                "masked_keys": {}
            }
        return {
            "id": user_id,
            "email": None,
            "full_name": None,
            "plan": "pro",
            "avatar_url": None,
            "has_custom_keys": False,
            "masked_keys": {}
        }
    
    custom_keys = profile.get("custom_api_keys") or {}
    masked = {k: mask_key(v) for k, v in custom_keys.items() if v}
    
    return {
        "id": profile.get("id", user_id),
        "email": profile.get("email"),
        "full_name": profile.get("full_name"),
        "avatar_url": profile.get("avatar_url"),
        "plan": profile.get("plan", "pro"),
        "preferences": profile.get("preferences", {}),
        "has_custom_keys": len(masked) > 0,
        "masked_keys": masked,
        "created_at": profile.get("created_at")
    }

@router.put("/profile")
def update_profile(data: UserProfileUpdate, user_id: str = "default_user"):
    """Updates user profile metadata."""
    existing = get_user_profile(user_id) or {"id": user_id}
    if data.full_name is not None:
        existing["full_name"] = data.full_name
    if data.email is not None:
        existing["email"] = data.email
    if data.avatar_url is not None:
        existing["avatar_url"] = data.avatar_url
    if data.preferences is not None:
        existing["preferences"] = data.preferences

    updated = upsert_user_profile(existing)
    return {"status": "success", "profile": updated}

@router.post("/api-keys")
def update_api_keys(keys: ApiKeysUpdate, user_id: str = "default_user"):
    """Updates Bring-Your-Own-Key (BYOK) configurations in Supabase."""
    existing = get_user_profile(user_id) or {"id": user_id}
    current_keys = existing.get("custom_api_keys") or {}

    if keys.openai_api_key is not None:
        if keys.openai_api_key.strip():
            current_keys["openai"] = keys.openai_api_key.strip()
        else:
            current_keys.pop("openai", None)

    if keys.tavily_api_key is not None:
        if keys.tavily_api_key.strip():
            current_keys["tavily"] = keys.tavily_api_key.strip()
        else:
            current_keys.pop("tavily", None)

    if keys.gemini_api_key is not None:
        if keys.gemini_api_key.strip():
            current_keys["gemini"] = keys.gemini_api_key.strip()
        else:
            current_keys.pop("gemini", None)

    if keys.anthropic_api_key is not None:
        if keys.anthropic_api_key.strip():
            current_keys["anthropic"] = keys.anthropic_api_key.strip()
        else:
            current_keys.pop("anthropic", None)

    existing["custom_api_keys"] = current_keys
    upsert_user_profile(existing)

    masked = {k: mask_key(v) for k, v in current_keys.items()}
    return {"status": "success", "message": "API keys updated successfully", "masked_keys": masked}

@router.post("/plan")
def update_plan(data: PlanUpdate, user_id: str = "default_user"):
    """Updates active subscription tier (free, pro, enterprise)."""
    if data.plan not in ["free", "pro", "enterprise"]:
        raise HTTPException(status_code=400, detail="Invalid plan tier. Choose free, pro, or enterprise.")
    
    existing = get_user_profile(user_id) or {"id": user_id}
    existing["plan"] = data.plan
    upsert_user_profile(existing)
    return {"status": "success", "plan": data.plan}
