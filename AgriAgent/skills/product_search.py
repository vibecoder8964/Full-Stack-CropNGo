from google import genai
from google.genai import types
from pydantic import BaseModel

from .app_crawler import search_shop_products
from .web_crawler import search_web
from config import Config
from formatter import format_product_results

client = genai.Client(api_key=Config.GEMINI_API_KEY)

class ItemExtraction(BaseModel):
    items: list[str]

def extract_items(input_data: dict) -> list[str]:
    question = input_data.get("question", "")
    prompt = f"Question: {question}\nExtract the specific items or products the user is looking for. Return as a list of strings."
    
    response = client.models.generate_content(
        model=Config.MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ItemExtraction,
        ),
    )
    return ItemExtraction.model_validate_json(response.text).items

def run_product_search(input_data: dict, specified_items: list[str] = None) -> str:
    web_search_enabled = input_data.get("web_search", False)
    
    # 1. Extract item name
    if specified_items:
        items = specified_items
    else:
        items = extract_items(input_data)
        
    if not items:
        # Fallback if AI couldn't extract
        items = ["fertiliser"] # random safe fallback
        
    app_results = []
    web_results = []
    
    # Process the most prominent item
    main_item = items[0]
    
    # 2. App search (always runs)
    shop_res = search_shop_products(main_item)
    app_results.extend(shop_res[:25]) # max 25
    
    # 3. Web Search (if enabled)
    if web_search_enabled:
        w_res = search_web(f"{main_item} supplier Malaysia", max_results=3)
        web_results.extend(w_res)
        
    # Formatting
    # Ensure min 2 results by duplicating or expanding search if we had a bigger DB,
    # but based on mock DB it will fetch whatever is available
    return format_product_results(app_results, web_results, web_search_enabled)
