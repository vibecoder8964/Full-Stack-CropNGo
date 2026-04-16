from google import genai
from google.genai import types
from pydantic import BaseModel
import base64
from typing import Optional

from .demand_search import run_demand_search
from .suitability_search import run_suitability_search
from .product_search import run_product_search
from config import Config

client = genai.Client(api_key=Config.GEMINI_API_KEY)

class FarmerContextExtraction(BaseModel):
    plant_type: str
    location: str
    items_needed: list[str]
    soil_quality_analysis: Optional[str] = None

def extract_farmer_context(question: str, image_data: Optional[str] = None) -> FarmerContextExtraction:
    prompt = f"""
    {Config.SYSTEM_PROMPT_CONSTRAINT}
    
    Based on this input:
    {question}
    
    Extract:
    1. The type of plant
    2. The place of cultivation
    3. Analyze the 'Tools available' and determine what additional agricultural items/tools the farmer needs to buy (e.g., fertiliser, seeds, pesticide, irrigation). Return at most 2 critical items.
    4. If a soil photo is provided (via image attachment), output a 20-40 word analysis about the suitability of the soil and give explanation based on what you visually observe. If no photo is provided, leave this field empty.
    """
    
    parts = []
    if image_data:
        try:
            if "," in image_data:
                mime_type = image_data.split(",")[0].split(":")[1].split(";")[0]
                base64_str = image_data.split(",")[1]
            else:
                mime_type = "image/jpeg"
                base64_str = image_data
            parts.append(types.Part.from_bytes(data=base64.b64decode(base64_str), mime_type=mime_type))
        except Exception as e:
            print(f"Failed to process image_data: {e}")
            
    parts.append(prompt)
    
    response = client.models.generate_content(
        model=Config.MODEL_NAME,
        contents=parts,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=FarmerContextExtraction,
        ),
    )
    return FarmerContextExtraction.model_validate_json(response.text)

def run_farmer_search(input_data: dict) -> str:
    question = input_data.get("question", "")
    web_search = input_data.get("web_search", False)
    image_data = input_data.get("image_data")
    
    # 1. Extract context
    ext = extract_farmer_context(question, image_data)
    
    # Construct virtual inputs for sub-skills
    sub_input = {
        "question": f"about {ext.plant_type} in {ext.location}",
        "description": input_data.get("description", ""),
        "web_search": web_search
    }
    
    # 2. Demand Search
    demand_output = run_demand_search(sub_input)
    
    # 3. Suitability Search
    suitability_output = run_suitability_search(sub_input)
    
    # 4. Product Search for needed items
    product_output = run_product_search(input_data, specified_items=ext.items_needed)
    
    # 5. Format Output
    # Re-indent the outputs slightly to match format
    demand_indented = "  " + demand_output.replace("\n", "\n  ")
    suitability_indented = "  " + suitability_output.replace("\n", "\n  ")
    product_indented = "  " + product_output.replace("\n", "\n  ")
    
    final_output = f"""Demand:
{demand_indented}

Suitability:
{suitability_indented}
"""

    if ext.soil_quality_analysis and ext.soil_quality_analysis.strip():
        soil_indented = "  " + ext.soil_quality_analysis.replace("\n", "\n  ")
        final_output += f"\nSoil Analysis:\n{soil_indented}\n"

    final_output += f"""
Products Available:
{product_indented}
"""
    return final_output.strip()
