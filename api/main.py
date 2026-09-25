from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from observability.tracing import setup_langsmith_tracing
import data.database as db
import data.cache as cache
from api.routes import (
    analysis_router,
    tools_router,
    insights_router,
    user_router,
    notifications_router,
    share_router,
    copilot_router
)

# Initialize LangSmith / LangChain tracing
setup_langsmith_tracing()

# Initialize SQLite database schema & cache tables
db.init_db()
cache.init_cache_table()

app = FastAPI(
    title="CoFound.ai API",
    description="Autonomous Multi-Agent Market Intelligence Platform powered by LangGraph, Tavily, GPT-5.6-Luna & Supabase",
    version="2.1.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────
# Mount Domain Routers
# ─────────────────────────────────────────────────────
app.include_router(analysis_router)
app.include_router(tools_router)
app.include_router(insights_router)
app.include_router(user_router)
app.include_router(notifications_router)
app.include_router(share_router)
app.include_router(copilot_router)

@app.get("/")
def read_root():
    return {
        "status": "ok",
        "service": "CoFound.ai Modular Backend",
        "model": "gpt-5.6-luna",
        "persistence": "Dual (Supabase PostgreSQL + SQLite)",
        "cache": "Active"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
