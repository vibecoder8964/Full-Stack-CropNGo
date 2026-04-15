from google import genai
from google.genai import types
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

class SkillRoute(BaseModel):
    skill: str

def test_model():
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        api_key = api_key.strip().strip("'").strip('"')
    
    client = genai.Client(api_key=api_key)
    model_name = "gemini-flash-lite-latest"
    
    print(f"Testing model: {model_name}")
    try:
        response = client.models.generate_content(
            model=model_name,
            contents="Say hello in JSON format with key 'greeting'",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        print("Response:")
        print(response.text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_model()
