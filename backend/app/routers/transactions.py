from typing import List, Optional
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.transaction import Transaction, Category, Tag
from app.schemas import (
    Transaction as TransactionSchema,
    TransactionCreate,
    TransactionUpdate,
    TransactionWithCategory
)
from app.routers.auth import get_current_active_user
from app.services.boursorama import BoursoramaService

router = APIRouter()
boursorama_service = BoursoramaService()


@router.get("/", response_model=List[TransactionWithCategory])
async def get_transactions(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    category_id: Optional[int] = None,
    is_expense: Optional[bool] = None,
    tag_id: Optional[int] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer toutes les transactions de l'utilisateur avec filtres optionnels.
    """
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    # Appliquer les filtres si fournis
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    # Filtre par mois et année
    if year and month:
        from sqlalchemy import extract
        query = query.filter(
            extract('year', Transaction.date) == year,
            extract('month', Transaction.date) == month
        )
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if is_expense is not None:
        query = query.filter(Transaction.is_expense == is_expense)
    if tag_id:
        query = query.join(Transaction.tags).filter(Tag.id == tag_id)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Transaction.description.ilike(search_term)) |
            (Transaction.merchant.ilike(search_term))
        )
    
    # Pagination et tri par date descendante
    transactions = query.order_by(Transaction.date.desc()).offset(skip).limit(limit).all()
    
    return transactions


@router.get("/{transaction_id}", response_model=TransactionWithCategory)
async def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer une transaction spécifique par son ID.
    """
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction non trouvée"
        )
    
    return transaction


@router.post("/", response_model=TransactionSchema, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction: TransactionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Créer une nouvelle transaction.
    """
    db_transaction = Transaction(
        user_id=current_user.id,
        date=transaction.date,
        amount=transaction.amount,
        description=transaction.description,
        merchant=transaction.merchant,
        is_expense=transaction.is_expense,
        is_recurring=transaction.is_recurring,
        category_id=transaction.category_id,
        external_id=transaction.external_id,
        explanation=transaction.explanation
    )
    
    # Ajouter les tags si fournis
    if transaction.tag_ids:
        tags = db.query(Tag).filter(Tag.id.in_(transaction.tag_ids)).all()
        db_transaction.tags = tags
    
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    
    return db_transaction


@router.put("/{transaction_id}", response_model=TransactionSchema)
async def update_transaction(
    transaction_id: int,
    transaction_update: TransactionUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Mettre à jour une transaction existante.
    """
    db_transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction non trouvée"
        )
    
    # Mettre à jour les champs fournis
    update_data = transaction_update.dict(exclude_unset=True)
    
    # Gérer séparément les tags s'ils sont fournis
    if "tag_ids" in update_data:
        tag_ids = update_data.pop("tag_ids")
        if tag_ids is not None:
            tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
            db_transaction.tags = tags
    
    for key, value in update_data.items():
        setattr(db_transaction, key, value)
    
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    
    return db_transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Supprimer une transaction.
    """
    db_transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction non trouvée"
        )
    
    db.delete(db_transaction)
    db.commit()
    
    return None


@router.post("/sync", status_code=status.HTTP_200_OK)
async def sync_transactions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Synchroniser les transactions depuis Boursorama.
    """
    try:
        new_transactions_count = boursorama_service.synchronize_user_transactions(current_user, db)
        
        return {
            "status": "success",
            "message": f"{new_transactions_count} nouvelles transactions importées",
            "count": new_transactions_count
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la synchronisation des transactions: {str(e)}"
        ) 