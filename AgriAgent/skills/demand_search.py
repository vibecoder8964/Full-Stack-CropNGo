import datetime
from google import genai
from google.genai import types
from pydantic import BaseModel

from .web_crawler import search_demand_web
from .app_crawler import calculate_search_score
from config import Config
from formatter import format_demand

# Init gemini client
client = genai.Client(api_key=Config.GEMINI_API_KEY)

class ProductExtraction(BaseModel):
    products: list[str]
    location: str

def extract_product_and_location(question: str, user_description: str) -> ProductExtraction:
    prompt = f"User profile: {user_description}\nQuestion: {question}\nExtract ALL individual agricultural products/equipment mentioned (as a strict array of individual strings, e.g. ['Tractor', 'Shovel', 'Plow']) and the intended location (default to user profile location if not in question). Make sure NO multiple items are merged into one string."
    
    response = client.models.generate_content(
        model=Config.MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ProductExtraction,
        ),
    )
    return ProductExtraction.model_validate_json(response.text)

class ExplanationModel(BaseModel):
    explanation: str

def generate_demand_explanation(product: str, location: str, web_score: float, app_score: float, final_score: float, grade: str) -> str:
    prompt = f"""
    {Config.SYSTEM_PROMPT_CONSTRAINT}
    
    Product: {product}
    Location: {location}
    Web Score (0-100): {web_score}
    App Shop Score (0-100): {app_score}
    Final Grade: {grade} ({final_score}/100)
    
    Write a clear and concise explanation on why this grade was given and the future growth outlook for this product in that location.
    Include mentions of the web interest trend and the app data trend based on the scores provided.
    Length constraint: Max length 200 words, minimum 30 words.
    Link constraint: Include a MAXIMUM of 5 external web links for suppliers or references if applicable.
    """
    
    response = client.models.generate_content(
        model=Config.MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ExplanationModel,
            temperature=0.3
        )
    )
    
    return ExplanationModel.model_validate_json(response.text).explanation

def _grade_score(final_score: int) -> str:
    if final_score >= 90:
        return "Very Demanding"
    elif final_score >= 75:
        return "Demanding"
    elif final_score >= 60:
        return "Decent"
    elif final_score >= 40:
        return "Less Demanding"
    else:
        return "Not Demanding"

def run_demand_search(input_data: dict) -> str:
    question = input_data.get("question", "")
    description = input_data.get("description", "")
    web_search = input_data.get("web_search", False)
    
    # 1. Extract ALL products
    extraction = extract_product_and_location(question, description)
    products = extraction.products
    location = extraction.location
    current_year = str(datetime.datetime.now().year)
    
    if not products:
        products = ["general agricultural product"]
    
    # 2. Analyse EACH product
    results = []
    for product in products:
        web_score = 0.0
        if web_search:
            web_score = search_demand_web(product, location, current_year)
        
        app_score = calculate_search_score(product)
        final_score = int((web_score * 0.80) + (app_score * 0.20))
        grade = _grade_score(final_score)
        explanation = generate_demand_explanation(product, location, web_score, app_score, final_score, grade)
        results.append(format_demand(grade, final_score, explanation, product))
    
    return "\n\n---\n\n".join(results)
