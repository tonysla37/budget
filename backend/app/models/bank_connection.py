from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, Field
from bson import ObjectId

class BankConnectionModel(BaseModel):
    """Modèle pour une connexion bancaire"""
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    bank: str  # 'boursobank', 'cic', etc.
    connection_type: str  # 'mock', 'scraping', 'api'
    nickname: Optional[str] = None
    
    # Credentials (seront chiffrés)
    encrypted_username: Optional[str] = None
    encrypted_password: Optional[str] = None
    encrypted_api_client_id: Optional[str] = None
    encrypted_api_client_secret: Optional[str] = None
    
    # Métadonnées
    is_active: bool = True
    accounts_count: int = 0
    last_sync: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat() if v else None,
        }

class BankAccountModel(BaseModel):
    """Modèle pour un compte bancaire"""
    id: Optional[str] = Field(default=None, alias="_id")
    connection_id: str
    user_id: str
    
    # Informations du compte
    external_id: str  # ID du compte chez la banque
    name: str
    account_type: str  # 'checking', 'savings', 'securities', etc.
    balance: float
    currency: str = "EUR"
    iban: Optional[str] = None
    
    # Métadonnées
    is_active: bool = True
    last_sync: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat() if v else None,
        }
