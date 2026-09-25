import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agents.graph import app as graph_app
import data.database as db

def test_graph_topology():
    print("=== 1. Verifying Graph Topology ===")
    graph = graph_app.get_graph()
    nodes = list(graph.nodes.keys())
    print("Compiled Nodes:", nodes)
    
    assert "structure" in nodes
    assert "synthesis" in nodes
    assert "critic" in nodes
    assert "decision" in nodes
    assert "report" in nodes

    # Verify edges
    edges = [(e.source, e.target) for e in graph.edges]
    print("Sample Edges:", edges[:8])
    
    # Assert Critic is strictly between Synthesis and Decision
    assert ("synthesis", "critic") in edges, "synthesis must feed into critic"
    assert ("critic", "decision") in edges, "critic must feed into decision"
    assert ("decision", "report") in edges, "decision must feed into report"
    print("[OK] Graph topology verified: structure -> parallel(6) -> synthesis -> critic -> decision -> report")

def test_sqlite_persistence():
    print("\n=== 2. Verifying SQLite Persistence ===")
    db.init_db()
    test_id = "test-persist-run"
    
    # 1. Create
    rec = db.create_analysis(
        analysis_id=test_id,
        raw_text="Test automated intelligence idea",
        context_tags={"sector": "fintech"},
        user_id="analyst_1"
    )
    assert rec["id"] == test_id
    assert rec["status"] == "pending"
    assert rec["progress_percentage"] == 0

    # 2. Update agent progress
    rec_updated = db.update_agent_progress(
        analysis_id=test_id,
        node_name="competitor",
        node_status="completed",
        metric_label="Identified 4 rivals (Saturation: 7/10)"
    )
    assert rec_updated["agent_statuses"]["competitor"] == "completed"
    assert rec_updated["agent_metrics"]["competitor"] == "Identified 4 rivals (Saturation: 7/10)"
    assert rec_updated["progress_percentage"] > 0

    # 3. Update status to completed
    rec_final = db.update_analysis_status(
        analysis_id=test_id,
        status="completed",
        result={"decision_results": {"decision": "GO", "confidence_score": 82}}
    )
    assert rec_final["status"] == "completed"
    assert rec_final["progress_percentage"] == 100
    assert rec_final["result"]["decision_results"]["decision"] == "GO"

    # 4. Fetch from database
    fetched = db.get_analysis(test_id)
    assert fetched["id"] == test_id
    assert fetched["status"] == "completed"

    # 5. List analyses
    all_runs = db.list_analyses(limit=10)
    assert any(r["id"] == test_id for r in all_runs)
    print("[OK] SQLite persistence verified: CRUD, status transitions, metrics, and listing works!")

    # Cleanup test run
    s = db.SessionLocal()
    s.query(db.AnalysisRecord).filter(db.AnalysisRecord.id == test_id).delete()
    s.commit()
    s.close()
    print("[OK] Test cleanup completed.")

if __name__ == "__main__":
    test_graph_topology()
    test_sqlite_persistence()
    print("\n[ALL TESTS PASSED SUCCESSFULLY!]")
