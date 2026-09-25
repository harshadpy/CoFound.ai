# CoFound.ai — Product & UI Architecture Overview

> **Document Purpose**: A concise reference summarizing the product definition, current UI/UX design language, page structure, and future advancement paths.

---

## 1. What CoFound.ai Is

**CoFound.ai** is an autonomous market intelligence and pre-seed validation platform. It transforms raw, unstructured founder thoughts (e.g. voice notes, messy pitch snippets, half-baked hypotheses) into an institutional-grade investment committee diligence report in under 3 minutes.

### Core Value Proposition:
- **No Chat Loops or Hallucinations**: Uses a deterministic 11-agent DAG (LangGraph) rather than free-form conversational chatbots.
- **Real-Time Web Grounding**: Live search via Tavily AI and DuckDuckGo cross-referenced against raw web snippets.
- **Geographic Awareness**: Tailors market sizing, competitor identification (local HQs), and distribution strategies to the target country (e.g., India vs. US/Global).
- **Adversarial Stress-Testing**: An independent **Critic Agent** acts like a skeptical Tier-1 VC partner, hunting for fatal flaws and penalizing unearned confidence.
- **Institutional Verdict**: Delivers a definitive, unvarnished **GO**, **PIVOT**, or **KILL** recommendation with kill conditions.

---

## 2. Technical Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 7, TailwindCSS v3, Zustand (state & persistence), Lucide React (icons), Framer Motion |
| **Backend** | Python 3.12, FastAPI, LangGraph (DAG orchestration), LangChain, Pydantic v2, Structlog |
| **Database** | SQLite (`data/cofound.db`) via SQLAlchemy ORM |
| **Telemetry & Stream** | Server-Sent Events (SSE) for live agent progress + LangSmith tracing (`cofound` project) |
| **Research Tools** | Tavily AI Search (primary) with automated fallback to DuckDuckGo (`ddgs`) |
| **Models** | OpenAI `gpt-4o-mini` (fast nodes) & `o1-mini` (reasoning) |

---

## 3. UI/UX Design System & Aesthetic

The application is built with a **Modern Analyst-Grade / High-Velocity SaaS** aesthetic, balancing the calm trustworthiness of financial research terminals (e.g., Google Stitch, PitchBook) with the sleek micro-interactions of developer tools (e.g., Linear, Raycast).

### 3.1 Color Palette & Semantics
- **Brand Primary**: Electric Blue / Indigo gradient (`#2563eb` &rarr; `#4f46e5`), conveying intelligence and speed.
- **Surface Neutrals**:
  - *Light Mode*: Crisp whites (`#ffffff`), subtle cool-slate borders (`#e2e8f0`), and soft slate backdrops (`#f8fafc`).
  - *Dark Mode*: Deep slate (`#0f172a` canvas, `#1e293b` cards, `#334155` borders).
- **Decision & Status Colors**:
  - **GO (Emerald)**: `#10b981` / `#059669` &mdash; High conviction, strong tailwinds.
  - **PIVOT (Amber)**: `#f59e0b` / `#d97706` &mdash; Validated pain point, flawed initial wedge.
  - **KILL (Rose / Red)**: `#ef4444` / `#dc2626` &mdash; Entrenched moats, fatal flaws, prohibitive acquisition costs.
  - **Synthesis / Intelligence (Violet)**: `#8b5cf6` &mdash; Strategic aggregation.

### 3.2 Typography & Hierarchy
- **Primary Typeface**: Clean modern sans-serif (`Inter`, system fallback).
- **Hierarchy Scale**:
  - Hero display titles: `text-6xl font-extrabold tracking-tight`
  - Page & card headers: `text-xl` to `text-2xl font-bold`
  - Badges & meta indicators: `text-[10px]` to `text-xs font-semibold tracking-widest uppercase`
  - Body & analysis text: `text-sm` to `text-base text-slate-600 dark:text-slate-300 leading-relaxed`

### 3.3 Key UI Components
- **Input Canvas**: Large, borderless textarea card with subtle glassmorphism backdrop and hover elevation.
- **Context Tag Pills**: Interactive category chips (`Industry`, `Geography`, `User Segment`) with auto-commit on submit, inline remove buttons, and market-focus icons.
- **Live Agent Timeline**: Visual vertical and grid cards tracking running/completed agents with animated pulse dots and live real-time metrics (e.g., *"CAGR: +24%"*, *"5 Indian rivals discovered"*).
- **Executive Report Layout**:
  - Top verdict banner with confidence gauge and badge.
  - Horizontal tabbed navigation for rapid section switching.
  - Interactive competitor comparison table with verified domains and headquarters location badges.
  - Structured alternative wedge cards and contingency pivot recommendations.
- **Export System**: Dual-mode export including an in-browser multi-page print portal and instant Markdown (`.md`) download.

---

## 4. Current App Pages & Structure

```
frontend/src/
├── pages/
│   ├── Home.jsx              # Idea entry canvas, interactive filters & curated startup hypotheses
│   ├── ActiveAnalysis.jsx    # Real-time SSE live execution timeline & telemetry stream
│   ├── Report.jsx            # Multi-section intelligence dossier, print portal & MD export
│   ├── AnalysisHistory.jsx   # Searchable archive of past analyses with verdict filters & deletion
│   ├── Ideas.jsx             # Inspiration library with categorized hypotheses and 1-click loading
│   ├── TrendExplorer.jsx     # Keyword momentum explorer (manual tool)
│   ├── CompetitorResearch.jsx# Rival teardown tool (manual tool)
│   └── MarketGaps.jsx        # Opportunity matrix mapping (manual tool)
├── components/
│   └── layout/
│       ├── Sidebar.jsx       # Collapsible left navigation bar with dark mode & profile
│       └── Header.jsx        # Breadcrumbs, search bar hint & notifications
└── store/
    └── useStore.js           # Central Zustand store (persistent session, SSE streaming & tags)
```

---

## 5. Upcoming UI & Product Advancements (Roadmap)

As the application advances, the following UI and feature expansions are planned:

1. **Interactive Data Visualizations**:
   - Radar charts comparing competitor features vs. user concept.
   - 2x2 Market Gap Matrix with drag-and-drop opportunity coordinates.
2. **Multi-Idea Portfolio Matrix**:
   - Compare and rank 3 to 5 startup hypotheses side-by-side in a comparative scorecard.
3. **White-Label Investor PDF Generator**:
   - Export styled branded PDF decks with customizable VC/accelerator logos and executive tear sheets.
4. **Interactive Drill-Down Sidebars**:
   - Click any competitor to open a flyout drawer showing scraped pricing tiers, customer reviews, and web citations.
5. **Search Result & Vector Caching**:
   - SQLite/Redis caching layer for Tavily search queries to accelerate repeat analyses.
