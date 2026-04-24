"""
CropNGo Agent — EventSearch AI Ranker (Gemini-Direct Mode)
==========================================================
Uses Gemini (google.genai) to directly search for and generate
agricultural events WITHOUT web crawlers.

Flow:
  1. Send a prompt to Gemini asking for REAL upcoming events
  2. Gemini uses its training knowledge to generate structured events
  3. Assign categories (Expo, Workshop, Webinar, Competition)
  4. Score each event for relevance to the user
  5. ALWAYS prepend 2 guaranteed CropNGo branded events

Cascade: 6 models × 10 iterations = 60 max attempts
"""

import json
from google import genai
from google.genai import types
from config import Config
from datetime import datetime


# ══════════════════════════════════════════════════════════════════
#  EVENT CATEGORIES (maps to frontend image slots)
# ══════════════════════════════════════════════════════════════════

CATEGORIES = {
    "Expo": {
        "image_slot": 1,
        "description": "Agricultural exhibitions, expos, and trade shows",
        "keywords": ["exhibition", "expo", "pameran", "trade show", "showcase", "fair", "festival", "carnival"],
    },
    "Workshop": {
        "image_slot": 2,
        "description": "Hands-on learning, training sessions, and bootcamps",
        "keywords": ["workshop", "training", "kursus", "bengkel", "bootcamp", "hands-on", "practical"],
    },
    "Webinar": {
        "image_slot": 3,
        "description": "Online seminars, webinars, conferences, and forums",
        "keywords": ["webinar", "seminar", "conference", "forum", "symposium", "online", "virtual", "talk"],
    },
    "Competition": {
        "image_slot": 4,
        "description": "Competitions, challenges, roadshows, and business opportunities",
        "keywords": ["competition", "challenge", "contest", "award", "roadshow", "road show",
                     "opportunity", "vendor", "seller", "promote", "market", "peluang", "pertandingan"],
    },
}


def assign_category(event_type: str, title: str, description: str) -> dict:
    """
    Maps an event to one of the 4 frontend image categories.
    Returns category name + image_slot number.
    """
    combined = (event_type + " " + title + " " + description).lower()
    for cat_name, cat_data in CATEGORIES.items():
        if any(kw in combined for kw in cat_data["keywords"]):
            return {"category": cat_name, "image_slot": cat_data["image_slot"]}
    # Default
    return {"category": "Expo", "image_slot": 1}


# ══════════════════════════════════════════════════════════════════
#  GUARANTEED CROPNGO BRANDED EVENTS (always shown)
# ══════════════════════════════════════════════════════════════════

def get_cropngo_events(location: dict) -> list[dict]:
    """Returns 2 guaranteed CropNGo branded events that always appear."""
    return [
        {
            "title": "The Great Farmers by CropNGo",
            "event_type": "Expo",
            "organiser": "CropNGo Events for Farmers, Vendors and Suppliers",
            "date_raw": "15 Nov 2026",
            "time_raw": "9:00 AM - 5:00 PM",
            "venue": "CropNGo Virtual Hub",
            "city": location.get('city', 'Online'),
            "state": location.get('state', 'Online'),
            "country": location.get('country', 'Malaysia'),
            "description": "An exclusive event for the CropNGo community. Connect with top farmers, suppliers, and vendors to grow your network and business.",
            "target_audience": "Farmers, Vendors, and Suppliers",
            "registration_url": "https://cropngo-1654b.web.app/",
            "source_url": "https://cropngo-1654b.web.app/",
            "domain": "cropngo.com",
            "is_trusted_source": True,
            "is_opportunity": False,
            "relevance_score": 100,
            "relevance_reason": "Exclusive official CropNGo networking event.",
            "category": "Expo",
            "image_slot": 1
        },
        {
            "title": "Tips to Plant, Care and Cultivate Plants",
            "event_type": "Workshop",
            "organiser": "CropNGo Events for Farmers, Vendors and Suppliers",
            "date_raw": "22 Nov 2026",
            "time_raw": "10:00 AM - 1:00 PM",
            "venue": "CropNGo Learning Center",
            "city": location.get('city', 'Online'),
            "state": location.get('state', 'Online'),
            "country": location.get('country', 'Malaysia'),
            "description": "Learn the best modern techniques to plant, care for, and cultivate your crops effectively for maximum yield.",
            "target_audience": "Farmers, Vendors, and Suppliers",
            "registration_url": "https://cropngo-1654b.web.app/",
            "source_url": "https://cropngo-1654b.web.app/",
            "domain": "cropngo.com",
            "is_trusted_source": True,
            "is_opportunity": False,
            "relevance_score": 95,
            "relevance_reason": "Essential cultivation knowledge from CropNGo experts.",
            "category": "Workshop",
            "image_slot": 2
        }
    ]


# ══════════════════════════════════════════════════════════════════
#  GEMINI-DIRECT EVENT SEARCH (no web crawlers)
# ══════════════════════════════════════════════════════════════════

def ai_search_and_rank(
    location: dict,
    user_profile: dict,
    description: str,
) -> tuple[list[dict], bool]:
    """
    Asks Gemini DIRECTLY to find/generate agricultural events
    WITHOUT any web crawling. Gemini uses its training knowledge.

    Returns:
        tuple of (events_list, is_exhausted)
        - events_list always includes 2 guaranteed CropNGo events
        - is_exhausted: True if all AI models failed
    """

    experience  = user_profile["experience_level"]
    preferences = ", ".join(user_profile["event_preference"])
    harvested   = user_profile["has_harvested"]
    today_str   = datetime.now().strftime('%Y-%m-%d')

    prompt = f"""You are an expert agricultural events research agent for Malaysia.

USER PROFILE:
- Location       : {location['full']}
- Experience     : {experience}
- Has Harvested  : {harvested}
- Preferred Events: {preferences}
- Description    : {description[:300]}

TODAY'S DATE: {today_str}

YOUR TASK:
Using your knowledge of agricultural events, workshops, expos, seminars,
roadshows, and farmer business opportunities in {location.get('country', 'Malaysia')},
generate a list of REALISTIC upcoming agricultural events that would be
relevant to this user.

CATEGORIES — You MUST use exactly one of these 4 categories:
- "Expo" — exhibitions, expos, trade shows, fairs, festivals, carnivals
- "Workshop" — hands-on training, workshops, bootcamps, courses, practical sessions
- "Webinar" — online seminars, conferences, forums, symposiums, virtual events, talks
- "Competition" — competitions, challenges, contests, awards, roadshows, vendor opportunities

RELEVANCE SCORING (0-100):
+40  Event is a Webinar, Online Event, or Virtual (highest priority)
+25  Event is a physical event in the SAME city/state as user ({location['city']}, {location['state']})
+15  Event is a physical event in the SAME country as user ({location['country']})
+20  Event type matches user preference ({preferences})
+15  Event is an opportunity to SELL or PROMOTE products (especially for experienced users)
+15  Event is a LEARNING opportunity (especially for newbie users)
+10  Source is a trusted government/authority domain
+10  Event has complete details (date, time, venue, contact, registration link)
+05  Event is upcoming (within next 6 months from today)

USER MATCHING RULES:
- experience=newbie, has_harvested=false  → Prioritise Workshops and Training
- experience=newbie, has_harvested=true   → Prioritise Expos and Competition
- experience=intermediate                 → Prioritise Competition, Expos, Workshops
- experience=experienced                  → Prioritise Competition to sell/promote

IMPORTANT INSTRUCTIONS:
- Generate 5 to 7 REALISTIC upcoming agricultural events
- Use REAL organisation names from {location.get('country', 'Malaysia')} (e.g. FAMA, MARDI, MOA, Agrobank, RISDA, FELDA)
- Set dates in the FUTURE (after {today_str}), within the next 6 months
- Include a mix of categories (at least 2 different categories)
- Make descriptions 2-4 sentences, informative, and explain value to the farmer
- Include realistic venue names and locations in {location.get('country', 'Malaysia')}

Return ONLY a valid JSON array. No markdown, no explanation. Format:
[
  {{
    "title"            : "Full event name",
    "event_type"       : "Expo|Workshop|Webinar|Competition",
    "organiser"        : "Organising body name",
    "date_raw"         : "Exact date string, e.g. '15 March 2025'",
    "time_raw"         : "Exact time string, e.g. '9:00 AM - 5:00 PM'",
    "venue"            : "Full venue name and address",
    "city"             : "City name",
    "state"            : "State name",
    "country"          : "{location['country']}",
    "description"      : "2-4 sentence description of event and its value to farmers",
    "target_audience"  : "Who should attend",
    "registration_url" : "https://realistic-url.example.com",
    "source_url"       : "https://realistic-url.example.com",
    "domain"           : "domain.com",
    "is_trusted_source": true|false,
    "is_opportunity"   : true|false,
    "relevance_score"  : 0-100,
    "relevance_reason" : "One sentence explaining why this event suits this specific user"
  }}
]

CRITICAL: Return a MAXIMUM of 7 events. Generate at least 5."""

    print("   [AI Search] Sending to Gemini (cascade: 6 models × 10 iterations)...")

    try:
        from llm_cascade import call_with_cascade, CascadeExhausted

        # 6 models × 10 iterations = 60 max attempts
        raw = call_with_cascade(
            prompt=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=4096,
            ),
            max_attempts=60  # 6 models × 10 iterations
        )
        raw = raw.replace("```json", "").replace("```", "").strip()

        try:
            events = json.loads(raw)
        except json.JSONDecodeError:
            print(f"   [AI Search] Failed to parse JSON. Raw output: {raw[:100]}...")
            events = []

        if not isinstance(events, list) or len(events) == 0:
            events = []

        # Post-process: assign image categories
        processed = []
        for e in events:
            cat = assign_category(
                e.get("event_type",""),
                e.get("title",""),
                e.get("description","")
            )
            e["category"]   = cat["category"]
            e["image_slot"] = cat["image_slot"]
            processed.append(e)

        processed.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
        processed = processed[:7]
        is_exhausted = False

    except CascadeExhausted as e:
        print(f"   [AI Search] Cascade exhausted: {e}")
        processed = []
        is_exhausted = True
    except Exception as e:
        print(f"   [AI Search] Error: {e}")
        processed = []
        is_exhausted = True

    # ── GUARANTEED: Always prepend 2 CropNGo branded events ─────────────
    cropngo_events = get_cropngo_events(location)

    if is_exhausted:
        # API failed — return only the 2 guaranteed CropNGo events
        final_events = cropngo_events
    else:
        # API success — CropNGo events first, then AI-generated events
        final_events = cropngo_events + processed

    print(f"   [AI Search] {len(final_events)} events total ({len(cropngo_events)} CropNGo + {len(processed)} AI-generated)")
    return final_events, is_exhausted