def format_demand(grade: str, score: int, explanation: str) -> str:
    return f"Grade: {grade} ({score}/100)\nExplanation: {explanation}"

def format_suitability(suitability: str, reason: str, suggestion: str) -> str:
    return f"Suitability: {suitability}\nReason: {reason}\nSuggestion: {suggestion}"

def format_product_results(app_results: list, web_results: list, web_search_enabled: bool) -> str:
    output = "App Results:\n"
    if not app_results:
        output += "No products found in shop.\n"
    for i, app in enumerate(app_results, 1):
        output += f"[{i}] {app['name']} — RM {app['price']}, {app['description']}.\n    → [Click to view in AgriConnect Shop]\n"
    
    if web_search_enabled:
        output += "\nWeb Results:\n"
        if not web_results:
            output += "No external results found.\n"
        for web in web_results:
            output += f"[Image | {web['title']} — {web['description']}\n  → {web['url']}]\n"
            
    return output.strip()
