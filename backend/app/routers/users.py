from typing import List, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
from bson import ObjectId

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


@router.get("/me/export")
async def export_user_data(
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Exporter toutes les données de l'utilisateur (catégories, transactions, règles).
    Les données sont anonymisées (pas d'info utilisateur).
    """
    try:
        user_id = current_user["_id"]
        
        # Récupérer toutes les catégories
        categories_collection = await db.get_collection("categories")
        categories = await categories_collection.find({"user_id": user_id}).to_list(length=None)
        
        # Récupérer toutes les transactions
        transactions_collection = await db.get_collection("transactions")
        transactions = await transactions_collection.find({"user_id": user_id}).to_list(length=None)
        
        # Récupérer toutes les règles
        rules_collection = await db.get_collection("rules")
        rules = await rules_collection.find({"user_id": user_id}).to_list(length=None)
        
        # Récupérer les comptes bancaires
        accounts_collection = await db.get_collection("accounts")
        accounts = await accounts_collection.find({"user_id": user_id}).to_list(length=None)
        
        # Récupérer les banques
        banks_collection = await db.get_collection("banks")
        banks = await banks_collection.find({"user_id": user_id}).to_list(length=None)
        
        # Fonction pour convertir ObjectId en string et retirer user_id
        def clean_document(doc):
            if not doc:
                return None
            cleaned = {}
            for key, value in doc.items():
                if key == "user_id":
                    continue  # On ne garde pas l'user_id
                elif key == "_id":
                    cleaned["id"] = str(value)
                elif isinstance(value, ObjectId):
                    cleaned[key] = str(value)
                elif isinstance(value, datetime):
                    cleaned[key] = value.isoformat()
                else:
                    cleaned[key] = value
            return cleaned
        
        # Nettoyer les données
        export_data = {
            "version": "1.0",
            "export_date": datetime.now(timezone.utc).isoformat(),
            "categories": [clean_document(cat) for cat in categories],
            "transactions": [clean_document(trans) for trans in transactions],
            "rules": [clean_document(rule) for rule in rules],
            "accounts": [clean_document(acc) for acc in accounts],
            "banks": [clean_document(bank) for bank in banks]
        }
        
        return JSONResponse(content=export_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'export: {str(e)}"
        )


@router.post("/me/import")
async def import_user_data(
    data: Dict,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Importer des données pour l'utilisateur connecté.
    Les données sont associées à l'utilisateur actuel.
    """
    try:
        user_id = current_user["_id"]
        
        # Mapping des anciens IDs vers les nouveaux
        category_id_map = {}
        account_id_map = {}
        bank_id_map = {}
        
        # Fonction pour créer un document avec user_id
        def prepare_document(doc, id_field="_id"):
            if not doc:
                return None
            prepared = {"user_id": user_id}
            old_id = None
            for key, value in doc.items():
                if key == "id":
                    old_id = value
                    prepared["_id"] = ObjectId()  # Nouveau ObjectId
                elif key.endswith("_id") and key != "user_id":
                    # Gérer les références à d'autres IDs
                    if value:
                        prepared[key] = value  # On mettra à jour après
                    else:
                        prepared[key] = None
                elif key in ["created_at", "updated_at", "date"]:
                    # Convertir les dates ISO en datetime
                    if isinstance(value, str):
                        prepared[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                    else:
                        prepared[key] = value
                else:
                    prepared[key] = value
            return prepared, old_id
        
        # Importer les banques
        banks = data.get("banks", [])
        for bank_data in banks:
            prepared, old_id = prepare_document(bank_data)
            if prepared:
                banks_collection = await db.get_collection("banks")
                result = await banks_collection.insert_one(prepared)
                if old_id:
                    bank_id_map[old_id] = str(result.inserted_id)
        
        # Importer les comptes
        accounts = data.get("accounts", [])
        for account_data in accounts:
            prepared, old_id = prepare_document(account_data)
            if prepared:
                # Mettre à jour bank_id si nécessaire
                if "bank_id" in prepared and prepared["bank_id"]:
                    prepared["bank_id"] = ObjectId(bank_id_map.get(prepared["bank_id"], prepared["bank_id"]))
                
                accounts_collection = await db.get_collection("accounts")
                result = await accounts_collection.insert_one(prepared)
                if old_id:
                    account_id_map[old_id] = str(result.inserted_id)
        
        # Importer les catégories
        categories = data.get("categories", [])
        # D'abord les catégories parentes
        for cat_data in categories:
            if not cat_data.get("parent_id"):
                prepared, old_id = prepare_document(cat_data)
                if prepared:
                    categories_collection = await db.get_collection("categories")
                    result = await categories_collection.insert_one(prepared)
                    if old_id:
                        category_id_map[old_id] = str(result.inserted_id)
        
        # Ensuite les sous-catégories
        for cat_data in categories:
            if cat_data.get("parent_id"):
                prepared, old_id = prepare_document(cat_data)
                if prepared:
                    # Mettre à jour parent_id
                    if "parent_id" in prepared and prepared["parent_id"]:
                        prepared["parent_id"] = ObjectId(category_id_map.get(prepared["parent_id"], prepared["parent_id"]))
                    
                    categories_collection = await db.get_collection("categories")
                    result = await categories_collection.insert_one(prepared)
                    if old_id:
                        category_id_map[old_id] = str(result.inserted_id)
        
        # Importer les transactions
        transactions = data.get("transactions", [])
        for trans_data in transactions:
            prepared, old_id = prepare_document(trans_data)
            if prepared:
                # Mettre à jour category_id, account_id, bank_id
                if "category_id" in prepared and prepared["category_id"]:
                    prepared["category_id"] = ObjectId(category_id_map.get(prepared["category_id"], prepared["category_id"]))
                
                if "account_id" in prepared and prepared["account_id"]:
                    prepared["account_id"] = ObjectId(account_id_map.get(prepared["account_id"], prepared["account_id"]))
                
                if "bank_id" in prepared and prepared["bank_id"]:
                    prepared["bank_id"] = ObjectId(bank_id_map.get(prepared["bank_id"], prepared["bank_id"]))
                
                transactions_collection = await db.get_collection("transactions")
                await transactions_collection.insert_one(prepared)
        
        # Importer les règles
        rules = data.get("rules", [])
        for rule_data in rules:
            prepared, old_id = prepare_document(rule_data)
            if prepared:
                # Mettre à jour category_id
                if "category_id" in prepared and prepared["category_id"]:
                    prepared["category_id"] = ObjectId(category_id_map.get(prepared["category_id"], prepared["category_id"]))
                
                rules_collection = await db.get_collection("rules")
                await rules_collection.insert_one(prepared)
        
        return {
            "message": "Import réussi",
            "success": True,
            "imported": {
                "categories": len(categories),
                "transactions": len(transactions),
                "rules": len(rules),
                "accounts": len(accounts),
                "banks": len(banks)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'import: {str(e)}"
        )