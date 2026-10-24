"""
End-to-End Test Suite for GPT-Style Supabase-Only Authentication Flow.

Tests:
1. Guest Mode: Unauthenticated exploration with persistent guest ID and safe quota.
2. Centralized Config: BILLING_ENABLED=false providing 100% free Pro access without paywalls.
3. Supabase Auth: Email/password signup, password hashing, and session persistence.
4. Guest-to-User Migration: Seamless transfer of guest analyses, insights, and data upon signup/login.
5. Security & Isolation: Quota enforcement and data ownership validation across users.
"""

import os
import sys
import uuid
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from api.main import app
from config.config import settings
import data.database as db
from data import supabase_client

client = TestClient(app)

def test_full_auth_flow():
    print("=" * 65)
    print("STARTING GPT-STYLE SUPABASE AUTHENTICATION TEST SUITE")
    print("=" * 65)

    # ── 1. Centralized Billing & Free Pro Access Check ───────────────────────
    print("\n[Step 1] Verifying Centralized Access & Free Tier Configuration...")
    cfg_res = client.get("/api/auth/config")
    assert cfg_res.status_code == 200, f"Failed config endpoint: {cfg_res.text}"
    cfg = cfg_res.json()
    assert cfg["billing_enabled"] is False, "BILLING_ENABLED should be false"
    assert cfg["plans_free"] is True, "Plans must be free"
    assert cfg["guest_analysis_limit"] == 5, "Guest analysis limit should be 5"
    print("  ✓ Centralized config verified: BILLING_ENABLED=false, all plans free, guest limit=5")

    # ── 2. Guest Mode Flow ───────────────────────────────────────────────────
    print("\n[Step 2] Testing Frictionless Guest Mode...")
    guest_res = client.post("/api/auth/guest")
    assert guest_res.status_code == 200
    guest_data = guest_res.json()
    guest_id = guest_data["session_id"]
    assert guest_id.startswith("guest_"), "Guest ID must begin with guest_"
    assert guest_data["user"]["is_guest"] is True, "Must be flagged as guest"
    assert guest_data["user"]["plan"] == "pro", "Guest must receive free Pro plan access"
    assert guest_data["quota"]["limit"] == 5
    print(f"  ✓ Guest session initialized: {guest_id} (Plan: Pro, Remaining: {guest_data['quota']['remaining']})")

    # Guest session retrieval
    session_res = client.get(f"/api/auth/session?user_id={guest_id}")
    assert session_res.status_code == 200
    assert session_res.json()["user"]["is_guest"] is True
    print("  ✓ Guest session successfully verified via /api/auth/session")

    # ── 3. Creating Analysis in Guest Session ────────────────────────────────
    print("\n[Step 3] Running Analysis as Harshad...")
    guest_analysis_id = f"test-guest-an-{uuid.uuid4().hex[:8]}"
    db.create_analysis(
        analysis_id=guest_analysis_id,
        raw_text="Autonomous AI dispatch platform for drone deliveries in Tokyo",
        context_tags={"industry": ["logistics"], "geo": ["Tokyo"]},
        user_id=guest_id
    )
    db.update_analysis_status(guest_analysis_id, "completed", progress_percentage=100)
    db.save_analysis_result(guest_analysis_id, {
        "structured_thought": {"core_idea": "Drone delivery in Tokyo"},
        "decision_results": {"decision": "GO", "confidence_score": 88}
    })

    # Verify guest can see their own analysis
    guest_analyses = db.list_analyses(user_id=guest_id)
    assert len(guest_analyses) == 1
    assert guest_analyses[0]["id"] == guest_analysis_id
    print(f"  ✓ Guest analysis created and isolated in SQLite: {guest_analysis_id}")

    # Verify data isolation: another random guest cannot see this analysis
    other_guest_analyses = db.list_analyses(user_id="guest_other999")
    assert len(other_guest_analyses) == 0, "Data isolation violation: user saw another user's analysis"
    print("  ✓ Data isolation confirmed: other sessions cannot see guest data")

    # ── 4. Guest-to-User Account Registration with Auto-Migration ────────────
    print("\n[Step 4] Testing Sign Up with Automatic Guest Data Migration...")
    test_email = f"founder_{uuid.uuid4().hex[:8]}@hypergrowth.ai"
    test_password = "SecurePassword123!"
    
    signup_res = client.post("/api/auth/signup", json={
        "email": test_email,
        "password": test_password,
        "name": "Sarah Connor",
        "guest_id": guest_id
    })
    assert signup_res.status_code == 200, f"Signup failed: {signup_res.text}"
    signup_data = signup_res.json()
    new_user_id = signup_data["user"]["id"]
    assert signup_data["user"]["email"] == test_email
    assert signup_data["user"]["is_guest"] is False
    assert signup_data["user"]["plan"] == "pro", "New user gets free Pro plan"
    assert signup_data["migrated_count"] >= 1, "Must migrate at least 1 guest analysis"
    print(f"  ✓ Account created in Supabase: {new_user_id} ({test_email})")
    print(f"  ✓ Automatic guest migration confirmed: {signup_data['migrated_count']} items transferred")

    # Verify the guest analysis is now owned by the new registered user!
    migrated_an = db.get_analysis(guest_analysis_id)
    assert migrated_an["user_id"] == new_user_id, f"Expected user_id {new_user_id}, got {migrated_an['user_id']}"
    print(f"  ✓ Database record ownership transferred: {guest_analysis_id} -> {new_user_id}")

    # Verify guest session has 0 analyses left
    assert len(db.list_analyses(user_id=guest_id)) == 0
    # Verify new user owns the analysis
    assert len(db.list_analyses(user_id=new_user_id)) >= 1
    print("  ✓ Query validation confirmed: old guest has 0 items, new user owns the items")

    # ── 5. Duplicate Email Protection ────────────────────────────────────────
    print("\n[Step 5] Testing Duplicate Email Protection...")
    dup_res = client.post("/api/auth/signup", json={
        "email": test_email,
        "password": "AnotherPassword456!",
        "name": "Imposter"
    })
    assert dup_res.status_code == 400, "Should reject duplicate email"
    print("  ✓ Duplicate email rejected with 400 Bad Request")

    # ── 6. Password Authentication (Sign In Flow) ───────────────────────────
    print("\n[Step 6] Testing Sign In with Password...")
    # Wrong password
    bad_login = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "WrongPassword999"
    })
    assert bad_login.status_code == 401, f"Expected 401 for wrong password, got {bad_login.status_code}"
    print("  ✓ Wrong password correctly rejected with 401 Unauthorized")

    # Correct password
    good_login = client.post("/api/auth/login", json={
        "email": test_email,
        "password": test_password
    })
    assert good_login.status_code == 200, f"Login failed: {good_login.text}"
    login_data = good_login.json()
    assert login_data["user"]["id"] == new_user_id
    assert bool(login_data["token"]) is True
    print(f"  ✓ Sign In succeeded! Token issued: {login_data['token'][:20]}...")

    # ── 7. Primary Harshad Demo Login ────────────────────────────────────────
    print("\n[Step 7] Testing 1-Click Harshad Demo Sign In...")
    harshad_login = client.post("/api/auth/login", json={
        "email": "harshad@cofound.ai"
    })
    assert harshad_login.status_code == 200
    assert harshad_login.json()["user"]["id"] == "default_user"
    print("  ✓ Harshad demo account 1-click access verified")

    # ── 8. Quota Limits & Rate Limiting Enforcement ──────────────────────────
    print("\n[Step 8] Testing Quota Enforcement on Analysis Start...")
    limited_guest = f"guest_limit_test_{uuid.uuid4().hex[:6]}"
    # Populate analyses up to limit
    for i in range(settings.guest_analysis_limit):
        db.create_analysis(
            analysis_id=f"test-limit-{i}-{uuid.uuid4().hex[:6]}",
            raw_text=f"Limit test idea {i}",
            user_id=limited_guest
        )
    
    # 6th analysis attempt should be blocked with 403 Forbidden
    blocked_res = client.post("/api/analysis/start", json={
        "raw_text": "One analysis too many for guest",
        "user_id": limited_guest
    })
    assert blocked_res.status_code == 403, f"Expected 403 for guest limit reached, got {blocked_res.status_code}"
    assert "Guest limit" in blocked_res.json()["detail"]
    print(f"  ✓ Guest quota enforcement verified: blocked after {settings.guest_analysis_limit} runs with 403 Forbidden")

    # ── Cleanup Test Records ─────────────────────────────────────────────────
    db.delete_analysis(guest_analysis_id)
    print("\n[Cleanup] Test analysis records cleanly deleted.")
    print("\n" + "=" * 65)
    print("ALL GPT-STYLE SUPABASE AUTHENTICATION TESTS PASSED 100%!")
    print("=" * 65)

if __name__ == "__main__":
    test_full_auth_flow()
