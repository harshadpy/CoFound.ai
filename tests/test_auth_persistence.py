import os
import sys
import uuid
import unittest
from fastapi.testclient import TestClient

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from api.main import app
import data.database as db
from data.supabase_client import get_user_profile, get_user_by_email

class TestAuthPersistence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        db.init_db()

    def test_01_login_harshad_default_account(self):
        """Tests logging in with the primary Harshad founder account."""
        res = self.client.post("/api/auth/login", json={
            "email": "harshad@cofound.ai"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "success")
        user = data.get("user", {})
        self.assertEqual(user.get("full_name"), "Harshad")
        self.assertEqual(user.get("email"), "harshad@cofound.ai")
        self.assertEqual(data.get("session_id"), "default_user")

    def test_02_register_and_login_new_founder(self):
        """Tests dynamic registration and persistence in Supabase for a new founder."""
        test_email = f"founder_{uuid.uuid4().hex[:6]}@hypergrowth.ai"
        test_name = "Elena Rostova"

        # 1. Login/Register
        res = self.client.post("/api/auth/login", json={
            "email": test_email,
            "name": test_name
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "success")
        user = data.get("user", {})
        self.assertEqual(user.get("full_name"), test_name)
        self.assertEqual(user.get("email"), test_email)
        user_id = data.get("session_id")
        self.assertTrue(user_id.startswith("user_"))

        # 2. Verify record in Supabase
        profile_in_db = get_user_profile(user_id)
        self.assertIsNotNone(profile_in_db)
        self.assertEqual(profile_in_db.get("email"), test_email)

        # 3. Retrieve Session
        session_res = self.client.get(f"/api/auth/session?user_id={user_id}")
        self.assertEqual(session_res.status_code, 200)
        session_user = session_res.json().get("user", {})
        self.assertEqual(session_user.get("full_name"), test_name)

        # 4. Login again with same email -> retrieves existing
        login_again = self.client.post("/api/auth/login", json={
            "email": test_email
        })
        self.assertEqual(login_again.status_code, 200)
        self.assertEqual(login_again.json().get("session_id"), user_id)

    def test_03_invalid_login_validation(self):
        """Tests validation for missing or invalid email addresses."""
        res = self.client.post("/api/auth/login", json={
            "email": "not-an-email"
        })
        self.assertEqual(res.status_code, 400)

    def test_04_logout(self):
        """Tests logout endpoint."""
        res = self.client.post("/api/auth/logout")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json().get("status"), "success")

if __name__ == "__main__":
    unittest.main()
