from typing import List, Optional, Dict
from datetime import datetime, UTC
from bson import ObjectId

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import get_db
from app.routers.auth import get_current_active_user
from app.routers.transactions import prepare_mongodb_document_for_response

router = APIRouter()


# ------ Catégories ------

@router.get("/categories", response_model=List[Dict])
async def get_categories(
    skip: int = 0,
    limit: int = 100,
    current_user: Dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """
    Récupérer toutes les catégories disponibles pour l'utilisateur.
    Inclut les catégories système et les catégories personnelles.
    """
    collection = await db.get_collection("categories")
    user_id = current_user["id"] if "id" in current_user else str(current_user["_id"])
    
    # Récupérer les catégories système (user_id == NULL) et les catégories de l'utilisateur
    cursor = collection.find({
        "$or": [
            {"user_id": None},
            {"user_id": user_id}
        ]
    }).skip(skip).limit(limit)
    
    categories = await cursor.to_list(length=limit)
    return [prepare_mongodb_document_for_response(cat) for cat in categories]


@router.post("/categories", response_model=Dict, status_code=status.HTTP_201_CREATED)
async def create_category(
    category: Dict,
    current_user: Dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """
    Créer une nouvelle catégorie personnelle.
    """
    collection = await db.get_collection("categories")
    user_id = current_user["id"] if "id" in current_user else str(current_user["_id"])
    
    new_category = {
        "name": category["name"],
        "description": category.get("description", ""),
        "color": category.get("color", "#000000"),
        "icon": category.get("icon", "default"),
        "user_id": user_id,
        "created_at": datetime.now(UTC)
    }
    
    result = await collection.insert_one(new_category)
    created_category = await collection.find_one({"_id": result.inserted_id})
    
    return prepare_mongodb_document_for_response(created_category)


@router.put("/categories/{category_id}", response_model=Dict)
async def update_category(
    category_id: str,
    category_update: Dict,
    current_user: Dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """
    Mettre à jour une catégorie existante.
    Seules les catégories créées par l'utilisateur peuvent être modifiées.
    """
    collection = await db.get_collection("categories")
    user_id = current_user["id"] if "id" in current_user else str(current_user["_id"])
    
    # Vérifier que la catégorie existe et appartient à l'utilisateur
    db_category = await collection.find_one({
        "_id": ObjectId(category_id),
        "user_id": user_id
    })
    
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catégorie non trouvée ou non modifiable"
        )
    
    # Préparer les données de mise à jour
    update_data = {k: v for k, v in category_update.items() if k in ["name", "description", "color", "icon"]}
    update_data["updated_at"] = datetime.now(UTC)
    
    # Mettre à jour la catégorie
    await collection.update_one(
        {"_id": ObjectId(category_id)},
        {"$set": update_data}
    )
    
    # Récupérer la catégorie mise à jour
    updated_category = await collection.find_one({"_id": ObjectId(category_id)})
    
    return prepare_mongodb_document_for_response(updated_category)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    current_user: Dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """
    Supprimer une catégorie.
    Seules les catégories créées par l'utilisateur peuvent être supprimées.
    """
    collection = await db.get_collection("categories")
    user_id = current_user["id"] if "id" in current_user else str(current_user["_id"])
    
    # Vérifier que la catégorie existe et appartient à l'utilisateur
    db_category = await collection.find_one({
        "_id": ObjectId(category_id),
        "user_id": user_id
    })
    
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catégorie non trouvée ou non supprimable"
        )
    
    # Supprimer la catégorie
    await collection.delete_one({"_id": ObjectId(category_id)})
    
    return None


# ------ Tags ------

@router.get("/tags", response_model=List[Dict])
async def get_tags(
    skip: int = 0,
    limit: int = 100,
    current_user: Dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """
    Récupérer tous les tags disponibles pour l'utilisateur.
    Inclut les tags système et les tags personnels.
    """
    collection = await db.get_collection("tags")
    user_id = current_user["id"] if "id" in current_user else str(current_user["_id"])
    
    # Récupérer les tags système (user_id == NULL) et les tags de l'utilisateur
    cursor = collection.find({
        "$or": [
            {"user_id": None},
            {"user_id": user_id}
        ]
    }).skip(skip).limit(limit)
    
    tags = await cursor.to_list(length=limit)
    return [prepare_mongodb_document_for_response(tag) for tag in tags]


@router.post("/tags", response_model=Dict, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag: Dict,
    current_user: Dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """
    Créer un nouveau tag personnel.
    """
    collection = await db.get_collection("tags")
    user_id = current_user["id"] if "id" in current_user else str(current_user["_id"])
    
    new_tag = {
        "name": tag["name"],
        "description": tag.get("description", ""),
        "color": tag.get("color", "#000000"),
        "user_id": user_id,
        "created_at": datetime.now(UTC)
    }
    
    result = await collection.insert_one(new_tag)
    created_tag = await collection.find_one({"_id": result.inserted_id})
    
    return prepare_mongodb_document_for_response(created_tag)


@router.put("/tags/{tag_id}", response_model=Dict)
async def update_tag(
    tag_id: str,
    tag_update: Dict,
    current_user: Dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """
    Mettre à jour un tag existant.
    Seuls les tags créés par l'utilisateur peuvent être modifiés.
    """
    collection = await db.get_collection("tags")
    user_id = current_user["id"] if "id" in current_user else str(current_user["_id"])
    
    # Vérifier que le tag existe et appartient à l'utilisateur
    db_tag = await collection.find_one({
        "_id": ObjectId(tag_id),
        "user_id": user_id
    })
    
    if not db_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag non trouvé ou non modifiable"
        )
    
    # Préparer les données de mise à jour
    update_data = {k: v for k, v in tag_update.items() if k in ["name", "description", "color"]}
    update_data["updated_at"] = datetime.now(UTC)
    
    # Mettre à jour le tag
    await collection.update_one(
        {"_id": ObjectId(tag_id)},
        {"$set": update_data}
    )
    
    # Récupérer le tag mis à jour
    updated_tag = await collection.find_one({"_id": ObjectId(tag_id)})
    
    return prepare_mongodb_document_for_response(updated_tag)


@router.delete("/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: str,
    current_user: Dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """
    Supprimer un tag.
    Seuls les tags créés par l'utilisateur peuvent être supprimés.
    """
    collection = await db.get_collection("tags")
    user_id = current_user["id"] if "id" in current_user else str(current_user["_id"])
    
    # Vérifier que le tag existe et appartient à l'utilisateur
    db_tag = await collection.find_one({
        "_id": ObjectId(tag_id),
        "user_id": user_id
    })
    
    if not db_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag non trouvé ou non supprimable"
        )
    
    # Supprimer le tag
    await collection.delete_one({"_id": ObjectId(tag_id)})
    
    return None 