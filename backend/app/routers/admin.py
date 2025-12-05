"""
Endpoints d'administration (réservés aux admins).
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, List
from bson import ObjectId
from datetime import datetime

from ..core.permissions import require_admin
from ..core.database import get_db
from ..schemas.user import UserCreate
from ..services.auth import create_user

router = APIRouter(prefix="/api/admin", tags=["Administration"])


@router.post("/users")
async def create_new_user(
    user_data: UserCreate,
    current_user: Dict = Depends(require_admin),
    db = Depends(get_db)
):
    """
    Créer un nouveau utilisateur (admin uniquement).
    """
    try:
        # Vérifier si l'utilisateur existe déjà
        users_collection = await db.get_collection("users")
        existing_user = await users_collection.find_one({"email": user_data.email})
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un utilisateur avec cet email existe déjà"
            )
        
        # Créer l'utilisateur
        new_user = await create_user(user_data, db)
        
        return {
            "message": "Utilisateur créé avec succès",
            "user": {
                "id": str(new_user["_id"]),
                "email": new_user["email"],
                "first_name": new_user.get("first_name"),
                "last_name": new_user.get("last_name"),
                "role": new_user.get("role", "user"),
                "is_active": new_user.get("is_active", True),
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création de l'utilisateur: {str(e)}"
        )


@router.get("/users")
async def list_users(
    current_user: Dict = Depends(require_admin),
    db = Depends(get_db)
):
    """
    Lister tous les utilisateurs (admin uniquement).
    """
    try:
        users_collection = await db.get_collection("users")
        
        users = []
        async for user in users_collection.find():
            # Gérer created_at qui peut être datetime ou string
            created_at = user.get("created_at")
            if created_at:
                if hasattr(created_at, 'isoformat'):
                    created_at_str = created_at.isoformat()
                else:
                    created_at_str = str(created_at)
            else:
                created_at_str = None
            
            users.append({
                "id": str(user["_id"]),
                "email": user.get("email"),
                "username": user.get("username"),
                "first_name": user.get("first_name"),
                "last_name": user.get("last_name"),
                "role": user.get("role", "user"),
                "is_active": user.get("is_active", True),
                "created_at": created_at_str,
            })
        
        return {"users": users, "total": len(users)}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des utilisateurs: {str(e)}"
        )


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: str,
    current_user: Dict = Depends(require_admin),
    db = Depends(get_db)
):
    """
    Modifier le rôle d'un utilisateur (admin uniquement).
    """
    try:
        if role not in ["user", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le rôle doit être 'user' ou 'admin'"
            )
        
        users_collection = await db.get_collection("users")
        
        # Vérifier que l'utilisateur existe
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        # Ne pas permettre de modifier son propre rôle
        if str(user["_id"]) == str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez pas modifier votre propre rôle"
            )
        
        # Mettre à jour le rôle
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"role": role, "updated_at": datetime.now()}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="L'utilisateur a déjà ce rôle"
            )
        
        return {
            "message": f"Rôle de l'utilisateur modifié en '{role}'",
            "user_id": user_id,
            "new_role": role
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la modification du rôle: {str(e)}"
        )


@router.patch("/users/{user_id}/active")
async def toggle_user_active(
    user_id: str,
    is_active: bool,
    current_user: Dict = Depends(require_admin),
    db = Depends(get_db)
):
    """
    Activer/désactiver un utilisateur (admin uniquement).
    """
    try:
        users_collection = await db.get_collection("users")
        
        # Vérifier que l'utilisateur existe
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        # Ne pas permettre de se désactiver soi-même
        if str(user["_id"]) == str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez pas modifier votre propre statut"
            )
        
        # Mettre à jour le statut
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_active": is_active, "updated_at": datetime.now()}}
        )
        
        status_text = "activé" if is_active else "désactivé"
        return {
            "message": f"Utilisateur {status_text}",
            "user_id": user_id,
            "is_active": is_active
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la modification du statut: {str(e)}"
        )


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: Dict = Depends(require_admin),
    db = Depends(get_db)
):
    """
    Supprimer un utilisateur et toutes ses données (admin uniquement).
    """
    try:
        users_collection = await db.get_collection("users")
        
        # Vérifier que l'utilisateur existe
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        # Ne pas permettre de se supprimer soi-même
        if str(user["_id"]) == str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez pas vous supprimer vous-même"
            )
        
        user_object_id = ObjectId(user_id)
        
        # Supprimer toutes les données de l'utilisateur
        collections_to_purge = [
            "categories",
            "transactions",
            "rules",
            "budgets",
            "accounts",
            "banks",
            "bank_connections"
        ]
        
        deleted_counts = {}
        for collection_name in collections_to_purge:
            collection = await db.get_collection(collection_name)
            result = await collection.delete_many({"user_id": user_object_id})
            deleted_counts[collection_name] = result.deleted_count
        
        # Supprimer l'utilisateur
        await users_collection.delete_one({"_id": user_object_id})
        
        return {
            "message": "Utilisateur et toutes ses données supprimés",
            "user_id": user_id,
            "deleted_data": deleted_counts
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la suppression de l'utilisateur: {str(e)}"
        )
