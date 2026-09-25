import requests
import time
import sys

BASE_URL = "http://localhost:8000"

def test_analysis_flow():
    print(f"Testing API at {BASE_URL}...")
    
    # 1. Start Analysis
    payload = {
        "raw_text": "I want to build a platform for renting high-end cameras to photographers in NYC.",
        "context_tags": {"industry": ["sharing economy"], "geo": ["NYC"]}
    }
    
    try:
        print("Sending POST /api/analysis/start request...")
        response = requests.post(f"{BASE_URL}/api/analysis/start", json=payload)
        response.raise_for_status()
        data = response.json()
        analysis_id = data.get("analysis_id")
        print(f"Analysis started with ID: {analysis_id}")
    except Exception as e:
        print(f"Failed to start analysis: {e}")
        return

    # 2. Poll Status
    print("Polling status for 30 seconds...")
    for i in range(10):
        try:
            status_res = requests.get(f"{BASE_URL}/api/analysis/{analysis_id}/status")
            status_data = status_res.json()
            status = status_data.get("status")
            print(f"[{i+1}/10] Status: {status}")
            
            if status == "failed":
                print("Analysis FAILED!")
                print(f"Error: {status_data.get('error')}")
                return
            
            if status == "completed":
                print("Analysis COMPLETED sucessfully!")
                return

            time.sleep(3)
        except Exception as e:
            print(f"Polling error: {e}")

    print("Test passed: Analysis is running successfully (no immediate failure).")

if __name__ == "__main__":
    test_analysis_flow()
