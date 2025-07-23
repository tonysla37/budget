from pydantic import BaseModel, Field
from typing import Optional, List, Union
from datetime import datetime


class TagBase(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = None


class TagCreate(TagBase):
    pass


class TagUpdate(TagBase):
    name: Optional[str] = None


class Tag(TagBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    name: Optional[str] = None


class Category(CategoryBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionBase(BaseModel):
    date: datetime
    amount: float
    description: str
    merchant: Optional[str] = None
    is_expense: bool = True
    is_recurring: bool = False
    category_id: Optional[int] = None
    external_id: Optional[str] = None
    explanation: Optional[str] = None


class TransactionCreate(TransactionBase):
    tag_ids: Optional[List[int]] = None


class TransactionUpdate(BaseModel):
    date: Optional[datetime] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    merchant: Optional[str] = None
    is_expense: Optional[bool] = None
    is_recurring: Optional[bool] = None
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = None


class Transaction(TransactionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    category: Optional[Category] = None
    tags: List[Tag] = []

    class Config:
        from_attributes = True


class TransactionWithCategory(Transaction):
    category: Optional[Category] = None


class MonthlyReport(BaseModel):
    year: int
    month: int
    total_income: float
    total_expenses: float
    net: float
    expenses_by_category: dict
    income_by_category: dict


class PeriodReport(BaseModel):
    start_date: datetime
    end_date: datetime
    total_income: float
    total_expenses: float
    net: float
    expenses_by_category: dict
    income_by_category: dict
    expenses_by_tag: dict
    income_by_tag: dict 