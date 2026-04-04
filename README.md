# MarketSense AI
### Institutional-Grade Real Estate Intelligence via Retrieval-Augmented Generation

MarketSense AI is a production-oriented, full-stack RAG application that transforms 1M+ rows of commercial real estate data into structured, analyst-ready strategic briefs. The platform bridges a React 18 frontend with a self-hosted n8n orchestration layer and Google Gemini 2.5 Flash, enabling non-technical stakeholders to execute deep-market research through natural language — with outputs verified against a live PostgreSQL backend.

> This project was engineered to solve three compounding production constraints: raw file latency at scale, LLM context-window saturation, and API rate-limit exhaustion. Each constraint drove a deliberate architectural decision.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [System Architecture](#2-system-architecture)
3. [Key Engineering Wins](#3-key-engineering-wins)
4. [Core Features](#4-core-features)
5. [Technology Stack](#5-technology-stack)
6. [Installation & Setup](#6-installation--setup)
7. [Data Source & Notice](#7-data-source--notice)

---

## 1. Problem Statement

Building an AI-powered analytics tool against a 170MB+ flat-file dataset surfaces three distinct engineering failure modes:

| Constraint | Root Cause | Impact |
|---|---|---|
| **Query Latency** | Full CSV scan on every request | High memory overhead; unacceptable response times in production |
| **Context Bottleneck** | Un-aggregated rows sent directly to the LLM | `429 Too Many Requests` errors; incomplete or truncated analysis |
| **Accessibility Gap** | No SQL interface for non-technical analysts | Investment stakeholders cannot derive insight without engineering support |

MarketSense AI addresses each of these constraints through a layered hybrid architecture rather than any single fix.

---

## 2. System Architecture

The core pipeline follows a six-stage RAG flow. Each stage is a discrete, replaceable component — a deliberate design choice for future scalability.

```
[ React 18 UI ]
      |
      |  HTTP POST (natural language query + location)
      v
[ n8n Webhook Trigger ]
      |
      |  Parameterized SQL query
      v
[ PostgreSQL (Docker) ]   <-- 1M+ rows, indexed by state/city
      |
      |  Raw record set (JSON array)
      v
[ n8n Aggregation Layer ]  <-- "Bucket" node; batches rows into a single prompt object
      |
      |  Single JSON payload (aggregated context)
      v
[ Google Gemini 2.5 Flash ]  <-- JSON Mode enabled for structured extraction
      |
      |  Structured JSON response { market_type, summary, pricing, recommendations }
      v
[ React UI — Report Renderer + Recharts Dashboard ]
```

**Stage-by-Stage Breakdown:**

**Stage 1 — Input.** The analyst enters a natural language query (e.g., _"What is the investment landscape in New Jersey?"_) into the React dashboard. The location is parsed client-side and appended to the POST body.

**Stage 2 — Webhook Trigger.** n8n receives the request at a configured webhook endpoint. CORS is explicitly enabled at the container level to permit cross-origin requests from the Vite dev server.

**Stage 3 — Relational Retrieval.** A SQL node executes a parameterized query against the containerized PostgreSQL instance, filtering records by state and/or city. Indexed columns ensure sub-500ms retrieval across the full dataset.

**Stage 4 — Aggregation Layer.** This is the critical engineering decision of the pipeline. Rather than forwarding every record to the LLM as individual requests (which triggers `429` errors), an n8n "Bucket" node collects the full result set and serializes it into a single JSON object. This collapses N API calls into one.

**Stage 5 — LLM Synthesis.** Gemini 2.5 Flash receives the aggregated context object and returns a structured JSON response. JSON Mode is enforced to guarantee parseable output for downstream rendering.

**Stage 6 — Render.** The React frontend parses the response and populates two components simultaneously: a Markdown-formatted strategic brief and a Recharts visualization of the AI-extracted pricing and sizing metrics.

---

## 3. Key Engineering Wins

### 3.1 Database-Driven RAG (CSV to PostgreSQL Migration)

**Problem:** Loading and querying a 170MB CSV file on every user request is not a viable pattern. It saturates memory, blocks the event loop, and provides no indexing capability.

**Decision:** The entire dataset was migrated to a containerized PostgreSQL instance using a Python ETL pipeline (pandas + SQLAlchemy). SQL queries against indexed columns replaced full-file scans.

**Outcome:** Query latency reduced by approximately 90%. Complex geographic filtering (e.g., multi-city, multi-state segmentation) became trivial via standard `WHERE` clauses.

---

### 3.2 Aggregation Layer — Solving the 429 Rate-Limit Problem

**Problem:** A naive implementation would forward each database row to the Gemini API as a separate completion request. At scale, this immediately exhausts per-minute token quotas, producing `429 Too Many Requests` errors and incomplete analysis.

**Decision:** An explicit Aggregation Layer was engineered in n8n using the built-in "Bucket" node and a custom JavaScript mapping function. The node collects all records from the SQL result set and serializes them into a single consolidated JSON payload before any LLM call is made.

**Outcome:** The system achieved 0% quota-exceeded errors post-implementation. A query returning 50+ property records now costs exactly one API call, regardless of result-set size. Token consumption is predictable and controllable.

---

### 3.3 Containerized Orchestration with CORS-Enabled n8n

**Problem:** Running n8n locally without explicit CORS configuration causes all cross-origin requests from the React frontend (port 5173) to be blocked at the browser level.

**Decision:** The n8n container is launched with `N8N_CORS_ENABLE=true` and a scoped `N8N_CORS_ALLOWED_ORIGINS` environment variable, permitting only the expected frontend origin. PostgreSQL is co-located in Docker, isolating the data layer from the host environment.

**Outcome:** A fully portable, one-command local environment that mirrors a production Docker Compose deployment pattern. No native database installations required.

---

### 3.4 Structured Output via JSON Mode

**Problem:** Unstructured LLM text responses cannot be reliably parsed for component-level rendering (e.g., populating a chart with specific numeric fields extracted from the brief).

**Decision:** The Gemini node is configured to enforce JSON Mode, with the system prompt specifying an explicit schema: `{ market_type, executive_summary, median_price, median_sqft, key_signals, recommendations }`.

**Outcome:** 1:1 parity between the AI-generated "Key Findings" narrative and the underlying PostgreSQL record averages. The Recharts dashboard renders directly from the structured fields — no regex or brittle string parsing required.

---

## 4. Core Features

**Natural Language Querying.** Analysts issue plain-English questions about market trends, pricing dynamics, and investment positioning without any SQL knowledge. Query intent is resolved by the n8n workflow layer.

**Real-Time Market Distribution Dashboard.** A Recharts-powered visualization component renders AI-extracted metrics — median price, median lot size, house size distribution — alongside the generated brief for immediate fact-checking.

**Automated Strategic Briefs.** Gemini synthesizes retrieved records into a structured Markdown report covering: market classification, pricing trends, demand signals, and investment recommendations.

**Hybrid RAG Architecture.** Structured retrieval (PostgreSQL) handles precision and speed. LLM reasoning (Gemini) handles synthesis and narrative. Neither layer is asked to do what the other does better.

---

## 5. Technology Stack

| Layer | Technology | Role |
|---|---|---|
| **Frontend** | React 18 (Vite) | UI framework and build tooling |
| **Styling** | Tailwind CSS, Lucide Icons | Component styling and iconography |
| **Data Visualization** | Recharts | Market distribution chart rendering |
| **Orchestration** | n8n (Self-hosted, Docker) | Workflow engine: webhook, SQL, aggregation, LLM |
| **Database** | PostgreSQL (Docker) | Relational storage for 1M+ property records |
| **AI Engine** | Google Gemini 2.5 Flash | LLM synthesis with JSON Mode enforcement |
| **ETL Pipeline** | Python (pandas, SQLAlchemy) | Data cleaning and PostgreSQL migration |

---

## 6. Installation & Setup

### Prerequisites

- Docker Desktop installed and running
- Node.js v18+ and npm
- Python 3.9+ with pip (for the ETL pipeline)
- A Google Gemini API Key ([obtain here](https://aistudio.google.com/))

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/marketsense-ai.git
cd marketsense-ai
```

---

### Step 2: Run the ETL Pipeline

Download the dataset (see [Section 7](#7-data-source--notice)), place `realtor-data.csv` in `backend/data_prep/`, then execute:

```bash
cd backend/data_prep
pip install -r requirements.txt
python etl_pipeline.py
```

This script cleans the raw CSV and loads the full dataset into PostgreSQL. Confirm the `DATABASE_URL` variable in `etl_pipeline.py` matches your container configuration before running.

---

### Step 3: Start the PostgreSQL Container

```powershell
docker run -d `
  --name marketsense-postgres `
  -e POSTGRES_USER=marketsense_user `
  -e POSTGRES_PASSWORD=your_secure_password `
  -e POSTGRES_DB=marketsense_db `
  -p 5432:5432 `
  postgres:15
```

Verify the container is running:

```bash
docker ps
```

---

### Step 4: Start the n8n Container (with CORS Enabled)

```powershell
docker run -d `
  --name marketsense-n8n `
  -p 5678:5678 `
  -e N8N_CORS_ENABLE=true `
  -e N8N_CORS_ALLOWED_ORIGINS=http://localhost:5173 `
  -v n8n_data:/home/node/.n8n `
  docker.n8n.io/n8nio/n8n
```

> **Note on Networking:** If n8n cannot resolve the PostgreSQL container by hostname, add `--network host` to the n8n `docker run` command, or connect both containers to a shared Docker network using `docker network create marketsense-net`.

---

### Step 5: Configure the n8n Workflow

1. Open [http://localhost:5678](http://localhost:5678) and complete the initial n8n setup.
2. Navigate to **Workflows > Import from File**.
3. Import `backend/n8n/MarketSense-AI-Core.json`.
4. Open the **Google Gemini Node** and enter your API key in the credentials panel.
5. Open the **PostgreSQL Node** and verify the connection parameters match your container (host: `localhost`, port: `5432`, database: `marketsense_db`).
6. Click **Publish** to activate the workflow.

---

### Step 6: Start the React Frontend

```bash
cd frontend
npm install
npm run dev
```

Access the dashboard at [http://localhost:5173](http://localhost:5173).

---

### Verified Environment Reference

| Service | URL | Default Port |
|---|---|---|
| React Frontend | http://localhost:5173 | 5173 |
| n8n Workflow Editor | http://localhost:5678 | 5678 |
| PostgreSQL | localhost | 5432 |

---

## 7. Data Source & Notice

This project is built on the **[USA Real Estate Dataset](https://www.kaggle.com/datasets/ahmedshahriarsakib/usa-real-estate-dataset/data)** (approx. 170MB, 1M+ rows), sourced from Kaggle under its respective license.

**The raw `realtor-data.csv` file is not included in this repository** due to GitHub's file size limitations.

To run the full pipeline locally:

1. Download the dataset from the Kaggle link above.
2. Place the file at `backend/data_prep/realtor-data.csv`.
3. Confirm the filename matches the path configured in the ETL script before executing Step 2 of the setup guide.

---

## License

This project is licensed under the MIT License. See `LICENSE` for details.
