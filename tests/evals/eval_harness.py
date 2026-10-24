import os
import json
import asyncio
from typing import Dict, Any, List

def evaluate_run_against_benchmark(benchmark: Dict[str, Any], result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates an agent swarm analysis output against ground-truth benchmark criteria.
    Produces quantitative audit scores (0-100) across 3 dimensions:
    1. Verdict Alignment
    2. Critic Rigor & Flaw Discovery
    3. Competitor Market Recall
    """
    decision = result.get("decision_verdict", {}) or result.get("decision", {})
    critic = result.get("critic_results", {}) or result.get("critic", {})
    competitor = result.get("competitor_results", {}) or result.get("competitor", {})

    actual_verdict = decision.get("verdict", "").upper()
    expected_verdicts = [v.upper() for v in benchmark.get("expected_verdicts", [])]
    
    # 1. Verdict Alignment (0 or 100)
    verdict_score = 100 if actual_verdict in expected_verdicts else 0

    # 2. Critic Rigor & Flaw Coverage
    fatal_flaws_text = " ".join(critic.get("fatal_flaws", []) + [critic.get("harsh_feedback", "")]).lower()
    required_flaws = benchmark.get("required_flaws", [])
    matched_flaws = 0
    for flaw in required_flaws:
        keywords = flaw.lower().split()
        if any(kw in fatal_flaws_text for kw in keywords):
            matched_flaws += 1
            
    critic_rigor_score = int((matched_flaws / max(len(required_flaws), 1)) * 100)
    
    # Check penalty threshold if defined
    min_penalty = benchmark.get("min_critic_penalty")
    actual_penalty = critic.get("confidence_penalty", 0)
    if min_penalty is not None and actual_penalty > min_penalty:
        # Critic was too lenient
        critic_rigor_score = max(0, critic_rigor_score - 20)

    # 3. Competitor Recall
    known_competitors = benchmark.get("known_competitors", [])
    if known_competitors:
        direct = competitor.get("direct_competitors", [])
        found_names = [c.get("name", "").lower() for c in direct if isinstance(c, dict)]
        matched_comps = sum(1 for kc in known_competitors if any(kc.lower() in fn for fn in found_names))
        comp_recall_score = int((matched_comps / len(known_competitors)) * 100)
    else:
        # If no specific known competitors listed, reward if >= 3 rivals identified with grounding
        direct_count = len(competitor.get("direct_competitors", []))
        comp_recall_score = min(100, direct_count * 25)

    # Aggregate Institutional Quality Index
    overall_score = round((verdict_score * 0.35) + (critic_rigor_score * 0.40) + (comp_recall_score * 0.25), 1)

    return {
        "scenario_id": benchmark.get("id"),
        "scenario_name": benchmark.get("name"),
        "actual_verdict": actual_verdict,
        "expected_verdicts": expected_verdicts,
        "verdict_score": verdict_score,
        "critic_rigor_score": critic_rigor_score,
        "competitor_recall_score": comp_recall_score,
        "overall_quality_score": overall_score,
        "matched_flaws": f"{matched_flaws}/{len(required_flaws)}",
        "confidence_penalty": actual_penalty
    }

def generate_markdown_scorecard(eval_results: List[Dict[str, Any]]) -> str:
    """Generates a professional evaluation scorecard markdown table."""
    md = [
        "# CoFound.ai — Autonomous Multi-Agent Evaluation Scorecard",
        "**Quantitative Institutional VC Audit & Anti-Hallucination Benchmark**\n",
        "| Scenario | Actual Verdict | Expected | Verdict Match | Critic Rigor | Comp Recall | Overall Quality |",
        "| :--- | :---: | :---: | :---: | :---: | :---: | :---: |"
    ]
    for r in eval_results:
        vm = "PASS" if r["verdict_score"] == 100 else "FAIL"
        md.append(f"| **{r['scenario_name']}** | `{r['actual_verdict']}` | {', '.join(r['expected_verdicts'])} | {vm} | {r['critic_rigor_score']}% ({r['matched_flaws']}) | {r['competitor_recall_score']}% | **{r['overall_quality_score']}/100** |")
    
    avg_score = round(sum(r["overall_quality_score"] for r in eval_results) / max(len(eval_results), 1), 1)
    md.append(f"\n**Mean Institutional Quality Index: {avg_score}/100**\n")
    return "\n".join(md)

if __name__ == "__main__":
    # Self-test using mock run data
    benchmarks_path = os.path.join(os.path.dirname(__file__), "benchmarks.json")
    with open(benchmarks_path, "r", encoding="utf-8") as f:
        benchmarks = json.load(f)

    # Sample synthetic run for Scenario 1 (Theranos for saliva)
    mock_run_1 = {
        "decision_verdict": {"verdict": "KILL", "confidence_score": 15},
        "critic_results": {
            "fatal_flaws": [
                "Severe FDA regulatory clearance hurdles and clinical validation cycle of 5+ years",
                "Extreme liability of false positives and false negatives in at-home oncology"
            ],
            "confidence_penalty": -25,
            "harsh_feedback": "Unviable without $50M in clinical trials."
        },
        "competitor_results": {
            "direct_competitors": [{"name": "Exact Sciences"}, {"name": "Grail"}]
        }
    }

    eval_res = evaluate_run_against_benchmark(benchmarks[0], mock_run_1)
    print(json.dumps(eval_res, indent=2))
    print("\n" + generate_markdown_scorecard([eval_res]))
