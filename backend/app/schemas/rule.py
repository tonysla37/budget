from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime, date

class RuleCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    pattern: str = Field(..., min_length=1)
    match_type: str = Field(..., pattern="^(contains|starts_with|ends_with|exact)$")
    category_id: str
    is_active: bool = True
    exceptions: List[str] = Field(default_factory=list)
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    @field_validator('start_date', 'end_date', mode='before')
    @classmethod
    def empty_str_to_none(cls, v):
        if v == '' or v == 'null':
            return None
        return v

class RuleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    pattern: Optional[str] = Field(None, min_length=1)
    match_type: Optional[str] = Field(None, pattern="^(contains|starts_with|ends_with|exact)$")
    category_id: Optional[str] = None
    is_active: Optional[bool] = None
    exceptions: Optional[List[str]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    @field_validator('start_date', 'end_date', mode='before')
    @classmethod
    def empty_str_to_none(cls, v):
        if v == '' or v == 'null':
            return None
        return v

class RuleResponse(BaseModel):
    id: str
    name: str
    pattern: str
    match_type: str
    category_id: str
    category_name: str
    is_active: bool
    exceptions: List[str] = Field(default_factory=list)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
