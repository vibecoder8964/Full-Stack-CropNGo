# CropNGo Full-Stack Application 🌾🤖

Nowadays, everything in the web that the farmers need, including search for people to supply tools, to purchase their crops, and to gain exposure or learn new plantation techniques, is scattered around the web, and finding those resources are not effective nor personalized. This had cause crop waste, reduced performance of farmers, and the declining of agricultural sector in Malaysia.

CropNGo is a comprehensive marketplace and communication platform designed specifically for the agricultural sector. It connects **Farmers, Vendors, and Suppliers**, helping them trade, communicate, and utilize advanced AI insights. It also provides suggestions and resources for Farmers to facilate the "produce and sell" process.

This repository contains both the **Frontend (CropNGo)** built with React + Vite, and the **Backend (AgriAgent)** built with Python, FastAPI and Google Gemini AI.

## 🚀 Key Features
- **Frontend App**: Modern UI, Authentication, Shop listings, Encrypted chats, Event Discovery, and Role-based dashboards.
- **AI Agent Backend**:
  - `Farmer AI`: Analyzes crop suitability based on climate, soil, and land size.
  - `Vendor AI`: Discovers specific product suppliers via app database and direct web scraping.
  - `Supplier AI`: Predicts equipment demand trends using recursive web search analysis.
- **Automated SEO Website Generator**: Automatically creates and updates free static SEO landing pages by providing keywords on GitHub Pages for farmers whenever they publish a product to gain exposure in the website.
- **AgriEvents and push notifications**: Dedicated events that suits the user, allowing user to join the agricultural events near them to gain exposure, learn new things and connect offline. Notifications notify user to prevent missing deadlines.
- **Live Database**: Firebase integration for real-time user profiles, authentication, and marketplace listings.

---

## 📂 Project Structure

```text
CropNGo_FullStackApp/
├── CropNGo/             # [FRONTEND] React + Vite App
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
   - Open your new `.env` file in your code editor and fill in your keys:
     ```env
     GEMINI_API_KEY="your_gemini_api_key_here"
     
     # (Optional but Recommended) Firebase Admin Credentials
     # See Step 1.1 below on how to get this JSON
     FIREBASE_CREDENTIALS_JSON='{"type": "service_account", ...}'
     ```

---

### Step 1.1: (Highly Recommended) Setup Firebase Admin SDK
If you see a "Firebase Admin Init Error" in your terminal, it means the backend is falling back to a slower method. To fix this:

1. Go to your [Firebase Console](https://console.firebase.google.com/).
2. Click on **Project Settings** (the gear icon) -> **Service Accounts**.
3. Click **Generate New Private Key** -> **Generate Key**. This downloads a `.json` file.
4. **Method A (Easiest):** Open that `.json` file, copy everything, and paste it into your `AgriAgent/.env` as the `FIREBASE_CREDENTIALS_JSON` variable (make sure it's all on one line or wrapped in single quotes).
5. **Method B:** Rename the file to `firebase-key.json` and move it into the `AgriAgent/` folder. The app will automatically try to find it.

---

5. Start the backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The backend is now running at `http://127.0.0.1:8000`*

---

### Step 2: Setup the Frontend (CropNGo)

1. Open a **new** terminal window and navigate to the frontend folder:
   ```bash
   cd CropNGo
   ```
2. Install the javascript dependencies:
   ```bash
   npm install
   ```
3. Set up your Frontend Environment Variables (`.env`):
   Just like the backend, you need a local `.env` file for the frontend!
   - Create a new file named `.env` in the `CropNGo` folder.
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

CropNGo has a feature that automatically generates a GitHub Pages website for farmers when they publish a product. 
**If you are a newbie without a GitHub account and just want to test the app locally, you can skip this step!** The app will gracefully fall back and still work perfectly without it.

If you want to test the SEO website generation feature:

1. Create a **GitHub Bot Account**. Open a private browser window, go to [github.com/signup](https://github.com/signup), and create a new account (e.g. `cropngo-bot`).
2. Generate a **Personal Access Token (PAT)**. Log in to the bot account, go to **Settings → Developer Settings → Personal Access Tokens → Tokens (classic)**. Generate a new token with **no expiration**, checking ONLY the `repo` and `workflow` scopes. **Copy the token.**
3. Add the token and bot info to your `AgriAgent/.env` file:
   ```env
   GITHUB_BOT_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
   GITHUB_BOT_USERNAME=YOUR_USERNAME
   GITHUB_BOT_EMAIL=YOUR_REGISTERED_EMAIL
   ```
4. Test the automated setup by running this command in the `AgriAgent` terminal (make sure your virtual environment is activated):
   ```bash
   python -m services.farmer_site_publisher --test
   ```
   *(This will safely create and delete a test repository on the bot account to confirm it works).*

---

### Step 4: Play with it! 🎉
Open your browser and navigate to `http://localhost:5173`.
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
   Run this command in the root folder (`CropNGo_FullStackApp`) to see what files Git is tracking:
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
   git commit -m "DESCRIPTIVE_NOTE_HERE"
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

### 🔄 How to Update & Push Subsequent Changes

Once you've made your first commit and your repository is linked to GitHub, follow these 3 steps whenever you want to save and upload your latest progress:

1. **Stage your changes**:
   This tells Git which modified files you want to include in your next "save point".
   ```bash
   git add .
   ```

2. **Commit your changes**:
   This saves a local snapshot of your project with a descriptive note. **You must do this before you can push!**
   ```bash
   git commit -m "DESCRIPTIVE_NOTE_HERE"
   ```

3. **Push to GitHub**:
   This uploads your local "save point" (commit) to the live repository on GitHub.
   ```bash
   git push
   ```

> **Pro Tip**: Always run `git status` before `git add .` to see exactly which files you've modified or added. It helps prevent accidental uploads of files that aren't ready yet!