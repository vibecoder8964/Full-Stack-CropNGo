# 🚜 CropNGo: Full-Stack Agricultural Ecosystem

CropNGo is an AI-powered agricultural platform designed for farmers in Malaysia. It integrates a React frontend with a FastAPI backend, featuring specialized AI agents, real-time market data, and automated farmer website publishing.

---

## 🚀 Quick Start (Cloud Mode)

You can use CropNGo in two ways:

### 1. Direct Cloud Access (Recommended)
Access the fully hosted application directly:
**[👉 Open CropNGo Live](https://cropngo-app-672662324019.us-central1.run.app)**

---

### 2. Local Frontend + Cloud Backend
If you want to run the frontend locally but use the powerful Cloud AI:

1. **Clone & Install Frontend:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Environment:**
   Create `frontend/.env`:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_key
   ```

3. **Launch:**
   ```bash
   npm run dev
   ```
   The frontend is pre-configured to automatically communicate with the production API.

---

## 🛠️ Infrastructure & Maintenance (Admin Only)

The backend is hosted on **Google Cloud Run** and is fully containerized.

### Deployment Commands:
To update the live server with new code:

1. **Build & Push:**
   ```powershell
   gcloud builds submit --config cloudbuild.yaml --substitutions=_VITE_GOOGLE_MAPS_API_KEY=your_key .
   ```

2. **Deploy:**
   ```powershell
   gcloud run deploy cropngo-app `
     --image us-central1-docker.pkg.dev/gen-lang-client-0666746526/cropngo-repo/cropngo-app `
     --platform managed `
     --region us-central1 `
     --allow-unauthenticated
   ```

### Configuration (Console):
API Keys (Gemini, Firebase, GitHub) are managed in the [Google Cloud Console](https://console.cloud.google.com/run/detail/us-central1/cropngo-app/revisions) under **Variables & Secrets**.

---

## 📝 Features & Tech Stack

### Frontend (React + Vite)
- **AI Assistant**: Intelligent chat for farming advice.
- **Marketplace**: Buy/Sell agricultural products.
- **Events**: Automated search for workshops and expos.
- **Farmer Profile**: Automated SEO-optimized website generation.

### Backend (FastAPI + Gemini)
- **AI Agent**: Orchestrates specialized skills for demand, suitability, and product searches.
- **Automated Publisher**: Generates and pushes static sites to GitHub Pages via bot.
- **Firebase Integration**: Real-time storage for user data and listings.

### Cloud (Google Cloud Run)
- **Containerized**: Multi-stage Docker build integrating React and Python.
- **Auto-Scaling**: Efficiently handles traffic while managing costs.

---

## 🐙 How to Safely Commit & Push to GitHub

1. **Stage your changes**:
   ```bash
   git add .
   ```

2. **Commit your changes**:
   ```bash
   git commit -m "Update message"
   ```

3. **Push to GitHub**:
   ```bash
   git push
   ```

---
© 2026 CropNGo Team