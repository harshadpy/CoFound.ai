-- =====================================================================
-- CoFound.ai — Supabase PostgreSQL Production Schema
-- =====================================================================
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor)
-- It creates all required tables, indexes, constraints, and Row Level Security (RLS) policies.

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────
-- 2. Users Table
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    name TEXT,
    avatar TEXT DEFAULT 'CO',
    avatar_url TEXT,
    plan TEXT DEFAULT 'pro',
    plan_type TEXT DEFAULT 'pro',
    credits_total INTEGER DEFAULT 100,
    credits_used INTEGER DEFAULT 0,
    custom_api_keys JSONB DEFAULT '{}'::jsonb,
    preferences JSONB DEFAULT '{"theme": "dark", "notifications_enabled": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ─────────────────────────────────────────────────────────────────────
-- 3. Analyses Table (Institutional Swarm Reports)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analyses (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'default_user',
    raw_text TEXT NOT NULL,
    context_tags JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending',
    progress_percentage INTEGER DEFAULT 0,
    agent_statuses JSONB DEFAULT '{}'::jsonb,
    agent_metrics JSONB DEFAULT '{}'::jsonb,
    result JSONB,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON public.analyses(status);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- 4. Saved Insights Table (Founder Bookmarks & Strategic Notes)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_insights (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tool_type TEXT NOT NULL,
    title TEXT NOT NULL,
    data JSONB NOT NULL,
    founder_note TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_insights_user_id ON public.saved_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_insights_tool_type ON public.saved_insights(tool_type);
CREATE INDEX IF NOT EXISTS idx_saved_insights_created_at ON public.saved_insights(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- 5. Notifications Table (System & Swarm Execution Alerts)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    link TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- 6. Shared Reports Table (Public Permalink Sharing)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shared_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL,
    analysis_id TEXT NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    created_by TEXT DEFAULT 'default_user',
    title TEXT NOT NULL,
    verdict TEXT,
    confidence_score TEXT,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_reports_token ON public.shared_reports(token);
CREATE INDEX IF NOT EXISTS idx_shared_reports_analysis_id ON public.shared_reports(analysis_id);

-- ─────────────────────────────────────────────────────────────────────
-- 7. Automatic Updated_At Trigger
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trigger_analyses_updated_at ON public.analyses;
CREATE TRIGGER trigger_analyses_updated_at
    BEFORE UPDATE ON public.analyses
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

-- ─────────────────────────────────────────────────────────────────────
-- 8. Row Level Security (RLS) Policies
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

-- Allow anon & authenticated service operations (CoFound.ai uses backend API keys)
CREATE POLICY "Allow public read of active shared reports"
    ON public.shared_reports FOR SELECT
    USING (is_active = true);

CREATE POLICY "Allow service and backend full access on users"
    ON public.users FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow service and backend full access on analyses"
    ON public.analyses FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow service and backend full access on saved_insights"
    ON public.saved_insights FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow service and backend full access on notifications"
    ON public.notifications FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow service and backend full access on shared_reports"
    ON public.shared_reports FOR ALL
    USING (true)
    WITH CHECK (true);
