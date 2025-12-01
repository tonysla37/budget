from typing import List, Optional, Dict, Any
from datetime import datetime, date, UTC
from bson import ObjectId
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.database import get_db

logger = logging.getLogger("budget-api")
from app.models.user import User
from app.models.transaction import Transaction, Category, Tag
from app.schemas import (
    Transaction as TransactionSchema,
    TransactionCreate,
    TransactionUpdate,
    TransactionWithCategory
)
from app.services.auth import get_current_user
# from app.services.boursorama import BoursoramaService  # Ancien service, remplacé par bank_connections

router = APIRouter(prefix="/api/transactions", tags=["transactions"])
# boursorama_service = BoursoramaService()  # Ancien service, remplacé par bank_connections


def prepare_mongodb_document_for_response(document: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prépare un document MongoDB pour être retourné en réponse.
    Convertit _id en id et effectue d'autres transformations nécessaires.
    """
    if document is None:
        return None
    
    result = {}
    for key, value in document.items():
        if key == "_id":
            result["id"] = str(value)
        elif isinstance(value, ObjectId):
            # Convertir les ObjectId en chaînes de caractères
            result[key] = str(value)
        elif isinstance(value, str) and key in ["date", "created_at", "updated_at"]:
            # Convertir les dates en string ISO en objets datetime
            try:
                result[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
            except:
                result[key] = value
        else:
            result[key] = value
    
    # Ajouter created_at si manquant (pour les catégories)
    if "created_at" not in result:
        result["created_at"] = datetime.now(UTC)
    
    return result


@router.get("/", response_model=List[TransactionWithCategory])
async def get_transactions(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    category_id: Optional[str] = None,
    is_expense: Optional[bool] = None,
    tag_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Récupérer toutes les transactions de l'utilisateur avec filtres optionnels.
    """
    # Construire le filtre MongoDB
    filter_query = {"user_id": current_user["_id"]}
    
    # Appliquer les filtres si fournis
    if start_date:
        filter_query["date"] = {"$gte": datetime.combine(start_date, datetime.min.time())}
    if end_date:
        if "date" in filter_query:
            filter_query["date"]["$lte"] = datetime.combine(end_date, datetime.max.time())
        else:
            filter_query["date"] = {"$lte": datetime.combine(end_date, datetime.max.time())}
    
    # Filtre par mois et année
    if year and month:
        start_of_month = datetime(year, month, 1)
        if month == 12:
            end_of_month = datetime(year + 1, 1, 1)
        else:
            end_of_month = datetime(year, month + 1, 1)
        
        filter_query["date"] = {"$gte": start_of_month, "$lt": end_of_month}
    
    if category_id:
        filter_query["category_id"] = ObjectId(category_id)
    
    if is_expense is not None:
        filter_query["is_expense"] = is_expense
    
    if search:
        filter_query["$or"] = [
            {"description": {"$regex": search, "$options": "i"}},
            {"merchant": {"$regex": search, "$options": "i"}}
        ]
    
    # Exécuter la requête MongoDB
    collection = await db.get_collection("transactions")
    cursor = collection.find(filter_query).sort("date", -1).skip(skip).limit(limit)
    transactions = await cursor.to_list(length=limit)
    
    # Préparer les transactions pour la réponse
    result = []
    bank_connections_collection = await db.get_collection("bank_connections")
    
    for transaction in transactions:
        # Récupérer la catégorie si elle existe
        category = None
        if transaction.get("category_id"):
            category = await db.find_one("categories", {"_id": transaction["category_id"]})
        
        # Récupérer la connexion bancaire si elle existe
        bank_connection = None
        bank_account = None
        if transaction.get("bank_connection_id"):
            # bank_connection_id est déjà un ObjectId dans la base
            bank_conn_id = transaction["bank_connection_id"]
            if isinstance(bank_conn_id, str):
                bank_conn_id = ObjectId(bank_conn_id)
            bank_connection = await bank_connections_collection.find_one({
                "_id": bank_conn_id
            })
        
        # Récupérer le compte bancaire si il existe
        if transaction.get("bank_account_id"):
            bank_accounts_collection = await db.get_collection("bank_accounts")
            bank_acc_id = transaction["bank_account_id"]
            if isinstance(bank_acc_id, str):
                bank_acc_id = ObjectId(bank_acc_id)
            bank_account = await bank_accounts_collection.find_one({
                "_id": bank_acc_id
            })
        
        # Préparer la transaction
        transaction_data = prepare_mongodb_document_for_response(transaction)
        if category:
            transaction_data["category"] = prepare_mongodb_document_for_response(category)
        
        # Ajouter les infos de la banque
        if bank_connection:
            transaction_data["bank"] = {
                "id": str(bank_connection["_id"]),
                "name": bank_connection.get("bank"),
                "nickname": bank_connection.get("nickname"),
                "connection_type": bank_connection.get("connection_type")
            }
        
        # Ajouter les infos du compte bancaire
        if bank_account:
            transaction_data["account"] = {
                "id": str(bank_account["_id"]),
                "name": bank_account.get("name"),
                "type": bank_account.get("account_type"),
                "external_id": bank_account.get("external_id"),
                "balance": bank_account.get("balance"),
                "currency": bank_account.get("currency", "EUR")
            }
        
        result.append(transaction_data)
    
    return result


@router.post("/", response_model=TransactionSchema)
async def create_transaction(
    transaction: TransactionCreate,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Créer une nouvelle transaction.
    """
    # Préparer les données de la transaction
    transaction_data = transaction.model_dump()
    transaction_data["user_id"] = current_user["_id"]
    transaction_data["created_at"] = datetime.now(UTC)
    transaction_data["updated_at"] = datetime.now(UTC)
    
    # Convertir les ObjectId si nécessaire
    if transaction_data.get("category_id"):
        transaction_data["category_id"] = ObjectId(transaction_data["category_id"])
    
    # Insérer la transaction
    result = await db.insert_one("transactions", transaction_data)
    transaction_data["_id"] = result
    
    return prepare_mongodb_document_for_response(transaction_data)


@router.get("/{transaction_id}", response_model=TransactionWithCategory)
async def get_transaction(
    transaction_id: str,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Récupérer une transaction spécifique.
    """
    # Vérifier que la transaction appartient à l'utilisateur
    transaction = await db.find_one("transactions", {
        "_id": ObjectId(transaction_id),
        "user_id": current_user["_id"]
    })
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction non trouvée"
        )
    
    # Récupérer la catégorie si elle existe
    category = None
    if transaction.get("category_id"):
        category = await db.find_one("categories", {"_id": transaction["category_id"]})
    
    # Préparer la réponse
    transaction_data = prepare_mongodb_document_for_response(transaction)
    if category:
        transaction_data["category"] = prepare_mongodb_document_for_response(category)
    
    return transaction_data


@router.put("/{transaction_id}", response_model=TransactionSchema)
async def update_transaction(
    transaction_id: str,
    transaction_update: TransactionUpdate,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Mettre à jour une transaction existante.
    """
    # Vérifier que la transaction appartient à l'utilisateur
    existing_transaction = await db.find_one("transactions", {
        "_id": ObjectId(transaction_id),
        "user_id": current_user["_id"]
    })
    
    if not existing_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction non trouvée"
        )
    
    # Préparer les données de mise à jour
    update_data = transaction_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(UTC)
    
    # Convertir les ObjectId si nécessaire
    if update_data.get("category_id"):
        update_data["category_id"] = ObjectId(update_data["category_id"])
    
    # Mettre à jour la transaction
    await db.update_one(
        "transactions",
        {"_id": ObjectId(transaction_id)},
        update_data
    )
    
    # Récupérer la transaction mise à jour
    updated_transaction = await db.find_one("transactions", {"_id": ObjectId(transaction_id)})
    
    return prepare_mongodb_document_for_response(updated_transaction)


@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: str,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Supprimer une transaction.
    """
    # Vérifier que la transaction appartient à l'utilisateur
    existing_transaction = await db.find_one("transactions", {
        "_id": ObjectId(transaction_id),
        "user_id": current_user["_id"]
    })
    
    if not existing_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction non trouvée"
        )
    
    # Supprimer la transaction
    await db.delete_one("transactions", {"_id": ObjectId(transaction_id)})
    
    return {"message": "Transaction supprimée avec succès"}


# ANCIEN ENDPOINT - Remplacé par le système de connexions bancaires (/api/bank-connections)
# @router.post("/import/boursorama")
# async def import_boursorama_transactions(
#     current_user: Dict = Depends(get_current_user),
#     db = Depends(get_db)
# ):
#     """
#     Importer les transactions depuis Boursorama.
#     DEPRECATED: Utiliser /api/bank-connections/{id}/sync à la place
#     """
#     raise HTTPException(
#         status_code=status.HTTP_410_GONE,
#         detail="Cet endpoint est obsolète. Utilisez /api/bank-connections pour gérer vos connexions bancaires."
#     )


@router.get("/stats/summary")
async def get_transaction_summary(
    year: Optional[int] = None,
    month: Optional[int] = None,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Récupérer un résumé des transactions.
    """
    # Construire le filtre de date
    date_filter = {}
    if year and month:
        start_of_month = datetime(year, month, 1)
        if month == 12:
            end_of_month = datetime(year + 1, 1, 1)
        else:
            end_of_month = datetime(year, month + 1, 1)
        
        date_filter = {"date": {"$gte": start_of_month, "$lt": end_of_month}}
    
    # Agréger les données
    pipeline = [
        {"$match": {"user_id": current_user["_id"]}},
        {"$group": {
            "_id": "$is_expense",
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    
    if date_filter:
        pipeline.insert(1, {"$match": date_filter})
    
    collection = await db.get_collection("transactions")
    results = await collection.aggregate(pipeline).to_list(length=None)
    
    # Préparer la réponse
    summary = {
        "total_income": 0,
        "total_expenses": 0,
        "income_count": 0,
        "expense_count": 0
    }
    
    for result in results:
        if result["_id"]:  # is_expense = True
            summary["total_expenses"] = result["total"]
            summary["expense_count"] = result["count"]
        else:  # is_expense = False
            summary["total_income"] = result["total"]
            summary["income_count"] = result["count"]
    
    summary["net_amount"] = summary["total_income"] - summary["total_expenses"]
    
    return summary 