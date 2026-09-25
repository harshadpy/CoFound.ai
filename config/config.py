from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    app_name: str = "CoFound.ai"
    openai_api_key: str
    model_fast: str = "gpt-4o-mini"
    model_reasoning: str = "o1-mini"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
