# 🚀 CoFound.ai — Deployment Guide

This document provides a fast-track reference for deploying **CoFound.ai** to production.

👉 **For the comprehensive, step-by-step production manual**, see [**`docs/deployment_guide.md`**](./docs/deployment_guide.md).

---

## ⚡ 60-Second Quick Start

### 1. Docker Compose (Instant Local / VPS Stack)

```bash
# 1. Configure environment keys
cp .env.example .env   # Ensure OPENAI_API_KEY is configured

# 2. Build and launch container stack
docker compose up -d --build

# 3. Check health status
curl http://localhost:8000/api/health
```
➡️ Access the live platform at **`http://localhost:8000`**.

---

### 2. 1-Click Render.com Blueprint

CoFound.ai includes a pre-configured [`render.yaml`](./render.yaml):

1. Push your repository to GitHub.
2. In [Render Dashboard](https://render.com), select **New** ➔ **Blueprint**.
3. Connect your repository.
4. Input your `OPENAI_API_KEY` (and optional `TAVILY_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`).
5. Click **Apply Blueprint**.

---

### 3. Decoupled Edge Frontend (Netlify / Vercel)

- **Netlify:** Ready-to-go [`netlify.toml`](./netlify.toml) configured with SPA fallback and API proxying.
- **Vercel:** Ready-to-go [`vercel.json`](./vercel.json) configured with SPA rewrites.

---

## 🗄️ Database & Supabase Migration

To set up cloud sync, public report permalinks, and BYOK user keys:

1. Open your Supabase project's **SQL Editor**.
2. Run the script in [**`infra/supabase_schema.sql`**](./infra/supabase_schema.sql).
3. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in your production environment variables.

---

## 📖 Complete Documentation

| Guide | Description |
|---|---|
| [**Full Production Deployment Guide**](./docs/deployment_guide.md) | Exhaustive guide covering Nginx, SSE non-buffering, SSL, systemd, hardware sizing, and troubleshooting. |
| [**Supabase SQL Schema**](./infra/supabase_schema.sql) | DDL script for all Supabase tables, indexes, triggers, and RLS policies. |
| [**Architecture Reference**](./docs/reference.md) | Deep-dive system execution graph, agent specs, and technical constraints. |
| [**Product Requirements**](./docs/prd.md) | Core product principles and roadmap specs. |
