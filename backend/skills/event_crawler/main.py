"""
CropNGo Agent — EventSearch Main Orchestrator (Gemini-Direct Mode)
===================================================================
Entry point for the EventSearch skill.
Called by the /events endpoint in the root main.py.

Architecture (Gemini-Direct — NO web crawlers):
  1. Resolve location via Google Maps Geocoding
  2. Profile the user (experience, preferences)
  3. Ask Gemini directly to find/generate events (skips DuckDuckGo/Jina)
  4. Format final JSON output
  5. Guaranteed 2 CropNGo branded events always included

Usage:
    from skills.event_crawler import run_event_search
    result = run_event_search(user_id, description, location_raw, web_search=True)
"""

from config import Config

from skills.event_crawler.crawler import profile_user, resolve_location
from skills.event_crawler.ranker    import ai_search_and_rank
from skills.event_crawler.formatter import format_final_output


def run_event_search(
    user_id:       str,
    description:   str,
    location_raw:  str,
    web_search:    bool = True,
) -> dict:
    """
    Full EventSearch pipeline (Gemini-Direct mode).

    Steps:
    1.  Resolve location via Google Maps Geocoding
    2.  Profile the user (experience, preferences)
    3.  Ask Gemini directly for events (no web crawling)
    4.  Format final JSON output

    Args:
        user_id      : CropNGo user ID (for logging)
        description  : User's description / bio from users table
        location_raw : Raw location string from users table
        web_search   : If False, return only CropNGo branded events

    Returns:
        dict — final JSON following the frontend contract in formatter.py
    """
    print("\n" + "="*60)
    print("  CropNGo Agent - EventSearch Pipeline Starting")
    print("  Mode: Gemini-Direct (no web crawlers)")
    print("="*60)

    # Use Google Maps API key from config for location resolution
    gmaps_key = Config.GOOGLE_MAPS_API_KEY

    if not web_search:
        print("[EventSearch] Web search disabled — returning CropNGo events only.")
        location = resolve_location(location_raw, gmaps_key)
        user_profile = profile_user(description)
        return format_final_output([], location, user_profile, description)

    # -- Step 1: Resolve location -----------------------------------------
    print("\n[1/3] Resolving location via Google Maps...")
    location = resolve_location(location_raw, gmaps_key)
    print(f"      -> {location['full']} ({location['lat']}, {location['lng']})")

    # -- Step 2: Profile user ---------------------------------------------
    print("\n[2/3] Profiling user from description...")
    user_profile = profile_user(description)
    print(f"      -> Experience  : {user_profile['experience_level']}")
    print(f"      -> Harvested   : {user_profile['has_harvested']}")
    print(f"      -> Preferences : {user_profile['event_preference'][:3]}")

    # -- Step 3: Gemini-Direct search (no crawlers) -----------------------
    print("\n[3/3] Asking Gemini directly for events (skipping web crawlers)...")
    ranked_events, is_exhausted = ai_search_and_rank(
        location, user_profile, description
    )

    # ── Format + return ──────────────────────────────────────────────────
    print("\n[Formatting final output...]")
    output = format_final_output(ranked_events, location, user_profile, description)

    if is_exhausted:
        output["message"] = "AI server is busy right now — showing CropNGo events only."

    print(f"\n{'-'*60}")
    print(f"  EventSearch Complete")
    print(f"  Total events: {output['total_found']}")
    print(f"  Opportunities: {output['opportunity_count']}")
    print(f"  Top picks: {output['top_pick_count']}")
    print(f"{'-'*60}\n")

    return output
