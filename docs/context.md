# CoFound.ai — Project State & Context Memory

> **Notice for AI Assistant**: Read this file first when continuing work or after context reset. Keep this file updated before context limits are reached or after completing major milestones.

---

## 1. Project Overview
- **Product Name**: CoFound.ai (Autonomous Market Intelligence Agent)
- **Core Value Proposition**: Turns unstructured founder thoughts into an end-to-end market intelligence report using an 11-agent LangGraph pipeline.
- **Key Principle**: *User triggers → Agents research in parallel → System synthesizes & critiques → Decision delivered (Go / Pivot / Kill)*.

---

## 2. Technical Stack
- **Backend**: Python 3.12, FastAPI, LangGraph (DAG execution), LangChain, Pydantic v2, Structlog.
- **Frontend**: React 19, Vite 7, TailwindCSS v3, Zustand (state & session persistence), Lucide icons, Framer Motion.
- **AI Models**: OpenAI (`gpt-4o-mini` for fast nodes, `o1-mini` for reasoning).
- **Search Engine**: **Tavily AI Search** (primary, real-time web research) with automated fallback to **DuckDuckGo** (`ddgs`).
- **Observability**: **LangSmith** (fully configured under project `cofound`, endpoint `https://api.smith.langchain.com`).
- **Environment**: Virtualenv at `.\venv`, activated with `.\venv\Scripts\Activate.ps1`.

---

## 3. Current Work & Recent Milestones

### Completed in Recent Sessions:
1. **Repository & Workspace Cleanup**:
   - Deleted `.obsidian/` metadata folders from root and `agents/`.
   - Added `.obsidian/` to `.gitignore`.
   - Removed loose root screenshot images and stray test scripts (`ddgs.py`, empty root `package-lock.json`).

2. **Virtual Environment & Dependencies**:
   - Created `venv` and installed all requirements.
   - Resolved IDE linter issues by installing `beautifulsoup4`, `requests`, `tavily-python`, and `ddgs` directly into `.\venv`.
   - Updated `requirements.txt` with all active dependencies.

3. **LangSmith Observability Layer**:
   - Created `observability/tracing.py`: exports `LANGCHAIN_TRACING_V2`, `LANGCHAIN_API_KEY`, `LANGCHAIN_PROJECT` (`cofound`), and builds execution `RunnableConfig` tagged by `analysis_id`.
   - Created `observability/logging.py`: structured event logger linking agent runs to analysis IDs.
   - Integrated with `api/main.py`: `graph_app.astream(initial_state, config=run_config)` traces the full 11-agent LangGraph workflow.

4. **Real-Time Search Agent Upgrades (Tavily)**:
   - Updated `tools/search.py`: `RealtimeSearchService` queries Tavily for rich, clean citation snippets; lazily loads DuckDuckGo as an automatic fallback if Tavily is unavailable.
   - Enhanced `agents/competitor_analysis/agent.py`: query parsing fix (splitlines) and rich competitor extraction.
   - Enhanced `agents/trend_intelligence/agent.py`: clean query formatting for market sizing & CAGR.
   - Enhanced `agents/market_validation/agent.py`: replaced purely simulated data with real-time web & forum search for genuine user complaints and pain points before synthesis.
   - Created and verified `tests/test_tavily_langsmith.py`: end-to-end execution confirmed working with OpenAI, Tavily, and LangSmith.

5. **LangGraph Architecture & Critic Guardrail**:
   - Re-architected `agents/graph.py` DAG topology: `structure` -> 6 parallel research nodes -> `synthesis` -> `critic` (Phase 4 Guardrail) -> `decision` (Phase 5 Authority) -> `report` -> `END`.
   - Upgraded `agents/critic/agent.py`: receives both synthesis and research dossier, calculates adversarial `confidence_penalty` (-5 to -35 pts), `fatal_flaws`, and `challenged_assumptions`.
   - Upgraded `agents/decision/agent.py`: receives both synthesis and critic results, factoring in the penalty to produce an institutional Go / Pivot / Kill verdict.
   - Upgraded `agents/report_generation/agent.py` to embed fatal flaws, assumptions, and kill conditions in the final report.

6. **SQLite Persistence Layer**:
   - Created `data/database.py` with SQLAlchemy: models `AnalysisRecord` table tracking ID, input, tags, progress, agent metrics, and complete results.
   - Connected `api/main.py` directly to SQLite: all runs, statuses, and reports persist permanently across restarts.
   - Added `GET /api/analyses` endpoint to list past runs.

7. **Real-Time Live Telemetry & SSE Streaming**:
   - Added Server-Sent Events endpoint `GET /api/analysis/{analysis_id}/stream` in `api/main.py`.
   - Updated `frontend/src/store/useStore.js` and `frontend/src/pages/ActiveAnalysis.jsx` to stream node progress and live agent metrics ("CAGR: +24%", "Identified 4 rivals", etc.) in real time with polling fallback.
   - Successfully verified frontend production build (`npm run build`).

8. **Professional Report Export**:
   - Fixed print portal rendering in `frontend/src/pages/Report.jsx`: full consultant-grade multi-page document rendered with cover page, idea title, sector, decision badges, competitor table, kill conditions, and critic red flags.
   - Added direct **Download Markdown (`.md`)** action button in report header.

9. **Past Analyses & History UI**:
   - Created `frontend/src/pages/AnalysisHistory.jsx` (`/history`): search, filter by GO/PIVOT/KILL verdict, open past report, iterate prompt, and delete run.
   - Added "Past Analyses" link with `History` icon to `frontend/src/components/layout/Sidebar.jsx`.
   - Added `delete_analysis` in `data/database.py` and `DELETE /api/analyses/{id}` in `api/main.py`.

10. **Grounding & Hallucination Guardrails**:
   - Created `guardrails/hallucination_checks.py`: cross-checks extracted competitor names, domains, and claims against raw search text from Tavily/DDG.
   - Connected to `agents/competitor_analysis/agent.py` to flag ungrounded competitors and synthetic domains.
   - Refactored grounding evaluation into functional helper `evaluate_competitors` with explicit non-zero divisor protection (`max(total_evaluated, 1)`), eliminating static analyzer warnings.
   - Verified via `tests/test_tier1.py` and `tests/test_features_integration.py`.

11. **Geographic Localization & Business Suggestions Overhaul**:
   - **Filter Input Persistence**: Added auto-commit on filter inputs (`Home.jsx`), interactive `+` buttons, and `setContextTags` store integration so that text typed into Geography (e.g. "India"), Industry, or Segment is captured even if Enter is not pressed.
   - **Thought Structuring**: Updated `ThoughtStructure` to extract and strictly preserve `target_geography` from both `context_tags` and raw text.
   - **Geographic Competitor Discovery**: Injected target geography into query generation and synthesis in `agents/competitor_analysis/agent.py`, requiring local headquarters (HQ) and region-specific competitors (e.g. Delhi, Bengaluru, Mumbai, Pune, Chennai when "India" is selected instead of defaulting to US giants).
   - **Trend & Market Validation Localization**: Localized search queries in `trend_intelligence` and `market_validation`.
   - **Investor-Grade Business Suggestions**: Upgraded "Curated Startup Hypotheses" in `Home.jsx` and the full library in `Ideas.jsx` (`/ideas`) with high-conviction, categorized startup hypotheses that pre-populate hypothesis, sector, geography, and segment tags.
   - **Ideation Agent Upgrade**: Updated `agents/ideation/agent.py` and `Report.jsx` to generate structured variations with initial wedge, monetization model, and contingency pivots tailored to the target geography.
   - Verified via `tests/test_geography_suggestions.py` and frontend production build.

12. **UI Modernization — Phase 1 (Foundation)**:
   - **Shared UI component library** created in `frontend/src/components/ui/`:
     - `Button.jsx`: 4 variants (primary / secondary / ghost / destructive), 4 sizes, consistent focus-visible + disabled states.
     - `Card.jsx` + sub-exports (CardHeader, CardTitle, CardDescription, CardContent, CardFooter): compact / roomy density, optional interactive hover mode.
     - `Badge.jsx`: semantic variants — default, muted, go (emerald), pivot (amber), kill (rose), violet — all with dark-mode-aware pairs.
     - `EmptyState.jsx`: icon + title + description + optional action button.
     - `ErrorBanner.jsx`: uses `destructive` token, optional Retry button.
     - `index.js`: barrel export for clean imports.
   - **Responsive app shell** fully rewritten (spec §16):
     - `Layout.jsx`: uses `md:ml-14 lg:ml-64` to accommodate rail/full sidebar at each breakpoint.
     - `Sidebar.jsx`: three modes — full (≥1024px), icon-only rail (768–1023px), off-canvas drawer (<768px) with scrim + close button.
     - `Header.jsx`: hamburger button (mobile only, toggles `sidebarOpen` from store), `aria-label` on all icon buttons, `aria-current="page"` on breadcrumb last segment, `pointer-events-none` replaced with semantic approach.
   - **Zustand store**: added `sidebarOpen` + `toggleSidebarOpen` + `closeSidebar` for mobile drawer state.
   - **index.css cleanup**: retired `card-hover` lift transform (border/shadow only now), wrapped `pulse-dot`, `shimmer`, `animate-fade-in-up` in `prefers-reduced-motion: no-preference` guards.
   - Build verified: `npm run build` passes, 1739 modules, 0 errors.
   - **Next**: Phase 2 — migrate `Report.jsx` off inline styles onto shared components + full dark-mode support.

13. **UI Modernization — Phase 2 (Report.jsx migration)**:
   - Fully rewrote `frontend/src/pages/Report.jsx` (70KB → 54KB): zero inline `style={{}}` for static values.
   - All section renderers (Decision, Summary, Metrics, Competitors, Trends, Validation, Critic, Ideation) migrated to Tailwind token classes.
   - **Dark mode now works on every section**: used semantic dark pairs (`bg-emerald-950/40`, `dark:text-emerald-300`, `dark:border-emerald-800`) for GO/PIVOT/KILL; `bg-card`, `text-foreground`, `text-muted-foreground` replace every hardcoded hex.
   - **Shared components adopted**: `Button` (all 4 action buttons in header), `Badge` (verdict chips, saturation scores, funding pills), imported via `../components/ui`.
    - Fully rewrote `frontend/src/pages/Report.jsx` (70KB → 54KB): zero inline `style={{}}` for static values.
    - All section renderers (Decision, Summary, Metrics, Competitors, Trends, Validation, Critic, Ideation) migrated to Tailwind token classes.
    - **Dark mode now works on every section**: used semantic dark pairs (`bg-emerald-950/40`, `dark:text-emerald-300`, `dark:border-emerald-800`) for GO/PIVOT/KILL; `bg-card`, `text-foreground`, `text-muted-foreground` replace every hardcoded hex.
    - **Shared components adopted**: `Button` (all 4 action buttons in header), `Badge` (verdict chips, saturation scores, funding pills), imported via `../components/ui`.
    - **Hover transforms removed** from StatCard, CompetitorCard, TrendCard, IdeationCard — replaced with Tailwind `hover:shadow-md hover:border-primary/30` color-only transitions.
    - **Section nav** rebuilt as proper `role="tablist"` with `aria-selected` and focus-visible rings.
    - **Progress dots** in bottom nav rebuilt with accessible `role="tab"` + `aria-label`.
    - **SectionNav tabs** now horizontally scrollable with `overflow-x-auto scrollbar-hide` for mobile.
    - **StatCard** ghost icon — only the dynamic `color` is still inline (data-driven per spec §18).
    - **Print portal** preserved intact (separate `@media print` CSS block for PDF export).
    - Build verified: `npm run build` passes, 1745 modules, 0 errors.

14. **UI Modernization — Phases 3–5 (Polish, States & Cleanup)**:
    - Phase 3: Large-surface gradients removed across all pages; hover lift transforms replaced with border/shadow glow transitions; comprehensive `focus-visible:ring-2` rings added; full ARIA audit (roles, labels, states).
    - Phase 4: Accessible `<EmptyState>` across all 6 listing/tool views; `<ErrorBanner>` with retry actions; app-wide `<ToastProvider>` integrated into App.jsx for immediate tactile feedback.
    - Phase 5: Cleaned up unused CSS and safeguarded all animations behind `prefers-reduced-motion`.

15. **Dark Mode Readability & Enhanced Parallax Upgrades (Phase 6)**:
    - Elevated `--card` in `frontend/src/index.css` from `222.2 84% 4.9%` (which blended into background) to `222.2 42% 11%`, with `--background: 222.2 47% 6.5%`, `--border: 217.2 30% 20%`, and brightened `--muted-foreground: 215 25% 72%`.
    - Fixed Executive Summary in `Report.jsx`: replaced dark cyan-on-navy with elevated `bg-blue-50/70 dark:bg-slate-800/80` and crisp `text-slate-900 dark:text-slate-100` with high-contrast primary border accent.
    - Replaced low-contrast text in Trends, Market Growth/CAGR, Critic Fatal Flaws, and Alternative Wedges.
    - Built an enhanced multi-depth parallax system in `Home.jsx`: ambient counter-directional radial glow orb (±45px X, ±35px Y), multi-plane spring layers (badge, headline, subtitle), and 3D card tilt (`perspective: 1200px`).
    - Created interactive `TiltExampleCard` component with dynamic 3D mouse tracking (±7deg tilt, scale 1.025, spring physics) for Curated Startup Hypotheses.
    - Build verified: `npm run build` completed cleanly with 0 errors.

16. **Backend Upgrades — Caching Layer, API Modularization & GPT-5.6-Luna (Phase 7)**:
    - **OpenAI Model Upgrade**: Configured `model_fast` and `model_reasoning` to `gpt-5.6-luna` in `config/config.py` with automated fallback to `gpt-4o-mini`.
    - **SQLite Caching Engine (`data/cache.py`)**: Persistent SQLite cache (`cache_entries` table in `cofound.db`) with SHA-256 keys, namespace filtering, human-readable query previews, and automatic TTL expiration.
    - **Search Cache Integration (`tools/search.py`)**: Web search queries in `RealtimeSearchService` check SQLite cache before calling Tavily or DuckDuckGo. Identical/iterating search queries resolve in under 3ms without expending Tavily credits.
    - **API Modularization with FastAPI `APIRouter`**:
      - `api/routes/analysis.py`: Lifecycle, status polling, SSE telemetry streaming, and SQLite persistence.
      - `api/routes/tools.py`: Standalone research agent endpoints (`trends`, `competitors`, `market-gaps`, `brainstorm`).
      - `api/routes/insights.py`: Catalog feeds, cache metrics (`GET /api/cache/stats`), and cache purge.
      - `api/main.py`: Slimmed down from a 432-line monolith to an orchestrator mounting domain routers.
    - Verified via `tests/test_backend_upgrades.py`: All 4 test suites passed with 100% success.

17. **Practical Research Tools & Saved Insights Notebook (Phase 8)**:
    - **Workflow Bridge to Swarm ("Launch Swarm Report")**: Connected standalone research tools (`/trends`, `/competitors`, `/market-gaps`) and the library (`/saved`) directly to the 11-agent autonomous pipeline. Clicking "Launch Swarm Report" pre-populates the hypothesis input and tags on `/` and smoothly navigates to initiate an evaluation.
    - **Curated One-Click Hypothesis Presets**: Added high-conviction clickable chip presets on all research tools to eliminate blank-page friction.
    - **Instant Founder Export Tools**: Added "Copy Markdown" to all research and insight cards (clipboard integration with toast feedback) and a one-click "Export All (.MD)" founder dossier generator on `/saved`.
    - **Interactive Founder Notebook (`SavedInsights.jsx`)**: Added real-time full-text search filtering and editable, auto-persisted founder memos on every card via `updateInsightNote` in Zustand.
    - **Sidebar Intelligence (`Sidebar.jsx`)**: Added real-time counter pill badge on "Saved Insights" and active indicator dots on research tools when results are present in memory.
18. **Research Tools UI Modernization (Phase 9)**:
    - **Visual Growth & Velocity Gauges (`TrendExplorer.jsx`)**: Added animated TAM progress bar, high-velocity CAGR indicator with directional vectors, segmented 4-stage adoption lifecycle timeline (Emerging -> Mass Adoption), and numbered catalyst cards.
    - **Segmented Saturation Bar & Filter Tabs (`CompetitorResearch.jsx`)**: Built 10-bar visual saturation meter with status pill (Red Ocean / Crowded / White Space) and instant client-side tabs (`All Rivals`, `Direct Competitors`, `Indirect & Adjacent`) with strengths & vulnerabilities comparison cards.
    - **Quantified Pain Severity Meters & WTP Badges (`MarketGaps.jsx`)**: Added dynamic 10-point pain severity progress bars, confirmed WTP tier badges, and signal filter tabs (`All Signals`, `Critical Pain (≥7/10)`, `Confirmed WTP`).
    - **Complete Redesign of Idea Brainstorming (`IdeaBrainstorming.jsx`)**: Rebuilt with design system tokens, 4 one-click startup presets, two-column variation cards showing Initial Wedge and Monetization model, strategic contingency pivot cards with `Pivot Swarm` bridges, and clipboard copy.
    - Verified with `npm run build` (0 errors) and browser subagent end-to-end testing across all 4 research tools.

19. **First-Time User Experience & How to Use Modal (Phase 10)**:
    - **Top-Level Zero-Scroll Sidebar Button (`Sidebar.jsx`)**: Positioned directly beneath the logo at the top of the sidebar navigation with a distinct gradient border and `GUIDE` badge. Visible across desktop, tablet, and mobile with zero scrolling required.
    - **Interactive How to Use Modal (`HowToUseModal.jsx`)**: Comprehensive 3-workflow guide modal explaining:
      1. *Direct 11-Agent Swarm Analysis* (seed idea directly on Home)
      2. *Research-First Discovery* (`/trends` -> `/competitors` -> `/market-gaps` -> Swarm Report)
      3. *Brainstorm & Pivot Exploration* (`/brainstorm` -> expanded wedges -> contingency pivots -> Swarm Report)
      Includes dynamic step timeline, direct workflow launch buttons, and architectural callouts (Adversarial Critic Gate, 11 parallel agents, Dossier export).
    - **First-Time Founder Toast & Hero Pill**: Mounted in `Home.jsx` via `useToast` with `localStorage` memory (`cofound_has_seen_guide`), plus a quick-launch pill next to the hero badge.
    - Verified with `npm run build` and browser subagent testing.

20. **Supabase Cloud Database & Full Backend Persistence (Phase 11)**:
    - **Active Supabase Project Connection**: Connected via Supabase MCP to project `szodeslkalqedrbmwqks` (`https://szodeslkalqedrbmwqks.supabase.co`).
    - **PostgreSQL Schema**: Migrated 5 core tables (`users`, `analyses`, `saved_insights`, `notifications`, `shared_reports`) with RLS enabled.
    - **Dual-Layer Architecture**: Created `data/supabase_client.py` as primary cloud persistence with local SQLite resilience.
    - **FastAPI Endpoints**:
      - `api/routes/user.py`: Account profile, plan tier management, and BYOK custom API keys (`openai`, `tavily`, `gemini`, `anthropic`).
      - `api/routes/notifications.py`: Event-driven notifications feed and mark read operations.
      - `api/routes/share.py`: Public report permalinks (`/share/:token`) with view counting.
      - `api/routes/copilot.py`: AI Strategic Copilot grounded on active analysis dossiers.
      - `api/routes/analysis.py`: Automatically synchronizes completed analyses and dispatches real-time Supabase notifications.
    - **Frontend Components**:
      - `SettingsModal.jsx`: Cloud Account, BYOK Keys, and Plan Tier switcher.
      - `CopilotDrawer.jsx`: Slide-over AI Strategic Advisor.
      - `SharedReport.jsx`: Public view for `/share/:token`.
      - `Header.jsx`: Live notification feed with unread count badge + Copilot trigger button.
      - `Sidebar.jsx`: Live user card opening Cloud Settings.
      - `Report.jsx`: Real public permalink generator.
    - **Verification**: 5/5 tests passed in `tests/test_supabase_integration.py` (100% OK), `npm run build` succeeded with 0 errors, and browser subagent verified all UI components with screenshots and video.

---

## 4. Pending Features & Technical Debt Roadmap

| Priority | Area | Task Description | Status |
|---|---|---|---|
| **P1** | **API Modularization** | Move routes from `api/main.py` into dedicated routers under `api/routes/` (`analysis.py`, `tools.py`). | **Completed** |
| **P2** | **Search Query Caching** | Implement cache layer (Redis or SQLite cache) for web search results to avoid repeated Tavily credit usage. | **Completed** |
| **P1** | **Auth & Session Persistence** | Multi-user login/registration via Supabase, session persistence, and isolated analysis execution. | **Completed** |
| **P3** | **Vector Memory** | Connect Qdrant or local vector store in `data/memory/` for empirical startup failure/success patterns. | Planned |
| **P4** | **Google Trends Quantitative Scraper** | Fetch quantitative time-series data for interest-over-time graphs. | Planned |
| **P5** | **Multi-Idea Portfolio Comparison** | Batch test and rank 3-5 startup ideas simultaneously in a comparison matrix. | Roadmap |

---

## 5. How to Run the Application

### Backend (FastAPI):
```powershell
.\venv\Scripts\Activate.ps1
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Docs: `http://localhost:8000/docs`

### Frontend (React + Vite):
```powershell
cd frontend
npm run dev
```
- App UI: `http://localhost:5173`

---

## 6. Maintenance Guidelines
Whenever completing tasks or when the conversation context approaches limits:
1. Update Section 3 (Completed Work) with what was changed and verified.
2. Update Section 4 (Pending Features & Roadmap) to mark completed tasks and reflect new priorities.
3. Keep the file concise, dense with actionable facts, and free of unnecessary fluff.
