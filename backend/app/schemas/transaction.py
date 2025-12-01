from pydantic import BaseModel, Field
from typing import Optional, List, Union, Dict, Any
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
    id: str
    user_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    type: Optional[str] = "expense"
    parent_id: Optional[str] = None  # ID de la catégorie parente pour les sous-catégories


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    name: Optional[str] = None


class Category(CategoryBase):
    id: str
    user_id: Optional[str] = None
    type: Optional[str] = "expense"
    parent_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionBase(BaseModel):
    date: datetime
    amount: float
    description: str
    merchant: Optional[str] = None
    is_expense: Optional[bool] = None  # Peut être None, calculé depuis type si absent
    type: Optional[str] = None  # "income" ou "expense" pour les transactions bancaires
    is_recurring: bool = False
    category_id: Optional[str] = None
    external_id: Optional[str] = None
    explanation: Optional[str] = None


class TransactionCreate(TransactionBase):
    tag_ids: Optional[List[str]] = None


class TransactionUpdate(BaseModel):
    date: Optional[datetime] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    merchant: Optional[str] = None
    is_expense: Optional[bool] = None
    is_recurring: Optional[bool] = None
    category_id: Optional[str] = None
    tag_ids: Optional[List[str]] = None


class Transaction(TransactionBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    category: Optional[Category] = None
    tags: List[Tag] = []
    bank_connection_id: Optional[str] = None  # ID de la connexion bancaire
    bank_account_id: Optional[str] = None  # ID du compte bancaire
    bank: Optional[Dict[str, Any]] = None  # Infos de la banque (ajoutées dynamiquement)
    account: Optional[Dict[str, Any]] = None  # Infos du compte bancaire (ajoutées dynamiquement)

    class Config:
        from_attributes = True


class TransactionWithCategory(Transaction):
    category: Optional[Category] = None


class CategoryAmount(BaseModel):
    category_id: str
    category_name: str
    amount: float
    count: int


class MonthlyReport(BaseModel):
    year: int
    month: int
    total_income: float
    total_expenses: float
    net: float
    expenses_by_category: List[CategoryAmount]
    income_by_category: List[CategoryAmount]


class PeriodReport(BaseModel):
    start_date: datetime
    end_date: datetime
    total_income: float
    total_expenses: float
    net: float
    expenses_by_category: List[CategoryAmount]
    income_by_category: List[CategoryAmount]
    expenses_by_tag: dict
    income_by_tag: dict 