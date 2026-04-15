from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

def list_available_models():
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        api_key = api_key.strip().strip("'").strip('"')
    if not api_key:
        print("API Key not found")
        return
    
    client = genai.Client(api_key=api_key)
    print("Available models:")
    try:
        for model in client.models.list():
            print(f"- {model.name}")
    except Exception as e:
        print(f"Error listing models: {e}")

if __name__ == "__main__":
    list_available_models()
