import os
from dotenv import load_dotenv

# Load .env from the root of the AgriAgent directory
base_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(base_dir, ".env")
load_dotenv(dotenv_path=env_path)

class Config:
    GEMINI_API_KEY = (os.getenv("GEMINI_API_KEY") or "").strip().strip("'").strip('"')
    GOOGLE_MAPS_API_KEY = (os.getenv("GOOGLE_MAPS_API_KEY") or "").strip().strip("'").strip('"')
    GOOGLE_WEATHER_API_KEY = (os.getenv("GOOGLE_WEATHER_API_KEY") or "").strip().strip("'").strip('"')
    
    # Preferred Model for most tasks
    MODEL_NAME = "gemini-flash-lite-latest"
    
    # GCP configuration for Vertex AI
    GCP_PROJECT = os.getenv("GCP_PROJECT")
    GCP_LOCATION = os.getenv("GCP_LOCATION", "us-central1")

