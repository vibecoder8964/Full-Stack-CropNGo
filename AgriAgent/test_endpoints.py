import httpx
import json

BASE_URL = "http://127.0.0.1:8000"

tests = [
    {
        "name": "Test 1 — DemandSearch",
        "route": "/agent",
        "payload": {
            "description": "Experienced paddy farmer based in Sekinchan, Selangor. Grows rice and occasionally vegetables.",
            "role": "Farmer",
            "web_search": True,
            "question": "Is there high demand for durian in my area right now?"
        }
    },
    {
        "name": "Test 2 — SuitabilitySearch",
        "route": "/agent",
        "payload": {
            "description": "Small-scale farmer in Cameron Highlands. Interested in diversifying crops.",
            "role": "Farmer",
            "web_search": True,
            "question": "Is strawberry a suitable crop to grow in my location?"
        }
    },
    {
        "name": "Test 3 — ProductSearch",
        "route": "/agent",
        "payload": {
            "description": "Vegetable supplier based in Kuala Lumpur looking for organic fertiliser sources.",
            "role": "Supplier",
            "web_search": True,
            "question": "Where can I find organic fertiliser suppliers?"
        }
    },
    {
        "name": "Test 4 — FarmerSearch",
        "route": "/agent",
        "payload": {
            "description": "New farmer with 2 acres of land in Johor Bahru, no prior farming experience.",
            "role": "Farmer",
            "web_search": True,
            "question": "Background:\n  Type of plant: Chilli\n  Place of cultivation: Johor Bahru\n  Land size: 2 acres\n  Tools available: Basic hand tools, water hose\n\nYour task: Based on the context and question given, analyse items needed by the farmer. Then search the items in the app and website."
        }
    },
    {
        "name": "Test 5 — Chatbox Fallback (No Skill Needed)",
        "route": "/chat",
        "payload": {
            "description": "General farmer in Perak growing mixed vegetables.",
            "role": "Farmer",
            "web_search": True,
            "question": "What is the difference between organic and conventional farming?"
        }
    }
]

def run_tests():
    with httpx.Client(timeout=30.0) as client:
        for t in tests:
            print(f"\\n{'='*50}")
            print(f"Running {t['name']}")
            print(f"{'='*50}")
            try:
                response = client.post(f"{BASE_URL}{t['route']}", json=t['payload'])
                if response.status_code == 200:
                    data = response.json()
                    print(data.get("response", "No response key in JSON"))
                else:
                    print(f"Failed with status: {response.status_code}")
                    print(response.text)
            except Exception as e:
                print(f"Error connecting to server: {e}")

if __name__ == "__main__":
    run_tests()
