"""
Tests dual-layer database offline fallback & graceful degradation.
Verifies that if Supabase credentials are missing or the connection fails:
1. SQLite local persistence functions 100% autonomously.
2. Supabase client calls return safely (None, False, empty list) without raising exceptions.
3. Analysis creation, update, and retrieval continue unaffected.
"""

import os
import sys
import uuid
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import data.database as db
from data import supabase_client

def test_offline_fallback():
    print("Testing Dual-Layer Offline Graceful Degradation...")

    # 1. Simulate Supabase client completely returning None (no credentials or network down)
    with patch("data.supabase_client.get_supabase_client", return_value=None):
        # User profile fallback
        user = supabase_client.get_user_profile("offline_user")
        assert user is None, "Should safely return None when Supabase is offline"
        
        # User upsert fallback
        upsert_res = supabase_client.upsert_user_profile({
            "id": "offline_user",
            "email": "offline@cofound.ai",
            "full_name": "Offline Founder"
        })
        assert upsert_res is not None, "Upsert should safely return payload even when offline"
        assert upsert_res["id"] == "offline_user"
        print("  [OK] User profile safe fallback")

        # Notification creation fallback
        notif_res = supabase_client.create_notification_in_supabase({
            "user_id": "offline_user",
            "title": "Offline Alert",
            "message": "Testing offline fallback"
        })
        assert notif_res is None, "Create notification returns None gracefully"
        
        notifs = supabase_client.get_notifications_from_supabase("offline_user")
        assert notifs == [], "Get notifications returns empty list gracefully"
        print("  [OK] Notifications safe fallback")

        # Insights fallback
        insights = supabase_client.list_insights_from_supabase("offline_user")
        assert insights == [], "List insights returns empty list gracefully"
        print("  [OK] Insights safe fallback")

        # Analysis sync fallback
        sync_ok = supabase_client.sync_analysis_to_supabase({
            "id": "test_sync_id",
            "raw_text": "Test idea"
        })
        assert sync_ok is False, "Sync analysis returns False safely"
        print("  [OK] Analysis sync safe fallback")

    # 2. Verify Local SQLite operates completely unaffected
    test_id = f"test-offline-{uuid.uuid4().hex[:8]}"
    db.create_analysis(
        analysis_id=test_id,
        raw_text="Autonomous AI agent test without external network dependency",
        context_tags={"category": "offline-resilience"},
        user_id="offline_user"
    )

    db.update_analysis_status(test_id, "running", progress_percentage=50)
    db.save_analysis_result(test_id, {
        "structured_thought": {"core_idea": "Autonomous drone dispatch"},
        "decision_results": {"decision": "GO", "confidence_score": 92}
    })

    record = db.get_analysis(test_id)
    assert record is not None, "SQLite must persist analysis locally"
    assert record["status"] == "completed"
    assert record["progress_percentage"] == 100
    assert record["result"]["decision_results"]["decision"] == "GO"
    print("  [OK] Local SQLite CRUD 100% resilient and functional")

    # Clean up test record
    db.delete_analysis(test_id)
    assert db.get_analysis(test_id) is None
    print("  [OK] Local SQLite cleanup successful")
    print("ALL OFFLINE FALLBACK AND DATABASE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_offline_fallback()
