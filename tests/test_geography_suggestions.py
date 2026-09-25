"""
Test verifying geographic awareness (e.g. India vs US) and enhanced ideation variations.
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agents.thought_structuring.agent import thought_structuring_node
from agents.competitor_analysis.agent import competitor_node
from agents.ideation.agent import ideation_node

def test_geographic_structuring():
    print("\n=== 1. Testing Thought Structuring with India Context Tag ===")
    state = {
        "raw_text": "custom ai solutions b2b saas for enterprises",
        "context_tags": {
            "industry": ["tech"],
            "geo": ["India"],
            "segment": ["SMBs"]
        }
    }
    res = thought_structuring_node(state)
    structured = res["structured_thought"]
    print(f"Extracted Structured Thought: {structured}")
    assert "India" in structured.get("target_geography", ""), f"Expected 'India' in target_geography, got: {structured.get('target_geography')}"
    print("[OK] Target geography correctly extracted and preserved as India!")
    return structured

def test_competitor_geographic_queries():
    print("\n=== 2. Testing Competitor Node with Geographic Awareness ===")
    structured = {
        "core_idea": "custom ai solutions b2b saas",
        "primary_sector": "Technology",
        "target_audience": "Mid-market enterprises",
        "target_geography": "India",
        "problem_statement": "High cost and complexity of deploying bespoke enterprise AI",
        "user_intent": "new idea"
    }
    state = {
        "raw_text": "custom ai solutions b2b saas",
        "context_tags": {"geo": ["India"]},
        "structured_thought": structured
    }
    comp_res = competitor_node(state)
    competitor_results = comp_res["competitor_results"]
    direct = competitor_results.get("direct_competitors", [])
    print(f"Identified {len(direct)} competitors.")
    for c in direct:
        print(f"  - {c.get('name')}: {c.get('description')} (HQ: {c.get('headquarters')})")
    
    assert len(direct) > 0, "Expected at least 1 competitor identified"
    print("[OK] Competitor analysis executed with geographic context!")

def test_ideation_variations():
    print("\n=== 3. Testing Enhanced Ideation Variations & Contingency Pivots ===")
    structured = {
        "core_idea": "custom ai solutions b2b saas",
        "primary_sector": "Technology",
        "target_audience": "Indian mid-market enterprises",
        "target_geography": "India",
        "problem_statement": "High cost and complexity of deploying bespoke enterprise AI",
        "user_intent": "new idea"
    }
    state = {
        "raw_text": "custom ai solutions b2b saas",
        "context_tags": {"geo": ["India"]},
        "structured_thought": structured
    }
    ideation_res = ideation_node(state)
    results = ideation_res["ideation_results"]
    variations = results.get("variations", [])
    pivots = results.get("pivot_options", [])
    
    print(f"Generated {len(variations)} variations and {len(pivots)} pivots.")
    for v in variations:
        print(f"  * {v.get('title')}: {v.get('description')}")
        if v.get('target_wedge'):
            print(f"    Wedge: {v.get('target_wedge')} | Model: {v.get('monetization')}")
    
    assert len(variations) >= 2, "Expected at least 2 variations"
    assert len(pivots) >= 1, "Expected at least 1 pivot"
    print("[OK] Enhanced ideation generated structured variations and pivots!")

if __name__ == "__main__":
    test_geographic_structuring()
    test_competitor_geographic_queries()
    test_ideation_variations()
    print("\n[ALL GEOGRAPHY & SUGGESTION TESTS PASSED SUCCESSFULLY!]")
