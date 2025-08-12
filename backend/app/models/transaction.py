"""
Modèle de données pour les transactions.
Ce modèle est utilisé pour structurer les données de transactions pour MongoDB.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from bson import ObjectId
from pydantic import BaseModel, Field

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


class Transaction(BaseModel):
    """
    Modèle de données pour une transaction.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    date: datetime
    amount: float
    description: str
    merchant: Optional[str] = None
    explanation: Optional[str] = None
    is_expense: bool = True
    category_id: Optional[str] = None
    tags: Optional[List[str]] = []
    metadata: Optional[List[Dict[str, Any]]] = []
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None

    class Config:
        validate_by_name = True  # anciennement allow_population_by_field_name
        json_encoders = {
            ObjectId: str
        }


class TransactionMetadata(BaseModel):
    """
    Modèle de données pour les métadonnées d'une transaction.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    transaction_id: str
    key: str
    value: Union[str, int, float, bool, Dict[str, Any], List[Any]]
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None

    class Config:
        validate_by_name = True  # anciennement allow_population_by_field_name
        json_encoders = {
            ObjectId: str
        }


class Category(BaseModel):
    """
    Modèle de données pour une catégorie.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#4CAF50"  # Couleur par défaut
    icon: Optional[str] = None
    user_id: Optional[str] = None  # None pour les catégories système
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None

    class Config:
        validate_by_name = True  # anciennement allow_population_by_field_name
        json_encoders = {
            ObjectId: str
        }


class Tag(BaseModel):
    """
    Modèle de données pour un tag.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#3498db"  # Couleur par défaut
    user_id: Optional[str] = None  # None pour les tags système
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None

    class Config:
        validate_by_name = True  # anciennement allow_population_by_field_name
        json_encoders = {
            ObjectId: str
        }
