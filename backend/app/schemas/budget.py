from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class BudgetCreate(BaseModel):
    category_id: str
    amount: float = Field(..., gt=0, description="Montant du budget (doit être > 0)")
    period_type: str = Field(default="monthly", pattern="^(monthly|yearly)$")

class BudgetUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    period_type: Optional[str] = Field(None, pattern="^(monthly|yearly)$")

class BudgetResponse(BaseModel):
    id: str
    category_id: str
    category_name: str
    category_color: str
    amount: float
    spent: float
    remaining: float
    percentage: float
    period_type: str

    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}
