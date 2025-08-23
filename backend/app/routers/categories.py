from typing import List, Optional, Dict
from datetime import datetime, UTC
from bson import ObjectId

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import get_db
from app.schemas import Category as CategorySchema, CategoryCreate, CategoryUpdate
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/categories", tags=["categories"])


def prepare_mongodb_document_for_response(document: Dict) -> Dict:
    """
    Prépare un document MongoDB pour être retourné en réponse.
    Convertit _id en id.
    """
    if document is None:
        return None
    
    result = {}
    for key, value in document.items():
        if key == "_id":
            result["id"] = str(value)
        else:
            result[key] = value
    
    return result


@router.get("/", response_model=List[CategorySchema])
async def get_categories(
    type: str = None,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Récupérer toutes les catégories de l'utilisateur.
    """
    filter_query = {"user_id": current_user["_id"]}
    if type:
        filter_query["type"] = type
    
    collection = await db.get_collection("categories")
    cursor = collection.find(filter_query).sort("name", 1)
    categories = await cursor.to_list(length=None)
    
    return [prepare_mongodb_document_for_response(cat) for cat in categories]


@router.post("/", response_model=CategorySchema)
async def create_category(
    category: CategoryCreate,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Créer une nouvelle catégorie.
    """
    # Vérifier si la catégorie existe déjà
    existing_category = await db.find_one("categories", {
        "name": category.name,
        "user_id": current_user["_id"]
    })
    
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Une catégorie avec ce nom existe déjà"
        )
    
    # Préparer les données de la catégorie
    category_data = category.model_dump()
    category_data["user_id"] = current_user["_id"]
    
    # Insérer la catégorie
    result = await db.insert_one("categories", category_data)
    category_data["_id"] = result
    
    return prepare_mongodb_document_for_response(category_data)


@router.get("/{category_id}", response_model=CategorySchema)
async def get_category(
    category_id: str,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Récupérer une catégorie spécifique.
    """
    category = await db.find_one("categories", {
        "_id": ObjectId(category_id),
        "user_id": current_user["_id"]
    })
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catégorie non trouvée"
        )
    
    return prepare_mongodb_document_for_response(category)


@router.put("/{category_id}", response_model=CategorySchema)
async def update_category(
    category_id: str,
    category_update: CategoryUpdate,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Mettre à jour une catégorie existante.
    """
    # Vérifier que la catégorie appartient à l'utilisateur
    existing_category = await db.find_one("categories", {
        "_id": ObjectId(category_id),
        "user_id": current_user["_id"]
    })
    
    if not existing_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catégorie non trouvée"
        )
    
    # Vérifier si le nouveau nom existe déjà
    if category_update.name:
        duplicate_category = await db.find_one("categories", {
            "name": category_update.name,
            "user_id": current_user["_id"],
            "_id": {"$ne": ObjectId(category_id)}
        })
        
        if duplicate_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Une catégorie avec ce nom existe déjà"
            )
    
    # Préparer les données de mise à jour
    update_data = category_update.model_dump(exclude_unset=True)
    
    # Mettre à jour la catégorie
    await db.update_one(
        "categories",
        {"_id": ObjectId(category_id)},
        {"$set": update_data}
    )
    
    # Récupérer la catégorie mise à jour
    updated_category = await db.find_one("categories", {"_id": ObjectId(category_id)})
    
    return prepare_mongodb_document_for_response(updated_category)


@router.delete("/{category_id}")
async def delete_category(
    category_id: str,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Supprimer une catégorie.
    """
    # Vérifier que la catégorie appartient à l'utilisateur
    existing_category = await db.find_one("categories", {
        "_id": ObjectId(category_id),
        "user_id": current_user["_id"]
    })
    
    if not existing_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catégorie non trouvée"
        )
    
    # Vérifier si la catégorie est utilisée dans des transactions
    transaction_count = await db.count_documents("transactions", {
        "category_id": ObjectId(category_id)
    })
    
    if transaction_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de supprimer une catégorie utilisée dans des transactions"
        )
    
    # Supprimer la catégorie
    await db.delete_one("categories", {"_id": ObjectId(category_id)})
    
    return {"message": "Catégorie supprimée avec succès"}


@router.get("/stats/usage")
async def get_category_usage_stats(
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Récupérer les statistiques d'utilisation des catégories.
    """
    # Agréger les données d'utilisation des catégories
    pipeline = [
        {"$match": {"user_id": current_user["_id"]}},
        {"$group": {
            "_id": "$category_id",
            "total_amount": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"total_amount": -1}}
    ]
    
    collection = await db.get_collection("transactions")
    results = await collection.aggregate(pipeline).to_list(length=None)
    
    # Récupérer les détails des catégories
    category_stats = []
    for result in results:
        category = await db.find_one("categories", {"_id": result["_id"]})
        if category:
            category_stats.append({
                "category": prepare_mongodb_document_for_response(category),
                "total_amount": result["total_amount"],
                "transaction_count": result["count"]
            })
    
    return category_stats 