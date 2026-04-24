# 🚜 CropNGo: The Future of Malaysian Agriculture

**CropNGo** is a next-generation, AI-powered agricultural ecosystem designed to bridge the gap between traditional farming and modern technology. Built specifically for the Malaysian farming community, it provides a unified platform for intelligence, commerce, and digital presence.

---

## 🌟 Our North Star

### 🎯 Mission
To empower every Malaysian farmer with AI-driven insights and automated digital tools, enabling them to increase productivity, reduce waste, and expand their market reach effortlessly.

### 🔭 Vision
To become the leading agricultural technology ecosystem in Southeast Asia, creating a world where technology and nature work in perfect harmony to ensure food security and farmer prosperity.

---

## 🚀 Key Functionality

### 🤖 AgriAgent AI
A specialized AI consultant powered by Google Gemini. It analyzes user profiles to provide:
*   **Suitability Search**: Real-time climate and soil analysis for specific crops.
*   **Demand Forecasting**: Predictive scoring of market demand for agricultural products.
*   **Product Sourcing**: Automated search for the best local suppliers of fertilizers and tools.

### 🛒 Unified Marketplace
A community-driven hub where farmers can list their produce and buy essential supplies. It features:
*   **E2E Encrypted Chat**: Secure, real-time communication between buyers and sellers.
*   **Smart Categorization**: Automated unit and quantity management.

### 🔍 Auto-Crawl Event Discovery
Never miss a learning opportunity again. Our background crawler automatically discovers:
*   Agricultural **Expos** and Trade Shows.
*   Hands-on **Workshops** and Training.
*   **Webinars** and Online Seminars across Malaysia.

### 🌐 Automated SEO Site Publisher
The moment a farmer lists a product, CropNGo automatically generates a professional, SEO-optimized personal website and pushes it to **GitHub Pages**. This gives every small-scale farmer a global digital footprint instantly.

---

## 🏗️ Technical Architecture (Cloud-Native)

CropNGo is built as a **Unified Full-Stack Container** deployed on **Google Cloud Run**.

*   **Frontend**: React + Vite + Tailwind CSS (bundled into the production container).
*   **Backend**: FastAPI (Python) serving both the API and the static frontend assets.
*   **Intelligence**: Google Gemini Pro (Generative AI).
*   **Database**: Firebase Firestore (NoSQL).
*   **Hosting**: Google Cloud Run (Serverless) + GitHub Pages (for farmer sites).

---

## 🚀 Deployment & Usage

### 1. Direct Access
Access the live application (Frontend + Backend) at:
**[👉 https://cropngo-app-672662324019.us-central1.run.app]**

### 2. Administrator Deployment
To update the live ecosystem:
1. **Build & Push**:
   ```powershell
   gcloud builds submit --config cloudbuild.yaml --substitutions=_VITE_GOOGLE_MAPS_API_KEY=your_key .
   ```
2. **Deploy**:
   ```powershell
   gcloud run deploy cropngo-app --image us-central1-docker.pkg.dev/gen-lang-client-0666746526/cropngo-repo/cropngo-app --region us-central1
   ```

---
© 2026 Full-Stack-CropNGo Team