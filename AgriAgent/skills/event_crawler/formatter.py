"""
AgriAgent — EventSearch Output Formatter
=========================================
Produces the final JSON structure consumed by the AgriConnect frontend.
The JSON schema here is the CONTRACT between backend and frontend.

Categories:  Expo | Workshop | Webinar | Competition
Image slots: 1=Expo, 2=Workshop, 3=Webinar, 4=Competition
"""

from datetime import datetime

CURRENT_DATE = datetime.now().strftime("%Y-%m-%d")
CURRENT_TS   = datetime.now().isoformat()


def format_final_output(
    ranked_events: list[dict],
    location: dict,
    user_profile: dict,
    description: str,
) -> dict:
    """
    Produces the final JSON output for the AgriConnect frontend.

    JSON CONTRACT (frontend must implement):
    ----------------------------------------
    {
      "status"          : "success" | "no_results" | "error",
      "generated_at"    : ISO timestamp,
      "location"        : { city, state, country, full },
      "user_profile"    : { experience_level, has_harvested, event_preference },
      "total_found"     : int,
      "top_pick_count"  : int,
      "opportunity_count": int,
      "event_count"     : int,
      "high_relevance_count": int,
      "opportunities"   : [ ...EventObject ],
      "events"          : [ ...EventObject ],
      "all_events"      : [ ...EventObject ],

      EventObject schema:
      {
        "id"               : "unique string ID",
        "title"            : "Event Title",
        "category"         : "Expo|Workshop|Webinar|Competition",
        "image_slot"       : 1|2|3|4,
        "event_type"       : "Expo|Workshop|Webinar|Competition",
        "organiser"        : "Organisation name",
        "date_raw"         : "15 March 2025",
        "time_raw"         : "9:00 AM - 5:00 PM",
        "venue"            : "Full venue address",
        "city"             : "Johor Bahru",
        "state"            : "Johor",
        "country"          : "Malaysia",
        "description"      : "2-4 sentence event description",
        "target_audience"  : "Who should attend",
        "is_opportunity"   : true|false,
        "is_trusted_source": true|false,
        "relevance_score"  : 0-100,
        "relevance_label"  : "Highly Relevant|Relevant|Somewhat Relevant|Low Relevance",
        "relevance_reason" : "Why this suits the user",
        "registration_url" : "https://...",
        "source_url"       : "https://...",
        "domain"           : "fama.gov.my",
        "badge"            : "🏆 Top Pick|⭐ Recommended|null"
      }
    }
    """
    if not ranked_events:
        return {
            "status":       "no_results",
            "generated_at": CURRENT_TS,
            "location":     location,
            "user_profile": user_profile,
            "total_found":  0,
            "top_pick_count": 0,
            "opportunity_count": 0,
            "event_count": 0,
            "high_relevance_count": 0,
            "opportunities": [],
            "events":       [],
            "all_events":   [],
            "message": (
                f"No upcoming agricultural events found near "
                f"{location.get('full','your area')}. "
                f"Please check back later or try expanding your search area."
            ),
        }

    formatted = []
    for i, e in enumerate(ranked_events):
        score = e.get("relevance_score", 0)

        # Relevance label
        if score >= 80:
            rel_label = "Highly Relevant"
            badge     = "🏆 Top Pick"
        elif score >= 60:
            rel_label = "Relevant"
            badge     = "⭐ Recommended"
        elif score >= 40:
            rel_label = "Somewhat Relevant"
            badge     = None
        else:
            rel_label = "Low Relevance"
            badge     = None

        # Ensure registration_url falls back to source_url
        reg_url = (e.get("registration_url") or
                   e.get("source_url") or "#")

        formatted.append({
            "id":                f"event_{i+1:03d}",
            "title":             e.get("title", "Untitled Event"),
            "category":          e.get("category", "Expo"),
            "image_slot":        e.get("image_slot", 1),
            "event_type":        e.get("event_type", "Expo"),
            "organiser":         e.get("organiser", "Not specified"),
            "date_raw":          e.get("date_raw", "Date not specified"),
            "time_raw":          e.get("time_raw", "Time not specified"),
            "venue":             e.get("venue", "Venue not specified"),
            "city":              e.get("city", ""),
            "state":             e.get("state", ""),
            "country":           e.get("country", "Malaysia"),
            "description":       e.get("description", ""),
            "target_audience":   e.get("target_audience", "All farmers"),
            "is_opportunity":    e.get("is_opportunity", False),
            "is_trusted_source": e.get("is_trusted_source", False),
            "relevance_score":   score,
            "relevance_label":   rel_label,
            "relevance_reason":  e.get("relevance_reason", ""),
            "registration_url":  reg_url,
            "source_url":        e.get("source_url", ""),
            "domain":            e.get("domain", ""),
            "badge":             badge,
        })

    opportunities = [e for e in formatted if e["is_opportunity"]]
    events        = [e for e in formatted if not e["is_opportunity"]]

    return {
        "status":              "success",
        "generated_at":        CURRENT_TS,
        "location":            location,
        "user_profile":        user_profile,
        "total_found":         len(formatted),
        "top_pick_count":      sum(1 for e in formatted if e["badge"] == "🏆 Top Pick"),
        "opportunity_count":   len(opportunities),
        "event_count":         len(events),
        "high_relevance_count": sum(1 for e in formatted if e["relevance_score"] >= 70),
        "opportunities":       opportunities,
        "events":              events,
        "all_events":          formatted,
    }