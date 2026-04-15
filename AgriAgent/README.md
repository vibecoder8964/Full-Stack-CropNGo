# AgriAgent - AI Orchestrator Backend

AgriAgent is the AI orchestration backend for the AgriConnect platform. It leverages Google Gemini AI to provide intelligent search, demand analysis, and crop suitability assessments for farmers, buyers, and suppliers.

## 🚀 Features

- **Skill Routing**: Automatically detects user intent and routes to specialized skills:
  - `DemandSearch`: Market trend and demand analysis (Web + App data).
  - `SuitabilitySearch`: Climate and soil-based crop suitability (Google Maps + Open-Meteo).
  - `ProductSearch`: Finds internal shop listings and external web suppliers.
  - `FarmerSearch`: A full sequential analysis pipeline (Demand -> Suitability -> Products).
- **Universal Input**: Standardized JSON interface for all AI interactions.
- **Web Crawling**: Integrated DuckDuckGo search + Jina AI reader for real-time market insights.
- **Database Mocking**: Ready-to-use mock system for rapid frontend testing.

## 📂 Project Structure

```
AgriAgent/
├── main.py                  # FastAPI server and endpoints
├── agent.py                 # Skill router and logic
├── config.py                # Configuration loader
├── formatter.py             # Response formatters
├── requirements.txt         # Dependencies
├── .env                     # Environment variables (private)
├── .env.example             # Environment variable template
├── test_endpoints.py        # Automated test suite
└── skills/
    ├── demand_search.py     # Skill: Demand analysis
    ├── suitability_search.py# Skill: Crop suitability
    ├── product_search.py    # Skill: Product discovery
    ├── farmer_search.py     # Orchestrator: Multi-skill pipeline
    ├── web_crawler.py       # Web search utilities
    └── app_crawler.py       # Internal DB search utilities (Mocked)
```

## 🛠️ Installation

1. **Clone the repository** (or navigate to the directory):
   ```bash
   cd AgriAgent
   ```

2. **Create a virtual environment** (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## ⚙️ Configuration

1. Open `.env` and fill in your API keys:
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `GOOGLE_MAPS_API_KEY`: Required for real location geocoding (falls back to Open-Meteo if empty).
   - `GOOGLE_WEATHER_API_KEY`: (Optional) specifically for Google's weather service.

## 🏃 Running the Server

Start the FastAPI application using `uvicorn`:

```bash
uvicorn main:app --reload --port 8000
```

The server will be available at `http://localhost:8000`.

## 📡 API Endpoints

### 1. `POST /agent`
The main entry point for the AI search and multi-skill orchestration.
- **Payload**:
  ```json
  {
    "description": "User profile context",
    "role": "Farmer",
    "web_search": true,
    "question": "Your question here"
  }
  ```

### 2. `POST /chat`
Direct conversational interface (AI Chatbox mode).
- **Payload**: Same as above.

## 🧪 Testing

I have included an automated test script to verify all 5 core scenarios (Demand, Suitability, Product, Farmer, and Chat fallback).

1. Ensure the server is running on port 8000.
2. Run the tests:
   ```bash
   python test_endpoints.py
   ```
