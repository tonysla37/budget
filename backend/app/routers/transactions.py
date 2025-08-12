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
from app.routers.auth import get_current_active_user
from app.services.boursorama import BoursoramaService

router = APIRouter()
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
    current_user: Dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """
    Récupérer toutes les transactions de l'utilisateur avec filtres optionnels.
    """
    # Construire le filtre MongoDB
    filter_query = {"user_id": current_user["id"] if "id" in current_user else current_user["_id"]}
    
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
        filter_query["category_id"] = category_id
    
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
    
    # Si nous avons des transactions et qu'elles ont des category_id, récupérer les catégories
    if transactions:
        category_ids = [t["category_id"] for t in transactions if "category_id" in t and t["category_id"]]
        categories = {}
        
        if category_ids:
            categories_collection = await db.get_collection("categories")
            categories_cursor = categories_collection.find({"_id": {"$in": [ObjectId(cid) for cid in category_ids if cid]}})
            categories_list = await categories_cursor.to_list(length=len(category_ids))
            categories = {str(cat["_id"]): cat for cat in categories_list}
        
        # Ajouter les informations de catégorie à chaque transaction
        for transaction in transactions:
            if "category_id" in transaction and transaction["category_id"] and transaction["category_id"] in categories:
                transaction["category"] = prepare_mongodb_document_for_response(categories[transaction["category_id"]])
    
    # Préparer les transactions pour la réponse
    return [prepare_mongodb_document_for_response(t) for t in transactions]


@router.get("/{transaction_id}", response_model=TransactionWithCategory)
async def get_transaction(
    transaction_id: str,
    current_user: Dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """
    Récupérer une transaction spécifique par son ID.
    """
    collection = await db.get_collection("transactions")
    user_id = current_user["id"] if "id" in current_user else current_user["_id"]
    transaction = await collection.find_one({"_id": ObjectId(transaction_id), "user_id": user_id})
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction non trouvée"
        )
    
    # Récupérer les informations de catégorie si nécessaire
    if "category_id" in transaction and transaction["category_id"]:
        categories_collection = await db.get_collection("categories")
        category = await categories_collection.find_one({"_id": ObjectId(transaction["category_id"])})
        if category:
            transaction["category"] = prepare_mongodb_document_for_response(category)
    
    return prepare_mongodb_document_for_response(transaction)


@router.post("/", response_model=TransactionSchema, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction: TransactionCreate,
    current_user: Dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """
    Créer une nouvelle transaction.
    """
    transaction_dict = transaction.model_dump()  # Utiliser model_dump() au lieu de dict()
    transaction_dict["user_id"] = current_user["id"] if "id" in current_user else current_user["_id"]
    transaction_dict["created_at"] = datetime.now(UTC)
    
    collection = await db.get_collection("transactions")
    result = await collection.insert_one(transaction_dict)
    
    # Récupérer la transaction créée
    created_transaction = await collection.find_one({"_id": result.inserted_id})
    
    return prepare_mongodb_document_for_response(created_transaction)


@router.put("/{transaction_id}", response_model=TransactionSchema)
async def update_transaction(
    transaction_id: str,
    transaction_update: TransactionUpdate,
    current_user: Dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """
    Mettre à jour une transaction existante.
    """
    collection = await db.get_collection("transactions")
    user_id = current_user["id"] if "id" in current_user else current_user["_id"]
    
    # Vérifier que la transaction existe et appartient à l'utilisateur
    transaction = await collection.find_one({"_id": ObjectId(transaction_id), "user_id": user_id})
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction non trouvée"
        )
    
    # Préparer les données de mise à jour
    update_data = {k: v for k, v in transaction_update.model_dump(exclude_unset=True).items()}  # Utiliser model_dump() au lieu de dict()
    update_data["updated_at"] = datetime.now(UTC)
    
    # Mettre à jour la transaction
    await collection.update_one(
        {"_id": ObjectId(transaction_id)},
        {"$set": update_data}
    )
    
    # Récupérer la transaction mise à jour
    updated_transaction = await collection.find_one({"_id": ObjectId(transaction_id)})
    
    return prepare_mongodb_document_for_response(updated_transaction)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: str,
    current_user: Dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """
    Supprimer une transaction.
    """
    collection = await db.get_collection("transactions")
    user_id = current_user["id"] if "id" in current_user else current_user["_id"]
    
    # Vérifier que la transaction existe et appartient à l'utilisateur
    transaction = await collection.find_one({"_id": ObjectId(transaction_id), "user_id": user_id})
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction non trouvée"
        )
    
    # Supprimer la transaction
    await collection.delete_one({"_id": ObjectId(transaction_id)})
    
    return None


@router.post("/sync", status_code=status.HTTP_200_OK)
async def sync_transactions(
    current_user: Dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """
    Synchroniser les transactions depuis Boursorama.
    """
    try:
        new_transactions_count = await boursorama_service.synchronize_user_transactions(current_user, db)
        
        return {
            "status": "success",
            "message": f"{new_transactions_count} nouvelles transactions importées",
            "count": new_transactions_count
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la synchronisation: {str(e)}"
        ) 