from google import genai
from config import Config

# Global client variable
_client = None

def get_gemini_client():
    """Lazy initializer for the Gemini client to prevent startup crashes."""
    global _client
    if _client is None:
        # Check if API key exists and is valid
        api_key = Config.GEMINI_API_KEY.strip().strip("'").strip('"') if Config.GEMINI_API_KEY else None
        if not api_key or "ENTER_YOUR" in api_key:
            return None
        try:
            _client = genai.Client(api_key=api_key)
        except Exception as e:
            print(f"LLM Client Initialization Error: {e}")
            return None
    return _client
