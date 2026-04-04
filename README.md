# MarketSense AI
### GenAI-Powered Real Estate Intelligence Engine

MarketSense AI is a full-stack prototype designed to transform raw commercial real estate data into actionable strategic briefs. By bridging a React frontend with an n8n automation backend and Google Gemini 2.5 Flash, the platform allows users to query massive datasets using natural language.

---

## Core Features
* Natural Language Querying: Ask complex questions about market trends, pricing, and "vibes" without knowing SQL.
* Dynamic Market Distribution: Real-time data visualization that adapts based on AI-extracted metrics.
* Automated Strategy Briefs: Generates professional-grade reports including key signals and investment recommendations.
* Hybrid Architecture: Combines high-speed local data processing (Node.js/n8n) with advanced LLM reasoning.

---

## The Tech Stack
* Frontend: React 18, Vite, Tailwind CSS (Custom UI Components)
* Backend Automation: n8n (Self-hosted via Docker)
* AI Engine: Google Gemini 2.5 Flash
* Data Source: 170MB+ Realtor Property Dataset (CSV)
* Environment: Dockerized workflow for local scalability

---

## Installation & Setup

### 1. Prerequisites
* Docker installed and running.
* Node.js (v18+) and npm.
* A Google Gemini API Key.

### 2. Backend Setup (n8n)
1.  Navigate to the /backend/n8n directory.
2.  Start the n8n container via PowerShell:
    ```powershell
    docker run -it --rm --name n8n -p 5678:5678 -v "${PWD}:/home/node/.n8n-files" docker.n8n.io/n8nio/n8n
    ```
3.  Open http://localhost:5678 in your browser.
4.  Import the MarketSense-AI-Core.json workflow file.
5.  Configure your Gemini API Key in the Google Gemini Node and click Publish.

### 3. Frontend Setup (React)
1.  Navigate to the /frontend directory.
2.  Install dependencies: 
    ```bash
    npm install
    ```
3.  Start the development server: 
    ```bash
    npm run dev
    ```
4.  Access the dashboard at http://localhost:5173.

---

## Data Source & Notice
This project utilizes the **[USA Real Estate Dataset](https://www.kaggle.com/datasets/ahmedshahriarsakib/usa-real-estate-dataset/data)** (approx. 170MB).

> **IMPORTANT:** Due to GitHub's file size limitations, the raw realtor-data.csv is **not** included in this repository. 
> 
> **To Run:** Download the dataset from the link above, place it in backend/data_prep/, and ensure the filename matches the path configured in the n8n "Read Binary File" node.
