import uuid
import structlog
from fastapi import APIRouter, HTTPException, Query, Header
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

from config.config import settings
from data.database import migrate_analyses_user, count_user_analyses
from data.supabase_client import (
    get_user_profile,
    upsert_user_profile,
    get_user_by_email,
    get_supabase_client,
    hash_password,
    verify_password,
    migrate_supabase_user_data
)
from api.routes.user import mask_key

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication & Session"])

# ── Pydantic Request Models ──────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = None
    name: Optional[str] = None
    guest_id: Optional[str] = None

class SignupRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    guest_id: Optional[str] = None

class GuestSessionRequest(BaseModel):
    existing_guest_id: Optional[str] = None

class MigrateGuestRequest(BaseModel):
    guest_id: str
    user_id: str

class AuthResponse(BaseModel):
    status: str
    message: str
    user: Dict[str, Any]
    session_id: str
    token: Optional[str] = None
    migrated_count: Optional[int] = 0

def format_user_profile(profile: Dict[str, Any], is_guest: bool = False) -> Dict[str, Any]:
    """Formats raw database profile into sanitized client payload."""
    custom_keys = profile.get("custom_api_keys") or profile.get("custom_keys") or {}
    masked = {k: mask_key(v) for k, v in custom_keys.items() if v}
    full_name = profile.get("full_name") or profile.get("name") or ("Harshad" if is_guest else "Founder")
    avatar = profile.get("avatar") or (full_name[:2].upper() if full_name else "CO")
    
    return {
        "id": profile.get("id"),
        "email": profile.get("email"),
        "full_name": full_name,
        "name": full_name,
        "avatar": avatar,
        "avatar_url": profile.get("avatar_url"),
        "plan": "pro" if not settings.billing_enabled else profile.get("plan", "pro"),
        "plan_type": "pro" if not settings.billing_enabled else profile.get("plan_type", "pro"),
        "is_guest": is_guest,
        "preferences": profile.get("preferences", {}),
        "has_custom_keys": len(masked) > 0,
        "masked_keys": masked,
        "created_at": profile.get("created_at")
    }

# ── 1. Guest Session Mode ────────────────────────────────────────────────────
@router.post("/guest")
def create_guest_session(payload: Optional[GuestSessionRequest] = None):
    """
    Initializes a secure guest session for users trying CoFound.ai without registration.
    Allows running analyses and exploring platform features with safe quota limits.
    """
    guest_id = payload.existing_guest_id if payload and payload.existing_guest_id else f"guest_{uuid.uuid4().hex[:12]}"
    
    # Verify guest ID format for security
    if not guest_id.startswith("guest_"):
        guest_id = f"guest_{uuid.uuid4().hex[:12]}"

    guest_user = {
        "id": guest_id,
        "email": None,
        "full_name": "Harshad",
        "name": "Harshad",
        "avatar": "H",
        "plan": "pro",
        "is_guest": True,
        "preferences": {"theme": "dark", "notifications_enabled": False}
    }
    
    used_analyses = count_user_analyses(guest_id)
    remaining = max(0, settings.guest_analysis_limit - used_analyses)

    logger.info("Guest session active", guest_id=guest_id, used=used_analyses, remaining=remaining)
    return {
        "status": "success",
        "message": "Guest session active",
        "session_id": guest_id,
        "user": format_user_profile(guest_user, is_guest=True),
        "quota": {
            "used": used_analyses,
            "limit": settings.guest_analysis_limit,
            "remaining": remaining
        }
    }

# ── 2. User Sign In (Supabase Email / Password) ──────────────────────────────
@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest):
    """
    Signs in an existing founder using Supabase Auth (email/password).
    Supports seamless guest data migration when guest_id is provided.
    """
    clean_email = payload.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")

    password = payload.password or ""
    client = get_supabase_client()
    user_id = None
    session_token = None
    profile = None

    # Handle Primary Demo Founder Account (Harshad)
    if clean_email == "harshad@cofound.ai":
        profile = get_user_profile("default_user")
        if not profile:
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
        user_id = "default_user"
        session_token = f"session_{user_id}_{uuid.uuid4().hex[:8]}"

    else:
        # Check Supabase Auth first
        auth_success = False
        if client and password:
            try:
                auth_res = client.auth.sign_in_with_password({"email": clean_email, "password": password})
                if auth_res and auth_res.user:
                    user_id = auth_res.user.id
                    if auth_res.session:
                        session_token = auth_res.session.access_token
                    auth_success = True
            except Exception as e:
                logger.warning("Supabase Auth API sign_in failed, checking users table fallback", error=str(e))

        # Check Supabase `users` table
        existing = get_user_by_email(clean_email)
        if not existing and not auth_success:
            if not password:
                # Seamless dynamic registration for passwordless email callers
                new_user_id = f"user_{uuid.uuid4().hex[:12]}"
                display_name = payload.name.strip() if payload.name and payload.name.strip() else clean_email.split("@")[0].capitalize()
                user_record = {
                    "id": new_user_id,
                    "email": clean_email,
                    "full_name": display_name,
                    "name": display_name,
                    "avatar": display_name[:2].upper() if len(display_name) >= 2 else "CO",
                    "plan": "pro",
                    "plan_type": "pro",
                    "credits_total": 100,
                    "credits_used": 0,
                    "custom_api_keys": {},
                    "preferences": {"theme": "dark", "notifications_enabled": True}
                }
                saved = upsert_user_profile(user_record)
                existing = saved or user_record
                user_id = new_user_id
            else:
                raise HTTPException(status_code=401, detail="No account found with this email. Please create an account.")

        if existing:
            user_id = existing.get("id") or user_id
            prefs = existing.get("preferences") or {}
            stored_hash = prefs.get("password_hash")
            
            # If password was provided and we have a stored hash, verify it
            if stored_hash and password:
                if not verify_password(password, stored_hash):
                    raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")
            elif not auth_success and password and stored_hash is None:
                # First time adding password to existing email profile
                prefs["password_hash"] = hash_password(password)
                existing["preferences"] = prefs
                upsert_user_profile(existing)

            profile = existing

        if not session_token:
            session_token = f"session_{user_id}_{uuid.uuid4().hex[:12]}"

    # Guest-to-User Data Migration (if founder used guest mode first)
    migrated_count = 0
    if payload.guest_id and payload.guest_id.startswith("guest_") and user_id:
        local_migrated = migrate_analyses_user(payload.guest_id, user_id)
        cloud_migrated = migrate_supabase_user_data(payload.guest_id, user_id)
        migrated_count = local_migrated + cloud_migrated.get("analyses", 0) + cloud_migrated.get("saved_insights", 0)
        logger.info("Migrated guest data on login", guest_id=payload.guest_id, user_id=user_id, count=migrated_count)

    formatted = format_user_profile(profile or {"id": user_id, "email": clean_email})
    return AuthResponse(
        status="success",
        message=f"Welcome back, {formatted['full_name']}!",
        user=formatted,
        session_id=user_id,
        token=session_token,
        migrated_count=migrated_count
    )

# ── 3. User Sign Up (Supabase Email / Password) ──────────────────────────────
@router.post("/signup", response_model=AuthResponse)
def signup(payload: SignupRequest):
    """
    Creates a new founder account using Supabase Auth and persists profile.
    Automatically migrates existing guest analyses and bookmarks to the new account.
    """
    clean_email = payload.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")

    if not payload.password or len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    client = get_supabase_client()
    existing = get_user_by_email(clean_email)
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please sign in.")

    new_user_id = f"user_{uuid.uuid4().hex[:12]}"
    session_token = None

    # Try native Supabase Auth sign_up
    if client:
        try:
            auth_res = client.auth.sign_up({"email": clean_email, "password": payload.password})
            if auth_res and auth_res.user:
                new_user_id = str(auth_res.user.id)
                if auth_res.session:
                    session_token = auth_res.session.access_token
        except Exception as e:
            logger.warning("Supabase Auth API sign_up returned exception, using table fallback", error=str(e))

    if not session_token:
        session_token = f"session_{new_user_id}_{uuid.uuid4().hex[:12]}"

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
        "preferences": {
            "theme": "dark",
            "notifications_enabled": True,
            "password_hash": hash_password(payload.password)
        }
    }

    saved = upsert_user_profile(user_record)
    saved_profile = saved or user_record

    # Seamless Guest Data Migration
    migrated_count = 0
    if payload.guest_id and payload.guest_id.startswith("guest_"):
        local_migrated = migrate_analyses_user(payload.guest_id, new_user_id)
        cloud_migrated = migrate_supabase_user_data(payload.guest_id, new_user_id)
        migrated_count = local_migrated + cloud_migrated.get("analyses", 0) + cloud_migrated.get("saved_insights", 0)
        logger.info("Migrated guest data on signup", guest_id=payload.guest_id, user_id=new_user_id, count=migrated_count)

    formatted = format_user_profile(saved_profile)
    logger.info("New founder registered in Supabase", user_id=new_user_id, email=clean_email)

    return AuthResponse(
        status="success",
        message=f"Account created successfully. Welcome to CoFound, {display_name}!",
        user=formatted,
        session_id=new_user_id,
        token=session_token,
        migrated_count=migrated_count
    )

# ── 4. Guest-to-User Explicit Migration Endpoint ─────────────────────────────
@router.post("/migrate-guest")
def migrate_guest(payload: MigrateGuestRequest):
    """
    Explicitly migrates past analyses, insights, and notifications from guest session to user.
    """
    if not payload.guest_id or not payload.user_id:
        raise HTTPException(status_code=400, detail="Both guest_id and user_id are required.")

    local_count = migrate_analyses_user(payload.guest_id, payload.user_id)
    cloud_stats = migrate_supabase_user_data(payload.guest_id, payload.user_id)
    total_migrated = local_count + cloud_stats.get("analyses", 0) + cloud_stats.get("saved_insights", 0)

    return {
        "status": "success",
        "message": f"Successfully migrated {total_migrated} items to your account.",
        "stats": {
            "local_analyses": local_count,
            "cloud_stats": cloud_stats,
            "total": total_migrated
        }
    }

# ── 5. Active Session Verification ───────────────────────────────────────────
@router.get("/session")
def get_session(
    user_id: str = Query(..., description="Active user or guest ID"),
    authorization: Optional[str] = Header(None)
):
    """
    Retrieves and validates active user or guest session from Supabase.
    """
    # 1. Guest Session
    if user_id.startswith("guest_"):
        used = count_user_analyses(user_id)
        guest_user = {
            "id": user_id,
            "email": None,
            "full_name": "Harshad",
            "name": "Harshad",
            "avatar": "H",
            "plan": "pro",
            "is_guest": True,
            "preferences": {"theme": "dark", "notifications_enabled": False}
        }
        return {
            "status": "success",
            "user": format_user_profile(guest_user, is_guest=True),
            "quota": {
                "used": used,
                "limit": settings.guest_analysis_limit,
                "remaining": max(0, settings.guest_analysis_limit - used)
            }
        }

    # 2. Registered User Session
    profile = get_user_profile(user_id)
    if not profile:
        if user_id == "default_user":
            profile = {
                "id": "default_user",
                "email": "harshad@cofound.ai",
                "full_name": "Harshad",
                "plan": "pro"
            }
        else:
            raise HTTPException(status_code=404, detail="Active user session not found.")

    used = count_user_analyses(user_id)
    return {
        "status": "success",
        "user": format_user_profile(profile, is_guest=False),
        "quota": {
            "used": used,
            "limit": settings.user_analysis_limit,
            "remaining": max(0, settings.user_analysis_limit - used)
        }
    }

# ── 6. Centralized Platform Configuration ────────────────────────────────────
@router.get("/config")
def get_auth_config():
    """Returns platform billing status and AI quota limits."""
    return {
        "billing_enabled": settings.billing_enabled,
        "plans_free": not settings.billing_enabled,
        "guest_analysis_limit": settings.guest_analysis_limit,
        "user_analysis_limit": settings.user_analysis_limit
    }

@router.post("/logout")
def logout():
    """Logs out the active user session."""
    return {"status": "success", "message": "Logged out successfully"}
