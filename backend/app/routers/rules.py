from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime, date
from bson import ObjectId

from ..core.database import get_db
from ..schemas.rule import RuleCreate, RuleUpdate, RuleResponse
from ..schemas.user import User
from .auth import get_current_user

router = APIRouter(prefix="/api/rules", tags=["rules"])

@router.get("/", response_model=List[RuleResponse])
async def get_rules(
    current_user: dict = Depends(get_current_user),
    database = Depends(get_db)
):
    """Récupère toutes les règles de l'utilisateur"""
    rules_collection = await database.get_collection("rules")
    categories_collection = await database.get_collection("categories")
    
    rules = await rules_collection.find({"user_id": current_user["_id"]}).to_list(length=None)
    
    # Enrichir avec le nom de la catégorie
    result = []
    for rule in rules:
        # category_id peut être ObjectId ou string, on gère les deux cas
        cat_id = rule["category_id"] if isinstance(rule["category_id"], ObjectId) else ObjectId(rule["category_id"])
        category = await categories_collection.find_one({"_id": cat_id})
        category_name = "Inconnue"
        
        if category:
            if category.get("parent_id"):
                parent_id = category["parent_id"] if isinstance(category["parent_id"], ObjectId) else ObjectId(category["parent_id"])
                parent = await categories_collection.find_one({"_id": parent_id})
                if parent:
                    category_name = f"{parent['name']} › {category['name']}"
                else:
                    category_name = category["name"]
            else:
                category_name = category["name"]
        
        result.append({
            "id": str(rule["_id"]),
            "name": rule["name"],
            "pattern": rule["pattern"],
            "match_type": rule["match_type"],
            "category_id": str(rule["category_id"]),  # Convertir en string
            "category_name": category_name,
            "is_active": rule["is_active"],
            "exceptions": rule.get("exceptions", []),
            "start_date": rule.get("start_date"),
            "end_date": rule.get("end_date"),
            "created_at": rule["created_at"],
            "updated_at": rule.get("updated_at", rule["created_at"])  # Fallback sur created_at
        })
    
    return result

@router.post("/", response_model=RuleResponse, status_code=status.HTTP_201_CREATED)
async def create_rule(
    rule: RuleCreate,
    current_user: dict = Depends(get_current_user),
    database = Depends(get_db)
):
    """Crée une nouvelle règle"""
    rules_collection = await database.get_collection("rules")
    categories_collection = await database.get_collection("categories")
    
    # Vérifier que la catégorie existe
    category = await categories_collection.find_one({"_id": ObjectId(rule.category_id)})
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Créer la règle
    now = datetime.utcnow()
    rule_dict = {
        "user_id": current_user["_id"],
        "name": rule.name,
        "pattern": rule.pattern,
        "match_type": rule.match_type,
        "category_id": rule.category_id,
        "is_active": rule.is_active,
        "exceptions": rule.exceptions,
        "start_date": rule.start_date.isoformat() if rule.start_date else None,
        "end_date": rule.end_date.isoformat() if rule.end_date else None,
        "created_at": now,
        "updated_at": now
    }
    
    result = await rules_collection.insert_one(rule_dict)
    created_rule = await rules_collection.find_one({"_id": result.inserted_id})
    
    # Obtenir le nom de la catégorie
    category_name = category["name"]
    if category.get("parent_id"):
        parent = await categories_collection.find_one({"_id": ObjectId(category["parent_id"])})
        if parent:
            category_name = f"{parent['name']} › {category_name}"
    
    return {
        "id": str(created_rule["_id"]),
        "name": created_rule["name"],
        "pattern": created_rule["pattern"],
        "match_type": created_rule["match_type"],
        "category_id": created_rule["category_id"],
        "category_name": category_name,
        "is_active": created_rule["is_active"],
        "exceptions": created_rule.get("exceptions", []),
        "start_date": created_rule.get("start_date"),
        "end_date": created_rule.get("end_date"),
        "created_at": created_rule["created_at"],
        "updated_at": created_rule["updated_at"]
    }

@router.put("/{rule_id}", response_model=RuleResponse)
async def update_rule(
    rule_id: str,
    rule: RuleUpdate,
    current_user: dict = Depends(get_current_user),
    database = Depends(get_db)
):
    """Met à jour une règle"""
    rules_collection = await database.get_collection("rules")
    categories_collection = await database.get_collection("categories")
    
    # Vérifier que la règle existe et appartient à l'utilisateur
    existing_rule = await rules_collection.find_one({
        "_id": ObjectId(rule_id),
        "user_id": current_user["_id"]
    })
    
    if not existing_rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    # Préparer les données à mettre à jour
    update_data = {k: v for k, v in rule.dict(exclude_unset=True).items()}
    
    # Convertir les dates en format ISO string pour MongoDB
    if "start_date" in update_data and update_data["start_date"] is not None:
        update_data["start_date"] = update_data["start_date"].isoformat()
    if "end_date" in update_data and update_data["end_date"] is not None:
        update_data["end_date"] = update_data["end_date"].isoformat()
    
    # Vérifier la catégorie si elle est modifiée
    if "category_id" in update_data:
        category = await categories_collection.find_one({"_id": ObjectId(update_data["category_id"])})
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
    
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await rules_collection.update_one(
        {"_id": ObjectId(rule_id)},
        update_data
    )    # Récupérer la règle mise à jour
    updated_rule = await rules_collection.find_one({"_id": ObjectId(rule_id)})
    
    # Obtenir le nom de la catégorie
    category = await categories_collection.find_one({"_id": ObjectId(updated_rule["category_id"])})
    category_name = "Inconnue"
    if category:
        category_name = category["name"]
        if category.get("parent_id"):
            parent = await categories_collection.find_one({"_id": ObjectId(category["parent_id"])})
            if parent:
                category_name = f"{parent['name']} › {category_name}"
    
    return {
        "id": str(updated_rule["_id"]),
        "name": updated_rule["name"],
        "pattern": updated_rule["pattern"],
        "match_type": updated_rule["match_type"],
        "category_id": updated_rule["category_id"],
        "category_name": category_name,
        "is_active": updated_rule["is_active"],
        "exceptions": updated_rule.get("exceptions", []),
        "start_date": updated_rule.get("start_date"),
        "end_date": updated_rule.get("end_date"),
        "created_at": updated_rule["created_at"],
        "updated_at": updated_rule["updated_at"]
    }

@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(
    rule_id: str,
    current_user: dict = Depends(get_current_user),
    database = Depends(get_db)
):
    """Supprime une règle"""
    rules_collection = await database.get_collection("rules")
    
    # Vérifier que la règle existe et appartient à l'utilisateur
    result = await rules_collection.delete_one({
        "_id": ObjectId(rule_id),
        "user_id": current_user["_id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    return None

@router.post("/apply/{transaction_id}")
async def apply_rules_to_transaction(
    transaction_id: str,
    current_user: dict = Depends(get_current_user),
    database = Depends(get_db)
):
    """Applique les règles à une transaction spécifique"""
    transactions_collection = await database.get_collection("transactions")
    rules_collection = await database.get_collection("rules")
    
    # Récupérer la transaction
    transaction = await transactions_collection.find_one({
        "_id": ObjectId(transaction_id),
        "user_id": current_user["_id"]
    })
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Récupérer toutes les règles actives
    rules = await rules_collection.find({
        "user_id": current_user["_id"],
        "is_active": True
    }).to_list(length=None)
    
    # Tester chaque règle
    description = transaction.get("description", "").upper()
    transaction_date = transaction.get("date")
    matched_rule = None
    
    for rule in rules:
        pattern = rule["pattern"].upper()
        match_type = rule["match_type"]
        
        # Vérifier la période d'application
        if rule.get("start_date"):
            start_date = datetime.fromisoformat(rule["start_date"]).date() if isinstance(rule["start_date"], str) else rule["start_date"]
            if transaction_date.date() < start_date:
                continue
        
        if rule.get("end_date"):
            end_date = datetime.fromisoformat(rule["end_date"]).date() if isinstance(rule["end_date"], str) else rule["end_date"]
            if transaction_date.date() > end_date:
                continue
        
        # Vérifier les exceptions
        exceptions = rule.get("exceptions", [])
        is_exception = False
        for exception_pattern in exceptions:
            exception_upper = exception_pattern.upper()
            if exception_upper in description:
                is_exception = True
                break
        
        if is_exception:
            continue
        
        matched = False
        if match_type == "contains":
            matched = pattern in description
        elif match_type == "starts_with":
            matched = description.startswith(pattern)
        elif match_type == "ends_with":
            matched = description.endswith(pattern)
        elif match_type == "exact":
            matched = description == pattern
        
        if matched:
            matched_rule = rule
            break
    
    if matched_rule:
        # Appliquer la catégorie
        await transactions_collection.update_one(
            {"_id": ObjectId(transaction_id)},
            {"$set": {"category_id": matched_rule["category_id"]}}
        )
        
        return {
            "matched": True,
            "rule_name": matched_rule["name"],
            "category_id": matched_rule["category_id"]
        }
    
    return {"matched": False}

