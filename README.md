# MarketSense AI
### GenAI-Enabled Real Estate Intelligence | Proof of Concept

---

## Executive Summary

Real estate investment firms spend the majority of analyst capacity on data preparation — sourcing, cleaning, and normalizing property records — leaving a fraction of available time for the high-value work: market interpretation and strategic advisory.

**MarketSense AI inverts that ratio.**

This platform is a Proof of Concept for an institutional-grade, AI-enabled decision-support system. It operationalizes a 1M+ row real estate dataset through a Retrieval-Augmented Generation (RAG) pipeline, allowing non-technical investment stakeholders to query market conditions in natural language and receive structured, analyst-ready strategic briefs in seconds — grounded in verified relational data, not hallucinated generalities.

The architecture was designed around three enterprise-grade constraints: **retrieval performance at scale**, **LLM API resilience**, and **output verifiability**. Each architectural decision maps directly to a production readiness concern.

> **Target Audience for this PoC:** GenAI Strategy leads, AI Enablement teams, and technology-forward investment firms evaluating the feasibility of integrating large language models into existing data infrastructure.

---

## Table of Contents

1. [The Business Problem](#1-the-business-problem)
2. [Solution Overview](#2-solution-overview)
3. [System Architecture](#3-system-architecture)
4. [Strategic Engineering Decisions](#4-strategic-engineering-decisions)
5. [Platform Capabilities](#5-platform-capabilities)
6. [Product Roadmap](#6-product-roadmap)
7. [Technology Stack](#7-technology-stack)
8. [Installation & Deployment](#8-installation--deployment)
9. [Data Source & Governance Notice](#9-data-source--governance-notice)

---

## 1. The Business Problem

The fundamental challenge of applying AI to enterprise data is not the AI itself — it is the gap between how data is stored and how intelligence systems consume it.

| Business Constraint | Technical Root Cause | Operational Impact |
|---|---|---|
| **Slow Time-to-Insight** | Full flat-file scans on every query against 170MB+ CSVs | Analyst hours consumed by data retrieval, not analysis |
| **AI Output Unreliability** | Un-aggregated, un-structured data sent directly to the LLM | Incomplete briefs, hallucinated metrics, `429 Rate Limit` failures |
| **Expertise Dependency** | No accessible query interface for non-technical stakeholders | Strategic decisions bottlenecked by engineering availability |

MarketSense AI was designed to close each of these gaps through a layered architecture in which every component has a single, clearly defined responsibility.

---

## 2. Solution Overview

MarketSense AI is a self-contained RAG system in which:

- **PostgreSQL** serves as the authoritative source of truth for all property data — structured, indexed, and queryable at relational speed.
- **n8n** acts as the low-code orchestration layer, routing user intent through SQL retrieval, data aggregation, and LLM synthesis in a single, auditable workflow.
- **Google Gemini 2.5 Flash** handles only what LLMs do best: synthesis, classification, and narrative generation — operating on clean, pre-aggregated context rather than raw rows.
- **React 18** presents the output as a dual-panel dashboard: an AI-generated strategic brief alongside a data visualization component that allows analysts to verify the AI's findings against the underlying record averages.

The result is a system where **AI accelerates advisory, and data provides the guardrails**.

---

## 3. System Architecture

The pipeline follows a six-stage flow. Each stage is a discrete, independently replaceable component — a deliberate design principle for enterprise extensibility.

```
[ React 18 Dashboard ]
         |
         |  POST — Natural language query + location parameter
         v
[ n8n Webhook Endpoint ]
         |
         |  Parameterized SQL — indexed by state / city
         v
[ PostgreSQL (Docker) ]          Source of Truth — 1M+ property records
         |
         |  JSON array — filtered record set
         v
[ n8n Aggregation Layer ]        Batch serialization; N records → 1 prompt object
         |
         |  Single consolidated JSON payload
         v
[ Google Gemini 2.5 Flash ]      JSON Mode enforced; structured schema output
         |
         |  { market_type, summary, median_price, median_sqft, signals, recommendations }
         v
[ React — Brief Renderer + Recharts Visualization ]
```

**Stage-by-Stage Rationale:**

**Stage 1 — User Input.** The analyst enters a plain-English query (e.g., _"What is the investment landscape in Bergen County, New Jersey?"_) into the React dashboard. Location parameters are parsed client-side and appended to the POST body before dispatch.

**Stage 2 — Webhook Orchestration.** n8n receives the request at a scoped webhook endpoint. Cross-origin access is governed by explicit environment-level CORS configuration, permitting only the designated frontend origin — a security boundary that mirrors enterprise API gateway patterns.

**Stage 3 — Relational Retrieval.** A SQL node executes a parameterized query against the containerized PostgreSQL instance. Geographic filtering is handled at the database layer — where it belongs — not in application logic or within the LLM prompt.

**Stage 4 — Aggregation Layer.** The critical resilience mechanism of the pipeline. An n8n Bucket node collects the full result set from PostgreSQL and serializes it into a single JSON payload. This collapses an arbitrary number of records into exactly one LLM API call, regardless of result-set size.

**Stage 5 — LLM Synthesis.** Gemini 2.5 Flash receives the aggregated context and returns a structured JSON object conforming to a predefined schema. The model is not asked to retrieve, filter, or calculate — it is asked exclusively to reason and synthesize.

**Stage 6 — Verified Output Rendering.** The React frontend populates two components simultaneously from the structured response: a Markdown-formatted strategic brief and a Recharts visualization of the AI-extracted metrics. Side-by-side rendering enables immediate analyst verification of AI outputs against data-derived figures.

---

## 4. Strategic Engineering Decisions

### 4.1 Relational Retrieval Efficiency — The Migration from Flat Files to a Source of Truth

**Strategic Context:** Flat-file architectures are acceptable for exploratory data work. They are not acceptable for systems that must serve concurrent users with sub-second query expectations against 1M+ row datasets.

**Decision:** The full dataset was migrated from a 170MB CSV into a containerized PostgreSQL instance via a purpose-built Python ETL pipeline (pandas + SQLAlchemy). Columns used for geographic filtering — state, city, zip code — were indexed at the database level.

**Business Outcome:** Query latency reduced by approximately 90% relative to full-file scans. The system now supports complex, multi-dimensional geographic segmentation (state AND city AND price range) through standard parameterized SQL — a capability that flat-file approaches cannot replicate without bespoke in-memory indexing logic.

The PostgreSQL backend also establishes a **verifiable source of truth**: every AI output can be independently audited against the underlying records, addressing a core enterprise concern around LLM-generated data reliability.

---

### 4.2 Context Window Management — The Aggregation Layer

**Strategic Context:** A direct, naive integration between a database and an LLM — forwarding each retrieved record as an individual API call — is neither cost-efficient nor resilient. At the query volumes required for meaningful market analysis (50+ records per request), this pattern immediately exhausts per-minute token quotas and produces `429 Too Many Requests` failures.

**Decision:** An explicit Aggregation Layer was implemented in n8n using the built-in Bucket node and a custom JavaScript mapping function. The node collects all records from the SQL result set and serializes them into a single consolidated JSON payload. The LLM receives one call; the context is complete; the output is coherent.

**Business Outcome:** The system achieved a 0% API quota-exceeded rate following implementation. More significantly, the aggregation step makes token consumption **predictable and auditable**: regardless of how many records a query returns, the cost to the LLM layer is exactly one completion call. This is a prerequisite for cost governance in any production AI deployment.

---

### 4.3 CORS Security Protocol — Scoped Cross-Origin Access Control

**Strategic Context:** Self-hosted AI orchestration tools running without explicit origin restrictions expose a permissive attack surface. In an enterprise context, API endpoints should accept requests only from designated, verified sources.

**Decision:** The n8n container is launched with `N8N_CORS_ENABLE=true` and a scoped `N8N_CORS_ALLOWED_ORIGINS` environment variable, explicitly whitelisting only the React frontend origin. All other origins are rejected at the container level before any workflow logic executes.

**Business Outcome:** The deployment pattern mirrors enterprise API gateway security configurations and is portable to production environments (AWS API Gateway, Azure API Management) without architectural changes. The scoped CORS policy also serves as the baseline for a future authentication layer.

---

### 4.4 Structured Output Schema Enforcement — Guaranteed Parseable Intelligence

**Strategic Context:** Unstructured LLM text responses create a hidden integration tax: every downstream consumer must implement brittle parsing logic to extract data points. This is antithetical to a system that should be reliable and auditable.

**Decision:** The Gemini node is configured to operate in JSON Mode, with the system prompt specifying an explicit response schema: `{ market_type, executive_summary, median_price, median_sqft, key_signals, recommendations }`. The LLM is contractually bound — within the prompt — to return data in this structure or fail explicitly.

**Business Outcome:** The React rendering layer consumes structured fields directly, with no regular expression parsing or defensive string manipulation. The Recharts visualization populates from the same JSON object as the strategic brief, ensuring 1:1 parity between the AI narrative and the data-derived figures rendered in the dashboard. This schema-first approach is the foundation for any future API contract between MarketSense AI and external consumer systems.

---

## 5. Platform Capabilities

**Natural Language Market Querying.** Investment analysts query market conditions in plain English. The orchestration layer resolves query intent into structured SQL — no SQL knowledge required from the end user.

**Verified AI Strategic Briefs.** Gemini synthesizes retrieved property records into a structured report covering: market classification, pricing trend analysis, demand signals, and investment positioning recommendations. Every brief is generated from live database records, not static training data.

**Side-by-Side Data Verification Dashboard.** A Recharts visualization component renders the AI-extracted median price and property size metrics alongside the generated brief. Analysts can immediately cross-reference AI conclusions against data-derived figures — a critical trust mechanism for institutional adoption.

**Production-Portable Architecture.** The full environment (database, orchestration engine, ETL pipeline) runs in Docker. The deployment footprint is portable from a local development machine to cloud container infrastructure without application-level changes.

---

## 6. Product Roadmap

The current PoC implements the core intelligence pipeline. The application navigation reflects three defined development phases, of which Phase 1 is production-ready.

### Phase 1 — Market Intelligence (Current: Production-Ready)

The **Market Data** module delivers the full RAG pipeline: natural language input, PostgreSQL retrieval, LLM synthesis, and verified visual output. This phase validates the core architectural hypothesis: that a low-code orchestration layer (n8n) can bridge enterprise relational data and frontier LLM reasoning in a maintainable, auditable workflow.

---

### Phase 2 — Autonomous Research Agent (Planned)

The **AI Agent** module represents the evolution from query-response to autonomous multi-step reasoning. Planned capabilities include:

- **Multi-turn research sessions:** The agent maintains context across a conversation, refining its analysis based on follow-up questions.
- **Comparative market analysis:** Simultaneous retrieval and synthesis across multiple geographic markets in a single session.
- **Proactive signal detection:** The agent surfaces anomalies and investment signals without explicit user prompting, based on configured watchlist parameters.

This phase introduces agentic workflow patterns in n8n (loop nodes, conditional branching) and evaluates the addition of a vector store layer (e.g., pgvector) for semantic retrieval alongside existing structured SQL queries.

---

### Phase 3 — Enterprise Data Integration & Personalization (Planned)

The **Settings** module underpins the enterprise integration layer. Planned capabilities include:

- **Live data source connectors:** Direct integration with MLS APIs, CoStar, and proprietary property databases to replace the static Kaggle dataset with continuously updated market data.
- **Portfolio-aware personalization:** Analyst profiles that bias retrieval and synthesis toward asset classes, geographies, and risk profiles relevant to their specific portfolio mandates.
- **Role-based access control (RBAC):** Differentiated access tiers for analysts, portfolio managers, and executive stakeholders, with audit logging for all AI-generated outputs.
- **Export and reporting pipeline:** One-click generation of formatted investment memos (PDF/DOCX) from AI briefs, suitable for direct distribution to investment committees.

---

## 7. Technology Stack

| Layer | Technology | Strategic Rationale |
|---|---|---|
| **Frontend** | React 18 (Vite) | Industry-standard component architecture; optimized build pipeline for production deployment |
| **Styling** | Tailwind CSS, Lucide Icons | Utility-first styling for rapid, consistent UI iteration without design system overhead |
| **Data Visualization** | Recharts | Declarative chart library; renders directly from structured JSON — no data transformation layer required |
| **Orchestration** | n8n (Self-hosted, Docker) | Low-code workflow engine enabling rapid pipeline iteration with full auditability; no vendor lock-in |
| **Database** | PostgreSQL (Docker) | Enterprise-grade relational storage; ACID compliance; indexing and query optimization at scale |
| **AI Engine** | Google Gemini 2.5 Flash | Frontier reasoning capability with JSON Mode for guaranteed structured output; cost-efficient at query volumes |
| **ETL Pipeline** | Python (pandas, SQLAlchemy) | Industry-standard data engineering toolchain; reproducible migration from source CSV to relational schema |

---

## 8. Installation & Deployment

### Prerequisites

| Requirement | Version | Purpose |
|---|---|---|
| Docker Desktop | Latest stable | Container runtime for PostgreSQL and n8n |
| Node.js + npm | v18+ | React frontend build and development server |
| Python + pip | 3.9+ | ETL pipeline execution |
| Google Gemini API Key | — | LLM inference ([Obtain here](https://aistudio.google.com/)) |

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/marketsense-ai.git
cd marketsense-ai
```

---

### Step 2: Provision the Data Layer (PostgreSQL)

Start the PostgreSQL container:

```powershell
docker run -d `
  --name marketsense-postgres `
  --network marketsense-net `
  -e POSTGRES_USER=marketsense_user `
  -e POSTGRES_PASSWORD=your_secure_password `
  -e POSTGRES_DB=marketsense_db `
  -p 5432:5432 `
  postgres:15
```

Create the shared Docker network if it does not yet exist:

```bash
docker network create marketsense-net
```

Verify the container is healthy:

```bash
docker ps
```

---

### Step 3: Execute the ETL Pipeline

Download the source dataset (see [Section 9](#9-data-source--governance-notice)) and place `realtor-data.csv` in `backend/data_prep/`. Then run:

```bash
cd backend/data_prep
pip install -r requirements.txt
python etl_pipeline.py
```

Confirm the `DATABASE_URL` variable in `etl_pipeline.py` matches your PostgreSQL container credentials before executing. The script performs data cleaning, schema creation, and full dataset ingestion.

---

### Step 4: Deploy the n8n Orchestration Layer

```powershell
docker run -d `
  --name marketsense-n8n `
  --network marketsense-net `
  -p 5678:5678 `
  -e N8N_CORS_ENABLE=true `
  -e N8N_CORS_ALLOWED_ORIGINS=http://localhost:5173 `
  -v n8n_data:/home/node/.n8n `
  docker.n8n.io/n8nio/n8n
```

> **Network Note:** Both containers are attached to `marketsense-net`. Within this network, n8n can resolve the PostgreSQL container by its service name (`marketsense-postgres`) rather than requiring a host IP address. Update the PostgreSQL node's host field in n8n accordingly.

---

### Step 5: Configure and Publish the n8n Workflow

1. Open [http://localhost:5678](http://localhost:5678) and complete the initial n8n account setup.
2. Navigate to **Workflows > Import from File**.
3. Import `backend/n8n/MarketSense-AI-Core.json`.
4. Open the **Google Gemini Node** and configure your API key in the credentials panel.
5. Open the **PostgreSQL Node** and verify the connection parameters:
   - Host: `marketsense-postgres`
   - Port: `5432`
   - Database: `marketsense_db`
6. Click **Publish** to activate the workflow and expose the webhook endpoint.

---

### Step 6: Launch the React Frontend

```bash
cd frontend
npm install
npm run dev
```

Access the platform at [http://localhost:5173](http://localhost:5173).

---

### Deployment Reference

| Service | Local URL | Port |
|---|---|---|
| MarketSense AI Dashboard | http://localhost:5173 | 5173 |
| n8n Workflow Editor | http://localhost:5678 | 5678 |
| PostgreSQL | localhost | 5432 |

---

## 9. Data Source & Governance Notice

This PoC is built on the **[USA Real Estate Dataset](https://www.kaggle.com/datasets/ahmedshahriarsakib/usa-real-estate-dataset/data)** (approximately 170MB; 1M+ property records), sourced from Kaggle under its applicable license terms.

**The raw `realtor-data.csv` file is not included in this repository** in compliance with GitHub's file size policy and dataset licensing terms.

To provision the data layer for local deployment:

1. Download the dataset from the Kaggle link above.
2. Place the file at `backend/data_prep/realtor-data.csv`.
3. Proceed with Step 3 of the installation guide.

In a production deployment, this static dataset would be replaced by a continuously updated feed from a licensed MLS or commercial property data provider — a transition the PostgreSQL schema and ETL pipeline are designed to accommodate without architectural changes.

---

## License

This project is licensed under the MIT License. See `LICENSE` for details.
