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

## 🗄️ Database & Supabase Auth Setup

CoFound.ai uses **Supabase only** for cloud data persistence and email/password authentication (no third-party OAuth providers).

### 1. Database Schema
1. Open your Supabase project's **SQL Editor**.
2. Run the script in [**`infra/supabase_schema.sql`**](./infra/supabase_schema.sql).

### 2. Supabase Auth Configuration (Dashboard)
1. Go to **Authentication** ➔ **Providers** ➔ Ensure **Email** is **Enabled**.
2. Go to **Authentication** ➔ **URL Configuration** ➔ Set **Site URL** to your deployment domain (e.g., `https://your-app.onrender.com`).
3. *(Optional for Instant Frictionless Testing)*: Under **Authentication** ➔ **Email Templates** / **Auth Settings**, toggle **Confirm email** off if you wish founders to log in immediately upon signup without verifying their inbox.

### 3. Required Environment Variables
Add these keys to your `.env` or cloud dashboard (Render, Railway, Fly.io, etc.):

```bash
# Supabase Project Credentials (Found in Project Settings -> API)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."

# Centralized Free Access & Quota Control
BILLING_ENABLED=false        # Makes all features and Pro reports 100% free
GUEST_ANALYSIS_LIMIT=5       # Free analyses for unauthenticated guests before signup
USER_ANALYSIS_LIMIT=50       # Quota per registered founder account
```

### 4. GPT-Style Authentication & Guest Migration Flow
- **Guest Mode:** First-time users can immediately try the application without signing up. A secure guest ID (`guest_<hex>`) is issued automatically.
- **Guest-to-User Migration:** When a guest founder signs up or logs in, all past analyses, bookmarks, and notifications automatically migrate to their registered Supabase account.
- **Free Pro Access:** `BILLING_ENABLED=false` guarantees that all users receive full access to 11-agent autonomous swarm reports, HITL steering, and ideation tools without payment paywalls.

---

## 📖 Complete Documentation

| Guide | Description |
|---|---|
| [**Full Production Deployment Guide**](./docs/deployment_guide.md) | Exhaustive guide covering Nginx, SSE non-buffering, SSL, systemd, hardware sizing, and troubleshooting. |
| [**Supabase SQL Schema**](./infra/supabase_schema.sql) | DDL script for all Supabase tables, indexes, triggers, and RLS policies. |
| [**Architecture Reference**](./docs/reference.md) | Deep-dive system execution graph, agent specs, and technical constraints. |
| [**Product Requirements**](./docs/prd.md) | Core product principles and roadmap specs. |
