MarketSense AI
GenAI-Powered Real Estate Intelligence Engine

MarketSense AI is a full-stack prototype designed to transform raw commercial real estate data into actionable strategic briefs. By bridging a React frontend with an n8n automation backend and Google Gemini 1.5 Flash, the platform allows users to query massive datasets using natural language.

Core Features
- Natural Language Querying: Ask complex questions about market trends, pricing, and "vibes" without knowing SQL.

- Dynamic Market Distribution: Real-time data visualization that adapts based on AI-extracted metrics.

- Automated Strategy Briefs: Generates professional-grade reports including key signals and investment recommendations.

- Hybrid Architecture: Combines high-speed local data processing (Node.js/n8n) with advanced LLM reasoning.

The Tech Stack
- Frontend: React 18, Vite, Tailwind CSS (Custom UI Components)

- Backend Automation: n8n (Self-hosted via Docker)

- AI Engine: Google Gemini 2.5 Flash

- Data Source: 170MB+ Realtor Property Dataset (CSV)

- Environment: Dockerized workflow for local scalability

Installation & Setup
1. Prerequisites
Docker installed and running.

Node.js (v18+) and npm.

A Google Gemini API Key.

2. Backend Setup (n8n)
Navigate to /backend/n8n.

Start the n8n container:

PowerShell
docker run -it --rm --name n8n -p 5678:5678 -v "${PWD}:/home/node/.n8n-files" docker.n8n.io/n8nio/n8n
Open http://localhost:5678 and Import the MarketSense-AI-Core.json workflow.

Add your Gemini API Key to the Google Gemini Node and click Publish.

3. Frontend Setup (React)
Navigate to /frontend.

Install dependencies: npm install

Start the development server: npm run dev

Access the dashboard at http://localhost:5173.

Data Notice
Due to GitHub's file size limitations, the raw realtor-data.csv (170MB+) is not included in this repository.

To Run: Place your source CSV in backend/data_prep/ and ensure the filename matches the path in the n8n "Read Binary File" node.
