import { create } from 'zustand'

// ─── Persistence helpers ────────────────────────────────────────────────────
const STORAGE_KEY   = 'cofound_analysis_result';
const DARK_KEY      = 'cofound_dark_mode';
const TOOL_KEY      = 'cofound_tool_results';   // sessionStorage – tool result cache
const INSIGHTS_KEY  = 'cofound_saved_insights'; // localStorage – saved insights

// Dark mode
function loadDarkMode() {
    try {
        const saved = localStorage.getItem(DARK_KEY);
        const isDark = saved === 'true';
        if (isDark) document.documentElement.classList.add('dark');
        return isDark;
    } catch { return false; }
}
function applyDarkMode(isDark) {
    try {
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        localStorage.setItem(DARK_KEY, String(isDark));
    } catch {}
}

// Analysis result (session)
function loadPersistedResult() {
    try { const r = sessionStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; }
    catch { return null; }
}
function persistResult(result) {
    try {
        if (result) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
        else sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
}

// Tool results cache (session – survives navigation, cleared on tab close)
function loadToolResults() {
    try { const r = sessionStorage.getItem(TOOL_KEY); return r ? JSON.parse(r) : {}; }
    catch { return {}; }
}
function persistToolResults(results) {
    try { sessionStorage.setItem(TOOL_KEY, JSON.stringify(results)); }
    catch {}
}

// Saved insights (localStorage – permanent)
function loadSavedInsights() {
    try { const r = localStorage.getItem(INSIGHTS_KEY); return r ? JSON.parse(r) : []; }
    catch { return []; }
}
function persistSavedInsights(insights) {
    try { localStorage.setItem(INSIGHTS_KEY, JSON.stringify(insights)); }
    catch {}
}

// ─── Store ──────────────────────────────────────────────────────────────────
export const useStore = create((set, get) => ({

    // UX State
    sidebarCollapsed: false,
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

    // Dark Mode
    isDark: loadDarkMode(),
    toggleDark: () => {
        const next = !get().isDark;
        applyDarkMode(next);
        set({ isDark: next });
    },

    // Analysis Input
    analysisInput: "",
    setAnalysisInput: (input) => set({ analysisInput: input }),

    contextTags: { industry: [], geo: [], segment: [] },
    addTag: (category, tag) => set((state) => ({
        contextTags: { ...state.contextTags, [category]: [...state.contextTags[category], tag] }
    })),
    removeTag: (category, tag) => set((state) => ({
        contextTags: { ...state.contextTags, [category]: state.contextTags[category].filter(t => t !== tag) }
    })),

    // Active Analysis
    isGenerating: false,
    uploadProgress: 0,
    currentAnalysisId: null,
    analysisStatus: "idle",
    analysisResult: loadPersistedResult(),
    agentStatuses: {},
    agentMetrics: {},
    progressPercentage: 0,

    startAnalysis: async () => {
        set({ isGenerating: true, uploadProgress: 10, analysisStatus: "pending" });
        try {
            const { analysisInput, contextTags } = get();
            const response = await fetch('/api/analysis/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ raw_text: analysisInput, context_tags: contextTags })
            });
            if (!response.ok) throw new Error("Failed to start analysis");
            const data = await response.json();
            set({ currentAnalysisId: data.analysis_id, uploadProgress: 20 });
            return data.analysis_id;
        } catch (error) {
            console.error(error);
            set({ isGenerating: false, analysisStatus: "failed" });
            throw error;
        }
    },

    pollStatus: async (analysisId) => {
        if (!analysisId) return;
        try {
            const response = await fetch(`/api/analysis/${analysisId}/status`);
            const data = await response.json();
            set({ agentStatuses: data.agent_statuses || {}, progressPercentage: data.progress_percentage || 0 });
            if (data.status === "completed") {
                set({ analysisStatus: "completed", isGenerating: false, uploadProgress: 100 });
                const reportRes = await fetch(`/api/analysis/${analysisId}/report`);
                const reportData = await reportRes.json();
                persistResult(reportData);
                set({ analysisResult: reportData });
                return "completed";
            } else if (data.status === "failed") {
                set({ analysisStatus: "failed", isGenerating: false });
                return "failed";
            } else {
                set({ uploadProgress: data.progress_percentage || 10 });
                return "pending";
            }
        } catch (error) {
            console.error(error);
            return "error";
        }
    },

    clearAnalysisResult: () => {
        persistResult(null);
        set({ analysisResult: null, analysisStatus: "idle" });
    },

    // ── Tool Results Cache ─────────────────────────────────────────────────
    // Shape: { trends: { query, result }, competitors: { query, result }, ... }
    toolResults: loadToolResults(),

    setToolResult: (tool, query, result) => {
        const updated = { ...get().toolResults, [tool]: { query, result, savedAt: Date.now() } };
        persistToolResults(updated);
        set({ toolResults: updated });
    },

    clearToolResult: (tool) => {
        const updated = { ...get().toolResults };
        delete updated[tool];
        persistToolResults(updated);
        set({ toolResults: updated });
    },

    // ── Saved Insights ─────────────────────────────────────────────────────
    savedInsights: loadSavedInsights(),

    saveInsight: (insight) => {
        // insight: { id, type, title, query, data, savedAt }
        const existing = get().savedInsights;
        // avoid exact duplicate (same type + query)
        const isDup = existing.some(i => i.type === insight.type && i.query === insight.query);
        if (isDup) return false;
        const updated = [insight, ...existing];
        persistSavedInsights(updated);
        set({ savedInsights: updated });
        return true;
    },

    removeInsight: (id) => {
        const updated = get().savedInsights.filter(i => i.id !== id);
        persistSavedInsights(updated);
        set({ savedInsights: updated });
    },

    // User State (Mock)
    user: {
        name: "Harshad",
        email: "alex@cofound.ai",
        avatar: "AH",
        plan: "Pro"
    }
}))
