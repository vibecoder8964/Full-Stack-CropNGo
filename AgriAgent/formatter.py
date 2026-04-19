def format_demand(grade: str, score: int, explanation: str, product: str = "") -> str:
    header = f"**{product}** — " if product else ""
    return f"{header}Grade: {grade} ({score}/100)\nExplanation: {explanation}"

def format_suitability(suitability: str, reason: str, suggestion: str) -> str:
    return f"Suitability: {suitability}\nReason: {reason}\nSuggestion: {suggestion}"

def format_product_results(app_results: list, web_results: list, web_search_enabled: bool) -> str:
    output = "**App Results:**\n"
    if not app_results:
        output += "No products found in the CropNGo shop.\n"
    for i, app in enumerate(app_results, 1):
        name = app.get('name', 'Unknown')
        price = app.get('price', 'N/A')
        desc = app.get('description', '')
        link = app.get('link', 'https://cropngo-1654b.web.app/app/shop')
        output += f"[{i}] **{name}** — RM {price}, {desc}\n    → [View in CropNGo Shop]({link})\n"
    
    if web_search_enabled:
        output += "\n**Web Results:**\n"
        if not web_results:
            output += "No external results found.\n"
        for i, web in enumerate(web_results, 1):
            title = web.get('title', 'Unknown')
            desc = web.get('description', '')
            url = web.get('url', '#')
            output += f"[{i}] **{title}** — {desc}\n    → [{url}]({url})\n"
            
    return output.strip()
