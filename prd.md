# 📘 PRD — CoFound.ai

**Autonomous Agentic Market Intelligence Platform**

---

## 1. Product Overview

### Product Name

**CoFound.ai**

### One-Liner

Turn messy founder thoughts into **autonomous, end-to-end market intelligence reports** using a multi-agent AI system.

### Vision

Enable solo founders, early teams, and product leaders to validate ideas **without manual research**, by delegating thinking, analysis, and synthesis to a coordinated agentic system.

### Core Principle

> **User triggers → Agents think → System decides → Report delivered**

The user does **not** micromanage steps.
The system runs **autonomously**.

---

## 2. Problem Statement

Founders today:

* Have fragmented ideas
* Lack time for deep market research
* Rely on biased intuition or shallow tools
* Jump into building without validation

Existing tools:

* Are static (dashboards)
* Require manual exploration
* Do not challenge assumptions
* Do not reason end-to-end

**There is no system that thinks for the founder.**

---

## 3. Target Users

### Primary

* Solo founders
* Early-stage startup teams
* Indie hackers
* Product managers

### Secondary

* VC analysts
* Startup studios
* Strategy consultants

---

## 4. Product Scope (MVP)

### What the system WILL do

* Accept unstructured thoughts
* Autonomously analyze market viability
* Identify competitors & gaps
* Assess feasibility
* Challenge assumptions
* Decide Go / Pivot / Kill
* Generate a structured Market Intelligence Report

### What the system WILL NOT do (v1)

* Build the product
* Write code
* Replace user judgment
* Guarantee success

---

## 5. Core UX Architecture

### Global Layout Rule

* **Left Sidebar is always present** (like GPT)
* Sidebar = manual research tools
* Main canvas = autonomous agentic execution

### Pages

#### 1. Autonomous Analysis Home (Primary)

* Large thought input
* Context inputs (industry, geography, user segment)
* CTA: **Generate Market Intelligence**
* Autonomous execution starts immediately

#### 2. Active Agentic Analysis Flow

* Vertical timeline of agent execution
* Live progress & confidence indicators
* No manual interaction

#### 3. Market Intelligence Report

* Executive summary
* Market size & demand
* Competitor landscape
* Market gaps
* Risks & feasibility
* Final decision & rationale

#### 4. Manual Research Pages (Sidebar-driven)

* Trend Explorer
* Competitor Research
* Market Gaps Matrix
* Saved Insights

> These pages are **optional exploratory tools**, not part of the autonomous flow.

---

## 6. Reference UI Artifacts

Design references are stored at:

```
/design/google-stitch-reference.png
```

This image represents:

* Visual hierarchy
* Sidebar behavior
* Report layout
* Agentic flow visualization

Design system:
**Modern SaaS / Analyst-grade / Calm / Trustworthy**

---

## 7. Agentic System Architecture (CORE)

### Agent Design Philosophy

* One responsibility per agent
* No agent decides + researches
* No agent talks directly to raw data
* All outputs are structured

---

## 8. Agent Definitions

### 1. Thought Structuring Agent

**Purpose:** Convert messy input → structured intent

**Inputs**

* Raw user text

**Outputs**

```json
{
  "pain_points": [],
  "user_segments": [],
  "assumptions": [],
  "constraints": []
}
```

---

### 2. Ideation Agent

**Purpose:** Problem-centric idea generation

**Outputs**

* Problem statements
* Initial solution hypotheses

---

### 3. Similarity & Pattern Agent

**Purpose:** Detect repeated ideas & saturation signals

**Outputs**

* Similar ideas
* Pattern frequency
* Saturation warnings

---

### 4. Market Validation Agent

**Purpose:** Demand & relevance evaluation

**Outputs**

* Demand score
* Market maturity
* Market size proxies

---

### 5. Trend Intelligence Agent

**Purpose:** Timing & momentum analysis

**Outputs**

* Trend velocity
* “Why now?” reasoning

---

### 6. Competitor Analysis Agent

**Purpose:** Saturation & differentiation analysis

**Outputs**

* Feature overlap
* Competitive density
* Gap signals

---

### 7. Feasibility Agent

**Purpose:** Cost & technical risk assessment

**Outputs**

* Technical feasibility score
* Cost complexity
* Execution risk

---

### 8. Critic Agent

**Purpose:** Assumption validation & challenge

**Outputs**

* Broken assumptions
* Weak links
* Risk flags

---

### 9. Decision Agent

**Purpose:** Final directive

**Outputs**

```json
{
  "decision": "GO | PIVOT | TERMINATE",
  "confidence": 0.0-1.0,
  "rationale": []
}
```

---

### 10. Synthesis Agent

**Purpose:** Cross-agent reasoning & narrative building

**Outputs**

* Unified insight narrative
* Inputs for report generation

---

### 11. Report Generation Agent

**Purpose:** Communication only (no reasoning)

**Outputs**

* Structured Market Intelligence Report
* Exportable formats

---

## 9. Agent Execution Order

```
User Input
↓
Thought Structuring Agent
↓
Ideation Agent
↓
Similarity & Pattern Agent
↓
Market Validation Agent
↓
Trend Intelligence Agent
↓
Competitor Analysis Agent
↓
Feasibility Agent
↓
Critic Agent
↓
Decision Agent
↓
Synthesis Agent
↓
Report Generation Agent
```

---

## 10. Data Pipeline Architecture

### Data Layers

#### 1. Raw Data Sources

* Market datasets
* Trend signals
* Competitor info
* User inputs

---

#### 2. Ingestion & Normalization

* Source tagging
* Timestamping
* Cleaning

```
/data/datasets/
```

---

#### 3. Embedding & Indexing

Used by similarity & pattern agents

```
/data/memory/long_term/
```

---

#### 4. Short-Term Execution Memory

Per-run agent communication

```
/data/memory/short_term/
```

---

#### 5. Confidence & Guardrails

* Score normalization
* Conflict detection
* Risk amplification

```
/guardrails/
```

---

#### 6. Output Storage

* Reports
* Decisions
* Saved insights

```
/data/reports/
```

---

## 11. Antigravity-Style Repo Structure

cofound-ai/
│
├── PRD.md
│   # Product Requirements Document (single source of truth)
│
├── README.md
│   # Setup, architecture overview, and run instructions
│
├── config/
│   └── config.yaml
│   # API keys, model routing, global thresholds
│
├── agents/
│   ├── base_agent.py
│   │   # Shared agent interface & execution contract
│   │
│   ├── thought_structuring/
│   │   └── agent.py
│   ├── ideation/
│   │   └── agent.py
│   ├── similarity_pattern/
│   │   └── agent.py
│   ├── market_validation/
│   │   └── agent.py
│   ├── trend_intelligence/
│   │   └── agent.py
│   ├── competitor_analysis/
│   │   └── agent.py
│   ├── feasibility/
│   │   └── agent.py
│   ├── critic/
│   │   └── agent.py
│   ├── decision/
│   │   └── agent.py
│   ├── synthesis/
│   │   └── agent.py
│   └── report_generation/
│       └── agent.py
│
├── tools/
│   ├── tool_definitions.py
│   │   # MCP interfaces (search, memory, reasoning)
│   │
│   └── api_integrations.py
│       # Free data sources (DuckDuckGo, Reddit, Google Trends)
│
├── orchestration/
│   ├── agent_runner.py
│   │   # Agent lifecycle management
│   │
│   └── execution_graph.py
│       # Deterministic autonomous execution graph
│
├── data/
│   ├── datasets/
│   │   # Cached market, trend, competitor data
│   │
│   ├── memory/
│   │   ├── short_term/
│   │   │   # Per-run execution context
│   │   │
│   │   └── long_term/
│   │       # Embeddings, patterns, past runs
│   │
│   └── reports/
│       # Generated intelligence reports (JSON / PDF)
│
├── guardrails/
│   ├── confidence_scoring.py
│   │   # Confidence normalization & penalties
│   │
│   └── hallucination_checks.py
│       # Contradiction & unsupported-claim detection
│
├── observability/
│   ├── logging.py
│   │   # Structured logs per agent
│   │
│   ├── tracing.py
│   │   # Execution spans across agents
│   │
│   └── metrics.py
│       # Latency, cost, confidence degradation
│
├── api/
│   ├── routes/
│   │   # FastAPI route handlers
│   │
│   └── schemas/
│       # Pydantic request / response schemas
│
├── frontend/
│   # React / Next.js UI (autonomous flow + sidebar tools)
│
├── design/
│   └── google-stitch-reference.png
│   # UI reference for implementation
│
├── infra/
│   # Docker, CI/CD, deployment configs
│
└── tests/
    ├── test_agents.py
    ├── test_tools.py
    ├── test_memory.py
    └── test_workflows.py


---

## 12. Success Metrics (MVP)

* Time to report: **< 2 minutes**
* User clarity score (self-reported)
* % users reaching Decision Agent
* Saved reports per user

---

## 13. Long-Term Extensions (Not MVP)

* Founder memory across projects
* Investor-ready pitch export
* Multi-idea portfolio analysis
* Agent fine-tuning per user

---

## 14. Product North Star

> **If a founder can confidently decide what *not* to build, the product has succeeded.**

---

| Layer               | Component                 | Choice (Free / Open)              | Used By (Agents / System)          | Purpose                                                  |
| ------------------- | ------------------------- | --------------------------------- | ---------------------------------- | -------------------------------------------------------- |
| **Frontend**        | Web App                   | **React + Vite + TailwindCSS**    | User-facing UI                     | Fast iteration, modern UX, matches Google Stitch designs |
| **Frontend State**  | Global State              | **Zustand**                       | UI + Agent status                  | Lightweight, no Redux overhead                           |
| **Backend API**     | API Server                | **FastAPI (Python)**              | All agents                         | Async, type-safe, agent-friendly                         |
| **Agent Runtime**   | Agent Orchestration       | **Antigravity**                   | All autonomous flows               | Multi-agent execution, task graphs                       |
| **Primary LLM**     | Reasoning Model           | **OpenAI (GPT-4.1 / GPT-5)**      | Critic, Decision, Synthesis Agents | Deep reasoning, final decisions                          |
| **Light LLM**       | Fast Model                | **OpenAI o4-mini**                | Ideation, Structuring, Similarity  | Cheap, fast, iterative reasoning                         |
| **Embeddings**      | Vector Embeddings         | **OpenAI text-embedding-3-large** | Memory + similarity                | Idea clustering & recall                                 |
| **Primary DB**      | Relational DB             | **PostgreSQL**                    | Projects, reports, users           | Durable structured storage                               |
| **Vector DB**       | Semantic Memory           | **Qdrant (self-hosted)**          | Vector Memory MCP                  | Idea similarity & pattern memory                         |
| **Cache**           | Request Cache             | **Redis (local / Upstash free)**  | Search MCP                         | Prevent re-scraping & cost                               |
| **Object Storage**  | Files & PDFs              | **Local FS / Cloudflare R2**      | Reports                            | Store generated reports                                  |
| **Search Data**     | Web Search                | **DuckDuckGo / Bing scraping**    | Market Validation, Trends          | Demand & intent signals                                  |
| **Trend Data**      | Trends                    | **Google Trends (scraped)**       | Trend Intelligence Agent           | Momentum & timing                                        |
| **Community Data**  | Forums                    | **Reddit scraping**               | Ideation, Critic                   | Pain points & language                                   |
| **Startup Data**    | Companies                 | **YC list + GitHub datasets**     | Competitor Agent                   | Saturation & landscape                                   |
| **Product Signals** | Launches                  | **Product Hunt scraping**         | Competitor Analysis                | Market noise vs signal                                   |
| **MCP**             | Search MCP                | **Custom (scrape + normalize)**   | Market, Trend Agents               | Unified search interface                                 |
| **MCP**             | Vector Memory MCP         | **Qdrant + embeddings**           | All agents                         | Long-term memory                                         |
| **MCP**             | Reasoning MCP             | **Pydantic + JSON schemas**       | Critic, Decision                   | Enforce logic & numbers                                  |
| **MCP**             | Guardrail MCP             | **Rule + LLM checks**             | Critic Agent                       | Assumption challenge                                     |
| **MCP**             | User Context MCP          | **Postgres JSON**                 | Decision Agent                     | Founder history & bias                                   |
| **Agent**           | Ideation Agent            | LLM + Search MCP                  | Autonomous flow                    | Problem-centric ideas                                    |
| **Agent**           | Market Validation Agent   | LLM + Search + Trends MCP         | Autonomous flow                    | Demand & relevance                                       |
| **Agent**           | Competitor Analysis Agent | LLM + Startup data                | Autonomous flow                    | Saturation & gaps                                        |
| **Agent**           | Feasibility Agent         | LLM + heuristics                  | Autonomous flow                    | Cost & tech risk                                         |
| **Agent**           | Critic Agent              | Strong LLM + Guardrails           | Autonomous flow                    | Challenge assumptions                                    |
| **Agent**           | Decision Agent            | Strong LLM + scores               | Final step                         | Go / Pivot / Kill                                        |
| **Observability**   | Logging                   | **Structlog + OpenTelemetry**     | Backend                            | Debug agent behavior                                     |
| **Export**          | Report Export             | **HTML → PDF**                    | User output                        | Shareable intelligence                                   |
| **DevOps**          | Runtime                   | **Docker + Docker Compose**       | Local dev                          | Simple deployment                                        |
| **Auth (MVP)**      | Authentication            | **Supabase Auth (free)**          | User accounts                      | Fast setup                                               |


Perfect — here’s the **execution graph** exactly as it should exist in **Antigravity**, written like we’re locking the system design before building.

This is the **autonomous spine** of CoFound.ai.
Sidebar tools never touch this graph directly.

---

# 🧠 CoFound.ai — Autonomous Execution Graph (Antigravity)

## High-level idea

* **Single trigger**
* **Deterministic order**
* **Parallel where safe**
* **Critic + Decision at the end only**

This avoids agent chaos and keeps costs + hallucinations low.

---

## 1️⃣ Entry Point (Single Trigger)

```
User Input
  ├─ raw_thought (text)
  ├─ industry? (optional)
  ├─ geography? (optional)
  └─ user_segment? (optional)
```

⬇️

---

## 2️⃣ Thought Structuring Agent (MANDATORY FIRST)

### Agent: `thought_structuring_agent`

**Purpose**

* Clean chaos
* Extract intent
* Define scope

**Outputs**

```json
{
  "core_problem": "...",
  "target_user": "...",
  "industry": "...",
  "job_to_be_done": "...",
  "assumptions": [...],
  "keywords": [...]
}
```

⬇️ (fan-out begins)

---

## 3️⃣ Parallel Research Phase (SAFE TO PARALLEL)

### These agents **DO NOT talk to each other**

```
                 ┌────────────────────────┐
                 │ Trend Intelligence     │
                 └────────────────────────┘
                         ▲
                         │
┌────────────────────────┴────────────────────────┐
│                                                 │
│  Market Validation Agent         Competitor Agent│
│                                                 │
└────────────────────────┬────────────────────────┘
                         │
                 ┌────────────────────────┐
                 │ Feasibility Agent       │
                 └────────────────────────┘
```

---

### 3.1 Market Validation Agent

**Uses**

* Search MCP
* Reddit
* DuckDuckGo / Bing

**Outputs**

```json
{
  "demand_score": 0-100,
  "pain_severity": "low|medium|high",
  "buyer_language": [...],
  "evidence": [...]
}
```

---

### 3.2 Trend Intelligence Agent

**Uses**

* Google Trends
* Historical keyword momentum

**Outputs**

```json
{
  "trend_direction": "rising|flat|declining",
  "timing_score": 0-100,
  "geo_hotspots": [...],
  "signals": [...]
}
```

---

### 3.3 Competitor Analysis Agent

**Uses**

* YC list
* Product Hunt
* GitHub startup datasets

**Outputs**

```json
{
  "competitor_count": n,
  "saturation_level": "low|medium|high",
  "feature_overlap": 0-100,
  "white_spaces": [...]
}
```

---

### 3.4 Feasibility Agent

**Uses**

* Heuristics
* Tech cost estimation
* Integration complexity rules

**Outputs**

```json
{
  "technical_risk": "low|medium|high",
  "build_complexity": 0-100,
  "mvp_scope": [...],
  "hidden_costs": [...]
}
```

⬇️ (all results collected)

---

## 4️⃣ Vector Memory Write (ASYNC, NON-BLOCKING)

### MCP: `vector_memory_mcp`

* Stores:

  * structured thought
  * agent outputs
  * embeddings

⚠️ **Does NOT affect decision flow**
This prevents latency creep.

---

## 5️⃣ Synthesis Agent (FIRST MERGE POINT)

### Agent: `synthesis_agent`

**Purpose**

* Combine facts
* Remove duplicates
* Normalize scores

**Inputs**

* Outputs from all research agents

**Outputs**

```json
{
  "normalized_scores": {
    "demand": 82,
    "trend": 74,
    "competition": 61,
    "feasibility": 68
  },
  "key_insights": [...],
  "contradictions": [...]
}
```

⬇️

---

## 6️⃣ Critic Agent (GUARDRAIL PHASE)

### Agent: `critic_agent`

**Runs ONCE. No loops.**

**Checks**

* Unsupported claims
* Score inflation
* Internal contradictions
* Missing counter-arguments

**Outputs**

```json
{
  "confidence_penalty": -8,
  "challenged_assumptions": [...],
  "risk_flags": [...]
}
```

⬇️

---

## 7️⃣ Decision Agent (FINAL AUTHORITY)

### Agent: `decision_agent`

**This agent is opinionated.**

**Inputs**

* Synthesis output
* Critic output
* User context (past ideas)

**Outputs**

```json
{
  "verdict": "proceed | caution | avoid",
  "confidence_score": 0-100,
  "why": [...],
  "next_actions": [...],
  "kill_conditions": [...]
}
```

⬇️

---

## 8️⃣ Report Generation Agent (SIDE EFFECT ONLY)

### Agent: `report_generator`

**Purpose**

* Convert structured decision → UI + PDF

**Formats**

* Executive summary
* Market landscape
* Trend rationale
* Market gap
* Risks
* Validation roadmap

⚠️ This agent **never influences logic**

---

## 9️⃣ Persistence Layer

Saved to:

* PostgreSQL → report + metadata
* Object storage → PDF
* Vector DB → embeddings

---

# 🔒 Design Principles (Why This Works)

1. **No agent talks sideways**
2. **One critic, one decision**
3. **Memory is passive**
4. **Parallel only where safe**
5. **UI never controls agents**

This is why it feels:

* Calm
* Trustworthy
* “Consultant-grade”

---

# 🧠 Mental Model (Explain in Interviews)

> “It’s a deterministic agent graph with a single entry, parallel research, enforced synthesis, adversarial critique, and a final decision authority. No chat loops, no agent democracy.”

That line alone is 🔥.

---


