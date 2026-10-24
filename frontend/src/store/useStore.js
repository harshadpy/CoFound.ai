import { create } from 'zustand'
import { apiUrl } from '../lib/api'

// ─── Persistence helpers ────────────────────────────────────────────────────
const STORAGE_KEY   = 'cofound_analysis_result';
const DARK_KEY      = 'cofound_dark_mode';
const TOOL_KEY      = 'cofound_tool_results';   // sessionStorage – tool result cache
const INSIGHTS_KEY  = 'cofound_saved_insights'; // localStorage – saved insights

// Dark mode — Defaults to dark mode automatically when opened
function loadDarkMode() {
    try {
        const saved = localStorage.getItem(DARK_KEY);
        // Automatically default to dark mode if not explicitly turned off
        const isDark = saved === null ? true : saved === 'true';
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        return isDark;
    } catch { 
        if (typeof document !== 'undefined') {
            document.documentElement.classList.add('dark');
        }
        return true; 
    }
}
function applyDarkMode(isDark) {
    try {
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        localStorage.setItem(DARK_KEY, String(isDark));
    } catch {}
}

// Analysis result (session)
const ANALYSIS_ID_KEY = 'cofound_active_analysis_id';
function loadActiveAnalysisId() {
    try { return sessionStorage.getItem(ANALYSIS_ID_KEY) || null; }
    catch { return null; }
}
function persistActiveAnalysisId(id) {
    try {
        if (id) sessionStorage.setItem(ANALYSIS_ID_KEY, id);
        else sessionStorage.removeItem(ANALYSIS_ID_KEY);
    } catch {}
}

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

// User Auth Session (localStorage)
const AUTH_KEY = 'cofound_auth_session';
const GUEST_KEY = 'cofound_guest_id';

function getOrCreateGuestId() {
    try {
        // Individual for each browsing session
        let gid = sessionStorage.getItem(GUEST_KEY);
        if (!gid || !gid.startsWith('guest_')) {
            gid = 'guest_' + Math.random().toString(36).substring(2, 8) + Date.now().toString(36);
            sessionStorage.setItem(GUEST_KEY, gid);
        }
        return gid;
    } catch {
        return 'guest_' + Date.now().toString(36);
    }
}

function createGuestUser() {
    const gid = getOrCreateGuestId();
    return {
        id: gid,
        name: "Harshad",
        email: null,
        avatar: "H",
        plan: "pro",
        is_guest: true,
        masked_keys: {}
    };
}

function loadAuthSession() {
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function persistAuthSession(session) {
    try {
        // Only registered, authenticated users are permanently saved to localStorage
        if (session && !session.is_guest) {
            localStorage.setItem(AUTH_KEY, JSON.stringify(session));
        } else {
            localStorage.removeItem(AUTH_KEY);
        }
    } catch {}
}

const savedSession = loadAuthSession();
let initialIsAuth = false;
let initialUser = null;

if (savedSession && savedSession.id && !savedSession.is_guest) {
    initialIsAuth = true;
    initialUser = savedSession;
} else {
    // Guest mode: Clean and individual per session
    initialIsAuth = false;
    initialUser = createGuestUser();
}

// ─── Store ──────────────────────────────────────────────────────────────────
export const useStore = create((set, get) => ({

    // UX State
    sidebarCollapsed: false,
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    // Mobile drawer
    sidebarOpen: false,
    toggleSidebarOpen: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    closeSidebar: () => set({ sidebarOpen: false }),

    // How to Use Guide Modal
    howToUseOpen: false,
    openHowToUse: () => set({ howToUseOpen: true }),
    closeHowToUse: () => set({ howToUseOpen: false }),

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
    setContextTags: (tags) => set((state) => ({
        contextTags: { ...state.contextTags, ...tags }
    })),
    addTag: (category, tag) => set((state) => ({
        contextTags: { ...state.contextTags, [category]: [...(state.contextTags[category] || []), tag] }
    })),
    removeTag: (category, tag) => set((state) => ({
        contextTags: { ...state.contextTags, [category]: (state.contextTags[category] || []).filter(t => t !== tag) }
    })),

    // Active Analysis
    isGenerating: false,
    uploadProgress: 0,
    currentAnalysisId: loadActiveAnalysisId(),
    analysisStatus: "idle",
    analysisResult: loadPersistedResult(),
    agentStatuses: {},
    agentMetrics: {},
    progressPercentage: 0,
    hitlEnabled: false,
    hitlReviewData: null,
    setHitlEnabled: (val) => set({ hitlEnabled: val }),
    setHitlReviewData: (data) => set({ hitlReviewData: data }),

    startAnalysis: async (customTags = null) => {
        set({ isGenerating: true, uploadProgress: 10, analysisStatus: "pending", hitlReviewData: null });
        try {
            const { analysisInput, contextTags, hitlEnabled } = get();
            const effectiveTags = customTags || contextTags;
            if (customTags) set({ contextTags: customTags });
            
            const activeUser = get().user;
            const effectiveUserId = (activeUser && activeUser.id) ? activeUser.id : 'default_user';

            const response = await fetch(apiUrl('/api/analysis/start'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    raw_text: analysisInput, 
                    context_tags: effectiveTags,
                    user_id: effectiveUserId,
                    hitl_enabled: hitlEnabled
                })
            });

            const text = await response.text();
            let data = {};
            if (text) {
                try {
                    data = JSON.parse(text);
                } catch {
                    data = { detail: text };
                }
            }

            if (!response.ok) {
                const errMsg = Array.isArray(data.detail)
                    ? data.detail.map(d => d.msg || JSON.stringify(d)).join(", ")
                    : (typeof data.detail === 'string' ? data.detail : "Failed to start analysis");
                throw new Error(errMsg);
            }

            if (!data.analysis_id) {
                throw new Error("Backend did not return an analysis_id. Please check API server health.");
            }

            persistActiveAnalysisId(data.analysis_id);
            set({ currentAnalysisId: data.analysis_id, uploadProgress: 20 });
            return data.analysis_id;
        } catch (error) {
            console.error("startAnalysis error:", error);
            set({ isGenerating: false, analysisStatus: "failed" });
            throw error;
        }
    },

    pollStatus: async (analysisId) => {
        if (!analysisId) return;
        try {
            const response = await fetch(apiUrl(`/api/analysis/${analysisId}/status`));
            if (!response.ok) return "error";
            const data = await response.json();
            set({ 
                agentStatuses: data.agent_statuses || {}, 
                agentMetrics: data.agent_metrics || {},
                progressPercentage: data.progress_percentage || 0 
            });
            if (data.status === "completed") {
                await get().fetchAndSaveReport(analysisId);
                return "completed";
            } else if (data.status === "awaiting_review") {
                set({ analysisStatus: "awaiting_review", isGenerating: false });
                return "awaiting_review";
            } else if (data.status === "failed") {
                set({ analysisStatus: "failed", isGenerating: false });
                return "failed";
            } else if (data.status === "running") {
                set({ 
                    analysisStatus: "running", 
                    isGenerating: true,
                    hitlReviewData: null,
                    uploadProgress: Math.max(data.progress_percentage || 65, 10) 
                });
                return "running";
            } else {
                set({ uploadProgress: Math.max(data.progress_percentage || 10, 10) });
                return "pending";
            }
        } catch (error) {
            console.error(error);
            return "error";
        }
    },

    applyStreamUpdate: (data) => {
        if (!data) return;
        const updates = {};
        if (data.agent_statuses) updates.agentStatuses = data.agent_statuses;
        if (data.agent_metrics) updates.agentMetrics = data.agent_metrics;
        if (typeof data.progress_percentage === 'number') {
            updates.progressPercentage = data.progress_percentage;
            updates.uploadProgress = data.progress_percentage;
        }
        if (data.type === 'hitl_interrupt') {
            updates.analysisStatus = 'awaiting_review';
            updates.isGenerating = false;
            if (data.review_data) updates.hitlReviewData = data.review_data;
        } else if (data.type === 'completed') {
            updates.analysisStatus = 'completed';
        } else if (data.type === 'failed') {
            updates.analysisStatus = 'failed';
        } else if (data.type === 'status_change' && data.status) {
            updates.analysisStatus = data.status;
            if (data.status === 'awaiting_review') {
                updates.isGenerating = false;
            } else if (data.status === 'running') {
                updates.isGenerating = true;
                updates.hitlReviewData = null;
            }
        } else if (data.type === 'init' && data.status) {
            updates.analysisStatus = data.status;
            if (data.status === 'awaiting_review') updates.isGenerating = false;
        }
        set(updates);
    },

    resumeAnalysis: async (analysisId, feedback) => {
        // Optimistically set synthesis as running so UI gives immediate live feedback
        set((state) => ({ 
            isGenerating: true, 
            analysisStatus: "running",
            hitlReviewData: null,
            agentStatuses: {
                ...state.agentStatuses,
                synthesis: "running"
            },
            agentMetrics: {
                ...state.agentMetrics,
                synthesis: "Synthesizing research & founder steering..."
            }
        }));
        try {
            const response = await fetch(apiUrl(`/api/analysis/${analysisId}/resume`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feedback)
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to resume analysis from checkpoint.");
            }
            return true;
        } catch (err) {
            console.error("resumeAnalysis error:", err);
            set({ isGenerating: false });
            throw err;
        }
    },

    fetchAndSaveReport: async (analysisId, retries = 3) => {
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const reportRes = await fetch(apiUrl(`/api/analysis/${analysisId}/report`));
                if (reportRes.ok) {
                    const reportData = await reportRes.json();
                    persistResult(reportData);
                    persistActiveAnalysisId(null);
                    set({ 
                        analysisResult: reportData, 
                        analysisStatus: "completed", 
                        isGenerating: false, 
                        uploadProgress: 100,
                        progressPercentage: 100
                    });
                    return reportData;
                }
            } catch (e) {
                console.error(`Attempt ${attempt + 1} to load report failed:`, e);
            }
            if (attempt < retries - 1) {
                await new Promise(r => setTimeout(r, 800));
            }
        }
        return null;
    },

    clearAnalysisResult: () => {
        persistResult(null);
        persistActiveAnalysisId(null);
        set({ analysisResult: null, currentAnalysisId: null, analysisStatus: "idle", isGenerating: false });
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

    // ── Saved Insights (Dual-layer: Supabase Cloud + Local Cache) ───────────
    savedInsights: loadSavedInsights(),

    fetchSavedInsights: async () => {
        const userId = get().user?.id || 'default_user';
        try {
            const res = await fetch(apiUrl(`/api/saved-insights?user_id=${encodeURIComponent(userId)}`));
            if (res.ok) {
                const data = await res.json();
                if (data.insights) {
                    persistSavedInsights(data.insights);
                    set({ savedInsights: data.insights });
                }
            }
        } catch (e) {
            console.warn("Using local cached saved insights:", e);
        }
    },

    saveInsight: async (insight) => {
        const existing = get().savedInsights;
        const isDup = existing.some(i => i.id === insight.id || (i.type === insight.type && i.query === insight.query && insight.query));
        if (isDup) return false;

        const updated = [insight, ...existing];
        persistSavedInsights(updated);
        set({ savedInsights: updated });

        const userId = get().user?.id || 'default_user';

        // Cloud sync to Supabase
        try {
            await fetch(apiUrl('/api/saved-insights'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: insight.id || `insight-${Date.now()}`,
                    type: insight.type || 'insight',
                    title: insight.title || 'Saved Insight',
                    content: insight.data || insight.content || {},
                    founder_note: insight.founderNote || null,
                    user_id: userId
                })
            });
        } catch (e) {
            console.error("Supabase insight save error:", e);
        }
        return true;
    },

    removeInsight: async (id) => {
        const updated = get().savedInsights.filter(i => i.id !== id);
        persistSavedInsights(updated);
        set({ savedInsights: updated });

        try {
            await fetch(apiUrl(`/api/saved-insights/${id}`), { method: 'DELETE' });
        } catch (e) {
            console.error("Supabase insight delete error:", e);
        }
    },

    updateInsightNote: async (id, note) => {
        const updated = get().savedInsights.map(i => i.id === id ? { ...i, founderNote: note } : i);
        persistSavedInsights(updated);
        set({ savedInsights: updated });

        try {
            await fetch(apiUrl(`/api/saved-insights/${id}/note`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ founder_note: note })
            });
        } catch (e) {
            console.error("Supabase insight note update error:", e);
        }
    },

    // ── Notifications (Supabase Cloud) ──────────────────────────────────────
    notifications: [],
    unreadNotificationsCount: 0,

    fetchNotifications: async () => {
        const userId = get().user?.id || 'default_user';
        try {
            const res = await fetch(apiUrl(`/api/notifications?user_id=${encodeURIComponent(userId)}`));
            if (res.ok) {
                const data = await res.json();
                set({
                    notifications: data.notifications || [],
                    unreadNotificationsCount: data.unread_count || 0
                });
            }
        } catch (e) {
            console.error("Fetch notifications failed:", e);
        }
    },

    markNotificationRead: async (id) => {
        const userId = get().user?.id || 'default_user';
        set((state) => {
            const updated = state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n);
            const unread = updated.filter(n => !n.is_read).length;
            return { notifications: updated, unreadNotificationsCount: unread };
        });
        try {
            await fetch(apiUrl(`/api/notifications/${id}/read?user_id=${encodeURIComponent(userId)}`), { method: 'POST' });
        } catch (e) {
            console.error(e);
        }
    },

    markAllNotificationsRead: async () => {
        const userId = get().user?.id || 'default_user';
        set((state) => ({
            notifications: state.notifications.map(n => ({ ...n, is_read: true })),
            unreadNotificationsCount: 0
        }));
        try {
            await fetch(apiUrl(`/api/notifications/read-all?user_id=${encodeURIComponent(userId)}`), { method: 'POST' });
        } catch (e) {
            console.error(e);
        }
    },

    // ── User Authentication & Profile (Supabase Cloud) ──────────────────────
    user: initialUser,
    isAuthenticated: initialIsAuth,

    authModalOpen: false,
    openAuthModal: () => set({ authModalOpen: true }),
    closeAuthModal: () => set({ authModalOpen: false }),

    quota: { used: 0, limit: 5, remaining: 5 },

    login: async (email, password = '', name = null) => {
        try {
            const currentGuestId = get().user?.is_guest ? get().user.id : null;
            const res = await fetch(apiUrl('/api/auth/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, guest_id: currentGuestId })
            });
            if (res.ok) {
                const data = await res.json();
                const u = data.user;
                const formattedUser = {
                    id: u.id,
                    name: u.full_name || u.name || "Founder",
                    email: u.email,
                    avatar: u.avatar || (u.full_name ? u.full_name.slice(0, 2).toUpperCase() : "CO"),
                    plan: "pro",
                    is_guest: false,
                    masked_keys: u.masked_keys || {},
                    has_custom_keys: u.has_custom_keys || false
                };
                persistAuthSession(formattedUser);
                if (data.token) {
                    try { localStorage.setItem('cofound_auth_token', data.token); } catch {}
                }
                set({
                    user: formattedUser,
                    isAuthenticated: true,
                    authModalOpen: false
                });
                get().fetchNotifications();
                get().fetchSavedInsights();
                get().fetchUserProfile();
                return { success: true, user: formattedUser, message: data.message, migratedCount: data.migrated_count };
            } else {
                const err = await res.json();
                return { success: false, message: err.detail || "Authentication failed." };
            }
        } catch (e) {
            console.error("Login request error:", e);
            return { success: false, message: "Network connection error during sign in." };
        }
    },

    signup: async (email, password, name = null) => {
        try {
            const currentGuestId = get().user?.is_guest ? get().user.id : null;
            const res = await fetch(apiUrl('/api/auth/signup'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, guest_id: currentGuestId })
            });
            if (res.ok) {
                const data = await res.json();
                const u = data.user;
                const formattedUser = {
                    id: u.id,
                    name: u.full_name || u.name || "Founder",
                    email: u.email,
                    avatar: u.avatar || (u.full_name ? u.full_name.slice(0, 2).toUpperCase() : "CO"),
                    plan: "pro",
                    is_guest: false,
                    masked_keys: u.masked_keys || {},
                    has_custom_keys: u.has_custom_keys || false
                };
                persistAuthSession(formattedUser);
                if (data.token) {
                    try { localStorage.setItem('cofound_auth_token', data.token); } catch {}
                }
                set({
                    user: formattedUser,
                    isAuthenticated: true,
                    authModalOpen: false
                });
                get().fetchNotifications();
                get().fetchSavedInsights();
                get().fetchUserProfile();
                return { success: true, user: formattedUser, message: data.message, migratedCount: data.migrated_count };
            } else {
                const err = await res.json();
                return { success: false, message: err.detail || "Account creation failed." };
            }
        } catch (e) {
            console.error("Signup request error:", e);
            return { success: false, message: "Network error during account creation." };
        }
    },

    logout: async () => {
        try {
            await fetch(apiUrl('/api/auth/logout'), { method: 'POST' });
        } catch {}
        try { localStorage.removeItem('cofound_auth_token'); } catch {}
        try { localStorage.removeItem(AUTH_KEY); } catch {}
        try { sessionStorage.removeItem(GUEST_KEY); } catch {}
        
        // Reset to a clean, isolated guest session
        const guest = createGuestUser();
        
        set({
            user: guest,
            isAuthenticated: false,
            settingsOpen: false,
            notifications: [],
            unreadNotificationsCount: 0
        });
    },

    settingsOpen: false,
    openSettings: () => set({ settingsOpen: true }),
    closeSettings: () => set({ settingsOpen: false }),

    fetchUserProfile: async () => {
        const currentUser = get().user;
        const userId = currentUser?.id;
        if (!userId) return;
        try {
            const res = await fetch(apiUrl(`/api/user/profile?user_id=${encodeURIComponent(userId)}`));
            if (res.ok) {
                const data = await res.json();
                const isDefault = data.id === 'default_user' || userId === 'default_user';
                const defaultName = isDefault ? "Harshad" : (currentUser.name || "Founder");
                const defaultEmail = isDefault ? "harshad@cofound.ai" : (currentUser.email || "");
                const name = data.full_name || currentUser.name || defaultName;
                const email = data.email || currentUser.email || defaultEmail;
                const avatar = (data.full_name ? data.full_name.slice(0, 2).toUpperCase() : (currentUser.avatar || "CO"));
                
                const u = {
                    id: data.id || userId,
                    name: name,
                    email: email,
                    avatar: avatar,
                    plan: data.plan || currentUser.plan || "pro",
                    masked_keys: data.masked_keys || currentUser.masked_keys || {},
                    has_custom_keys: data.has_custom_keys ?? currentUser.has_custom_keys ?? false
                };
                persistAuthSession(u);
                set({ user: u, isAuthenticated: true });
            }
        } catch (e) {
            console.error("Fetch user profile failed:", e);
        }
    },

    updateUserProfile: async (payload) => {
        const userId = get().user?.id || 'default_user';
        try {
            const res = await fetch(apiUrl(`/api/user/profile?user_id=${encodeURIComponent(userId)}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                await get().fetchUserProfile();
                return true;
            }
        } catch (e) {
            console.error("Update profile failed:", e);
        }
        return false;
    },

    updateApiKeys: async (keys) => {
        const userId = get().user?.id || 'default_user';
        try {
            const res = await fetch(apiUrl(`/api/user/api-keys?user_id=${encodeURIComponent(userId)}`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(keys)
            });
            if (res.ok) {
                await get().fetchUserProfile();
                return true;
            }
        } catch (e) {
            console.error("Update API keys failed:", e);
        }
        return false;
    },

    updatePlan: async (plan) => {
        const userId = get().user?.id || 'default_user';
        try {
            const res = await fetch(apiUrl(`/api/user/plan?user_id=${encodeURIComponent(userId)}`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan })
            });
            if (res.ok) {
                await get().fetchUserProfile();
                return true;
            }
        } catch (e) {
            console.error("Update plan failed:", e);
        }
        return false;
    },

    // ── AI Strategic Copilot ────────────────────────────────────────────────
    copilotOpen: false,
    openCopilot: () => set({ copilotOpen: true }),
    closeCopilot: () => set({ copilotOpen: false }),
    copilotMessages: [
        {
            role: 'assistant',
            content: "Hello Harshad! I am your **Executive Strategic Copilot**. Grounded directly on your market analyses, competitive landscapes, and risk teardowns, I'm here to help you pressure-test your strategy, pricing, and go-to-market execution. What's on your mind today?"
        }
    ],
    copilotLoading: false,
    suggestedFollowups: [
        "How can we build a defensive moat against incumbents?",
        "What is the leanest MVP to test customer willingness to pay?",
        "How should we pitch our pricing model to early adopters?"
    ],

    sendCopilotMessage: async (text, analysisId = null) => {
        const currentMessages = get().copilotMessages;
        const newHistory = [...currentMessages, { role: 'user', content: text }];
        set({ copilotMessages: newHistory, copilotLoading: true });

        try {
            const res = await fetch(apiUrl('/api/copilot/chat'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    analysis_id: analysisId || get().currentAnalysisId,
                    conversation_history: newHistory,
                    user_id: 'default_user'
                })
            });

            if (res.ok) {
                const data = await res.json();
                set({
                    copilotMessages: [...newHistory, { role: 'assistant', content: data.reply }],
                    suggestedFollowups: data.suggested_followups || get().suggestedFollowups,
                    copilotLoading: false
                });
            } else {
                throw new Error("Copilot response error");
            }
        } catch (e) {
            console.error("Copilot request error:", e);
            set({
                copilotMessages: [
                    ...newHistory,
                    {
                        role: 'assistant',
                        content: "I ran into a temporary hiccup communicating with the model, but my core advice remains: focus first on validating customer willingness to pay before investing heavily in engineering."
                    }
                ],
                copilotLoading: false
            });
        }
    },

    // ── Share Permalinks (Supabase Cloud) ───────────────────────────────────
    shareReport: async (analysisId, title) => {
        try {
            const res = await fetch(apiUrl(`/api/analysis/${analysisId}/share`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.error("Failed to share report:", e);
        }
        return null;
    }
}))
