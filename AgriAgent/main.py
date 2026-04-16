import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent import process_agent_request, run_chat_request
from skills.event_crawler import run_event_search
from skills.event_crawler.endpoint import EventSearchRequest

logger = logging.getLogger("agriconnect")

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
    image_data: Optional[str] = None

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


class PublishSitePayload(BaseModel):
    farmer_id: str

@app.post("/publish-site")
def publish_site_endpoint(payload: PublishSitePayload):
    """
    Non-blocking SEO site publisher.
    Called by the frontend after a product is published to Firestore.
    Creates or updates the farmer's GitHub Pages SEO site.
    """
    try:
        from services.farmer_site_publisher import publish_farmer_site
        result = publish_farmer_site(farmer_id=payload.farmer_id)
        logger.info(f"Site published: {result}")
        return result
    except Exception as e:
        logger.error(f"Site publish failed silently: {e}")
        return {"url": None, "status": "error", "repo": None}

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

from fastapi import WebSocket, WebSocketDisconnect
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, to_user_id: str):
        if to_user_id in self.active_connections:
            try:
                await self.active_connections[to_user_id].send_text(message)
            except Exception as e:
                print(f"Error sending to {to_user_id}: {e}")

manager = ConnectionManager()

@app.websocket("/ws/chat/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # E2E Payload format: {"to": "username", "msg": "encryptedPayload", "timestamp": "...", "iv": "..."}
            parsed = json.loads(data)
            to_user = parsed.get("to")
            if to_user:
                payload = {
                    "from": user_id,
                    "msg": parsed.get("msg"),
                    "timestamp": parsed.get("timestamp"),
                    "iv": parsed.get("iv")
                }
                await manager.send_personal_message(json.dumps(payload), to_user)
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        print(f"WebSocket Error: {e}")
        manager.disconnect(user_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
