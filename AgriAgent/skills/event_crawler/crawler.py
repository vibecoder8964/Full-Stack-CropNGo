"""
AgriAgent — EventSearch Recursive Web Crawler
=============================================
Recursively crawls the web to find agricultural events,
workshops, roadshows, and farmer business opportunities.
 
Architecture:
  run_event_crawler()
    ├── resolve_location()           → Google Maps Geocoding
    ├── profile_user()               → Gemini extracts user profile
    ├── build_seo_queries()          → SEO-optimised query list
    ├── recursive_crawl()            → DuckDuckGo + Jina AI, depth-first
    │     ├── crawl_ddg()            → get URLs from search engine
    │     ├── read_page_jina()       → extract clean page text
    │     ├── extract_links()        → find sub-links on page
    │     └── recurse into links     → depth up to MAX_DEPTH
    ├── deduplicate_results()        → remove duplicate URLs/events
    ├── ai_rank_and_structure()      → Gemini scores + structures events
    └── format_output()             → final JSON for frontend
"""
 
import os
import re
import time
import hashlib
import requests
from datetime import datetime
from urllib.parse import quote_plus, urlparse, urljoin
from bs4 import BeautifulSoup
from collections import deque
 
 
# ══════════════════════════════════════════════════════════════════
#  CONSTANTS
# ══════════════════════════════════════════════════════════════════
 
JINA_BASE   = "https://r.jina.ai/"
DDG_URL     = "https://html.duckduckgo.com/html/"
BING_URL    = "https://www.bing.com/search"
 
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9,ms;q=0.8",
}
 
MAX_DEPTH        = 2      # how deep to follow links recursively
MAX_URLS_PER_Q   = 5      # URLs per search query
MAX_LINKS_PER_P  = 3      # sub-links to follow per page
MAX_TOTAL_PAGES  = 40     # hard cap on total pages read
REQUEST_DELAY    = 0.6    # seconds between requests (polite crawling)
JINA_MAX_CHARS   = 1800   # characters to read per page
 
CURRENT_YEAR  = datetime.now().year
CURRENT_MONTH = datetime.now().strftime("%B")
CURRENT_DATE  = datetime.now().strftime("%Y-%m-%d")
 
# Trusted agricultural domains — get SEO priority boost
TRUSTED_DOMAINS = [
    "moa.gov.my", "fama.gov.my", "mardi.gov.my", "doa.gov.my",
    "felda.net.my", "agrobank.com.my", "lada.gov.my", "risda.gov.my",
    "mpob.gov.my", "lgm.gov.my", "fib.gov.my", "moa.gov.my",
    "eventbrite.com", "meetup.com", "eventbrite.my",
    "bernama.com", "thestar.com.my", "nst.com.my", "malaymail.com",
    "agriculture.com.my", "agromedia.com.my",
]
 
# Keywords that strongly suggest an event page (not just an article)
EVENT_SIGNALS = [
    "event", "workshop", "seminar", "expo", "exhibition", "conference",
    "roadshow", "festival", "fair", "webinar", "forum", "symposium",
    "bootcamp", "training", "programme", "program", "pendaftaran",
    "pameran", "bengkel", "kursus", "daftar", "register", "join us",
    "attend", "exhibitor", "vendor", "showcase", "opportunity",
    "open to", "farmers welcome", "submit application",
]
 
# Keywords that disqualify a page (old news, unrelated)
DISQUALIFY_SIGNALS = [
    "404", "page not found", "error", "login required",
    "subscribe to read", "paywall",
]
 
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
    """
    if not location_raw:
        return {"city": "Malaysia", "state": "Malaysia",
                "country": "Malaysia", "full": "Malaysia",
                "lat": 3.1390, "lng": 101.6869}
 
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
            return {"city": city, "state": state, "country": country,
                    "full": full or location_raw,
                    "lat": geo["lat"], "lng": geo["lng"]}
    except Exception as e:
        print(f"   [Maps] Error: {e}")
 
    return {"city": location_raw, "state": location_raw,
            "country": "Malaysia", "full": location_raw,
            "lat": 3.1390, "lng": 101.6869}
 
 
# ══════════════════════════════════════════════════════════════════
#  SEO QUERY BUILDER
# ══════════════════════════════════════════════════════════════════
 
def build_seo_queries(location: dict, user_profile: dict,
                      description: str) -> list[str]:
    """
    Builds a prioritised list of SEO-optimised search queries.
    Focuses on the entire country to broaden search results, 
    and adds social media & online keywords.
    """
    country = location.get("country", "Malaysia")
    year  = CURRENT_YEAR
    month = CURRENT_MONTH
    prefs = user_profile["event_preference"]
 
    queries = []
 
    # ── Tier 1: Country-level, current, event-type specific + Online/Social ──────────────
    for pref in prefs[:3]:
        queries += [
            f"agricultural {pref.lower()} {country} {year}",
            f"farming {pref.lower()} {country} online {month} {year}",
            f"agri {pref.lower()} {country} {year} register facebook",
            f"agri {pref.lower()} webinar {country} {year}",
        ]
 
    # ── Tier 2: Opportunity / expose queries ───────────────────────────
    queries += [
        f"farmers market vendor opportunity {country} {year}",
        f"agricultural product showcase {country} {year}",
        f"agro exhibition exhibitor registration {country} {year}",
        f"sell farm produce exhibition {country} {year}",
        f"peluang petani pameran {country} {year}",
        f"bengkel pertanian online {country} {month} {year}",
        f"pameran agro {country} facebook {year}",
    ]
 
    # ── Tier 3: Authority site queries (high trust SEO) ─────────────────
    # If the user is in Malaysia, we can keep the MY domains. Otherwise, we just fallback to generic.
    if country.lower() == "malaysia":
        queries += [
            f"site:fama.gov.my event {year}",
            f"site:moa.gov.my programme {year}",
            f"site:mardi.gov.my workshop {year}",
            f"FAMA agro carnival {country} {year}",
            f"MOA agriculture programme {country} {year}",
            f"Agrobank farming event {year}",
        ]
    else:
        queries += [
            f"site:gov agriculture event {country} {year}",
            f"ministry of agriculture {country} event {year}",
        ]
 
    # ── Tier 4: National fallbacks ──────────────────────────────────────
    queries += [
        f"agriculture events {country} {month} {year}",
        f"farming workshop {country} {year}",
        f"agri expo {country} {year}",
        f"agriculture conference {country} {year}",
        f"farm roadshow {country} {year}",
    ]
 
    # ── Tier 5: Experience-specific ─────────────────────────────────────
    level = user_profile["experience_level"]
    if level == "newbie":
        queries += [
            f"beginner farmer training {country} {year}",
            f"pertanian asas kursus {country} {year}",
            f"new farmer workshop {country} online {year}",
        ]
    elif level == "experienced":
        queries += [
            f"agribusiness networking {country} {year}",
            f"export opportunity agriculture {country} {year}",
            f"agriculture B2B {country} {year}",
        ]
 
    # Deduplicate preserving order
    seen, unique = set(), []
    for q in queries:
        if q not in seen:
            seen.add(q)
            unique.append(q)
 
    return unique[:25]  # top 25 queries
 
 
# ══════════════════════════════════════════════════════════════════
#  CRAWLING ENGINE
# ══════════════════════════════════════════════════════════════════
 
def is_trusted(url: str) -> bool:
    domain = urlparse(url).netloc.replace("www.", "")
    return any(td in domain for td in TRUSTED_DOMAINS)
 
 
def is_event_relevant(text: str, threshold: int = 2) -> bool:
    text_lower = text.lower()
    if any(s in text_lower for s in DISQUALIFY_SIGNALS):
        return False
    score = sum(1 for s in EVENT_SIGNALS if s in text_lower)
    return score >= threshold
 
 
def extract_links_from_page(html: str, base_url: str,
                             keywords: list[str]) -> list[str]:
    """
    Extracts sub-links from a page that are likely to be event pages.
    Uses keyword matching to avoid following irrelevant links.
    """
    try:
        soup  = BeautifulSoup(html, "html.parser")
        links = []
        for a in soup.find_all("a", href=True):
            href = a.get("href", "")
            text = a.get_text(strip=True).lower()
            # Resolve relative URLs
            full_url = urljoin(base_url, href)
            if not full_url.startswith("http"):
                continue
            # Only follow links that look event-related
            combined = href.lower() + " " + text
            if any(kw in combined for kw in keywords):
                links.append(full_url)
        # Deduplicate
        return list(dict.fromkeys(links))[:MAX_LINKS_PER_P]
    except Exception:
        return []
 
 
def crawl_search_engine(query: str, engine: str = "ddg") -> list[dict]:
    """
    Gets URLs from DuckDuckGo via duckduckgo_search library.
    Returns list of {url, title, snippet}.
    """
    results = []
    try:
        from ddgs import DDGS
        
        with DDGS() as ddgs:
            # We use text search
            search_results = list(ddgs.text(query, region='wt-wt', safesearch='moderate', max_results=MAX_URLS_PER_Q))
            
            for item in search_results:
                url = item.get("href", "")
                if not url.startswith("http"):
                    continue
                results.append({
                    "url":     url,
                    "title":   item.get("title", ""),
                    "snippet": item.get("body", ""),
                    "domain":  urlparse(url).netloc.replace("www.", ""),
                    "query":   query,
                    "trusted": is_trusted(url),
                })
    except Exception as e:
        print(f"      [Search engine error] {e}")
 
    return results
 
 
def read_page_jina(url: str) -> tuple[str, str]:
    """
    Reads a URL via Jina AI reader (free, no API key).
    Returns (clean_text, raw_html_snippet).
    """
    try:
        resp = requests.get(
            f"{JINA_BASE}{url}",
            headers={"Accept": "text/plain", **HEADERS},
            timeout=14
        )
        if resp.status_code == 200:
            text = resp.text[:JINA_MAX_CHARS].strip()
            return text, ""
    except Exception:
        pass
    # Fallback: direct request + BeautifulSoup
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        text = soup.get_text(separator=" ", strip=True)[:JINA_MAX_CHARS]
        return text, resp.text[:3000]
    except Exception:
        return "", ""
 
 
def recursive_crawl(queries: list[str],
                    event_keywords: list[str]) -> list[dict]:
    """
    Core recursive crawler.
 
    Algorithm:
    1. For each SEO query → get URLs from DuckDuckGo
    2. For each URL → read page with Jina AI
    3. If page is event-relevant → extract sub-links
    4. Follow sub-links recursively up to MAX_DEPTH
    5. Collect all page data with metadata
    6. Hard-cap at MAX_TOTAL_PAGES
 
    Uses BFS (breadth-first) queue to manage recursion.
    Trusted domains are always followed deeper.
    """
    visited   = set()       # URL fingerprints
    all_pages = []          # collected page data
    queue     = deque()     # (url, depth, parent_query, metadata)
 
    link_keywords = ["event", "workshop", "seminar", "expo", "fair",
                     "exhibition", "roadshow", "register", "daftar",
                     "pameran", "bengkel", "opportunity", "programme"]
 
    # ── Seed the queue from search results ────────────────────────────
    print(f"   [Crawler] Seeding queue with {len(queries)} queries...")
    for i, query in enumerate(queries[:20]):
        print(f"   [Query {i+1}/{min(len(queries),20)}] '{query[:55]}...'")
        results = crawl_search_engine(query, engine="ddg")
        # Fallback to Bing if DDG returns nothing
        if not results:
            results = crawl_search_engine(query, engine="bing")
        for r in results:
            url_hash = hashlib.md5(r["url"].encode()).hexdigest()
            if url_hash not in visited:
                visited.add(url_hash)
                queue.append((r["url"], 0, query, r))
        time.sleep(REQUEST_DELAY)
 
    print(f"   [Crawler] Queue seeded: {len(queue)} URLs to process")
 
    # ── BFS Recursive Crawl ────────────────────────────────────────────
    while queue and len(all_pages) < MAX_TOTAL_PAGES:
        url, depth, parent_query, meta = queue.popleft()
        print(f"   [Depth {depth}] Reading: {url[:65]}...")
 
        page_text, raw_html = read_page_jina(url)
        combined = (meta.get("snippet","") + " " + meta.get("title","")
                    + " " + page_text)
 
        # Relevance check
        relevance_threshold = 1 if meta.get("trusted") else 2
        if not is_event_relevant(combined, relevance_threshold):
            print(f"            -> Skipped (not event-relevant)")
            time.sleep(0.3)
            continue
 
        # Store this page
        page_data = {
            **meta,
            "page_text":    page_text,
            "depth":        depth,
            "parent_query": parent_query,
            "is_trusted":   meta.get("trusted", False),
        }
        all_pages.append(page_data)
        print(f"            -> [OK] Collected (depth={depth}, "
              f"trusted={meta.get('trusted',False)})")
 
        # ── Recurse into sub-links if depth allows ─────────────────────
        if depth < MAX_DEPTH and (meta.get("trusted") or depth == 0):
            sub_links = extract_links_from_page(
                raw_html or page_text, url, link_keywords
            )
            for link in sub_links[:MAX_LINKS_PER_P]:
                link_hash = hashlib.md5(link.encode()).hexdigest()
                if link_hash not in visited:
                    visited.add(link_hash)
                    queue.append((link, depth + 1, parent_query, {
                        "url":     link,
                        "title":   "",
                        "snippet": "",
                        "domain":  urlparse(link).netloc.replace("www.", ""),
                        "query":   parent_query,
                        "trusted": is_trusted(link),
                    }))
 
        time.sleep(REQUEST_DELAY)
 
    print(f"   [Crawler] Done. {len(all_pages)} relevant pages collected.")
    return all_pages