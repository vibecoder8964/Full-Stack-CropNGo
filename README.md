# AgriConnect Full-Stack Application 🌾🤖

AgriConnect is a comprehensive, mobile-first marketplace and communication platform designed specifically for the agricultural sector. It connects **Farmers, Vendors, and Suppliers**, helping them trade, communicate, and utilize advanced AI insights.

This repository contains both the **Frontend (AgriConnect)** built with React + Vite, and the **Backend (AgriAgent)** built with FastAPI and Google Gemini AI.

## 🚀 Key Features
- **Frontend App**: Modern UI, Authentication, Shop listings, Event Discovery, and Role-based dashboards.
- **AI Agent Backend**:
  - `Farmer AI`: Analyzes crop suitability based on climate, soil, and land size.
  - `Vendor AI`: Discovers specific product suppliers via app database and direct web scraping.
  - `Supplier AI`: Predicts equipment demand trends using recursive web search analysis.
- **Automated SEO Website Generator**: Automatically creates and updates free static SEO landing pages on GitHub Pages for farmers whenever they publish a product.
- **Live Database**: Firebase integration for real-time user profiles, authentication, and marketplace listings.

---

## 📂 Project Structure

```text
AgriConnect_FullStackApp/
├── AgriConnect/             # [FRONTEND] React + Vite App
│   ├── src/                 # UI Components, Pages, Context, and firebase.js
│   ├── public/              # Static public assets
│   ├── dist/                # Production build output
│   ├── firebase.json        # Firebase hosting configuration
│   ├── firestore.rules      # Database security rules
│   ├── storage.rules        # Storage security rules
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   └── .env                 # Frontend environment variables
│
└── AgriAgent/               # [BACKEND] Python + FastAPI + Gemini
    ├── main.py              # Server and API Endpoints
    ├── agent.py             # Skill routing logic
    ├── config.py            # App configurations
    ├── services/            # Automated SEO website publisher logic
    ├── skills/              # Agent tools (Crawlers, Search, Assessors)
    ├── tools/               # Helper modules
    ├── requirements.txt     # Python Dependencies
    ├── .env.example         # Template for required environment variables
    └── .env                 # Backend environment variables (you create this!)
```

---

## 🛠️ Step-by-Step Local Setup Guide

Follow these steps to run both the frontend and backend locally on your machine. This guide is designed to be friendly for everyone, even if you are new to coding!

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Python](https://www.python.org/) (v3.9 or higher)
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey) (Free)

---

### Step 1: Setup the AI Backend (AgriAgent)

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd AgriAgent
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install the required external packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up your Environment Variables (`.env`):
   When you clone a repository, secret files like `.env` are deliberately left out for security. We provide an `.env.example` file so you know what variables the app needs!
   
   - Look for the `.env.example` file in the `AgriAgent` folder.
   - **Copy** `.env.example` and rename the new file to exactly `.env` (it might look like a file with no name and just an extension on Windows).
   - Open your new `.env` file in your code editor and fill in your **Gemini API Key**:
     ```env
     GEMINI_API_KEY="your_gemini_api_key_here"
     ```
5. Start the backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The backend is now running at `http://127.0.0.1:8000`*

---

### Step 2: Setup the Frontend (AgriConnect)

1. Open a **new** terminal window and navigate to the frontend folder:
   ```bash
   cd AgriConnect
   ```
2. Install the javascript dependencies:
   ```bash
   npm install
   ```
3. Set up your Frontend Environment Variables (`.env`):
   Just like the backend, you need a local `.env` file for the frontend!
   - Create a new file named `.env` in the `AgriConnect` folder.
   - To connect the frontend to your local backend, add this line in your `.env` file:
     ```env
     VITE_API_URL=http://127.0.0.1:8000
     ```
     *(If this line does not exist, the app will automatically default to `http://127.0.0.1:8000`)*
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The frontend is now running at `http://localhost:5173`*

---

### Step 3: (Optional) Setup the Automated SEO Site Publisher

AgriConnect has a feature that automatically generates a GitHub Pages website for farmers when they publish a product. 
**If you are a newbie without a GitHub account and just want to test the app locally, you can skip this step!** The app will gracefully fall back and still work perfectly without it.

If you want to test the SEO website generation feature:

1. Create a **GitHub Bot Account**. Open a private browser window, go to [github.com/signup](https://github.com/signup), and create a new account (e.g. `agriconnect-bot`).
2. Generate a **Personal Access Token (PAT)**. Log in to the bot account, go to **Settings → Developer Settings → Personal Access Tokens → Tokens (classic)**. Generate a new token with **no expiration**, checking ONLY the `repo` and `workflow` scopes. **Copy the token.**
3. Add the token and bot info to your `AgriAgent/.env` file:
   ```env
   GITHUB_BOT_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
   GITHUB_BOT_USERNAME=agriconnect-bot
   GITHUB_BOT_EMAIL=agriconnect-bot@yourdomain.com
   ```
4. Test the automated setup by running this command in the `AgriAgent` terminal (make sure your virtual environment is activated):
   ```bash
   python -m services.farmer_site_publisher --test
   ```
   *(This will safely create and delete a test repository on the bot account to confirm it works).*

---

### Step 4: Play with it! 🎉
Open your browser and navigate to `http://localhost:5173` (or the URL provided by the `npm run dev` command). 
- **Sign up** to create an account (data is saved to Firebase).
- Navigate to the **AI Assistant** or **Events** page to see the backend tools in action.
- Add a listing in the **Marketplace** (Shop page) to see the Automated SEO Site feature automatically create a Github Pages site for your farmer profile!
- Check your Backend terminal window — you will see the API requests coming through and the AI agent processing your commands and web searches in real time!

---

## 🐙 How to Safely Commit & Push to GitHub

If you are developing locally and want to push the **entire full-stack project** to GitHub, it's critical to make sure you **don't** accidentally push your API keys or massive library folders!

We use a special file called `.gitignore` which automatically hides files like `.env`, `node_modules/`, and `venv/` from Git.

Here is the step-by-step guide to safe committing:

1. **Verify your `.gitignore` is working**
   Run this command in the root folder (`AgriConnect_FullStackApp`) to see what files Git is tracking:
   ```bash
   git status
   ```
   *Look at the untracked files. You should **NOT** see your `.env` files, `node_modules`, or `venv` listed! You SHOULD see `.env.example`.*

2. **Initialize Git** *(Skip this if you already cloned from GitHub)*
   ```bash
   git init
   ```

3. **Add all safe files to staging**
   This command prepares all your code (frontend, backend, and `.env.example`) to be saved, while automatically ignoring the bad stuff:
   ```bash
   git add .
   ```

4. **Commit your changes**
   Save a snapshot of the current state:
   ```bash
   git commit -m "feat: setup full stack app with local `.env.example`"
   ```

5. **Link to your GitHub Repository** *(Skip if already linked)*
   Go to GitHub, create a new empty repository on your main account, copy the remote URL, and run:
   ```bash
   git remote add origin https://github.com/your-username/your-repo-name.git
   ```

6. **Push to GitHub**
   Upload the code to your main branch:
   ```bash
   git push -u origin main
   ```

> **Why push `.env.example` and not `.env`?**
> When your teammates clone this repository, they won't have your passwords. But because you pushed `.env.example`, they can see exactly what keys the app *expects*, and they can create their own local `.env` files safely!
