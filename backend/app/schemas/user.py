from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from bson import ObjectId


class Token(BaseModel):
    """Schema for the authentication token."""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Schema for the token data."""
    email: Optional[str] = None


class LoginRequest(BaseModel):
    """Schema for login request."""
    email: EmailStr
    password: str


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool = True
    billing_cycle_day: int = 1  # Jour de début du cycle de facturation (1-28)


class UserCreate(UserBase):
    """Schema for user creation."""
    password: str


class UserUpdate(BaseModel):
    """Schema for user update."""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: Optional[bool] = None
    billing_cycle_day: Optional[int] = None
    password: Optional[str] = None
    
    @field_validator('billing_cycle_day')
    def validate_billing_cycle_day(cls, v):
        if v is not None and (v < 1 or v > 28):
            raise ValueError('billing_cycle_day doit être entre 1 et 28')
        return v


class ChangePasswordRequest(BaseModel):
    """Schema for password change request."""
    current_password: str
    new_password: str
    
    @field_validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 6:
            raise ValueError('Le nouveau mot de passe doit contenir au moins 6 caractères')
        return v


class User(UserBase):
    """Schema for user response."""
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {ObjectId: str}
        populate_by_name = True

    @field_validator('id', mode='before')
    @classmethod
    def validate_id(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v


class UserInDB(User):
    """Schema for user in database."""
    hashed_password: str


class BoursoramaCredentials(BaseModel):
    """Schema for Boursorama credentials."""
    username: str
    password: str 