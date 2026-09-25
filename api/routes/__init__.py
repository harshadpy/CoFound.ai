"""
API Routes package for CoFound.ai.
Exports domain-specific APIRouters:
- analysis_router: LangGraph execution lifecycle, status, SSE stream, persistence
- tools_router: Specialized standalone research agents
- insights_router: Catalog endpoints, saved insights, and cache management
- user_router: Founder profile, BYOK API keys, and subscription plan
- notifications_router: Real-time event notifications backed by Supabase
- share_router: Public shareable report permalinks (/share/:token)
- copilot_router: AI Strategic Advisor Copilot grounded on active dossiers
"""
from api.routes.analysis import router as analysis_router
from api.routes.tools import router as tools_router
from api.routes.insights import router as insights_router
from api.routes.user import router as user_router
from api.routes.notifications import router as notifications_router
from api.routes.share import router as share_router
from api.routes.copilot import router as copilot_router
from api.routes.auth import router as auth_router

__all__ = [
    "auth_router",
    "analysis_router",
    "tools_router",
    "insights_router",
    "user_router",
    "notifications_router",
    "share_router",
    "copilot_router"
]
