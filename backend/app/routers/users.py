from typing import List, Dict

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import get_db
from app.models.user import User
from app.schemas import User as UserSchema, UserUpdate
from app.services.auth import get_user, get_user_by_email, update_user, delete_user, get_current_user

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