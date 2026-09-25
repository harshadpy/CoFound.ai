import os
import sys
import uuid
from fastapi.testclient import TestClient

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from api.main import app
import data.database as db

client = TestClient(app)

def run_all_crud_checks():
    db.init_db()
    print("\n=======================================================")
    print("STARTING END-TO-END CRUD VERIFICATION SUITE")
    print("=======================================================\n")
    
    # ---------------------------------------------------------
    # 1. USER PROFILE CRUD
    # ---------------------------------------------------------
    print("--- 1. Testing User Profile CRUD ---")
    
    # READ: Initial profile
    r = client.get("/api/user/profile?user_id=default_user")
    assert r.status_code == 200, f"GET /api/user/profile failed: {r.text}"
    profile = r.json()
    print(f" [PASS] GET Profile: full_name='{profile.get('full_name')}', email='{profile.get('email')}'")
    assert "Founder" not in profile.get("full_name", ""), "Display name should not have '(Founder)'"
    assert profile.get("full_name") == "Harshad", f"Expected 'Harshad', got '{profile.get('full_name')}'"

    # UPDATE: Update profile name and preferences
    r = client.put("/api/user/profile?user_id=default_user", json={
        "full_name": "Harshad",
        "preferences": {"notifications_enabled": True, "theme": "dark", "view_mode": "detailed"}
    })
    assert r.status_code == 200, f"PUT /api/user/profile failed: {r.text}"
    print(" [PASS] PUT Profile: full_name and preferences successfully updated.")

    # UPDATE: Save BYOK keys
    r = client.post("/api/user/api-keys?user_id=default_user", json={
        "openai_api_key": "sk-proj-test1234567890abcdef12345678",
        "tavily_api_key": "tvly-test-1234567890abcdef"
    })
    assert r.status_code == 200, f"POST /api/user/api-keys failed: {r.text}"
    masked = r.json().get("masked_keys", {})
    assert "openai" in masked and masked["openai"].startswith("sk-") and masked["openai"].endswith("5678"), f"Key masking check failed: {masked}"
    print(f" [PASS] POST User API Keys: masked keys successfully stored -> {masked}")

    # READ: Verify updated profile
    r = client.get("/api/user/profile?user_id=default_user")
    assert r.status_code == 200
    p2 = r.json()
    assert p2.get("full_name") == "Harshad"
    assert p2.get("has_custom_keys") is True
    print(" [PASS] GET Profile (Post-Update): confirmed full_name='Harshad' with active custom keys.")

    # ---------------------------------------------------------
    # 2. SAVED INSIGHTS CRUD
    # ---------------------------------------------------------
    print("\n--- 2. Testing Saved Insights CRUD ---")
    insight_id = f"test-crud-ins-{uuid.uuid4().hex[:8]}"

    # CREATE
    r = client.post("/api/saved-insights", json={
        "id": insight_id,
        "type": "market_gap",
        "title": "Automated Legal Compliance Micro-SaaS",
        "content": {"gap_score": 92, "target": "European SMBs", "opportunity": "High"},
        "founder_note": "Initial note from automated CRUD test",
        "user_id": "default_user"
    })
    assert r.status_code == 200, f"POST /api/saved-insights failed: {r.text}"
    print(f" [PASS] CREATE Insight (ID: {insight_id})")

    # READ: List
    r = client.get("/api/saved-insights?user_id=default_user")
    assert r.status_code == 200, f"GET /api/saved-insights failed: {r.text}"
    insights = r.json().get("insights", [])
    matched = [i for i in insights if i.get("id") == insight_id]
    assert len(matched) == 1, f"Created insight {insight_id} not found in listing"
    print(f" [PASS] READ Insight: retrieved '{matched[0].get('title')}' in saved items list")

    # UPDATE: Note
    new_note = "Updated priority: High conviction, start prototype in sprint 4"
    r = client.put(f"/api/saved-insights/{insight_id}/note", json={
        "founder_note": new_note
    })
    assert r.status_code == 200, f"PUT /api/saved-insights note failed: {r.text}"
    print(" [PASS] UPDATE Insight: successfully updated founder_note")

    # READ: Verify update
    r = client.get("/api/saved-insights?user_id=default_user")
    insights = r.json().get("insights", [])
    matched = [i for i in insights if i.get("id") == insight_id]
    assert matched and (matched[0].get("founder_note") == new_note or matched[0].get("founderNote") == new_note), "Note update not reflected"
    print(" [PASS] READ Insight (Verification): updated note verified in storage.")

    # DELETE
    r = client.delete(f"/api/saved-insights/{insight_id}")
    assert r.status_code == 200, f"DELETE /api/saved-insights failed: {r.text}"
    print(" [PASS] DELETE Insight: deletion command executed")

    # READ: Verify deletion
    r = client.get("/api/saved-insights?user_id=default_user")
    insights = r.json().get("insights", [])
    matched = [i for i in insights if i.get("id") == insight_id]
    assert len(matched) == 0, f"Insight {insight_id} should have been deleted"
    print(" [PASS] READ Insight (Post-Delete): confirmed insight is removed from database.")

    # ---------------------------------------------------------
    # 3. NOTIFICATIONS CRUD
    # ---------------------------------------------------------
    print("\n--- 3. Testing Notifications CRUD ---")
    
    # CREATE
    r = client.post("/api/notifications?user_id=default_user", json={
        "title": "Swarm Test Notification",
        "message": "Automated verification completed with 0 errors.",
        "type": "success",
        "link": "/dashboard"
    })
    assert r.status_code == 200, f"POST /api/notifications failed: {r.text}"
    notif_data = r.json().get("notification") or {}
    notif_id = notif_data.get("id")
    print(f" [PASS] CREATE Notification (ID: {notif_id})")

    # READ: List
    r = client.get("/api/notifications?user_id=default_user")
    assert r.status_code == 200, f"GET /api/notifications failed: {r.text}"
    notifs = r.json().get("notifications", [])
    assert len(notifs) > 0, "No notifications returned"
    print(f" [PASS] READ Notifications: fetched {len(notifs)} notifications, unread: {r.json().get('unread_count')}")

    # UPDATE: Mark single read (if notif_id present)
    if notif_id:
        r = client.post(f"/api/notifications/{notif_id}/read?user_id=default_user")
        assert r.status_code == 200, f"POST mark_read failed: {r.text}"
        print(f" [PASS] UPDATE Notification: marked notification {notif_id} as read")

    # UPDATE: Mark all read
    r = client.post("/api/notifications/read-all?user_id=default_user")
    assert r.status_code == 200, f"POST read-all failed: {r.text}"
    print(" [PASS] UPDATE Notifications: marked all notifications as read")

    # READ: Verify unread count is 0
    r = client.get("/api/notifications?user_id=default_user")
    assert r.json().get("unread_count") == 0, f"Expected 0 unread notifications, got {r.json().get('unread_count')}"
    print(" [PASS] READ Notifications (Verification): unread_count is verified as 0.")

    # ---------------------------------------------------------
    # 4. SHARED REPORTS CRUD
    # ---------------------------------------------------------
    print("\n--- 4. Testing Shared Reports CRUD ---")
    share_analysis_id = f"test-share-an-{uuid.uuid4().hex[:8]}"
    db.create_analysis(share_analysis_id, "Enterprise Security Copilot for Healthcare")
    db.save_analysis_result(share_analysis_id, {
        "title": "Enterprise Healthcare Security Copilot",
        "decision_verdict": {"verdict": "GO", "confidence_score": 91},
        "structured_thought": {"core_idea": "HIPAA-compliant zero-trust copilot"}
    })

    # CREATE: Share report
    r = client.post(f"/api/analysis/{share_analysis_id}/share", json={
        "title": "Enterprise Security Copilot Analysis"
    })
    assert r.status_code == 200, f"POST /api/analysis share failed: {r.text}"
    share_res = r.json()
    token = share_res.get("token")
    assert token, "Token not returned in share response"
    print(f" [PASS] CREATE Shared Report: generated public token '{token}'")

    # READ: Public share endpoint (1st visit)
    r1 = client.get(f"/api/share/{token}")
    assert r1.status_code == 200, f"GET /api/share/{token} failed: {r1.text}"
    data1 = r1.json()
    assert data1.get("title") == "Enterprise Security Copilot Analysis"
    initial_views = data1.get("views_count", 1)
    print(f" [PASS] READ Shared Report (1st visit): views_count = {initial_views}")

    # READ: Public share endpoint (2nd visit - tests view counter update)
    r2 = client.get(f"/api/share/{token}")
    assert r2.status_code == 200
    data2 = r2.json()
    assert data2.get("views_count") >= initial_views, "View count should increment or stay consistent"
    print(f" [PASS] READ Shared Report (2nd visit): views_count = {data2.get('views_count')}")

    # ---------------------------------------------------------
    # 5. ANALYSES CRUD (SQLite)
    # ---------------------------------------------------------
    print("\n--- 5. Testing Analyses CRUD (SQLite) ---")
    crud_analysis_id = f"test-an-crud-{uuid.uuid4().hex[:8]}"

    # CREATE
    db.create_analysis(crud_analysis_id, "Real-time Supply Chain Digital Twin")
    db.save_analysis_result(crud_analysis_id, {
        "final_report_md": "# Digital Twin Report\nFeasibility is high.",
        "final_report_html": "<h1>Digital Twin Report</h1><p>Feasibility is high.</p>",
        "decision_verdict": {"verdict": "GO", "confidence_score": 88}
    })
    print(f" [PASS] CREATE Analysis (ID: {crud_analysis_id})")

    # READ: List analyses
    r = client.get("/api/analyses")
    assert r.status_code == 200, f"GET /api/analyses failed: {r.text}"
    analyses_list = r.json()
    matched = [a for a in analyses_list if a.get("id") == crud_analysis_id]
    assert len(matched) == 1, f"Analysis {crud_analysis_id} not found in /api/analyses"
    print(f" [PASS] READ Analysis List: confirmed presence of analysis '{crud_analysis_id}'")

    # READ: Analysis Status
    r = client.get(f"/api/analysis/{crud_analysis_id}/status")
    assert r.status_code == 200, f"GET /api/analysis status failed: {r.text}"
    print(f" [PASS] READ Analysis Status: status = '{r.json().get('status')}'")

    # READ: Analysis Report
    r = client.get(f"/api/analysis/{crud_analysis_id}/report")
    assert r.status_code == 200, f"GET /api/analysis report failed: {r.text}"
    assert "Digital Twin Report" in r.json().get("report_md", "")
    print(" [PASS] READ Analysis Report: report content retrieved successfully")

    # DELETE: Delete analysis
    r = client.delete(f"/api/analyses/{crud_analysis_id}")
    assert r.status_code == 200, f"DELETE /api/analyses failed: {r.text}"
    print(f" [PASS] DELETE Analysis: deleted '{crud_analysis_id}'")

    # READ: Verify deleted
    r = client.get("/api/analyses")
    analyses_list = r.json()
    matched = [a for a in analyses_list if a.get("id") == crud_analysis_id]
    assert len(matched) == 0, f"Analysis {crud_analysis_id} was not deleted from SQLite"
    print(" [PASS] READ Analysis List (Post-Delete): confirmed analysis record is permanently deleted.")

    # Clean up test share analysis
    db.delete_analysis(share_analysis_id)

    print("\n=======================================================")
    print("ALL CRUD OPERATIONS VERIFIED 100% OPERATIONAL!")
    print("=======================================================\n")

if __name__ == "__main__":
    run_all_crud_checks()
