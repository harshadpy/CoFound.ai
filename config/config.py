from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
from typing import Optional
import os

class Settings(BaseSettings):
    app_name: str = "CoFound.ai"
    openai_api_key: str
    model_fast: str = "gpt-5.6-luna"
    model_reasoning: str = "gpt-5.6-luna"
    model_fallback: str = "gpt-4o-mini"
    
    # Tavily Search
    tavily_api_key: Optional[str] = Field(default=None, validation_alias="TAVILY_API_KEY")
    
    # LangSmith / LangChain Observability
    langsmith_api_key: Optional[str] = Field(default=None, validation_alias="LANGSMITH_API_KEY")
    langchain_api_key: Optional[str] = Field(default=None, validation_alias="LANGCHAIN_API_KEY")
    langsmith_tracing: Optional[str] = Field(default="true", validation_alias="LANGSMITH_TRACING")
    langchain_tracing_v2: Optional[str] = Field(default="true", validation_alias="LANGCHAIN_TRACING_V2")
    langsmith_project: Optional[str] = Field(default="cofound", validation_alias="LANGSMITH_PROJECT")
    langsmith_endpoint: Optional[str] = Field(default="https://api.smith.langchain.com", validation_alias="LANGSMITH_ENDPOINT")
    
    # Supabase Cloud Project
    supabase_url: Optional[str] = Field(default=None, validation_alias="SUPABASE_URL")
    supabase_anon_key: Optional[str] = Field(default=None, validation_alias="SUPABASE_ANON_KEY")
    supabase_publishable_key: Optional[str] = Field(default=None, validation_alias="SUPABASE_PUBLISHABLE_KEY")
    
    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
