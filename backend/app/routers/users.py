from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import get_db
from app.models.user import User
from app.schemas import User as UserSchema, UserUpdate
from app.services.auth import get_user, get_user_by_email, update_user, delete_user
from app.routers.auth import get_current_active_user, get_current_user

router = APIRouter()


@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """
    Récupérer les informations de l'utilisateur connecté.
    """
    return current_user


@router.put("/me", response_model=UserSchema)
async def update_user_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """
    Mettre à jour les informations de l'utilisateur connecté.
    """
    return update_user(db, current_user.id, user_update) 