import sys
import os
import time
from datetime import datetime, timedelta

# Ensure root path is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.config import settings
import data.cache as cache
from tools.search import search_service
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_model_configuration():
    print("\n=== 1. Testing Model Configuration (GPT-5.6-Luna) ===")
    assert settings.model_fast == "gpt-5.6-luna", f"Expected gpt-5.6-luna, got {settings.model_fast}"
    assert settings.model_reasoning == "gpt-5.6-luna", f"Expected gpt-5.6-luna, got {settings.model_reasoning}"
    assert settings.model_fallback == "gpt-4o-mini", f"Expected gpt-4o-mini, got {settings.model_fallback}"
    print(f"[OK] Model configured correctly: model_fast={settings.model_fast}, fallback={settings.model_fallback}")

def test_cache_engine():
    print("\n=== 2. Testing SQLite Cache Engine ===")
    test_ns = "test_ns"
    test_key = "query_startup_ai_tpa"
    test_payload = {"result": "Cached Market Intelligence", "metrics": {"tam": "$4.2B"}}

    # Purge any existing test data
    cache.purge_cache(test_ns)

    # Verify cache miss
    miss = cache.get_cached(test_ns, test_key)
    assert miss is None, "Expected cache miss"

    # Set cache with 5s TTL
    saved = cache.set_cached(test_ns, test_key, test_payload, ttl_seconds=5, query_preview="Startup AI TPA")
    assert saved is True, "Failed to save to cache"

    # Verify cache hit
    hit = cache.get_cached(test_ns, test_key)
    assert hit is not None, "Expected cache hit"
    assert hit["result"] == "Cached Market Intelligence"
    assert hit["metrics"]["tam"] == "$4.2B"
    print("[OK] Cache set & get verified successfully!")

    # Check stats
    stats = cache.get_cache_stats()
    assert stats["total_entries"] > 0
    assert test_ns in stats["by_namespace"]
    print(f"[OK] Cache stats verified: {stats}")

    # Test purge
    purged = cache.purge_cache(test_ns)
    assert purged >= 1
    assert cache.get_cached(test_ns, test_key) is None
    print("[OK] Cache purge verified successfully!")

def test_search_caching_integration():
    print("\n=== 3. Testing RealtimeSearchService Caching ===")
    query = "Autonomous WhatsApp B2B Sales SDR Indian Distributors"

    # Warm cache by executing search or setting cached mock
    cache_key = f"str:{query}:5:basic:None:None"
    mock_search_result = "[1] B2B WhatsApp Automation\nURL: https://example.com/sdr\nRelevance Content: High conversion rate"
    cache.set_cached("search", cache_key, mock_search_result, ttl_seconds=86400, query_preview=query)

    # Search should hit cache immediately (<5ms)
    t0 = time.time()
    result = search_service.search(query)
    elapsed = time.time() - t0

    assert "[1] B2B WhatsApp Automation" in result
    assert elapsed < 0.1, f"Expected instant cache hit (<100ms), took {elapsed:.4f}s"
    print(f"[OK] Search cache hit confirmed in {elapsed*1000:.2f}ms!")

def test_modular_api_endpoints():
    print("\n=== 4. Testing Modularized FastAPI Routes ===")
    
    # 1. Root healthcheck
    res_root = client.get("/")
    assert res_root.status_code == 200
    data_root = res_root.json()
    assert data_root["model"] == "gpt-5.6-luna"
    assert data_root["cache"] == "Active"
    print("[OK] Root health check passed!")

    # 2. Cache stats endpoint
    res_stats = client.get("/api/cache/stats")
    assert res_stats.status_code == 200
    assert "total_entries" in res_stats.json()
    print(f"[OK] /api/cache/stats passed: {res_stats.json()}")

    # 3. Catalog endpoints from insights_router
    res_trends = client.get("/api/trends")
    assert res_trends.status_code == 200
    assert len(res_trends.json()) >= 1
    print("[OK] /api/trends passed!")

    res_comps = client.get("/api/competitors")
    assert res_comps.status_code == 200
    print("[OK] /api/competitors passed!")

    # 4. Past analyses endpoint from analysis_router
    res_analyses = client.get("/api/analyses")
    assert res_analyses.status_code == 200
    assert isinstance(res_analyses.json(), list)
    print(f"[OK] /api/analyses passed! Retrieved {len(res_analyses.json())} past analyses.")

if __name__ == "__main__":
    test_model_configuration()
    test_cache_engine()
    test_search_caching_integration()
    test_modular_api_endpoints()
    print("\n=======================================================")
    print("ALL BACKEND UPGRADE TESTS PASSED SUCCESSFULLY!")
    print("=======================================================")
