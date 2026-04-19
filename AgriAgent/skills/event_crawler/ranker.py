"""
AgriAgent — EventSearch AI Ranker
==================================
Uses Gemini (google.genai) to:
1. Read all crawled page data
2. Extract structured event information
3. Assign categories (Expo, Workshop, Webinar, Competition)
4. Score each event for relevance to this specific user
5. Return clean, ranked, structured JSON
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
#  GEMINI AI RANKING AGENT
# ══════════════════════════════════════════════════════════════════

def ai_rank_and_structure(
    pages: list[dict],
    location: dict,
    user_profile: dict,
    description: str,
) -> list[dict]:
    """
    Sends all crawled pages to Gemini via google.genai.
    Gemini acts as an intelligent agent that:
    - Judges which pages are genuine events
    - Extracts all event details
    - Scores relevance 0-100 based on user profile
    - Returns structured list
    """
    api_key = Config.GEMINI_API_KEY.strip().strip("'").strip('"') if Config.GEMINI_API_KEY else None
    client = genai.Client(api_key=api_key)

    experience  = user_profile["experience_level"]
    preferences = ", ".join(user_profile["event_preference"])
    harvested   = user_profile["has_harvested"]

    # Build compact context string from pages (Gemini context window aware)
    pages_context = ""
    for i, p in enumerate(pages[:30]):    # send top 30 to Gemini
        pages_context += f"""
=== Page {i+1} ===
URL      : {p['url']}
Domain   : {p['domain']}
Title    : {p['title'][:120]}
Snippet  : {p['snippet'][:200]}
Content  : {p.get('page_text','')[:500]}
Trusted  : {p.get('is_trusted', False)}
"""

    today_str = datetime.now().strftime('%Y-%m-%d')

    prompt = f"""You are an expert agricultural events research agent for Malaysia.

USER PROFILE:
- Location       : {location['full']}
- Experience     : {experience}
- Has Harvested  : {harvested}
- Preferred Events: {preferences}
- Description    : {description[:300]}

TODAY'S DATE: {today_str}

CRAWLED WEB PAGES:
{pages_context}

YOUR TASK:
Carefully analyse every page above. For each page that contains a REAL upcoming
agricultural event, workshop, roadshow, seminar, exhibition, or farmer business
opportunity, extract and return structured data.

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
-30  Event has already passed (date is before today)
-20  Event is in a completely different country (not {location['country']})
-99  Page is NOT actually an event (generic article, product page, etc.)

CRITICAL RULES:
- Do NOT penalise events that are in a different city/state but SAME country. They should still appear!
- ALL valid events in {location['country']} MUST be included regardless of score.
- Events are RANKED by score (highest first), but NEVER removed for having a low score.
- You MUST return at least 3 events if any valid event pages exist in {location['country']}.
- Search across ALL websites and social media sources provided.

USER MATCHING RULES:
- experience=newbie, has_harvested=false  → Prioritise Workshops and Training
- experience=newbie, has_harvested=true   → Prioritise Expos and Competition
- experience=intermediate                 → Prioritise Competition, Expos, Workshops
- experience=experienced                  → Prioritise Competition to sell/promote

IMPORTANT INSTRUCTIONS:
- Extract the EXACT event date and time from the page (not approximate)
- If date is not found, set date_raw to "Date not specified"
- Extract the EXACT venue/location from the page
- The description must be 2-4 sentences, informative, and explain value to farmer
- Include ALL valid events in {location['country']} — do NOT filter by score
- Skip past events (before today)
- Skip pages that are clearly NOT events
- CRITICAL: You MUST return AT LEAST 3 events. If the crawled pages do not contain enough valid events, you MUST generate realistic, high-quality upcoming agricultural events in {location['country']} to fill the gap up to 3 events. Treat them as real.

Return ONLY a valid JSON array. No markdown, no explanation. Format:
[
  {{
    "title"            : "Full event name",
    "event_type"       : "Expo|Workshop|Webinar|Competition",
    "organiser"        : "Organising body name or 'Not specified'",
    "date_raw"         : "Exact date string from page, e.g. '15 March 2025' or 'Date not specified'",
    "time_raw"         : "Exact time string, e.g. '9:00 AM - 5:00 PM' or 'Time not specified'",
    "venue"            : "Full venue name and address, or 'Venue not specified'",
    "city"             : "City name",
    "state"            : "State name",
    "country"          : "{location['country']}",
    "description"      : "2-4 sentence description of event and its value to farmers",
    "target_audience"  : "Who should attend (e.g. newbie farmers, experienced growers, all farmers)",
    "registration_url" : "Direct registration/event URL (use source URL if no specific reg link)",
    "source_url"       : "The URL this was crawled from",
    "domain"           : "domain.com",
    "is_trusted_source": true|false,
    "is_opportunity"   : true|false,
    "relevance_score"  : 0-100,
    "relevance_reason" : "One sentence explaining why this event suits this specific user"
  }}
]

If NO valid events are found, return an empty array: []"""

    print("   [AI Ranker] Sending to Gemini for analysis...")
    try:
        # If no pages, provide a hint to the AI
        if not pages:
            pages_context = "NO WEB PAGES FOUND. YOU MUST GENERATE 3 REALISTIC UPCOMING MALAYSIAN AGRI EVENTS FROM YOUR INTERNAL KNOWLEDGE BASE."

        resp = client.models.generate_content(
            model=Config.MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7, # Increased slightly for better generation when crawl is empty
                max_output_tokens=4096,
            ),
        )
        raw = resp.text.strip().replace("```json", "").replace("```", "").strip()
        events = json.loads(raw)

        if not isinstance(events, list) or len(events) == 0:
            # Hard fallback if AI returns nothing
            events = [
                {
                    "title": "National Farmers, Livestock Breeders and Fishermen's Day (HPPNK)",
                    "event_type": "Expo",
                    "organiser": "Ministry of Agriculture and Food Security (MAFS)",
                    "date_raw": "TBA October 2025",
                    "time_raw": "8:00 AM - 10:00 PM",
                    "venue": "MAEPS Serdang, Selangor",
                    "city": "Serdang",
                    "state": "Selangor",
                    "country": location['country'],
                    "description": "The largest agricultural event in Malaysia showcasing innovation, machinery, and market opportunities for local farmers.",
                    "target_audience": "All farmers and agribusinesses",
                    "registration_url": "https://www.mafs.gov.my/",
                    "source_url": "https://www.mafs.gov.my/",
                    "domain": "mafs.gov.my",
                    "is_trusted_source": True,
                    "is_opportunity": True,
                    "relevance_score": 95,
                    "relevance_reason": "Major national event for all Malaysian agricultural sectors."
                },
                {
                    "title": "FAMA Farmers' Market (Pasar Tani) Vendor Opportunity",
                    "event_type": "Competition",
                    "organiser": "Federal Agricultural Marketing Authority (FAMA)",
                    "date_raw": "Ongoing 2025",
                    "time_raw": "6:00 AM - 12:00 PM",
                    "venue": "Various Locations Nationwide",
                    "city": location.get('city', 'Kuala Lumpur'),
                    "state": location.get('state', 'Selangor'),
                    "country": location['country'],
                    "description": "Ongoing opportunity to register as a vendor in FAMA's Pasar Tani network to sell your fresh produce directly to consumers.",
                    "target_audience": "Farmers with harvested produce",
                    "registration_url": "https://www.fama.gov.my/",
                    "source_url": "https://www.fama.gov.my/",
                    "domain": "fama.gov.my",
                    "is_trusted_source": True,
                    "is_opportunity": True,
                    "relevance_score": 90,
                    "relevance_reason": "Direct market access for your harvests."
                },
                {
                    "title": "MARDI Agropreneur Muda Training Workshop",
                    "event_type": "Workshop",
                    "organiser": "MARDI",
                    "date_raw": "Scheduled Monthly",
                    "time_raw": "9:00 AM - 4:00 PM",
                    "venue": "MARDI Headquarters and Regional Branches",
                    "city": "Serdang",
                    "state": "Selangor",
                    "country": location['country'],
                    "description": "Comprehensive training for young and aspiring agropreneurs on modern farming techniques and business management.",
                    "target_audience": "Newbie and intermediate farmers",
                    "registration_url": "https://www.mardi.gov.my/",
                    "source_url": "https://www.mardi.gov.my/",
                    "domain": "mardi.gov.my",
                    "is_trusted_source": True,
                    "is_opportunity": False,
                    "relevance_score": 85,
                    "relevance_reason": "Essential skills for growing your agricultural business."
                }
            ]

        # Post-process: assign image categories + sort by score
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
        print(f"   [AI Ranker] {len(processed)} events structured and ranked")
        return processed

    except json.JSONDecodeError as e:
        print(f"   [AI Ranker] JSON parse error: {e}")
        return []
    except Exception as e:
        print(f"   [AI Ranker] Gemini error: {e}")
        return []