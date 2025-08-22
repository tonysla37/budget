import os
from typing import List
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str = "Budget App"
    PROJECT_VERSION: str = "0.1.0"
    
    # Environment
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # MongoDB
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "budget_db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-for-development-only")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 jours
    
    # Encryption
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", SECRET_KEY[:32].ljust(32, "x"))
    
    # CORS - Ajout du port 19006 pour Expo
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8080",
        "http://localhost:19006",  # Port Expo par défaut
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:19006",  # Port Expo par défaut
        "exp://localhost:19000",   # Expo dev server
        "exp://127.0.0.1:19000",   # Expo dev server
    ]
    
    class Config:
        case_sensitive = True


# Instantiate the settings object
settings = Settings() 