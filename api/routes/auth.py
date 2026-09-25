import uuid
import structlog
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

from data.supabase_client import (
    get_user_profile,
    upsert_user_profile,
    get_user_by_email
)
from api.routes.user import mask_key

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication & Session"])

class LoginRequest(BaseModel):
    email: str
    name: Optional[str] = None

class AuthResponse(BaseModel):
    status: str
    message: str
    user: Dict[str, Any]
    session_id: str

def format_user_profile(profile: Dict[str, Any]) -> Dict[str, Any]:
    custom_keys = profile.get("custom_api_keys") or {}
    masked = {k: mask_key(v) for k, v in custom_keys.items() if v}
    full_name = profile.get("full_name") or profile.get("name") or "Founder"
    avatar = profile.get("avatar") or (full_name[:2].upper() if full_name else "CO")
    
    return {
        "id": profile.get("id"),
        "email": profile.get("email"),
        "full_name": full_name,
        "name": full_name,
        "avatar": avatar,
        "avatar_url": profile.get("avatar_url"),
        "plan": profile.get("plan", "pro"),
        "preferences": profile.get("preferences", {}),
        "has_custom_keys": len(masked) > 0,
        "masked_keys": masked,
        "created_at": profile.get("created_at")
    }

@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest):
    """
    Signs in an existing founder or registers a new founder in Supabase.
    Persists profile, custom settings, and BYOK keys across sessions.
    """
    clean_email = payload.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")

    # 1. Check for special default account
    if clean_email == "harshad@cofound.ai":
        profile = get_user_profile("default_user")
        if not profile:
            # Ensure Harshad default profile exists in Supabase
            profile = {
                "id": "default_user",
                "email": "harshad@cofound.ai",
                "full_name": "Harshad",
                "name": "Harshad",
                "avatar": "HP",
                "plan": "pro",
                "plan_type": "pro",
                "credits_total": 100,
                "credits_used": 0,
                "custom_api_keys": {},
                "preferences": {"theme": "dark", "notifications_enabled": True}
            }
            upsert_user_profile(profile)
        
        formatted = format_user_profile(profile)
        logger.info("User logged in as Harshad", user_id="default_user", email=clean_email)
        return AuthResponse(
            status="success",
            message="Welcome back, Harshad!",
            user=formatted,
            session_id=profile["id"]
        )

    # 2. Look up existing user by email in Supabase
    existing = get_user_by_email(clean_email)
    if existing:
        formatted = format_user_profile(existing)
        logger.info("Existing user logged in", user_id=existing.get("id"), email=clean_email)
        return AuthResponse(
            status="success",
            message=f"Welcome back, {formatted['full_name']}!",
            user=formatted,
            session_id=existing["id"]
        )

    # 3. New Registration -> Insert into Supabase
    new_user_id = f"user_{uuid.uuid4().hex[:10]}"
    display_name = payload.name.strip() if payload.name and payload.name.strip() else clean_email.split("@")[0].capitalize()
    avatar = display_name[:2].upper() if len(display_name) >= 2 else "CO"

    user_record = {
        "id": new_user_id,
        "email": clean_email,
        "full_name": display_name,
        "name": display_name,
        "avatar": avatar,
        "plan": "pro",
        "plan_type": "pro",
        "credits_total": 100,
        "credits_used": 0,
        "custom_api_keys": {},
        "preferences": {"theme": "dark", "notifications_enabled": True}
    }

    saved = upsert_user_profile(user_record)
    saved_profile = saved or user_record
    formatted = format_user_profile(saved_profile)
    logger.info("New founder registered in Supabase", user_id=new_user_id, email=clean_email)

    return AuthResponse(
        status="success",
        message=f"Account created successfully. Welcome to CoFound, {display_name}!",
        user=formatted,
        session_id=new_user_id
    )

@router.get("/session")
def get_session(user_id: str = Query(..., description="Active user ID")):
    """Retrieves session profile from Supabase."""
    profile = get_user_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Active user session not found in Supabase.")
    return {"status": "success", "user": format_user_profile(profile)}

@router.post("/logout")
def logout():
    """Logs out the active user session."""
    return {"status": "success", "message": "Logged out successfully"}
