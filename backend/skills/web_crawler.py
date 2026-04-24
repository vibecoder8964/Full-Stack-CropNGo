"""
CropNGo Agent — AI-Powered Web Search Module
=============================================
All web searching is delegated to Gemini AI instead of manual crawling.
No DuckDuckGo, no Jina AI, no BeautifulSoup — just AI.

Functions:
  ai_search_web()         → AI finds web results (replaces ddgs search)
  ai_crawl_page()         → AI summarises a URL's content (replaces Jina reader)
  ai_search_demand_web()  → AI assesses product demand score (replaces manual crawler)
"""

import json
from google.genai import types
from llm_client import get_gemini_client
from llm_cascade import call_with_cascade, CascadeExhausted
from config import Config


def ai_search_web(query: str, max_results: int = 5) -> list:
    """
    Uses Gemini AI to find relevant web results for a query.
    Returns results in the same format as the old DuckDuckGo search:
    [{title, description, url, image}, ...]
    """
    client = get_gemini_client()
    if not client:
        print("[AI Search] No AI client available.")
        return []

    prompt = f"""{Config.SYSTEM_PROMPT_CONSTRAINT}

You are a web search assistant. For the following query, provide {max_results} REAL, relevant web results.

Query: "{query}"

Return ONLY a valid JSON array with NO markdown formatting. Each result must have:
- "title": Page title (string)
- "description": 1-2 sentence summary of the page content (string)
- "url": A REAL, working URL to the resource (string) — use well-known domains like official government sites, major retailers, news outlets, or established agricultural platforms
- "image": Set to "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=400&q=80"

Focus on results from established, trustworthy sources. Prioritise .gov, .edu, and major commercial sites.
Return ONLY the JSON array, no explanation."""

    try:
        raw = call_with_cascade(
            prompt=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=2048,
            )
        )
        raw = raw.replace("```json", "").replace("```", "").strip()
        results = json.loads(raw)

        if isinstance(results, list):
            # Ensure each result has the expected keys
            validated = []
            for r in results[:max_results]:
                validated.append({
                    "title": r.get("title", ""),
                    "description": r.get("description", ""),
                    "url": r.get("url", ""),
                    "image": r.get("image", "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=400&q=80")
                })
            return validated
    except (CascadeExhausted, json.JSONDecodeError) as e:
        print(f"[AI Search] Error: {e}")
    except Exception as e:
        print(f"[AI Search] Unexpected error: {e}")

    return []


def ai_crawl_page(url: str) -> str:
    """
    Uses Gemini AI to provide a summary of what a given URL contains.
    Replaces the old Jina AI page reader.
    """
    client = get_gemini_client()
    if not client:
        return ""

    prompt = f"""{Config.SYSTEM_PROMPT_CONSTRAINT}

Provide a concise 100-200 word summary of the content typically found at this URL:
{url}

Focus on the main topic, key information, and relevance to agriculture if applicable.
Return only the summary text, no formatting."""

    try:
        return call_with_cascade(
            prompt=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=500,
            )
        )
    except (CascadeExhausted, Exception) as e:
        print(f"[AI Crawl] Error for {url}: {e}")
        return ""


def ai_search_demand_web(product: str, location: str, current_year: str) -> float:
    """
    Uses Gemini AI to assess the web demand score for a product.
    Returns a score from 0-100 based on AI's knowledge of market trends.
    Replaces the old DuckDuckGo-based demand search.
    """
    client = get_gemini_client()
    if not client:
        return 65.0  # Moderate baseline if AI is unavailable

    prompt = f"""{Config.SYSTEM_PROMPT_CONSTRAINT}

You are a market analyst specialising in agricultural products.

Assess the CURRENT WEB DEMAND for:
- Product: {product}
- Location: {location}
- Year: {current_year}

Based on your knowledge of:
1. Search engine trends for this product
2. Market reports and agricultural data
3. Consumer interest and seasonal demand
4. Regional popularity and trade volume

Return ONLY a single integer number between 0 and 100 representing the demand score:
- 90-100: Extremely high demand (trending, shortage, viral)
- 75-89: High demand (popular, growing market)
- 60-74: Moderate demand (steady, normal market)
- 40-59: Low demand (declining interest)
- 0-39: Very low demand (niche, oversupplied)

Return ONLY the number, nothing else."""

    try:
        raw = call_with_cascade(
            prompt=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=10,
            )
        )
        # Parse the number from AI response
        score_str = raw.strip().replace("%", "")
        score = float(score_str)
        return max(0.0, min(100.0, score))  # Clamp to 0-100
    except (CascadeExhausted, ValueError) as e:
        print(f"[AI Demand] Error: {e}")
        return 65.0
    except Exception as e:
        print(f"[AI Demand] Unexpected error: {e}")
        return 65.0


# ── Legacy aliases (keep backward compatibility for imports) ───────────
# These names match the old function signatures so existing callers work unchanged
search_web = ai_search_web
crawl_page = ai_crawl_page
search_demand_web = ai_search_demand_web
