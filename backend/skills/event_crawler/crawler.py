"""
CropNGo Agent — EventSearch Utilities
======================================
Utility functions for the EventSearch pipeline.
All web searching is now handled by Gemini AI directly (see ranker.py).

Kept functions:
  profile_user()      → Analyses user description for experience/preferences
  resolve_location()  → Google Maps Geocoding API wrapper
"""

import requests
from config import Config

# Location cache to avoid repeated geocoding API calls
_location_cache = {}


# ══════════════════════════════════════════════════════════════════
#  USER PROFILE EXTRACTION
# ══════════════════════════════════════════════════════════════════

def profile_user(description: str) -> dict:
    """
    Analyses user description and classifies:
    - experience_level : newbie / intermediate / experienced
    - has_harvested    : whether user has harvested before
    - crop_types       : list of crops/products
    - goals            : sell / learn / network / all
    - event_preference : ranked list of preferred event types
    """
    desc_lower = description.lower()

    # Experience level heuristics
    newbie_signals     = ["new", "beginner", "start", "first time", "just", "learning",
                          "baru", "mula", "baru mula", "pemula"]
    experienced_signals = ["years", "experience", "veteran", "established", "since",
                           "tahun", "berpengalaman", "lama"]

    newbie_score      = sum(1 for s in newbie_signals if s in desc_lower)
    experienced_score = sum(1 for s in experienced_signals if s in desc_lower)

    if experienced_score > newbie_score:
        experience = "experienced"
    elif newbie_score > 0:
        experience = "newbie"
    else:
        experience = "intermediate"

    has_harvested = any(w in desc_lower for w in [
        "harvest", "tuai", "sell", "jual", "sold", "market",
        "income", "pendapatan", "result", "yield"
    ])

    # Determine event preference based on profile
    if experience == "newbie" and not has_harvested:
        event_preference = ["Workshop", "Training", "Seminar", "Webinar"]
    elif experience == "newbie" and has_harvested:
        event_preference = ["Exhibition", "Roadshow", "Workshop", "Opportunity"]
    elif experience == "intermediate":
        event_preference = ["Exhibition", "Roadshow", "Workshop", "Conference", "Opportunity"]
    else:  # experienced
        event_preference = ["Opportunity", "Exhibition", "Conference", "Expo", "Roadshow"]

    return {
        "experience_level":  experience,
        "has_harvested":     has_harvested,
        "event_preference":  event_preference,
        "raw_description":   description,
    }


# ══════════════════════════════════════════════════════════════════
#  LOCATION RESOLUTION
# ══════════════════════════════════════════════════════════════════

def resolve_location(location_raw: str, gmaps_key: str) -> dict:
    """
    Takes a raw location string (from user DB) and returns
    structured location data via Google Maps Geocoding API.
    Uses caching to avoid repeated API calls for same location.
    """
    global _location_cache
    
    if not location_raw:
        return {"city": "Malaysia", "state": "Malaysia",
                "country": "Malaysia", "full": "Malaysia",
                "lat": 3.1390, "lng": 101.6869}
    
    # Check cache first
    cache_key = location_raw.strip().lower()
    if cache_key in _location_cache:
        print(f"   [Maps] Using cached location for: {location_raw}")
        return _location_cache[cache_key]

    try:
        resp = requests.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params={"address": location_raw, "key": gmaps_key, "region": "MY"},
            timeout=8
        )
        data = resp.json()
        if data.get("results"):
            components = data["results"][0]["address_components"]
            geo        = data["results"][0]["geometry"]["location"]
            city  = next((c["long_name"] for c in components if "locality" in c["types"]), "")
            state = next((c["long_name"] for c in components if "administrative_area_level_1" in c["types"]), "")
            country = next((c["long_name"] for c in components if "country" in c["types"]), "Malaysia")
            full  = ", ".join(filter(None, [city, state, country]))
            result = {"city": city, "state": state, "country": country,
                    "full": full or location_raw,
                    "lat": geo["lat"], "lng": geo["lng"]}
            # Cache the result
            _location_cache[cache_key] = result
            return result
    except Exception as e:
        print(f"   [Maps] Error: {e}")

    result = {"city": location_raw, "state": location_raw,
            "country": "Malaysia", "full": location_raw,
            "lat": 3.1390, "lng": 101.6869}
    _location_cache[cache_key] = result
    return result