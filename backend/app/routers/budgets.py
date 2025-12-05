from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime, timedelta
from bson import ObjectId

from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse
from app.core.database import get_db
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/budgets", tags=["budgets"])

def get_period_dates(period_type: str, billing_cycle_day: int = 1):
    """Calcule les dates de début et fin selon le type de période"""
    now = datetime.utcnow()
    
    if period_type == "monthly":
        # Utilise le billing_cycle_day pour déterminer le début du mois
        if now.day >= billing_cycle_day:
            start_date = datetime(now.year, now.month, billing_cycle_day)
            # Mois suivant
            if now.month == 12:
                end_date = datetime(now.year + 1, 1, billing_cycle_day)
            else:
                end_date = datetime(now.year, now.month + 1, billing_cycle_day)
        else:
            # On est avant le billing_cycle_day, donc période précédente
            if now.month == 1:
                start_date = datetime(now.year - 1, 12, billing_cycle_day)
            else:
                start_date = datetime(now.year, now.month - 1, billing_cycle_day)
            end_date = datetime(now.year, now.month, billing_cycle_day)
    else:  # yearly
        start_date = datetime(now.year, 1, 1)
        end_date = datetime(now.year + 1, 1, 1)
    
    return start_date, end_date

@router.get("/", response_model=List[BudgetResponse])
async def get_budgets(
    period_type: str = "monthly",
    database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Récupère tous les budgets de l'utilisateur avec les dépenses actuelles"""
    
    # Récupérer le billing_cycle_day de l'utilisateur
    billing_cycle_day = current_user.get("billing_cycle_day", 1)
    
    # Calculer les dates de la période
    start_date, end_date = get_period_dates(period_type, billing_cycle_day)
    
    # Récupérer les collections
    budgets_collection = await database.get_collection("budgets")
    categories_collection = await database.get_collection("categories")
    transactions_collection = await database.get_collection("transactions")
    
    # Récupérer tous les budgets de l'utilisateur
    budgets_cursor = budgets_collection.find({
        "user_id": current_user["_id"],
        "period_type": period_type
    })
    
    budgets = await budgets_cursor.to_list(length=None)
    
    result = []
    for budget in budgets:
        # Récupérer les infos de la catégorie
        category = await categories_collection.find_one({"_id": budget["category_id"]})
        if not category:
            continue
        
        # Récupérer les IDs des sous-catégories si c'est une catégorie parente
        category_ids = [budget["category_id"]]
        
        # Chercher les sous-catégories (parent_id est ObjectId en base)
        subcategories = await categories_collection.find({
            "parent_id": budget["category_id"]
        }).to_list(length=None)
        
        # Ajouter les IDs des sous-catégories
        for subcat in subcategories:
            category_ids.append(subcat["_id"])
        
        # Calculer les dépenses pour cette catégorie ET ses sous-catégories dans la période (utiliser datetime directement)
        pipeline = [
            {
                "$match": {
                    "user_id": current_user["_id"],
                    "category_id": {"$in": category_ids},
                    "is_expense": True,
                    "date": {"$gte": start_date, "$lt": end_date}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": "$amount"}
                }
            }
        ]
        
        spent_result = await transactions_collection.aggregate(pipeline).to_list(length=1)
        spent = spent_result[0]["total"] if spent_result else 0.0
        
        remaining = budget["amount"] - spent
        percentage = (spent / budget["amount"] * 100) if budget["amount"] > 0 else 0
        
        result.append(BudgetResponse(
            id=str(budget["_id"]),
            category_id=str(budget["category_id"]),
            category_name=category["name"],
            category_color=category["color"],
            amount=budget["amount"],
            spent=spent,
            remaining=remaining,
            percentage=percentage,
            period_type=budget["period_type"],
            is_recurring=budget.get("is_recurring", True),
            year=budget.get("year"),
            month=budget.get("month")
        ))
    
    return result

@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(
    budget_data: BudgetCreate,
    database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Crée un nouveau budget pour une catégorie"""
    
    # Récupérer les collections
    budgets_collection = await database.get_collection("budgets")
    categories_collection = await database.get_collection("categories")
    transactions_collection = await database.get_collection("transactions")
    
    # Vérifier que la catégorie existe et appartient à l'utilisateur
    category = await categories_collection.find_one({
        "_id": ObjectId(budget_data.category_id),
        "user_id": current_user["_id"]
    })
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catégorie non trouvée"
        )
    
    # Vérifier qu'il n'existe pas déjà un budget pour cette catégorie et période
    budget_filter = {
        "user_id": current_user["_id"],
        "category_id": ObjectId(budget_data.category_id),
        "period_type": budget_data.period_type
    }
    
    # Si c'est un budget ponctuel, vérifier pour l'année/mois spécifique
    if not budget_data.is_recurring:
        if not budget_data.year or not budget_data.month:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="L'année et le mois sont requis pour un budget ponctuel"
            )
        budget_filter["is_recurring"] = False
        budget_filter["year"] = budget_data.year
        budget_filter["month"] = budget_data.month
    else:
        # Pour un budget récurrent, vérifier qu'il n'y a pas déjà un récurrent
        budget_filter["is_recurring"] = True
    
    existing_budget = await budgets_collection.find_one(budget_filter)
    
    if existing_budget:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un budget existe déjà pour cette catégorie et cette période"
        )
    
    # Créer le budget
    budget = {
        "user_id": current_user["_id"],
        "category_id": ObjectId(budget_data.category_id),
        "amount": budget_data.amount,
        "period_type": budget_data.period_type,
        "is_recurring": budget_data.is_recurring,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Ajouter year/month si budget ponctuel
    if not budget_data.is_recurring:
        budget["year"] = budget_data.year
        budget["month"] = budget_data.month
    
    result = await budgets_collection.insert_one(budget)
    budget["_id"] = result.inserted_id
    
    # Calculer les dépenses pour la réponse
    billing_cycle_day = current_user.get("billing_cycle_day", 1)
    start_date, end_date = get_period_dates(budget_data.period_type, billing_cycle_day)
    
    # Calculer le montant dépensé (utiliser datetime objects directement)
    pipeline = [
        {
            "$match": {
                "user_id": current_user["_id"],
                "category_id": ObjectId(budget_data.category_id),
                "is_expense": True,
                "date": {"$gte": start_date, "$lt": end_date}
            }
        },
        {
            "$group": {
                "_id": None,
                "total": {"$sum": "$amount"}
            }
        }
    ]
    
    spent_result = await transactions_collection.aggregate(pipeline).to_list(length=1)
    spent = spent_result[0]["total"] if spent_result else 0.0
    
    remaining = budget["amount"] - spent
    percentage = (spent / budget["amount"] * 100) if budget["amount"] > 0 else 0
    
    return BudgetResponse(
        id=str(budget["_id"]),
        category_id=str(budget["category_id"]),
        category_name=category["name"],
        category_color=category["color"],
        amount=budget["amount"],
        spent=spent,
        remaining=remaining,
        percentage=percentage,
        period_type=budget["period_type"],
        is_recurring=budget.get("is_recurring", True),
        year=budget.get("year"),
        month=budget.get("month")
    )

@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: str,
    budget_data: BudgetUpdate,
    database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Met à jour un budget existant"""
    
    # Récupérer les collections
    budgets_collection = await database.get_collection("budgets")
    categories_collection = await database.get_collection("categories")
    transactions_collection = await database.get_collection("transactions")
    
    # Vérifier que le budget existe et appartient à l'utilisateur
    budget = await budgets_collection.find_one({
        "_id": ObjectId(budget_id),
        "user_id": current_user["_id"]
    })
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget non trouvé"
        )
    
    # Préparer les données de mise à jour
    update_data = {k: v for k, v in budget_data.dict(exclude_unset=True).items()}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucune donnée à mettre à jour"
        )
    
    update_data["updated_at"] = datetime.utcnow()
    
    # Mettre à jour le budget
    await budgets_collection.update_one(
        {"_id": ObjectId(budget_id)},
        {"$set": update_data}
    )
    
    # Récupérer le budget mis à jour
    updated_budget = await budgets_collection.find_one({"_id": ObjectId(budget_id)})
    
    # Récupérer les infos de la catégorie
    category = await categories_collection.find_one({"_id": updated_budget["category_id"]})
    
    # Calculer les dépenses
    billing_cycle_day = current_user.get("billing_cycle_day", 1)
    start_date, end_date = get_period_dates(updated_budget["period_type"], billing_cycle_day)
    
    # Convertir les dates en strings pour MongoDB
    
    # Calculer le montant dépensé (utiliser datetime objects directement)
    pipeline = [
        {
            "$match": {
                "user_id": current_user["_id"],
                "category_id": updated_budget["category_id"],
                "is_expense": True,
                "date": {"$gte": start_date, "$lt": end_date}
            }
        },
        {
            "$group": {
                "_id": None,
                "total": {"$sum": "$amount"}
            }
        }
    ]
    
    spent_result = await transactions_collection.aggregate(pipeline).to_list(length=1)
    spent = spent_result[0]["total"] if spent_result else 0.0
    
    remaining = updated_budget["amount"] - spent
    percentage = (spent / updated_budget["amount"] * 100) if updated_budget["amount"] > 0 else 0
    
    return BudgetResponse(
        id=str(updated_budget["_id"]),
        category_id=str(updated_budget["category_id"]),
        category_name=category["name"],
        category_color=category["color"],
        amount=updated_budget["amount"],
        spent=spent,
        remaining=remaining,
        percentage=percentage,
        period_type=updated_budget["period_type"],
        is_recurring=updated_budget.get("is_recurring", True),
        year=updated_budget.get("year"),
        month=updated_budget.get("month")
    )

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: str,
    database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Supprime un budget"""
    
    budgets_collection = await database.get_collection("budgets")
    
    result = await budgets_collection.delete_one({
        "_id": ObjectId(budget_id),
        "user_id": current_user["_id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget non trouvé"
        )
    
    return None
