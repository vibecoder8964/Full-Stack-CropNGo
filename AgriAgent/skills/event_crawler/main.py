"""
AgriAgent — EventSearch Main Orchestrator
==========================================
Entry point for the EventSearch skill.
Called by the /events endpoint in the root main.py.

Usage:
    from skills.event_crawler import run_event_search
    result = run_event_search(user_id, description, location_raw, web_search=True)
"""

from config import Config

from skills.event_crawler.crawler import (
    profile_user, resolve_location,
    build_seo_queries, recursive_crawl
)
from skills.event_crawler.ranker    import ai_rank_and_structure
from skills.event_crawler.formatter import format_final_output


def run_event_search(
    user_id:       str,
    description:   str,
    location_raw:  str,
    web_search:    bool = True,
) -> dict:
    """
    Full EventSearch pipeline.

    Steps:
    1.  Resolve location via Google Maps Geocoding
    2.  Profile the user (experience, preferences)
    3.  Build 25 SEO-optimised queries
    4.  Recursive web crawl (DuckDuckGo + Jina AI, depth 2)
    5.  Gemini AI ranks + structures all event data
    6.  Format final JSON output

    Args:
        user_id      : CropNGo user ID (for logging)
        description  : User's description / bio from users table
        location_raw : Raw location string from users table
        web_search   : If False, return empty (no web crawling)

    Returns:
        dict — final JSON following the frontend contract in formatter.py
    """
    print("\n" + "="*60)
    print("  AgriAgent - EventSearch Pipeline Starting")
    print("="*60)

    # Use Google Maps API key from config for location resolution
    gmaps_key = Config.GOOGLE_MAPS_API_KEY

    if not web_search:
        print("[EventSearch] Web search disabled.")
        return format_final_output([], {"full": location_raw, "city": "", "state": "", "country": "Malaysia"}, {}, description)

    # -- Step 1: Resolve location -----------------------------------------
    print("\n[1/5] Resolving location via Google Maps...")
    location = resolve_location(location_raw, gmaps_key)
    print(f"      -> {location['full']} ({location['lat']}, {location['lng']})")

    # -- Step 2: Profile user ---------------------------------------------
    print("\n[2/5] Profiling user from description...")
    user_profile = profile_user(description)
    print(f"      -> Experience  : {user_profile['experience_level']}")
    print(f"      -> Harvested   : {user_profile['has_harvested']}")
    print(f"      -> Preferences : {user_profile['event_preference'][:3]}")

    # -- Step 3: Build SEO queries ----------------------------------------
    print("\n[3/5] Building SEO-optimised search queries...")
    queries = build_seo_queries(location, user_profile, description)
    print(f"      -> {len(queries)} queries generated")

    # -- Step 4: Recursive crawl ------------------------------------------
    print("\n[4/5] Starting recursive web crawl...")
    event_keywords = ["event", "workshop", "expo", "pameran", "bengkel",
                      "seminar", "roadshow", "festival", "register", "daftar",
                      "competition", "webinar", "conference"]
    raw_pages = recursive_crawl(queries, event_keywords)
    print(f"      -> {len(raw_pages)} relevant pages collected")

    # -- Step 5: AI ranking -----------------------------------------------
    print("\n[5/5] Running Gemini AI ranking agent...")
    # Even if raw_pages is empty, we call the ranker to generate fallback events
    ranked_events = ai_rank_and_structure(
        raw_pages or [], location, user_profile, description
    )

    # ── Format + return ──────────────────────────────────────────────────
    print("\n[Formatting final output...]")
    output = format_final_output(ranked_events, location, user_profile, description)

    print(f"\n{'-'*60}")
    print(f"  EventSearch Complete")
    print(f"  Total events: {output['total_found']}")
    print(f"  Opportunities: {output['opportunity_count']}")
    print(f"  Top picks: {output['top_pick_count']}")
    print(f"{'-'*60}\n")

    return output
