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
    product: str
    location: str

def extract_product_and_location(question: str, user_description: str) -> ProductExtraction:
    prompt = f"User profile: {user_description}\nQuestion: {question}\nExtract the main agricultural product and the intended location (default to user profile location if not in question)."
    
    response = client.models.generate_content(
        model=Config.MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ProductExtraction,
        ),
    )
    # Parse the json output natively or using Pydantic
    return ProductExtraction.model_validate_json(response.text)

class ExplanationModel(BaseModel):
    explanation: str

def generate_demand_explanation(product: str, location: str, web_score: float, app_score: float, final_score: float, grade: str) -> str:
    prompt = f"""
    Product: {product}
    Location: {location}
    Web Score (0-100): {web_score}
    App Shop Score (0-100): {app_score}
    Final Grade: {grade} ({final_score}/100)
    
    Write a concise explanation (max 150 words) on why this grade was given and the future growth outlook for this product in that location.
    Include mentions of the web interest trend and the app data trend based on the scores provided. Ensure it matches the requested tone.
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

def run_demand_search(input_data: dict) -> str:
    question = input_data.get("question", "")
    description = input_data.get("description", "")
    web_search = input_data.get("web_search", False)
    
    # 1. Extract product
    extraction = extract_product_and_location(question, description)
    product = extraction.product
    location = extraction.location
    current_year = str(datetime.datetime.now().year)
    
    # 2. Get location coordinate (simulated in step 3 right away for demand)
    
    # 3. Web Crawl
    web_score = 0.0
    if web_search:
        web_score = search_demand_web(product, location, current_year)
    
    # 4. App Crawl
    app_score = calculate_search_score(product)
    
    # 5. Score Calculation
    final_score = int((web_score * 0.80) + (app_score * 0.20))
    
    # 6. Grade Score
    if final_score >= 90:
        grade = "Very Demanding"
    elif final_score >= 75:
        grade = "Demanding"
    elif final_score >= 60:
        grade = "Decent"
    elif final_score >= 40:
        grade = "Less Demanding"
    else:
        grade = "Not Demanding"
        
    # Generate Explanation
    explanation = generate_demand_explanation(product, location, web_score, app_score, final_score, grade)
    
    return format_demand(grade, final_score, explanation)
