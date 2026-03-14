from pathlib import Path
from typing import List, Optional

from pydantic_settings import BaseSettings

# Get the absolute path to the .env file
env_path = Path(__file__).parent.parent.parent.parent / '.env'

class Settings(BaseSettings):
    # Project
    PROJECT_NAME: str = "Meal Planner API"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str
    TEST_DATABASE_URL: Optional[str] = None
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]  # Frontend URL
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Gemini (LLM)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    # First superuser
    FIRST_SUPERUSER_EMAIL: str = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = ""

    # Startup seeding
    SEED_DEFAULT_ALLERGIES: bool = True
    SEED_DEFAULT_ALLERGIES_AUTOMAP_LIMIT: int = 25

    class Config:
        case_sensitive = True
        env_file = str(env_path)
        env_file_encoding = 'utf-8'

# Create settings instance
settings = Settings()
