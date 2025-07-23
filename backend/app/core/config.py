import os
from typing import List
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str = "Budget App"
    PROJECT_VERSION: str = "0.1.0"
    
    # MongoDB
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "budget_db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-for-development-only")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:5173",
        "http://localhost:19000",  # Expo
        "http://localhost:19006",  # Expo web
        "exp://localhost:19000",   # Expo mobile
    ]
    
    # Boursorama API
    BOURSORAMA_API_URL: str = os.getenv("BOURSORAMA_API_URL", "")
    
    # Encryption key for Boursorama credentials
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", SECRET_KEY)
    
    class Config:
        case_sensitive = True


settings = Settings() 