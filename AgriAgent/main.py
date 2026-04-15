from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent import process_agent_request, run_chat_request
from skills.event_crawler import run_event_search
from skills.event_crawler.endpoint import EventSearchRequest

app = FastAPI(title="AgriAgent API")

# Enable CORS for AgriConnect's frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Should be restricted in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """Root endpoint — shows API info instead of a blank page."""
    return {
        "service": "AgriAgent API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": ["/agent", "/chat", "/events", "/health"],
    }


@app.get("/health")
def health_check():
    """Health check for frontend connectivity verification."""
    return {"status": "ok"}

from typing import Optional

class InputPayload(BaseModel):
    description: str
    role: str
    question: str
    web_search: Optional[bool] = False

import time
from google.genai.models import Models

original_generate_content = Models.generate_content

def generate_content_with_fallback(self, *args, **kwargs):
    models_to_try = [
        "gemini-1.5-flash-8b",
        "gemini-2.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-3.0-flash",
        "gemini-1.5-flash",
        "gemini-2.5-flash"
    ]
    last_error = None
    
    for attempt in range(5):
        for m in models_to_try:
            kwargs['model'] = m
            try:
                return original_generate_content(self, *args, **kwargs)
            except Exception as e:
                err_str = str(e).lower()
                if "503" in err_str or "unavailability" in err_str or "429" in err_str or "high demand" in err_str or "not found" in err_str.replace("_", " "):
                    last_error = e
                    continue
                raise e
        
        # If all 6 models failed on this attempt and it isn't the last attempt, wait 3s
        if attempt < 4:
            time.sleep(3)
            
    raise Exception("Sorry, the LLM is occupied, Please try again later")

Models.generate_content = generate_content_with_fallback

@app.post("/agent")
def agent_endpoint(payload: InputPayload):
    """Skill router endpoint"""
    try:
        result = process_agent_request(payload.model_dump())
        return {"response": result}
    except Exception as e:
        if "Sorry, the LLM is occupied" in str(e):
            return {"response": "Sorry, the LLM is occupied, Please try again later"}
        raise e

@app.post("/chat")
def chat_endpoint(payload: InputPayload):
    """Direct chatbox LLM call"""
    try:
        result = run_chat_request(payload.model_dump())
        return {"response": result}
    except Exception as e:
        if "Sorry, the LLM is occupied" in str(e):
            return {"response": "Sorry, the LLM is occupied, Please try again later"}
        raise e


@app.post("/events")
def events_endpoint(req: EventSearchRequest):
    """
    Finds agricultural events, workshops, webinars and
    competitions near the user's location.
    Returns structured JSON following the frontend contract.
    """
    try:
        result = run_event_search(
            user_id      = req.user_id,
            description  = req.description,
            location_raw = req.location,
            web_search   = req.web_search,
        )
        return result
    except Exception as e:
        print(f"[/events] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
