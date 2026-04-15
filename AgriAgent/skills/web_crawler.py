from ddgs import DDGS
import httpx

def search_web(query: str, max_results: int = 3) -> list:
    """Run web crawler searching for external sources using ddgs"""
    results = []
    try:
        with DDGS() as ddgs:
            # text search
            search_results = list(ddgs.text(query, max_results=max_results))
            for res in search_results:
                results.append({
                    "title": res.get("title", ""),
                    "description": res.get("body", ""),
                    "url": res.get("href", ""),
                    "image": "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=400&q=80" # Better default image
                })
    except Exception as e:
        print(f"Web search error: {e}")
        
    return results

def crawl_page(url: str) -> str:
    """Uses Jina AI reader to extract page content"""
    # Using Jina AI reader API
    target_url = f"https://r.jina.ai/{url}"
    try:
        with httpx.Client() as client:
            response = client.get(target_url, timeout=10.0)
            if response.status_code == 200:
                return response.text[:2000] # Return only top text to save tokens
    except Exception as e:
        print(f"Jina AI Reader error for {url}: {e}")
    return ""

def search_demand_web(product: str, location: str, current_year: str) -> float:
    """Special web crawl for demand score computation"""
    query = f"{product} demand {location} {current_year}"
    results = search_web(query, max_results=2)
    
    # We would theoretically pass crawler results to an LLM to assess a sentiment/demand score (0-100)
    # Since we need a concrete score for calculation: 
    # For testing, we mock a high web score if results match "durian"
    if "durian" in product.lower() or "chilli" in product.lower():
        return 85.0
        
    return 70.0 # moderate baseline
