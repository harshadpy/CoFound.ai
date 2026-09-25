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
        if (session) localStorage.setItem(AUTH_KEY, JSON.stringify(session));
        else localStorage.removeItem(AUTH_KEY);
    } catch {}
}

const savedSession = loadAuthSession();
const hasLoggedOut = typeof window !== 'undefined' && localStorage.getItem('cofound_has_logged_out') === 'true';

let initialIsAuth = false;
let initialUser = null;

if (savedSession && savedSession.id) {
    initialIsAuth = true;
    initialUser = savedSession;
} else if (!hasLoggedOut) {
    // Default initial experience is Harshad
    initialIsAuth = true;
    initialUser = {
        id: "default_user",
        name: "Harshad",
        email: "harshad@cofound.ai",
        avatar: "HP",
        plan: "pro",
        masked_keys: {}
    };
    persistAuthSession(initialUser);
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

    startAnalysis: async (customTags = null) => {
        set({ isGenerating: true, uploadProgress: 10, analysisStatus: "pending" });
        try {
            const { analysisInput, contextTags } = get();
            const effectiveTags = customTags || contextTags;
            if (customTags) set({ contextTags: customTags });
            
            const activeUser = get().user;
            const effectiveUserId = (activeUser && activeUser.id) ? activeUser.id : 'default_user';

            const response = await fetch('/api/analysis/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    raw_text: analysisInput, 
                    context_tags: effectiveTags,
                    user_id: effectiveUserId
                })
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const errMsg = Array.isArray(errData.detail)
                    ? errData.detail.map(d => d.msg || JSON.stringify(d)).join(", ")
                    : (typeof errData.detail === 'string' ? errData.detail : "Failed to start analysis");
                throw new Error(errMsg);
            }
            const data = await response.json();
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
            const response = await fetch(`/api/analysis/${analysisId}/status`);
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
            } else if (data.status === "failed") {
                set({ analysisStatus: "failed", isGenerating: false });
                return "failed";
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
        if (data.status) updates.analysisStatus = data.status;
        set(updates);
    },

    fetchAndSaveReport: async (analysisId, retries = 3) => {
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const reportRes = await fetch(`/api/analysis/${analysisId}/report`);
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
            const res = await fetch(`/api/saved-insights?user_id=${encodeURIComponent(userId)}`);
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
            await fetch('/api/saved-insights', {
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
            await fetch(`/api/saved-insights/${id}`, { method: 'DELETE' });
        } catch (e) {
            console.error("Supabase insight delete error:", e);
        }
    },

    updateInsightNote: async (id, note) => {
        const updated = get().savedInsights.map(i => i.id === id ? { ...i, founderNote: note } : i);
        persistSavedInsights(updated);
        set({ savedInsights: updated });

        try {
            await fetch(`/api/saved-insights/${id}/note`, {
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
            const res = await fetch(`/api/notifications?user_id=${encodeURIComponent(userId)}`);
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
            await fetch(`/api/notifications/${id}/read?user_id=${encodeURIComponent(userId)}`, { method: 'POST' });
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
            await fetch(`/api/notifications/read-all?user_id=${encodeURIComponent(userId)}`, { method: 'POST' });
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

    login: async (email, name) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name })
            });
            if (res.ok) {
                const data = await res.json();
                const u = data.user;
                const formattedUser = {
                    id: u.id,
                    name: u.full_name || u.name || "Founder",
                    email: u.email,
                    avatar: u.avatar || (u.full_name ? u.full_name.slice(0, 2).toUpperCase() : "HP"),
                    plan: u.plan || "pro",
                    masked_keys: u.masked_keys || {},
                    has_custom_keys: u.has_custom_keys || false
                };
                persistAuthSession(formattedUser);
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('cofound_has_logged_out');
                }
                set({
                    user: formattedUser,
                    isAuthenticated: true,
                    authModalOpen: false
                });
                get().fetchNotifications();
                get().fetchSavedInsights();
                return { success: true, user: formattedUser, message: data.message };
            } else {
                const err = await res.json();
                return { success: false, message: err.detail || "Authentication failed." };
            }
        } catch (e) {
            console.error("Login request error:", e);
            return { success: false, message: "Network connection error during sign in." };
        }
    },

    logout: async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch {}
        persistAuthSession(null);
        if (typeof window !== 'undefined') {
            localStorage.setItem('cofound_has_logged_out', 'true');
        }
        set({
            user: null,
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
            const res = await fetch(`/api/user/profile?user_id=${encodeURIComponent(userId)}`);
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
            const res = await fetch(`/api/user/profile?user_id=${encodeURIComponent(userId)}`, {
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
            const res = await fetch(`/api/user/api-keys?user_id=${encodeURIComponent(userId)}`, {
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
            const res = await fetch(`/api/user/plan?user_id=${encodeURIComponent(userId)}`, {
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
            const res = await fetch('/api/copilot/chat', {
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
            const res = await fetch(`/api/analysis/${analysisId}/share`, {
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
