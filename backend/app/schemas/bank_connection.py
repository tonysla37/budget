from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, field_validator

class BankConnectionCreate(BaseModel):
    """Schéma pour créer une connexion bancaire"""
    bank: str
    connection_type: str  # 'mock', 'scraping', 'api'
    nickname: Optional[str] = None
    
    # Credentials en clair (seront chiffrés côté backend)
    username: Optional[str] = None
    password: Optional[str] = None
    api_client_id: Optional[str] = None
    api_client_secret: Optional[str] = None
    
    @field_validator('bank')
    @classmethod
    def validate_bank(cls, v):
        valid_banks = ['boursobank', 'cic']
        if v not in valid_banks:
            raise ValueError(f"Banque non supportée. Valeurs autorisées: {', '.join(valid_banks)}")
        return v
    
    @field_validator('connection_type')
    @classmethod
    def validate_connection_type(cls, v):
        valid_types = ['mock', 'scraping', 'api']
        if v not in valid_types:
            raise ValueError(f"Type de connexion non supporté. Valeurs autorisées: {', '.join(valid_types)}")
        return v

class BankConnectionUpdate(BaseModel):
    """Schéma pour mettre à jour une connexion bancaire"""
    nickname: Optional[str] = None
    is_active: Optional[bool] = None
    username: Optional[str] = None
    password: Optional[str] = None
    api_client_id: Optional[str] = None
    api_client_secret: Optional[str] = None

class BankConnectionResponse(BaseModel):
    """Schéma de réponse pour une connexion bancaire"""
    id: str
    bank: str
    connection_type: str
    nickname: Optional[str] = None
    is_active: bool
    accounts_count: int = 0
    last_sync: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Note: les credentials chiffrés ne sont jamais renvoyés
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None,
        }

class BankAccountResponse(BaseModel):
    """Schéma de réponse pour un compte bancaire"""
    id: str
    connection_id: str
    external_id: str
    name: str
    account_type: str
    balance: float
    currency: str
    iban: Optional[str] = None
    is_active: bool
    last_sync: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None,
        }

class SyncResult(BaseModel):
    """Schéma de résultat de synchronisation"""
    success: bool
    new_transactions: int = 0
    updated_accounts: int = 0
    error: Optional[str] = None
    synced_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None,
        }
