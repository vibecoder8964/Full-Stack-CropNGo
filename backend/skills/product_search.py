from google import genai
from google.genai import types
from pydantic import BaseModel

from .app_crawler import search_shop_products
from .web_crawler import ai_search_web as search_web
from config import Config
from llm_client import get_gemini_client
from llm_cascade import call_with_cascade, CascadeExhausted
from formatter import format_product_results

class ItemExtraction(BaseModel):
    items: list[str]


def extract_items(input_data: dict) -> list[str]:
    client = get_gemini_client()
    if not client:
        return ["fertilizer"] # Safe fallback

    question = input_data.get("question", "")
    prompt = f"Question: {question}\nExtract the specific items or products the user is looking for. Return as a list of strings."
    
    try:
        raw = call_with_cascade(
            prompt=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ItemExtraction,
            )
        )
        return ItemExtraction.model_validate_json(raw).items
    except CascadeExhausted:
        return ["fertilizer"]

def run_product_search(input_data: dict, specified_items: list[str] = None) -> str:
    web_search_enabled = input_data.get("web_search", False)
    
    # 1. Extract item name
    if specified_items:
        items = specified_items
    else:
        items = extract_items(input_data)
        
    if not items:
        items = ["fertiliser"]
        
    app_results = []
    web_results = []
    
    # 2. App search (always runs) — iterate ALL items, not just the first
    for item in items:
        shop_res = search_shop_products(item)
        app_results.extend(shop_res)
    
    # Deduplicate app results by name
    seen = set()
    unique_app = []
    for r in app_results:
        key = r.get('name', '')
        if key not in seen:
            seen.add(key)
            unique_app.append(r)
    app_results = unique_app[:25]  # max 25
    
    # 3. Web Search (if enabled) — minimum 5 links
    if web_search_enabled:
        for item in items:
            w_res = search_web(f"{item} supplier Malaysia", max_results=5)
            web_results.extend(w_res)
        
        # Deduplicate web results by URL
        seen_urls = set()
        unique_web = []
        for r in web_results:
            url = r.get('url', '')
            if url not in seen_urls:
                seen_urls.add(url)
                unique_web.append(r)
        web_results = unique_web[:5]  # max 5 web links
        
        # If we still have fewer than 5, do a broader search
        if len(web_results) < 5:
            broader = search_web(f"agricultural {'  '.join(items)} supplier buy Malaysia", max_results=5)
            for r in broader:
                url = r.get('url', '')
                if url not in seen_urls:
                    seen_urls.add(url)
                    web_results.append(r)
        
    return format_product_results(app_results, web_results, web_search_enabled)
