from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from ..services.auth import get_current_user
from ..db.mongodb import get_db
from ..schemas.user import UserUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/")
async def get_user_settings(current_user: dict = Depends(get_current_user)):
    """Récupérer les paramètres de l'utilisateur."""
    return {
        "email": current_user.get("email"),
        "first_name": current_user.get("first_name"),
        "last_name": current_user.get("last_name"),
        "billing_cycle_day": current_user.get("billing_cycle_day", 1)
    }


@router.put("/")
async def update_user_settings(
    settings: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Mettre à jour les paramètres de l'utilisateur."""
    database = db.db
    
    # Préparer les données à mettre à jour
    update_data = {}
    if settings.first_name is not None:
        update_data["first_name"] = settings.first_name
    if settings.last_name is not None:
        update_data["last_name"] = settings.last_name
    if settings.billing_cycle_day is not None:
        if settings.billing_cycle_day < 1 or settings.billing_cycle_day > 28:
            raise HTTPException(status_code=400, detail="Le jour de cycle doit être entre 1 et 28")
        update_data["billing_cycle_day"] = settings.billing_cycle_day
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour")
    
    # Mettre à jour l'utilisateur
    result = await database.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Récupérer l'utilisateur mis à jour
    updated_user = await database.users.find_one({"_id": current_user["_id"]})
    
    return {
        "message": "Paramètres mis à jour avec succès",
        "email": updated_user.get("email"),
        "first_name": updated_user.get("first_name"),
        "last_name": updated_user.get("last_name"),
        "billing_cycle_day": updated_user.get("billing_cycle_day", 1)
    }
