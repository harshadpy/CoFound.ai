# =====================================================================
# Stage 1: Build Frontend Single-Page Application (Vite + React)
# =====================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source and build static bundle
COPY frontend/ ./
RUN npm run build

# =====================================================================
# Stage 2: Production Python Runtime
# =====================================================================
FROM python:3.11-slim AS production

# Set environment defaults
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application backend source
COPY agents/ ./agents/
COPY api/ ./api/
COPY config/ ./config/
COPY data/ ./data/
COPY guardrails/ ./guardrails/
COPY observability/ ./observability/
COPY orchestration/ ./orchestration/
COPY tools/ ./tools/
COPY utils/ ./utils/
COPY render.yaml runtime.txt ./

# Copy built frontend assets from stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Ensure persistent data directory exists
RUN mkdir -p /app/data/reports /app/data/memory

# Expose HTTP port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Start Uvicorn ASGI server
CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT}"]
