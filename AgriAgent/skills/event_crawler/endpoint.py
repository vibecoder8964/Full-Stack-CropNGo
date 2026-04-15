"""
AgriAgent — EventSearch FastAPI Endpoint
=========================================
Defines the request model and test runner for the /events endpoint.
The endpoint itself is registered in the root main.py.

Endpoint  : POST /events
Port      : 8000 (same as agent)
CORS      : Already handled by existing middleware
"""

import os
from pydantic import BaseModel


# ── Request model ─────────────────────────────────────────────────────────
class EventSearchRequest(BaseModel):
    user_id:      str           # AgriConnect user ID (username)
    description:  str           # from users table (bio)
    location:     str           # from users table (raw string e.g. "Johor Bahru")
    web_search:   bool = True   # user toggle in frontend


# ── Test runner (run this file directly to test) ──────────────────────────
if __name__ == "__main__":
    import json
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

    from skills.event_crawler.main import run_event_search

    TEST_CASES = [
        {
            "name": "Newbie farmer, no harvest yet — Johor Bahru",
            "payload": {
                "user_id":    "u_test_001",
                "description": (
                    "I am a new farmer in Johor Bahru. Just started farming "
                    "this year. I am growing chilli and vegetables on a small "
                    "plot of land. I want to learn more about farming techniques."
                ),
                "location":   "Johor Bahru, Johor",
                "web_search": True,
            }
        },
        {
            "name": "Newbie but harvested — Selangor",
            "payload": {
                "user_id":    "u_test_002",
                "description": (
                    "I started farming 6 months ago in Shah Alam, Selangor. "
                    "I have already harvested my first batch of vegetables and "
                    "want to find places to sell my produce. Growing tomatoes "
                    "and cucumber."
                ),
                "location":   "Shah Alam, Selangor",
                "web_search": True,
            }
        },
        {
            "name": "Experienced paddy farmer — Kedah",
            "payload": {
                "user_id":    "u_test_003",
                "description": (
                    "Experienced paddy farmer in Alor Setar, Kedah with 15 years "
                    "of experience. Part of MADA irrigation scheme. Looking to "
                    "expand my network and find business opportunities to sell "
                    "my rice directly to buyers."
                ),
                "location":   "Alor Setar, Kedah",
                "web_search": True,
            }
        },
    ]

    print("\n" + "#"*60)
    print("  AgriAgent EventSearch - Test Runner")
    print("#"*60)

    for i, tc in enumerate(TEST_CASES):
        print(f"\n\n{'-'*60}")
        print(f"  TEST {i+1}: {tc['name']}")
        print(f"{'-'*60}")

        result = run_event_search(
            user_id      = tc["payload"]["user_id"],
            description  = tc["payload"]["description"],
            location_raw = tc["payload"]["location"],
            web_search   = tc["payload"]["web_search"],
        )

        # Pretty print summary
        print(f"\n  STATUS       : {result['status']}")
        print(f"  LOCATION     : {result['location']['full']}")
        print(f"  TOTAL FOUND  : {result['total_found']}")
        print(f"  TOP PICKS    : {result.get('top_pick_count', 0)}")
        print(f"  OPPORTUNITIES: {result.get('opportunity_count', 0)}")

        if result["status"] == "success" and result["all_events"]:
            print(f"\n  TOP 3 EVENTS:")
            for j, evt in enumerate(result["all_events"][:3]):
                print(f"\n    [{j+1}] {evt['title']}")
                print(f"         Category  : {evt['category']} (image_slot={evt['image_slot']})")
                print(f"         Date/Time : {evt['date_raw']} {evt['time_raw']}")
                print(f"         Venue     : {evt['venue'][:60]}")
                print(f"         Score     : {evt['relevance_score']}/100 - {evt['relevance_label']}")
                print(f"         Badge     : {evt.get('badge') or 'None'}")
                print(f"         URL       : {evt['registration_url'][:60]}")

        # Save full JSON output
        out_file = f"test_output_{i+1}.json"
        with open(out_file, "w") as f:
            json.dump(result, f, indent=2)
        print(f"\n  OK Full output saved to {out_file}")

    print(f"\n\n" + "#"*60)
    print("  All tests complete.")
    print("#"*60)