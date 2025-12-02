from typing import List, Dict

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import get_db
from app.models.user import User
from app.schemas import User as UserSchema, UserUpdate, ChangePasswordRequest
from app.services.auth import get_user, get_user_by_email, update_user, delete_user, get_current_user, verify_password, get_password_hash

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: Dict = Depends(get_current_user)):
    """
    Récupérer les informations de l'utilisateur connecté.
    """
    try:
        # Convertir l'ObjectId en string pour le schéma
        user_data = dict(current_user)
        user_data["id"] = str(user_data.pop("_id"))
        
        return UserSchema(**user_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des données utilisateur: {str(e)}"
        )


@router.put("/me", response_model=UserSchema)
async def update_user_me(
    user_update: UserUpdate,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Mettre à jour les informations de l'utilisateur connecté.
    """
    try:
        updated_user = await update_user(str(current_user["_id"]), user_update.model_dump(), db)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        # Convertir l'ObjectId en string pour le schéma
        user_data = dict(updated_user)
        user_data["id"] = str(user_data.pop("_id"))
        
        return UserSchema(**user_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise à jour du profil: {str(e)}"
        )


@router.post("/me/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Changer le mot de passe de l'utilisateur connecté.
    """
    try:
        # Vérifier le mot de passe actuel
        if not verify_password(password_data.current_password, current_user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le mot de passe actuel est incorrect"
            )
        
        # Hasher le nouveau mot de passe
        new_hashed_password = get_password_hash(password_data.new_password)
        
        # Mettre à jour le mot de passe
        from datetime import datetime, timezone
        from bson import ObjectId
        
        modified_count = await db.update_one(
            "users",
            {"_id": current_user["_id"]},
            {
                "hashed_password": new_hashed_password,
                "updated_at": datetime.now(timezone.utc)
            }
        )
        
        if modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erreur lors de la mise à jour du mot de passe"
            )
        
        return {
            "message": "Mot de passe changé avec succès",
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du changement de mot de passe: {str(e)}"
        ) 