import os
import sys
import unittest
from fastapi.testclient import TestClient

# Ensure root is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from api.main import app
import data.database as db

class TestSupabaseIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        db.init_db()

    def test_root_health(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("Dual", data.get("persistence", ""))

    def test_user_profile_and_settings(self):
        # 1. Get profile
        res = self.client.get("/api/user/profile?user_id=default_user")
        self.assertEqual(res.status_code, 200)
        profile = res.json()
        self.assertIn("email", profile)
        self.assertIn("plan", profile)

        # 2. Update profile
        update_res = self.client.put("/api/user/profile?user_id=default_user", json={
            "full_name": "Harshad",
            "preferences": {"notifications_enabled": True, "theme": "dark"}
        })
        self.assertEqual(update_res.status_code, 200)

        # 3. Update BYOK API keys
        keys_res = self.client.post("/api/user/api-keys?user_id=default_user", json={
            "openai_api_key": "sk-proj-test1234567890abcdef"
        })
        self.assertEqual(keys_res.status_code, 200)
        self.assertIn("masked_keys", keys_res.json())

        # 4. Update Plan
        plan_res = self.client.post("/api/user/plan?user_id=default_user", json={
            "plan": "enterprise"
        })
        self.assertEqual(plan_res.status_code, 200)
        self.assertEqual(plan_res.json()["plan"], "enterprise")

    def test_notifications_lifecycle(self):
        # 1. Create notification
        create_res = self.client.post("/api/notifications?user_id=default_user", json={
            "title": "Test Swarm Complete",
            "message": "Market verification finished with Go verdict.",
            "type": "success",
            "link": "/report?id=test-123"
        })
        self.assertEqual(create_res.status_code, 200)

        # 2. List notifications
        list_res = self.client.get("/api/notifications?user_id=default_user")
        self.assertEqual(list_res.status_code, 200)
        data = list_res.json()
        self.assertGreaterEqual(len(data.get("notifications", [])), 1)

        # 3. Read all
        read_res = self.client.post("/api/notifications/read-all?user_id=default_user")
        self.assertEqual(read_res.status_code, 200)

    def test_saved_insights_supabase(self):
        import uuid
        insight_id = f"test-insight-{uuid.uuid4().hex[:8]}"

        # 1. Save insight
        save_res = self.client.post("/api/saved-insights", json={
            "id": insight_id,
            "type": "trend",
            "title": "Autonomous Coding Swarms",
            "content": {"growth": "+520%", "signals": ["Github Trending", "YC Batch S24"]},
            "founder_note": "Crucial for Q3 roadmap"
        })
        self.assertEqual(save_res.status_code, 200)

        # 2. List insights
        list_res = self.client.get("/api/saved-insights?user_id=default_user")
        self.assertEqual(list_res.status_code, 200)
        insights = list_res.json().get("insights", [])
        found = any(i.get("id") == insight_id for i in insights)
        self.assertTrue(found)

        # 3. Update note
        note_res = self.client.put(f"/api/saved-insights/{insight_id}/note", json={
            "founder_note": "Updated note: prioritize immediately"
        })
        self.assertEqual(note_res.status_code, 200)

        # 4. Delete insight
        del_res = self.client.delete(f"/api/saved-insights/{insight_id}")
        self.assertEqual(del_res.status_code, 200)

    def test_share_report_flow(self):
        import uuid
        sample_id = f"sample-share-{uuid.uuid4().hex[:8]}"
        db.create_analysis(sample_id, "AI-powered legal contract auditor")
        db.save_analysis_result(sample_id, {
            "decision_verdict": {"verdict": "CAUTION", "confidence_score": 72},
            "structured_thought": {"core_idea": "AI contract audit for law firms"}
        })

        # Share it
        share_res = self.client.post(f"/api/analysis/{sample_id}/share", json={
            "title": "AI Legal Auditor Analysis"
        })
        self.assertEqual(share_res.status_code, 200)
        share_data = share_res.json()
        token = share_data.get("token")
        self.assertTrue(token)

        # Retrieve public report
        public_res = self.client.get(f"/api/share/{token}")
        self.assertEqual(public_res.status_code, 200)
        pub_data = public_res.json()
        self.assertEqual(pub_data.get("title"), "AI Legal Auditor Analysis")
        self.assertIn("analysis", pub_data)

if __name__ == "__main__":
    unittest.main()
