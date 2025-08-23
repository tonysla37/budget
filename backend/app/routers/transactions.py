from typing import List, Optional, Dict, Any
from datetime import datetime, date, UTC
from bson import ObjectId

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.database import get_db
from app.models.user import User
from app.models.transaction import Transaction, Category, Tag
from app.schemas import (
    Transaction as TransactionSchema,
    TransactionCreate,
    TransactionUpdate,
    TransactionWithCategory
)
from app.services.auth import get_current_user
from app.services.boursorama import BoursoramaService

router = APIRouter(prefix="/api/transactions", tags=["transactions"])
boursorama_service = BoursoramaService()


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
        else:
            result[key] = value
    
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
    filter_query = {"user_id": str(current_user["_id"])}
    
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
    for transaction in transactions:
        # Récupérer la catégorie si elle existe
        category = None
        if transaction.get("category_id"):
            category = await db.find_one("categories", {"_id": transaction["category_id"]})
        
        # Préparer la transaction
        transaction_data = prepare_mongodb_document_for_response(transaction)
        if category:
            transaction_data["category"] = prepare_mongodb_document_for_response(category)
        
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
        {"$set": update_data}
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


@router.post("/import/boursorama")
async def import_boursorama_transactions(
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Importer les transactions depuis Boursorama.
    """
    try:
        # Récupérer les identifiants Boursorama de l'utilisateur
        user_credentials = await db.find_one("boursorama_credentials", {
            "user_id": current_user["_id"]
        })
        
        if not user_credentials:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Aucune identifiants Boursorama configurés"
            )
        
        # Importer les transactions
        imported_count = await boursorama_service.import_transactions(
            user_credentials["username"],
            user_credentials["password"],
            current_user["_id"],
            db
        )
        
        return {
            "message": f"{imported_count} transactions importées avec succès",
            "imported_count": imported_count
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'import: {str(e)}"
        )


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