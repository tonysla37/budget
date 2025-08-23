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


class UserCreate(UserBase):
    """Schema for user creation."""
    password: str


class UserUpdate(UserBase):
    """Schema for user update."""
    password: Optional[str] = None


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