import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.model_router import get_routed_model, ModelRole, estimate_cost_usd
from guardrails.hallucination_checks import is_safe_url, verify_competitor_grounding
from agents.graph import app, app_hitl, checkpointer
from tests.evals.eval_harness import evaluate_run_against_benchmark

def test_model_router_roles_and_costs():
    """Validates model routing and token cost calculation."""
    critic_model = get_routed_model(ModelRole.CRITIC)
    assert critic_model is not None

    cost = estimate_cost_usd("gpt-4o", 10000, 2000)
    assert cost > 0
    assert isinstance(cost, float)

def test_ssrf_safety_guardrail():
    """Validates SSRF prevention against private IP probing."""
    assert is_safe_url("http://127.0.0.1/admin") is False
    assert is_safe_url("http://localhost:8000") is False
    assert is_safe_url("http://169.254.169.254/latest/meta-data/") is False
    assert is_safe_url("http://10.0.0.5/secret") is False
    assert is_safe_url("https://github.com") is True

def test_competitor_grounding_eval():
    """Validates citation & anti-hallucination competitor verification."""
    comp_data = {
        "direct_competitors": [
            {"name": "Stripe", "website": "https://stripe.com"},
            {"name": "BogusCorpFake", "website": "https://boguscorpfake999.io"}
        ]
    }
    raw_search = "Stripe is the leading payment processor for developers at stripe.com"
    verified = verify_competitor_grounding(comp_data, raw_search)

    direct = verified["direct_competitors"]
    assert direct[0]["is_grounded"] is True
    assert direct[1]["is_grounded"] is False
    assert verified["grounding_metadata"]["grounding_score"] == 50

def test_langgraph_checkpoint_setup():
    """Validates durable checkpointer and graph compilation."""
    assert app is not None
    assert app_hitl is not None
    assert checkpointer is not None

def test_hitl_resume_state_update():
    """Validates that LangGraph update_state with as_node succeeds without ambiguity error."""
    import uuid
    thread_id = f"test-hitl-{uuid.uuid4().hex[:8]}"
    run_config = {"configurable": {"thread_id": thread_id}}
    
    # Pre-seed initial state
    app_hitl.update_state(run_config, {
        "analysis_id": thread_id,
        "raw_text": "AI autonomous logistics platform",
        "hitl_enabled": True
    }, as_node="structure")
    
    # Test human feedback update simulating HITL resume
    feedback = {"additional_competitors": ["RivalCo"], "founder_notes": "Target enterprise B2B"}
    app_hitl.update_state(run_config, {"hitl_feedback": feedback}, as_node="competitor")
    
    state_vals = app_hitl.get_state(run_config).values
    assert state_vals.get("hitl_feedback") == feedback, "HITL feedback must be persisted in graph state"

def test_offline_eval_scoring():
    """Validates institutional VC audit evaluation metric calculation."""
    benchmark = {
        "id": "test_biotech",
        "name": "Test Biotech",
        "expected_verdicts": ["KILL"],
        "required_flaws": ["FDA clearance", "clinical trials"],
        "min_critic_penalty": -15
    }
    run_output = {
        "decision_verdict": {"verdict": "KILL"},
        "critic_results": {
            "fatal_flaws": ["FDA clearance required", "clinical trials cost too high"],
            "confidence_penalty": -20
        },
        "competitor_results": {
            "direct_competitors": [{"name": "A"}, {"name": "B"}]
        }
    }
    score = evaluate_run_against_benchmark(benchmark, run_output)
    assert score["verdict_score"] == 100
    assert score["critic_rigor_score"] == 100
    assert score["overall_quality_score"] > 80

if __name__ == "__main__":
    test_model_router_roles_and_costs()
    test_ssrf_safety_guardrail()
    test_competitor_grounding_eval()
    test_langgraph_checkpoint_setup()
    test_hitl_resume_state_update()
    test_offline_eval_scoring()
    print("All integration & unit tests passed successfully!")
