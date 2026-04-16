import httpx
from google import genai
from google.genai import types
from pydantic import BaseModel

from config import Config
from formatter import format_suitability

client = genai.Client(api_key=Config.GEMINI_API_KEY)

class CropLocationExtraction(BaseModel):
    crop: str
    location: str

def extract_crop_and_location(input_data: dict) -> CropLocationExtraction:
    question = input_data.get("question", "")
    description = input_data.get("description", "")
    
    prompt = f"User profile: {description}\nQuestion: {question}\nExtract the main crop type and the location. Default to user location if not explicitly in the question."
    
    response = client.models.generate_content(
        model=Config.MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=CropLocationExtraction,
        ),
    )
    return CropLocationExtraction.model_validate_json(response.text)

class SuitabilityAssessment(BaseModel):
    suitability: str # [Very Suitable, Suitable, Medium Risk, Risky]
    reason: str
    suggestion: str

def get_coordinates(location: str):
    """Call Google Maps API to refine coordinates. Fallback to Open-Meteo Geocoding."""
    if Config.GOOGLE_MAPS_API_KEY and Config.GOOGLE_MAPS_API_KEY != "your_google_maps_api_key_here":
        try:
            url = f"https://maps.googleapis.com/maps/api/geocode/json?address={location}&key={Config.GOOGLE_MAPS_API_KEY}"
            with httpx.Client() as c:
                resp = c.get(url).json()
                if resp["status"] == "OK":
                    lat = resp["results"][0]["geometry"]["location"]["lat"]
                    lon = resp["results"][0]["geometry"]["location"]["lng"]
                    return lat, lon
        except Exception as e:
            print(f"Google Maps Geocoding failed: {e}")
            
    # Fallback to Open-Meteo Geocoding
    try:
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={location}&count=1&language=en&format=json"
        with httpx.Client() as c:
            resp = c.get(url).json()
            if "results" in resp and len(resp["results"]) > 0:
                return resp["results"][0]["latitude"], resp["results"][0]["longitude"]
    except Exception as e:
        print(f"Open-Meteo Geocoding failed: {e}")
        
    return 3.1390, 101.6869 # Default to Kuala Lumpur coordinates if all fails

def get_weather_climate(lat: float, lon: float) -> dict:
    """Call Open-Meteo to get weather data (temperature, rainfall/humidity)."""
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,precipitation&timezone=auto"
        with httpx.Client() as c:
            resp = c.get(url).json()
            if "current" in resp:
                return {
                    "temperature": resp["current"]["temperature_2m"],
                    "humidity": resp["current"]["relative_humidity_2m"],
                    "rainfall_indicator": resp["current"]["precipitation"],
                    "inferred_soil_zone": "Tropical" if abs(lat) < 23.5 else "Temperate" # Very basic inference
                }
    except Exception as e:
        print(f"Weather API failed: {e}")
            
    # Fallback mock weather data
    return {
        "temperature": "22-30",
        "humidity": "80%",
        "rainfall_indicator": "High",
        "inferred_soil_zone": "Tropical"
    }

def run_suitability_search(input_data: dict) -> str:
    # 1. Extract
    ext = extract_crop_and_location(input_data)
    
    # 2. Coordinates
    lat, lon = get_coordinates(ext.location)
    
    # 3. Weather API
    weather_data = get_weather_climate(lat, lon)
    
    # 4. Assess Suitability via Gemini
    prompt = f"""
    Crop: {ext.crop}
    Location: {ext.location} (Lat: {lat}, Lon: {lon})
    Climate Data: {weather_data}
    
    Assess if this crop is suitable for this location. 
    Output must exactly match this JSON schema including:
    - suitability: Must be one of "Very Suitable", "Suitable", "Medium Risk", "Risky"
    - reason: Why this rating based on soil, climate, rainfall context. Max length 200 words, minimum 30 words. Keep it clear and concise.
    - suggestion: What the farmer should do or watch out for. Max length 200 words, minimum 30 words. You MUST include a MAXIMUM of 5 external web links if applicable.
    """
    
    response = client.models.generate_content(
        model=Config.MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=SuitabilityAssessment,
            temperature=0.2
        )
    )
    
    assessment = SuitabilityAssessment.model_validate_json(response.text)
    
    return format_suitability(assessment.suitability, assessment.reason, assessment.suggestion)
