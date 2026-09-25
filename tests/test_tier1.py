import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from guardrails.hallucination_checks import verify_competitor_grounding
import data.database as db

def test_hallucination_guardrails():
    print("=== 1. Testing Grounding & Hallucination Guardrail ===")
    mock_search_context = """
    Source 1: Perplexity AI (https://perplexity.ai) raises $250M for conversational search engine.
    Source 2: Writer.com secures Series B funding for enterprise AI writing workflows.
    """
    
    mock_competitor_data = {
        "direct_competitors": [
            {
                "name": "Perplexity AI",
                "website": "https://perplexity.ai",
                "description": "AI conversational search engine"
            },
            {
                "name": "Fabricated Corp",
                "website": "https://fake-hallucinated-domain-1234.io",
                "description": "Completely made-up competitor not in search results"
            }
        ],
        "indirect_competitors": []
    }

    result = verify_competitor_grounding(mock_competitor_data, mock_search_context)
    meta = result.get("grounding_metadata", {})
    print("Grounding Meta:", meta)
    
    # Assert Perplexity is grounded and verified
    direct = result["direct_competitors"]
    assert direct[0]["is_grounded"] is True
    assert direct[0]["website_verified"] is True
    
    # Assert Fabricated Corp is ungrounded and domain flagged
    assert direct[1]["is_grounded"] is False
    assert direct[1]["website_verified"] is False
    assert len(meta["flagged_unverified_urls"]) == 1
    assert meta["grounding_score"] == 50
    print("[OK] Hallucination guardrail correctly detected grounded vs fabricated competitors!")

def test_database_deletion():
    print("\n=== 2. Testing SQLite Deletion Operation ===")
    test_id = "test-delete-id"
    db.init_db()
    
    # Create
    db.create_analysis(test_id, "Idea to be deleted")
    assert db.get_analysis(test_id) is not None
    
    # Delete
    deleted = db.delete_analysis(test_id)
    assert deleted is True
    assert db.get_analysis(test_id) is None
    print("[OK] SQLite delete_analysis verified!")

if __name__ == "__main__":
    test_hallucination_guardrails()
    test_database_deletion()
    print("\n[ALL TIER 1 TESTS PASSED SUCCESSFULLY!]")
