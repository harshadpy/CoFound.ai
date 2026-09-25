# CoFound.ai

**Autonomous Market Intelligence Agent**

CoFound.ai is an agentic platform that acts as your AI Co-Founder. It autonomously researches your startup idea, analyzes competitors, identifies market gaps, and generates a comprehensive strategic report using a multi-agent system orchestrated by **LangGraph**.

## Architecture

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: FastAPI, LangGraph, LangChain
- **AI Models**: OpenAI (GPT-4o, o1-mini)
- **Tools**: DuckDuckGo Search, Custom Web Scraper

## Setup & Run

### Prerequisites
- Python 3.10+
- Node.js 18+
- OpenAI API Key

### 1. Configure Environment
Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=sk-your-key-here
```

### 2. Backend (API & Agents)
```bash
# Install dependencies
pip install -r requirements.txt

# Run the API server
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```
The API will be available at `http://localhost:8000`.

### 3. Frontend (UI)
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
The UI will be available at `http://localhost:5173`.

## Features

- **Autonomous Analysis**: Input an idea, and 11 specialized agents (Ideation, Competitor, Trends, etc.) collaborate to analyze it.
- **Real-time Research**: Agents browse the web to find the latest data.
- **Stateful Workflow**: LangGraph manages the complex parallel and sequential logic.
- **Tools**: Trend Explorer, Competitor Research, and Market Gap Matrix.

## License
MIT
