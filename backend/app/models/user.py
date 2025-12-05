"""
Modèle de données pour les utilisateurs.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId

class PyObjectId(ObjectId):
    """Helper pour convertir les ObjectId en strings et vice versa."""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("ObjectId invalide")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, _schema_generator, _field):
        return {"type": "string"}


class User(BaseModel):
    """
    Modèle de données pour un utilisateur.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    email: EmailStr
    username: Optional[str] = None
    hashed_password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False
    role: str = "user"  # "user" ou "admin"
    
    # Préférences utilisateur
    preferences: Optional[Dict[str, Any]] = {}
    
    # Intégrations externes
    external_accounts: Optional[Dict[str, Any]] = {}
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None
    
    class Config:
        validate_by_name = True  # anciennement allow_population_by_field_name
        json_encoders = {
            ObjectId: str
        }


class UserInDB(User):
    """
    Modèle utilisé en interne pour stocker l'utilisateur dans la base de données.
    Cette classe étend User et ajoute des champs supplémentaires non exposés à l'API.
    """
    security_token: Optional[str] = None
    security_token_expires: Optional[datetime] = None
    password_reset_token: Optional[str] = None
    password_reset_expires: Optional[datetime] = None
    last_login: Optional[datetime] = None
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None
