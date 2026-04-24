import os
import logging
import json
import time
from typing import Optional

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

class EventSearchRequest(BaseModel):
    user_id: str
    description: str
    location: str
    web_search: bool = False

try:
    from agent import process_agent_request, run_chat_request
    from skills.event_crawler import run_event_search
except Exception as e:
    print(f"Startup Import Warning: {e}")

logger = logging.getLogger("cropngo")

app = FastAPI(title="CropNGo API")

# Essential: Add a root health check that NEVER fails
@app.get("/_health")
def health():
    return {"status": "ok"}

# Enable CORS for CropNGo's frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Should be restricted in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




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
    user_id: Optional[str] = None

# --- CLOUD API ENDPOINTS ---
@app.post("/api/agent")
@app.post("/agent")
def agent_endpoint(payload: InputPayload):
    """Skill router endpoint"""
    try:
        result = process_agent_request(payload.model_dump())
        return {"response": result}
    except Exception as e:
        logger.error(f"Agent Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/message")
@app.post("/chat")
def chat_endpoint(payload: InputPayload):
    """Direct chatbox LLM call"""
    try:
        response = run_chat_request(payload.model_dump())
        return {"response": response}
    except Exception as e:
        logger.error(f"Chat Error: {e}")
        if "Sorry, the LLM is occupied" in str(e) or "try again" in str(e).lower():
            return {"response": "Sorry, the AI is busy right now. Please try again in a moment."}
        raise HTTPException(status_code=500, detail=str(e))


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
        error_msg = str(e)
        if 'cascade' in error_msg.lower() or 'try again' in error_msg.lower():
            return JSONResponse(status_code=503, content={"status": "error", "message": "All AI models are busy. Please try again."})
        raise HTTPException(status_code=500, detail=error_msg)


class SEORefreshPayload(BaseModel):
    api_key: Optional[str] = None

@app.post("/api/seo/refresh-all")
def seo_refresh_all(payload: SEORefreshPayload = SEORefreshPayload()):
    """Monthly SEO refresh endpoint. Re-publishes all farmer sites with fresh SEO."""
    try:
        from services.seo_scheduler import refresh_all_sites
        result = refresh_all_sites()
        return result
    except Exception as e:
        logger.error(f"SEO Refresh Error: {e}")
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

# --- STATIC FILE SERVING ---
# Check and report what we found for debugging
print(f"DEBUG: Current directory: {os.getcwd()}")
print(f"DEBUG: Static folder exists: {os.path.exists('static')}")
if os.path.exists('static'):
    print(f"DEBUG: Static contents: {os.listdir('static')}")

# Serve static assets (JS, CSS, Images)
# Vite builds assets into a folder named 'assets'
if os.path.exists("static/assets"):
    print("DEBUG: Mounting /assets from static/assets")
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")
else:
    print("WARNING: static/assets NOT FOUND. Frontend will be unstyled!")

# Serve the main index.html at the root
@app.get("/")
async def serve_index():
    try:
        return FileResponse("static/index.html")
    except Exception:
        return JSONResponse(status_code=404, content={"detail": "Frontend not built"})

# Catch-all route to serve index.html for the React SPA (handles /app/* routes)
@app.exception_handler(404)
async def spa_fallback(request, exc):
    # If the request is for an API, don't fallback to index.html
    if request.url.path.startswith("/api"):
        return JSONResponse(status_code=404, content={"detail": "Not Found"})
    
    # Otherwise, serve the React index.html for SPA routing
    try:
        if os.path.exists("static/index.html"):
            return FileResponse("static/index.html")
        return JSONResponse(status_code=404, content={"detail": "Frontend not built"})
    except Exception:
        return JSONResponse(status_code=404, content={"detail": "Frontend not built"})
