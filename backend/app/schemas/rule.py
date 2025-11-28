from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class RuleCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    pattern: str = Field(..., min_length=1)
    match_type: str = Field(..., pattern="^(contains|starts_with|ends_with|exact)$")
    category_id: str
    is_active: bool = True

class RuleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    pattern: Optional[str] = Field(None, min_length=1)
    match_type: Optional[str] = Field(None, pattern="^(contains|starts_with|ends_with|exact)$")
    category_id: Optional[str] = None
    is_active: Optional[bool] = None

class RuleResponse(BaseModel):
    id: str
    name: str
    pattern: str
    match_type: str
    category_id: str
    category_name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
