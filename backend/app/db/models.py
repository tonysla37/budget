from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
from pydantic import BaseModel, Field

# Classe utilitaire pour gérer ObjectId MongoDB dans Pydantic
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("ObjectId invalide")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

# Modèles de base
class MongoBaseModel(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat(),
        }

# Modèles utilisateur
class UserModel(MongoBaseModel):
    email: str
    hashed_password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False
    bourso_username_encrypted: Optional[str] = None
    bourso_password_encrypted: Optional[str] = None
    last_sync: Optional[datetime] = None

    def to_json(self):
        return {
            "_id": str(self.id),
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "is_active": self.is_active,
            "is_superuser": self.is_superuser,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_sync": self.last_sync.isoformat() if self.last_sync else None,
        }

# Modèles de catégorie et tag
class CategoryModel(MongoBaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    user_id: Optional[str] = None  # None pour les catégories système
    
    def to_json(self):
        return {
            "_id": str(self.id),
            "name": self.name,
            "description": self.description,
            "color": self.color,
            "icon": self.icon,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat(),
        }

class TagModel(MongoBaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    user_id: Optional[str] = None  # None pour les tags système
    
    def to_json(self):
        return {
            "_id": str(self.id),
            "name": self.name,
            "description": self.description,
            "color": self.color,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat(),
        }

# Modèle de transaction
class TransactionModel(MongoBaseModel):
    user_id: str
    date: datetime
    amount: float
    description: str
    merchant: Optional[str] = None
    is_expense: bool = True  # True pour une dépense, False pour un revenu
    is_recurring: bool = False
    category_id: Optional[str] = None
    external_id: Optional[str] = None  # ID depuis Boursorama
    tag_ids: List[str] = []
    explanation: Optional[str] = None  # Explication pour la ligne de débit
    
    def to_json(self):
        return {
            "_id": str(self.id),
            "user_id": self.user_id,
            "date": self.date.isoformat(),
            "amount": self.amount,
            "description": self.description,
            "merchant": self.merchant,
            "is_expense": self.is_expense,
            "is_recurring": self.is_recurring,
            "category_id": self.category_id,
            "external_id": self.external_id,
            "tag_ids": self.tag_ids,
            "explanation": self.explanation,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

# Collections MongoDB
USERS_COLLECTION = "users"
CATEGORIES_COLLECTION = "categories"
TAGS_COLLECTION = "tags"
TRANSACTIONS_COLLECTION = "transactions"

# Fonctions helper pour manipuler les collections
async def create_indexes(db):
    """
    Crée les index nécessaires sur les collections MongoDB.
    """
    # Index utilisateurs
    await db.get_collection(USERS_COLLECTION).create_index("email", unique=True)
    
    # Index transactions
    await db.get_collection(TRANSACTIONS_COLLECTION).create_index("user_id")
    await db.get_collection(TRANSACTIONS_COLLECTION).create_index("date")
    await db.get_collection(TRANSACTIONS_COLLECTION).create_index([("user_id", 1), ("external_id", 1)], unique=True, sparse=True)
    
    # Index catégories
    await db.get_collection(CATEGORIES_COLLECTION).create_index([("name", 1), ("user_id", 1)], unique=True)
    
    # Index tags
    await db.get_collection(TAGS_COLLECTION).create_index([("name", 1), ("user_id", 1)], unique=True) 