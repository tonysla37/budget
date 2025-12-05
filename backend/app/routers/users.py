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
        
        # Récupérer les connexions bancaires
        bank_connections_collection = await db.get_collection("bank_connections")
        bank_connections = await bank_connections_collection.find({"user_id": user_id}).to_list(length=None)
        
        # Récupérer les budgets
        budgets_collection = await db.get_collection("budgets")
        budgets = await budgets_collection.find({"user_id": user_id}).to_list(length=None)
        
        # Créer un index des catégories par ID pour retrouver les parents
        categories_by_id = {str(cat["_id"]): cat for cat in categories}
        
        # Fonction pour convertir ObjectId en string et retirer user_id
        def clean_document(doc, doc_type=None):
            if not doc:
                return None
            cleaned = {}
            for key, value in doc.items():
                if key == "user_id":
                    continue  # On ne garde pas l'user_id
                elif key == "_id":
                    cleaned["id"] = str(value)
                elif key == "parent_id" and doc_type == "category" and value:
                    # Pour les catégories, ajouter parent_name au lieu de parent_id
                    parent_cat = categories_by_id.get(str(value))
                    if parent_cat:
                        cleaned["parent_name"] = parent_cat.get("name")
                    continue  # Ne pas garder parent_id
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
            "categories": [clean_document(cat, "category") for cat in categories],
            "transactions": [clean_document(trans) for trans in transactions],
            "rules": [clean_document(rule) for rule in rules],
            "accounts": [clean_document(acc) for acc in accounts],
            "banks": [clean_document(bank) for bank in banks],
            "bank_connections": [clean_document(conn) for conn in bank_connections],
            "budgets": [clean_document(budget) for budget in budgets]
        }
        
        return JSONResponse(content=export_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'export: {str(e)}"
        )


@router.post("/me/import/preview")
async def preview_import(
    data: Dict,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Prévisualiser l'import de données sans les importer réellement.
    Retourne un résumé des modifications qui seront appliquées.
    """
    try:
        # Analyser le fichier d'import
        categories = data.get("categories", [])
        transactions = data.get("transactions", [])
        rules = data.get("rules", [])
        budgets = data.get("budgets", [])
        accounts = data.get("accounts", [])
        banks = data.get("banks", [])
        bank_connections = data.get("bank_connections", [])
        
        # Compter les données actuelles
        user_id = current_user["_id"]
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        categories_collection = await db.get_collection("categories")
        transactions_collection = await db.get_collection("transactions")
        rules_collection = await db.get_collection("rules")
        budgets_collection = await db.get_collection("budgets")
        bank_connections_collection = await db.get_collection("bank_connections")
        
        current_categories = await categories_collection.count_documents({"user_id": user_id})
        current_transactions = await transactions_collection.count_documents({"user_id": user_id})
        current_rules = await rules_collection.count_documents({"user_id": user_id})
        current_budgets = await budgets_collection.count_documents({"user_id": user_id})
        current_bank_connections = await bank_connections_collection.count_documents({"user_id": user_id})
        
        # Analyser les catégories
        parent_categories = [c for c in categories if not c.get("parent_name")]
        sub_categories = [c for c in categories if c.get("parent_name")]
        
        # Créer un mapping des anciens IDs vers les nouveaux (ou existants)
        category_id_map = {}
        
        # Simuler la détection de doublons
        new_categories = 0
        duplicate_categories = 0
        
        for cat in parent_categories:
            existing = await categories_collection.find_one({
                "user_id": user_id,
                "name": cat.get("name"),
                "type": cat.get("type"),
                "parent_id": None
            })
            if existing:
                duplicate_categories += 1
                # Mapper l'ancien ID vers l'ID existant
                category_id_map[cat.get("id")] = existing["_id"]
            else:
                new_categories += 1
                # Pour les nouvelles catégories, on ne peut pas mapper car elles n'existent pas encore
                # On utilise l'ancien ID temporairement
                category_id_map[cat.get("id")] = cat.get("id")
        
        for cat in sub_categories:
            # On considère que le parent existera après l'import
            existing = await categories_collection.find_one({
                "user_id": user_id,
                "name": cat.get("name"),
                "type": cat.get("type")
            })
            if existing:
                duplicate_categories += 1
                # Mapper l'ancien ID vers l'ID existant
                category_id_map[cat.get("id")] = existing["_id"]
            else:
                new_categories += 1
                category_id_map[cat.get("id")] = cat.get("id")
        
        # Analyser les transactions (vérifier doublons par external_id ou date+description+amount)
        new_transactions = 0
        duplicate_transactions = 0
        
        for trans in transactions:
            if trans.get("external_id"):
                existing = await transactions_collection.find_one({
                    "user_id": user_id,
                    "external_id": trans["external_id"]
                })
            else:
                # Convertir la date pour la comparaison
                trans_date = trans.get("date")
                if isinstance(trans_date, str):
                    trans_date = datetime.fromisoformat(trans_date.replace('Z', '+00:00'))
                
                existing = await transactions_collection.find_one({
                    "user_id": user_id,
                    "date": trans_date,
                    "description": trans.get("description"),
                    "amount": trans.get("amount")
                })
            
            if existing:
                duplicate_transactions += 1
            else:
                new_transactions += 1
        
        # Analyser les règles (vérifier doublons par user_id + pattern + field)
        new_rules = 0
        duplicate_rules = 0
        
        for rule in rules:
            existing = await rules_collection.find_one({
                "user_id": user_id,
                "pattern": rule.get("pattern"),
                "field": rule.get("field")
            })
            
            if existing:
                duplicate_rules += 1
            else:
                new_rules += 1
        
        # Analyser les budgets (vérifier doublons par user_id + category_id + period)
        new_budgets = 0
        duplicate_budgets = 0
        
        for budget in budgets:
            category_id = budget.get("category_id")
            
            # Mapper l'ancien category_id vers le nouveau (ou existant)
            if category_id in category_id_map:
                category_id = category_id_map[category_id]
            elif isinstance(category_id, str):
                category_id = ObjectId(category_id)
            
            existing = await budgets_collection.find_one({
                "user_id": user_id,
                "category_id": category_id,
                "period": budget.get("period")
            })
            
            if existing:
                duplicate_budgets += 1
            else:
                new_budgets += 1
        
        # Analyser les connexions bancaires (vérifier doublons par user_id + bank + nickname)
        new_bank_connections = 0
        duplicate_bank_connections = 0
        
        for connection in bank_connections:
            query = {
                "user_id": user_id,
                "bank": connection.get("bank")
            }
            
            # Ajouter nickname au critère de doublon si présent
            if connection.get("nickname"):
                query["nickname"] = connection.get("nickname")
            
            existing = await bank_connections_collection.find_one(query)
            
            if existing:
                duplicate_bank_connections += 1
            else:
                new_bank_connections += 1
        
        # Construire le résumé
        preview = {
            "import_summary": {
                "categories": {
                    "current": current_categories,
                    "in_file": len(categories),
                    "new": new_categories,
                    "duplicates": duplicate_categories,
                    "after_import": current_categories + new_categories,
                    "details": {
                        "parents": len(parent_categories),
                        "subcategories": len(sub_categories)
                    }
                },
                "transactions": {
                    "current": current_transactions,
                    "in_file": len(transactions),
                    "new": new_transactions,
                    "duplicates": duplicate_transactions,
                    "after_import": current_transactions + new_transactions
                },
                "rules": {
                    "current": current_rules,
                    "in_file": len(rules),
                    "new": new_rules,
                    "duplicates": duplicate_rules,
                    "after_import": current_rules + new_rules
                },
                "budgets": {
                    "current": current_budgets,
                    "in_file": len(budgets),
                    "new": new_budgets,
                    "duplicates": duplicate_budgets,
                    "after_import": current_budgets + new_budgets
                },
                "bank_connections": {
                    "current": current_bank_connections,
                    "in_file": len(bank_connections),
                    "new": new_bank_connections,
                    "duplicates": duplicate_bank_connections,
                    "after_import": current_bank_connections + new_bank_connections
                }
            },
            "warnings": [],
            "file_info": {
                "version": data.get("version"),
                "export_date": data.get("export_date")
            }
        }
        
        # Ajouter des avertissements si nécessaire
        if duplicate_categories > 0:
            preview["warnings"].append(f"{duplicate_categories} catégorie(s) en doublon seront ignorées")
        
        if duplicate_transactions > 0:
            preview["warnings"].append(f"{duplicate_transactions} transaction(s) en doublon seront ignorées")
        
        if duplicate_rules > 0:
            preview["warnings"].append(f"{duplicate_rules} règle(s) en doublon seront ignorées")
        
        if duplicate_budgets > 0:
            preview["warnings"].append(f"{duplicate_budgets} budget(s) en doublon seront ignorés")
        
        if duplicate_bank_connections > 0:
            preview["warnings"].append(f"{duplicate_bank_connections} connexion(s) bancaire(s) en doublon seront ignorées")
        
        # Vérifier les sous-catégories orphelines
        parent_names = {c["name"] for c in parent_categories}
        orphans = [c["name"] for c in sub_categories if c.get("parent_name") not in parent_names]
        if orphans:
            preview["warnings"].append(f"{len(orphans)} sous-catégorie(s) sans parent trouvé: {', '.join(orphans[:3])}...")
        
        return preview
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la prévisualisation: {str(e)}"
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
        bank_connection_id_map = {}
        
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
                elif key == "parent_name":
                    # Ignorer parent_name, il sera géré manuellement dans l'import des catégories
                    continue
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
        
        # Importer les connexions bancaires
        bank_connections = data.get("bank_connections", [])
        bank_connections_imported = 0
        bank_connections_skipped = 0
        for connection_data in bank_connections:
            prepared, old_id = prepare_document(connection_data)
            if prepared:
                bank_connections_collection = await db.get_collection("bank_connections")
                
                # Vérifier si une connexion similaire existe déjà (même banque + même nickname)
                query = {
                    "user_id": user_id,
                    "bank": prepared.get("bank")
                }
                
                # Ajouter nickname au critère de doublon si présent
                if prepared.get("nickname"):
                    query["nickname"] = prepared.get("nickname")
                
                existing = await bank_connections_collection.find_one(query)
                
                if not existing:
                    result = await bank_connections_collection.insert_one(prepared)
                    if old_id:
                        bank_connection_id_map[old_id] = str(result.inserted_id)
                    bank_connections_imported += 1
                else:
                    # Utiliser l'ID de la connexion existante pour le mapping
                    if old_id:
                        bank_connection_id_map[old_id] = str(existing["_id"])
                    bank_connections_skipped += 1
        
        # Importer les catégories
        categories = data.get("categories", [])
        categories_imported = 0
        categories_skipped = 0
        
        # Créer un mapping nom -> ObjectId pour les catégories parentes
        parent_name_to_id = {}
        
        # D'abord les catégories parentes
        for cat_data in categories:
            if not cat_data.get("parent_name"):
                prepared, old_id = prepare_document(cat_data)
                if prepared:
                    categories_collection = await db.get_collection("categories")
                    
                    # Vérifier si une catégorie similaire existe déjà (même nom + type + pas de parent)
                    existing = await categories_collection.find_one({
                        "user_id": user_id,
                        "name": prepared.get("name"),
                        "type": prepared.get("type"),
                        "parent_id": None
                    })
                    
                    if not existing:
                        result = await categories_collection.insert_one(prepared)
                        new_id = str(result.inserted_id)
                        if old_id:
                            category_id_map[old_id] = new_id
                        parent_name_to_id[prepared.get("name")] = ObjectId(new_id)
                        categories_imported += 1
                    else:
                        # Utiliser l'ID de la catégorie existante pour le mapping
                        existing_id = str(existing["_id"])
                        if old_id:
                            category_id_map[old_id] = existing_id
                        parent_name_to_id[prepared.get("name")] = existing["_id"]
                        categories_skipped += 1
        
        # Ensuite les sous-catégories
        for cat_data in categories:
            if cat_data.get("parent_name"):
                prepared, old_id = prepare_document(cat_data)
                if prepared:
                    categories_collection = await db.get_collection("categories")
                    
                    # Récupérer le parent_id à partir du nom du parent
                    parent_name = cat_data.get("parent_name")
                    parent_id = parent_name_to_id.get(parent_name)
                    
                    if not parent_id:
                        print(f"WARNING: Parent '{parent_name}' non trouvé pour la sous-catégorie '{prepared.get('name')}'")
                        continue
                    
                    # Vérifier si une sous-catégorie similaire existe déjà (même nom + type + même parent)
                    existing = await categories_collection.find_one({
                        "user_id": user_id,
                        "name": prepared.get("name"),
                        "type": prepared.get("type"),
                        "parent_id": parent_id
                    })
                    
                    if not existing:
                        # Ajouter le parent_id dans le document à insérer
                        prepared["parent_id"] = parent_id
                        result = await categories_collection.insert_one(prepared)
                        if old_id:
                            category_id_map[old_id] = str(result.inserted_id)
                        categories_imported += 1
                    else:
                        # Utiliser l'ID de la catégorie existante pour le mapping
                        if old_id:
                            category_id_map[old_id] = str(existing["_id"])
                        categories_skipped += 1
        
        # Importer les transactions
        transactions = data.get("transactions", [])
        transactions_imported = 0
        transactions_skipped = 0
        for trans_data in transactions:
            prepared, old_id = prepare_document(trans_data)
            if prepared:
                # Mettre à jour category_id, account_id, bank_id, bank_connection_id
                if "category_id" in prepared and prepared["category_id"]:
                    prepared["category_id"] = ObjectId(category_id_map.get(prepared["category_id"], prepared["category_id"]))
                
                if "account_id" in prepared and prepared["account_id"]:
                    prepared["account_id"] = ObjectId(account_id_map.get(prepared["account_id"], prepared["account_id"]))
                
                if "bank_id" in prepared and prepared["bank_id"]:
                    prepared["bank_id"] = ObjectId(bank_id_map.get(prepared["bank_id"], prepared["bank_id"]))
                
                if "bank_connection_id" in prepared and prepared["bank_connection_id"]:
                    prepared["bank_connection_id"] = ObjectId(bank_connection_id_map.get(prepared["bank_connection_id"], prepared["bank_connection_id"]))
                
                transactions_collection = await db.get_collection("transactions")
                
                # Vérifier si la transaction existe déjà (par external_id ou combinaison date+description+amount)
                existing = None
                if prepared.get("external_id"):
                    existing = await transactions_collection.find_one({
                        "user_id": user_id,
                        "external_id": prepared["external_id"]
                    })
                
                if not existing:
                    # Vérifier aussi par date + description + montant
                    existing = await transactions_collection.find_one({
                        "user_id": user_id,
                        "date": prepared.get("date"),
                        "description": prepared.get("description"),
                        "amount": prepared.get("amount")
                    })
                
                if not existing:
                    await transactions_collection.insert_one(prepared)
                    transactions_imported += 1
                else:
                    transactions_skipped += 1
        
        # Importer les règles
        rules = data.get("rules", [])
        rules_imported = 0
        rules_skipped = 0
        for rule_data in rules:
            prepared, old_id = prepare_document(rule_data)
            if prepared:
                # Mettre à jour category_id
                if "category_id" in prepared and prepared["category_id"]:
                    prepared["category_id"] = ObjectId(category_id_map.get(prepared["category_id"], prepared["category_id"]))
                
                rules_collection = await db.get_collection("rules")
                
                # Vérifier si une règle similaire existe déjà (même pattern + même field)
                existing = await rules_collection.find_one({
                    "user_id": user_id,
                    "pattern": prepared.get("pattern"),
                    "field": prepared.get("field")
                })
                
                if not existing:
                    await rules_collection.insert_one(prepared)
                    rules_imported += 1
                else:
                    rules_skipped += 1
        
        # Importer les budgets
        budgets = data.get("budgets", [])
        budgets_imported = 0
        budgets_skipped = 0
        for budget_data in budgets:
            prepared, old_id = prepare_document(budget_data)
            if prepared:
                # Mettre à jour category_id
                if "category_id" in prepared and prepared["category_id"]:
                    prepared["category_id"] = ObjectId(category_id_map.get(prepared["category_id"], prepared["category_id"]))
                
                budgets_collection = await db.get_collection("budgets")
                
                # Vérifier si un budget existe déjà pour cette catégorie et cette période
                existing = await budgets_collection.find_one({
                    "user_id": user_id,
                    "category_id": prepared.get("category_id"),
                    "period": prepared.get("period")
                })
                
                if not existing:
                    await budgets_collection.insert_one(prepared)
                    budgets_imported += 1
                else:
                    budgets_skipped += 1
        
        return {
            "message": "Import réussi",
            "success": True,
            "imported": {
                "categories": categories_imported,
                "transactions": transactions_imported,
                "rules": rules_imported,
                "budgets": budgets_imported,
                "accounts": len(accounts),
                "banks": len(banks),
                "bank_connections": bank_connections_imported
            },
            "skipped": {
                "categories": categories_skipped,
                "transactions": transactions_skipped,
                "bank_connections": bank_connections_skipped,
                "rules": rules_skipped,
                "budgets": budgets_skipped
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'import: {str(e)}"
        )

@router.delete("/me/purge", status_code=status.HTTP_200_OK)
async def purge_user_data(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Purger toutes les données de l'utilisateur (catégories, transactions, règles, budgets, etc.)
    """
    try:
        user_id = current_user["_id"]
        
        # Supprimer toutes les collections de l'utilisateur
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
        total_deleted = 0
        
        for collection_name in collections_to_purge:
            collection = await db.get_collection(collection_name)
            result = await collection.delete_many({"user_id": user_id})
            deleted_counts[collection_name] = result.deleted_count
            total_deleted += result.deleted_count
        
        return {
            "message": "Données purgées avec succès",
            "total_deleted": total_deleted,
            "details": deleted_counts
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la purge: {str(e)}"
        )