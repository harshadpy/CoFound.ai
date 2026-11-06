# 🌐 CoFound.ai Production Deployment Guide

This guide provides end-to-end instructions for deploying **CoFound.ai** to production environments. Whether you prefer a single-command unified container, a decoupled cloud architecture (e.g. Netlify/Vercel + Render/Railway), or a self-hosted Linux VPS with Nginx, this document details every configuration, environment variable, and operational best practice.

---

## 📑 Table of Contents

1. [Architectural Topologies](#1-architectural-topologies)
2. [Environment Variables Reference](#2-environment-variables-reference)
3. [Database & Supabase Setup](#3-database--supabase-setup)
4. [Deployment Path A: 1-Click Render.com Blueprint](#4-deployment-path-a-1-click-rendercom-blueprint)
5. [Deployment Path B: Production Docker & Docker Compose](#5-deployment-path-b-production-docker--docker-compose)
6. [Deployment Path C: Decoupled (Vercel / Netlify + Backend PaaS)](#6-deployment-path-c-decoupled-vercel--netlify--backend-paas)
7. [Deployment Path D: Bare-Metal / Ubuntu Linux VPS](#7-deployment-path-d-bare-metal--ubuntu-linux-vps)
8. [Critical Production Tuning for Agent Swarms & SSE](#8-critical-production-tuning-for-agent-swarms--sse)
9. [Post-Deployment Verification & Smoke Tests](#9-post-deployment-verification--smoke-tests)
10. [Troubleshooting & FAQ](#10-troubleshooting--faq)

---

## 1. Architectural Topologies

CoFound.ai consists of two core tiers:
- **Backend API & Agent Orchestration:** FastAPI application running an 11-agent LangGraph state machine, real-time Server-Sent Events (SSE) telemetry, SQLite local persistence, and Supabase cloud synchronization.
- **Frontend Client:** React 19 single-page application built with Vite, Tailwind CSS, Zustand, and Three.js.

Choose the deployment model that best fits your infrastructure:

```
[ Topology 1: Unified Single Container ]
Browser ──► [ Nginx / Docker Container : Port 8000 ]
             ├── /api/*   ──► FastAPI + 11-Agent Graph
             └── /*       ──► React SPA (Static /dist)

[ Topology 2: Decoupled Cloud PaaS ]
Browser ──► Netlify / Vercel (Edge CDN)
             │   ├── /*       ──► React SPA
             │   └── /api/*   ──► Reverse Proxy / Rewrite
             │
             ▼
      Render / Railway / Fly.io (Python Web Service)
             └── FastAPI + LangGraph + SSE Stream
             │
             ▼
      Supabase PostgreSQL + OpenAI + Tavily AI
```

| Topology | Best For | Complexity | Cost |
|---|---|---|---|
| **Render Blueprint** | Quickest managed setup, zero devops overhead | Low | Free / ~$7/mo |
| **Unified Docker** | Self-hosted VPS, AWS EC2, DigitalOcean, GCP Cloud Run | Low-Medium | ~$5–$12/mo |
| **Decoupled (Vercel + PaaS)** | Global edge CDN for UI, isolated backend compute | Medium | Free tier available |
| **Ubuntu VPS + Nginx** | Complete data sovereignty, custom SSL, lowest long-term cost | Medium-High | ~$5–$10/mo |

---

## 2. Environment Variables Reference

Configure these variables in your deployment dashboard, `.env` file, or container orchestrator:

### Core LLM & Agent Swarm (Required)

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | **Yes** | — | OpenAI API key with access to `gpt-4o` and `gpt-4o-mini`. Required for agent reasoning, critique, and synthesis. |
| `MODEL_PRIMARY` | No | `gpt-4o` | Primary reasoning model used by Critic, Decision Authority, and Synthesizer agents. |
| `MODEL_FAST` | No | `gpt-4o-mini` | High-throughput model used for ideation, hypothesis extraction, and structuring. |

### Real-Time Live Web Intelligence (Recommended)

| Variable | Required | Default | Description |
|---|---|---|---|
| `TAVILY_API_KEY` | Recommended | — | Tavily AI Search API key for high-speed live web search, competitor analysis, and market data retrieval. Falls back to DuckDuckGo search if omitted. |

### Supabase Cloud Sync & Public Reports (Optional)

| Variable | Required | Default | Description |
|---|---|---|---|
| `SUPABASE_URL` | Optional | — | Your Supabase project URL (e.g., `https://your-project.supabase.co`). Enables cross-device sync, BYOK key vault, and public report permalinks. |
| `SUPABASE_ANON_KEY` | Optional | — | Supabase `anon` public key for client-safe operations. |
| `SUPABASE_PUBLISHABLE_KEY` | Optional | — | Supabase publishable key for public sharing. |

### LangSmith & Observability (Optional)

| Variable | Required | Default | Description |
|---|---|---|---|
| `LANGSMITH_API_KEY` | Optional | — | API key for LangChain LangSmith tracing. |
| `LANGSMITH_TRACING` | Optional | `false` | Set to `true` to enable execution tracing in LangSmith. |
| `LANGSMITH_PROJECT` | Optional | `cofound` | Project name in the LangSmith dashboard. |
| `LANGSMITH_ENDPOINT` | Optional | `https://api.smith.langchain.com` | LangSmith API endpoint. |

---

## 3. Database & Supabase Setup

CoFound.ai uses a resilient **dual-persistence model**:
- **Local SQLite (`data/cofound.db`):** Always active, zero-config, records all analysis sessions, cached research responses, and local states.
- **Supabase PostgreSQL:** Seamlessly enhances the app when credentials are provided, enabling user profiles, custom BYOK API keys, real-time alerts, and public report sharing (`/share/:token`).

### Initializing the Supabase Database

1. Create a free account at [supabase.com](https://supabase.com) and create a new project.
2. In your Supabase project dashboard, navigate to **SQL Editor** -> **New query**.
3. Copy the complete contents of [`infra/supabase_schema.sql`](file:///c:/Users/Jarvis/Downloads/cofound/infra/supabase_schema.sql) and paste into the editor.
4. Click **Run**. This automatically creates:
   - `users`: User profiles, subscription tier, and encrypted custom API keys.
   - `analyses`: Multi-agent report outputs and execution states.
   - `saved_insights`: Founder bookmark catalog and strategic notes.
   - `notifications`: Real-time execution completion and warning alerts.
   - `shared_reports`: Public permalink records and view tracking.
   - Necessary performance indexes and Row Level Security (RLS) policies.
5. In **Project Settings** -> **API**, copy:
   - **Project URL** -> `SUPABASE_URL`
   - **Project API Keys (`anon` / `public`)** -> `SUPABASE_ANON_KEY`

---

## 4. Deployment Path A: 1-Click Render.com Blueprint

Render is the simplest way to deploy CoFound.ai with native background task execution and HTTP streaming support.

### Step-by-Step Instructions

1. Push your repository to GitHub or GitLab.
2. Log in to [Render.com](https://render.com) and click **Blueprints** -> **New Blueprint Instance**.
3. Select your `cofound` repository. Render will automatically detect [`render.yaml`](file:///c:/Users/Jarvis/Downloads/cofound/render.yaml).
4. Render will configure:
   - **`cofound-api` Web Service:** Python 3.11, runs `uvicorn api.main:app --host 0.0.0.0 --port $PORT --workers 1` with health checks pointing to `/api/health`.
   - **`cofound-ui` Static Site (Optional):** Builds Vite React SPA from `frontend/` and configures automatic API routing rewrites.
5. In the Render Environment Variables prompt, fill in:
   - `OPENAI_API_KEY`: Your OpenAI secret key.
   - `TAVILY_API_KEY`: Your Tavily search key.
   - `SUPABASE_URL` & `SUPABASE_ANON_KEY`: (Optional) Your Supabase credentials.
6. Click **Apply Blueprint**. Deployment will finish in approximately 2–3 minutes.

> [!NOTE]
> If you deploy **only** the `cofound-api` web service using the single-container mode (or build the frontend into `frontend/dist`), the FastAPI backend will automatically serve both the React frontend and all API endpoints from a single URL!

---

## 5. Deployment Path B: Production Docker & Docker Compose

A unified multi-stage [`Dockerfile`](file:///c:/Users/Jarvis/Downloads/cofound/Dockerfile) compiles the React frontend bundle with Node.js and packages it alongside the FastAPI backend in a lightweight Python 3.11 container.

### Fast Run with Docker Compose

1. Clone repository on your host machine:
   ```bash
   git clone https://github.com/harshadpy/cofound.git
   cd cofound
   ```

2. Create your `.env` file from the reference:
   ```bash
   cp .env.example .env   # Or create .env with OPENAI_API_KEY
   ```

3. Launch the container stack:
   ```bash
   docker compose up -d --build
   ```

4. Verify status and container health:
   ```bash
   docker compose ps
   curl -i http://localhost:8000/api/health
   ```

5. Access the live platform at `http://localhost:8000`.

### Manual Docker Build

```bash
# Build multi-stage image
docker build -t cofound:latest .

# Run container with data volume mount
docker run -d \
  --name cofound-app \
  -p 8000:8000 \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  cofound:latest
```

> [!TIP]
> The volume mount `-v $(pwd)/data:/app/data` ensures your SQLite history (`cofound.db`) and markdown dossiers persist across container restarts or image upgrades.

---

## 6. Deployment Path C: Decoupled (Vercel / Netlify + Backend PaaS)

In this decoupled model, the static React UI is deployed to high-performance edge CDNs (Vercel or Netlify), and all `/api/*` traffic is transparently proxied to your backend service (e.g. on Render, Railway, or Fly.io).

### Option 1: Netlify

The repository includes a ready-to-use [`netlify.toml`](file:///c:/Users/Jarvis/Downloads/cofound/netlify.toml).

1. Open [`netlify.toml`](file:///c:/Users/Jarvis/Downloads/cofound/netlify.toml) and update the redirect destination with your deployed backend URL:
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://your-backend-service.onrender.com/api/:splat"
     status = 200
     force = true
   ```
2. In Netlify Dashboard:
   - Click **Add new site** -> **Import an existing project**.
   - Select your Git repository.
   - Netlify will automatically detect settings: Base directory `frontend`, Publish directory `dist`, Build command `npm run build`.
3. Click **Deploy Site**.

### Option 2: Vercel

The repository includes a pre-configured [`vercel.json`](file:///c:/Users/Jarvis/Downloads/cofound/vercel.json).

1. Edit [`vercel.json`](file:///c:/Users/Jarvis/Downloads/cofound/vercel.json) to point to your live backend:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://your-backend-service.onrender.com/api/:path*"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
2. In Vercel Dashboard:
   - Click **Add New Project** and import the repository.
   - Set **Root Directory** to `./` (or select `frontend`).
3. Click **Deploy**.

---

## 7. Deployment Path D: Bare-Metal / Ubuntu Linux VPS

For complete data sovereignty on any cloud VPS (Ubuntu 22.04 / 24.04 LTS on Hetzner, DigitalOcean, Linode, AWS EC2):

### Step 1: System Dependencies & Environment

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv git nginx certbot python3-certbot-nginx nodejs npm

# Create cofound application directory
sudo mkdir -p /var/www/cofound
sudo chown -R $USER:$USER /var/www/cofound

# Clone repository
git clone https://github.com/harshadpy/cofound.git /var/www/cofound
cd /var/www/cofound

# Set up Python virtual environment
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Build Frontend Single-Page App
cd frontend
npm install
npm run build
cd ..
```

### Step 2: Configure Environment

```bash
nano /var/www/cofound/.env
```
Paste your production environment variables (`OPENAI_API_KEY`, `TAVILY_API_KEY`, `SUPABASE_URL`, etc.).

### Step 3: Set Up Systemd Service

Create the systemd daemon file:
```bash
sudo nano /etc/systemd/system/cofound.service
```

Paste the following configuration:
```ini
[Unit]
Description=CoFound.ai FastAPI Production Daemon
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/cofound
Environment="PATH=/var/www/cofound/venv/bin"
EnvironmentFile=/var/www/cofound/.env
ExecStart=/var/www/cofound/venv/bin/uvicorn api.main:app --host 127.0.0.1 --port 8000 --workers 1

Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Ensure permissions and enable the service:
```bash
sudo chown -R www-data:www-data /var/www/cofound
sudo systemctl daemon-reload
sudo systemctl enable cofound
sudo systemctl start cofound
sudo systemctl status cofound
```

### Step 4: Configure Nginx with SSE Buffer Disablement

Create an Nginx server block:
```bash
sudo nano /etc/nginx/sites-available/cofound
```

Paste the following (replace `yourdomain.com` with your domain):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Static Frontend SPA Build
    root /var/www/cofound/frontend/dist;
    index index.html;

    # Client-side routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Endpoints & Real-Time SSE Streams
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;

        # Standard headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CRITICAL: Disable proxy buffering for real-time Server-Sent Events (SSE)
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;

        # Generous timeout for 11-agent parallel investigations
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
    }
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/cofound /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: Secure with Let's Encrypt SSL

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 8. Critical Production Tuning for Agent Swarms & SSE

### 1. Reverse Proxy Buffering & Real-Time SSE Streaming
The CoFound.ai swarm broadcasts live agent status updates over `GET /api/analysis/{id}/stream` using Server-Sent Events (`text/event-stream`).
- **If Nginx or Cloudflare buffers the response**, the user will see a frozen screen until the entire 11-agent pipeline completes.
- In Nginx: You **must** include `proxy_buffering off;` and `proxy_cache off;` (as configured above).
- In Cloudflare: Ensure **Buffering** is disabled for the `/api/analysis/*/stream` URL pattern in Cloudflare Page Rules / Transform Rules.

### 2. Uvicorn Worker Concurrency
- Live SSE subscriptions use an in-memory asynchronous broadcast queue (`STREAM_SUBSCRIBERS`).
- **Always run Uvicorn with `--workers 1`** per container or process instance.
- To scale throughput, scale horizontally by launching additional container replicas behind a load balancer with session affinity (sticky sessions) or connect an external Pub/Sub layer like Redis.

### 3. Gateway & Timeout Settings
- A full 11-agent deep market research investigation takes between **30 to 90 seconds** depending on live web search depth and LLM reasoning latency.
- Ensure reverse proxies, load balancers, and Cloudflare have a request timeout of at least **120 to 180 seconds** on API routes.
- The background task starts immediately and returns an `analysis_id` in milliseconds; the frontend monitors progress via the SSE stream, so standard REST timeouts do not affect execution.

### 4. Memory & Hardware Sizing
- **Minimum:** 1 vCPU, 1 GB RAM (fits Python runtime + LangGraph dependencies).
- **Recommended Production:** 2 vCPU, 2 GB–4 GB RAM (ensures fast Three.js asset delivery, concurrent background swarm runs, and comfortable SQLite query caching).

---

## 9. Post-Deployment Verification & Smoke Tests

Run these checks against your production URL (replace `https://your-app.com` with your live domain):

### 1. System Health Check
```bash
curl -i https://your-app.com/api/health
```
**Expected Response:**
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "healthy",
  "service": "CoFound.ai Modular Backend",
  "version": "2.1.0",
  "database": "connected",
  "supabase_configured": true
}
```

### 2. Standalone Research Tool Endpoint
```bash
curl -i -X POST https://your-app.com/api/tools/trends \
  -H "Content-Type: application/json" \
  -d '{"query": "AI Code Review for Regulated Banks", "sector": "FinTech"}'
```
**Expected Response:** `HTTP/1.1 200 OK` with JSON trend data, TAM estimates, and CAGR.

### 3. Multi-Agent Analysis Initialization
```bash
curl -i -X POST https://your-app.com/api/analysis/start \
  -H "Content-Type: application/json" \
  -d '{"raw_text": "AI Automated Compliance Audit Agent for HIPAA Clinics", "context_tags": {"industry": "HealthTech"}}'
```
**Expected Response:**
```json
HTTP/1.1 200 OK

{
  "analysis_id": "c138d689-1fc7-4566-a365-1d4ba2f30b9e",
  "status": "pending"
}
```

### 4. Live Telemetry Stream
```bash
curl -N https://your-app.com/api/analysis/<analysis_id>/stream
```
**Expected Response:** Streaming `data: {...}` lines reporting agent completions (`structure`, `ideation`, `competitor`, etc.).

---

## 10. Troubleshooting & FAQ

### Q: Analysis begins but the SSE progress bar doesn't update in real time.
- **Root Cause:** A proxy (Nginx, Cloudflare, or AWS ALB) is buffering chunks.
- **Fix:** In Nginx, set `proxy_buffering off;` and `proxy_set_header Connection '';`. In Cloudflare, create a rule bypassing cache and buffer on `/api/analysis/*/stream`.

### Q: `[Errno 11001] getaddrinfo failed` or Supabase sync warnings in server logs.
- **Root Cause:** The server cannot resolve the `SUPABASE_URL` domain or the URL contains a syntax error.
- **Fix:** Verify `SUPABASE_URL` starts with `https://` (e.g. `https://xxxx.supabase.co`) and that your server has working outbound DNS resolution. If Supabase is unreachable, CoFound.ai automatically and safely falls back to local SQLite storage.

### Q: The frontend shows a 404 when refreshing `/market-gaps`, `/trends`, or `/history`.
- **Root Cause:** Single Page Application (SPA) routing is not falling back to `index.html`.
- **Fix:** Ensure your web server rewrites unmatched paths to `index.html` (in Nginx: `try_files $uri $uri/ /index.html;`, in Netlify: `[[redirects]] from = "/*" to = "/index.html"`).

### Q: 504 Gateway Timeout on API endpoints.
- **Root Cause:** Proxy gateway timeout is lower than agent reasoning latency.
- **Fix:** Increase `proxy_read_timeout` to `300s` in Nginx, or ensure your PaaS web service timeout is configured to at least 120 seconds.

---

<div align="center">
<b>CoFound.ai is ready for production.</b><br/>
Need custom enterprise infrastructure or private VPC deployment assistance? Check our <a href="./reference.md">Master Architecture Reference</a>.
</div>
