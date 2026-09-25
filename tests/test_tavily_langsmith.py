import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
load_dotenv()

from config.config import settings
from observability.tracing import setup_langsmith_tracing, get_langsmith_config
from tools.search import search_service
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

def test_tavily_and_langsmith():
    print("=== 1. Checking Configuration ===")
    print(f"OpenAI Key set: {bool(settings.openai_api_key)}")
    print(f"Tavily Key set: {bool(settings.tavily_api_key)}")
    print(f"LangSmith Project: {settings.langsmith_project}")
    
    print("\n=== 2. Testing LangSmith Tracing Setup ===")
    tracing_active = setup_langsmith_tracing()
    print(f"LangSmith Tracing Active: {tracing_active}")
    assert tracing_active, "LangSmith tracing should be active"
    
    print("\n=== 3. Testing Real-time Search with Tavily ===")
    query = "AI market intelligence agent startups 2025"
    search_result = search_service.search(query, max_results=2)
    print(f"Is Tavily Provider Active: {search_service.is_tavily_active}")
    print(f"Search Snippet:\n{search_result[:350]}...\n")
    assert search_service.is_tavily_active, "Tavily should be the active search provider"
    assert len(search_result) > 50, "Search result should contain relevant context"

    print("\n=== 4. Testing Traced LangChain Invocation to LangSmith ===")
    cfg = get_langsmith_config(
        analysis_id="test-run-verification",
        tags=["verification-test", "langsmith-tavily"]
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an AI analyst. Summarize in one short sentence."),
        ("user", "Summarize this market signal: {signal}")
    ])
    model = ChatOpenAI(model=settings.model_fast, api_key=settings.openai_api_key)
    chain = prompt | model | StrOutputParser()
    
    response = chain.invoke({"signal": search_result[:300]}, config=cfg)
    print(f"Traced LLM Response: {response}")
    print("\n[SUCCESS] LangSmith tracing and Tavily search are fully operational!")

if __name__ == "__main__":
    test_tavily_and_langsmith()
