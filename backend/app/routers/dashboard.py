from typing import Dict, Optional
from datetime import datetime, date
from bson import ObjectId

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.database import get_db
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/")
async def get_dashboard_data(
    period: str = Query("current", description="Période: current, previous, year"),
    start_date: Optional[str] = Query(None, description="Date de début (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Date de fin (YYYY-MM-DD)"),
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Récupérer les données du tableau de bord.
    """
    try:
        # Si start_date et end_date sont fournis, utiliser ces dates
        if start_date and end_date:
            start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
            end_datetime = datetime.strptime(end_date, "%Y-%m-%d")
        else:
            # Récupérer le billing_cycle_day de l'utilisateur
            billing_cycle_day = current_user.get("billing_cycle_day", 1)
            
            # Calculer la période
            now = datetime.now()
            if period == "current":
                # Utilise le billing_cycle_day pour déterminer le début du mois
                if now.day >= billing_cycle_day:
                    start_datetime = datetime(now.year, now.month, billing_cycle_day)
                    # Mois suivant
                    if now.month == 12:
                        end_datetime = datetime(now.year + 1, 1, billing_cycle_day)
                    else:
                        end_datetime = datetime(now.year, now.month + 1, billing_cycle_day)
                else:
                    # On est avant le billing_cycle_day, donc période précédente
                    if now.month == 1:
                        start_datetime = datetime(now.year - 1, 12, billing_cycle_day)
                    else:
                        start_datetime = datetime(now.year, now.month - 1, billing_cycle_day)
                    end_datetime = datetime(now.year, now.month, billing_cycle_day)
            elif period == "previous":
                # Calculer le mois précédent en tenant compte du billing_cycle_day
                if now.day >= billing_cycle_day:
                    # Période actuelle, donc previous = mois -1
                    if now.month == 1:
                        start_datetime = datetime(now.year - 1, 12, billing_cycle_day)
                        end_datetime = datetime(now.year, 1, billing_cycle_day)
                    else:
                        start_datetime = datetime(now.year, now.month - 1, billing_cycle_day)
                        end_datetime = datetime(now.year, now.month, billing_cycle_day)
                else:
                    # On est déjà dans la période précédente, donc previous = mois -2
                    if now.month <= 2:
                        start_datetime = datetime(now.year - 1, 12 if now.month == 1 else 11, billing_cycle_day)
                        end_datetime = datetime(now.year - 1 if now.month == 1 else now.year, 12 if now.month == 1 else now.month - 1, billing_cycle_day)
                    else:
                        start_datetime = datetime(now.year, now.month - 2, billing_cycle_day)
                        end_datetime = datetime(now.year, now.month - 1, billing_cycle_day)
            else:  # year
                start_datetime = datetime(now.year, 1, 1)
                end_datetime = datetime(now.year + 1, 1, 1)

        # Convertir les datetime en strings pour MongoDB (les dates sont stockées en string)
        start_date_str = start_datetime.strftime("%Y-%m-%d")
        end_date_str = end_datetime.strftime("%Y-%m-%d")

        # Récupérer les transactions de la période
        collection = await db.get_collection("transactions")
        
        # Pipeline pour les statistiques générales
        stats_pipeline = [
            {"$match": {
                "user_id": current_user["_id"],
                "date": {"$gte": start_date_str, "$lt": end_date_str}
            }},
            {"$addFields": {
                "computed_is_expense": {
                    "$cond": [
                        {"$eq": [{"$type": "$is_expense"}, "bool"]},
                        "$is_expense",
                        {"$eq": ["$type", "expense"]}
                    ]
                }
            }},
            {"$group": {
                "_id": "$computed_is_expense",
                "total_amount": {"$sum": "$amount"},
                "count": {"$sum": 1}
            }}
        ]
        
        stats_results = await collection.aggregate(stats_pipeline).to_list(length=None)
        
        # Calculer les totaux
        total_income = 0
        total_expenses = 0
        income_count = 0
        expense_count = 0
        
        for result in stats_results:
            if result["_id"]:  # is_expense = True
                total_expenses = result["total_amount"]
                expense_count = result["count"]
            else:  # is_expense = False
                total_income = result["total_amount"]
                income_count = result["count"]
        
        net_amount = total_income - total_expenses
        
        # Pipeline pour les dépenses par catégorie
        category_pipeline = [
            {"$match": {
                "user_id": current_user["_id"],
                "date": {"$gte": start_date_str, "$lt": end_date_str}
            }},
            {"$addFields": {
                "computed_is_expense": {
                    "$cond": [
                        {"$eq": [{"$type": "$is_expense"}, "bool"]},
                        "$is_expense",
                        {"$eq": ["$type", "expense"]}
                    ]
                }
            }},
            {"$match": {
                "computed_is_expense": True
            }},
            {"$group": {
                "_id": "$category_id",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1}
            }},
            {"$sort": {"total": -1}}
        ]
        
        category_results = await collection.aggregate(category_pipeline).to_list(length=None)
        
        # Pipeline pour les revenus par catégorie
        income_category_pipeline = [
            {"$match": {
                "user_id": current_user["_id"],
                "date": {"$gte": start_date_str, "$lt": end_date_str}
            }},
            {"$addFields": {
                "computed_is_expense": {
                    "$cond": [
                        {"$eq": [{"$type": "$is_expense"}, "bool"]},
                        "$is_expense",
                        {"$eq": ["$type", "expense"]}
                    ]
                }
            }},
            {"$match": {
                "computed_is_expense": False
            }},
            {"$group": {
                "_id": "$category_id",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1}
            }},
            {"$sort": {"total": -1}}
        ]
        
        income_category_results = await collection.aggregate(income_category_pipeline).to_list(length=None)
        
        # Récupérer les détails des catégories
        categories = await db.find_many("categories", {"user_id": current_user["_id"]})
        category_map = {str(cat["_id"]): cat for cat in categories}
        
        # Préparer les données des catégories de dépenses
        expenses_by_category = []
        for result in category_results:
            category_id = str(result["_id"]) if result["_id"] else "uncategorized"
            category_data = {
                "id": category_id,
                "total": result["total"],
                "count": result["count"],
                "percentage": (result["total"] / total_expenses * 100) if total_expenses > 0 else 0
            }
            
            if category_id in category_map:
                cat = category_map[category_id]
                category_data.update({
                    "name": cat["name"],
                    "color": cat.get("color", "#6b7280"),
                    "parent_id": cat.get("parent_id")
                })
                # Ajouter le nom du parent si c'est une sous-catégorie
                if cat.get("parent_id"):
                    parent = category_map.get(str(cat["parent_id"]))
                    if parent:
                        category_data["parent_name"] = parent["name"]
            else:
                category_data.update({
                    "name": "Non catégorisé",
                    "color": "#6b7280"
                })
            
            expenses_by_category.append(category_data)
        
        # Préparer les données des catégories de revenus
        income_by_category = []
        for result in income_category_results:
            category_id = str(result["_id"]) if result["_id"] else "uncategorized"
            category_data = {
                "id": category_id,
                "total": result["total"],
                "count": result["count"],
                "percentage": (result["total"] / total_income * 100) if total_income > 0 else 0
            }
            
            if category_id in category_map:
                cat = category_map[category_id]
                category_data.update({
                    "name": cat["name"],
                    "color": cat.get("color", "#6b7280"),
                    "parent_id": cat.get("parent_id")
                })
                # Ajouter le nom du parent si c'est une sous-catégorie
                if cat.get("parent_id"):
                    parent = category_map.get(str(cat["parent_id"]))
                    if parent:
                        category_data["parent_name"] = parent["name"]
            else:
                category_data.update({
                    "name": "Non catégorisé",
                    "color": "#6b7280"
                })
            
            income_by_category.append(category_data)
        
        # Récupérer les transactions récentes de la période
        recent_transactions = await collection.find({
            "user_id": current_user["_id"],
            "date": {"$gte": start_date_str, "$lt": end_date_str}
        }).sort("date", -1).limit(100).to_list(length=100)
        
        # Récupérer la collection des connexions bancaires pour ajouter les infos bank
        bank_connections_collection = await db.get_collection("bank_connections")
        bank_accounts_collection = await db.get_collection("bank_accounts")
        
        # Préparer les transactions récentes
        recent_transactions_data = []
        for transaction in recent_transactions:
            # Gérer les deux formats : is_expense (boolean) ou type (string)
            is_expense = transaction.get("is_expense")
            if is_expense is None and "type" in transaction:
                # Convertir type ('income'/'expense') en is_expense (boolean)
                is_expense = transaction["type"] == "expense"
            
            transaction_data = {
                "id": str(transaction["_id"]),
                "description": transaction["description"],
                "amount": transaction["amount"],
                "is_expense": is_expense if is_expense is not None else True,
                "date": transaction["date"],
                "merchant": transaction.get("merchant"),
                "category": None
            }
            
            # Récupérer la connexion bancaire si elle existe
            if transaction.get("bank_connection_id"):
                bank_conn_id = transaction["bank_connection_id"]
                if isinstance(bank_conn_id, str):
                    from bson import ObjectId
                    bank_conn_id = ObjectId(bank_conn_id)
                bank_connection = await bank_connections_collection.find_one({
                    "_id": bank_conn_id
                })
                if bank_connection:
                    transaction_data["bank"] = {
                        "id": str(bank_connection["_id"]),
                        "name": bank_connection.get("bank"),
                        "nickname": bank_connection.get("nickname"),
                        "connection_type": bank_connection.get("connection_type")
                    }
            
            # Récupérer le compte bancaire si il existe
            if transaction.get("bank_account_id"):
                bank_acc_id = transaction["bank_account_id"]
                if isinstance(bank_acc_id, str):
                    from bson import ObjectId
                    bank_acc_id = ObjectId(bank_acc_id)
                bank_account = await bank_accounts_collection.find_one({
                    "_id": bank_acc_id
                })
                if bank_account:
                    transaction_data["account"] = {
                        "id": str(bank_account["_id"]),
                        "name": bank_account.get("name"),
                        "type": bank_account.get("account_type"),
                        "external_id": bank_account.get("external_id"),
                        "balance": bank_account.get("balance"),
                        "currency": bank_account.get("currency", "EUR")
                    }
            
            if transaction.get("category_id"):
                category = category_map.get(str(transaction["category_id"]))
                if category:
                    transaction_data["category"] = {
                        "id": str(category["_id"]),
                        "name": category["name"],
                        "parent_id": category.get("parent_id")
                    }
                    # Ajouter le nom du parent si c'est une sous-catégorie
                    if category.get("parent_id"):
                        parent = category_map.get(str(category["parent_id"]))
                        if parent:
                            transaction_data["category"]["parent_name"] = parent["name"]
            
            recent_transactions_data.append(transaction_data)
        
        # Récupérer les informations budgétaires (optionnel, ne doit pas casser le dashboard)
        budget_info = {
            "total_budget": 0,
            "total_spent": 0,
            "total_remaining": 0,
            "usage_percentage": 0,
            "budgets": []
        }
        
        try:
            budgets_collection = await db.get_collection("budgets")
            
            # Construire le filtre pour les budgets en fonction de la période
            budget_filter = {"user_id": current_user["_id"]}
            
            # Pour la période actuelle, on cherche :
            # 1. Les budgets récurrents (is_recurring=True)
            # 2. Les budgets ponctuels pour ce mois/année spécifique
            if period in ["current", "previous"]:
                budget_filter["$or"] = [
                    {"is_recurring": True},  # Budgets récurrents
                    {  # Budgets ponctuels pour ce mois
                        "is_recurring": False,
                        "year": start_datetime.year,
                        "month": start_datetime.month
                    }
                ]
            else:  # year
                # Pour l'année, on prend tous les budgets récurrents
                budget_filter["is_recurring"] = True
            
            budgets_cursor = budgets_collection.find(budget_filter)
            budgets = await budgets_cursor.to_list(length=None)
            
            if budgets:
                total_budget = 0
                total_spent_budget = 0
                budget_summary = []
                
                # Créer un dict des dépenses par catégorie pour un accès rapide
                expenses_dict = {}
                for exp in expenses_by_category:
                    expenses_dict[exp["id"]] = exp["total"]
                
                for budget in budgets:
                    # Récupérer les infos de la catégorie
                    category = category_map.get(str(budget["category_id"]))
                    if not category:
                        continue
                    
                    # Calculer les dépenses pour cette catégorie
                    spent = expenses_dict.get(str(budget["category_id"]), 0)
                    
                    # Ajouter les dépenses des sous-catégories
                    for cat_id, cat_data in category_map.items():
                        if cat_data.get("parent_id") == str(budget["category_id"]):
                            spent += expenses_dict.get(cat_id, 0)
                    
                    # Calculer le montant du budget selon la période
                    budget_amount = budget["amount"]
                    if period == "year" and budget.get("period_type") == "monthly":
                        # Pour une année, multiplier le budget mensuel par 12
                        budget_amount = budget_amount * 12
                    
                    remaining = budget_amount - spent
                    percentage = (spent / budget_amount * 100) if budget_amount > 0 else 0
                    
                    total_budget += budget_amount
                    total_spent_budget += spent
                    
                    budget_summary.append({
                        "category_id": str(budget["category_id"]),
                        "category_name": category["name"],
                        "category_color": category.get("color", "#3b82f6"),
                        "amount": budget_amount,
                        "spent": spent,
                        "remaining": remaining,
                        "percentage": percentage
                    })
                
                # Calculer le budget restant total
                total_budget_remaining = total_budget - total_spent_budget
                budget_usage_percentage = (total_spent_budget / total_budget * 100) if total_budget > 0 else 0
                
                budget_info = {
                    "total_budget": total_budget,
                    "total_spent": total_spent_budget,
                    "total_remaining": total_budget_remaining,
                    "usage_percentage": budget_usage_percentage,
                    "budgets": budget_summary[:5]  # Top 5 budgets
                }
        except Exception as e:
            # En cas d'erreur, on continue avec budget_info vide
            print(f"Erreur lors de la récupération des budgets: {e}")
        
        # Préparer la réponse
        dashboard_data = {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net_amount": net_amount,
            "income_count": income_count,
            "expense_count": expense_count,
            "savings": 0,  # À implémenter plus tard
            "expenses_by_category": expenses_by_category,
            "income_by_category": income_by_category,
            "recent_transactions": recent_transactions_data,
            "budget_info": budget_info,
            "period": {
                "start": start_datetime,
                "end": end_datetime,
                "label": f"{start_datetime.strftime('%B %Y')}"
            }
        }
        
        return dashboard_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des données du dashboard: {str(e)}"
        )


@router.get("/monthly")
async def get_monthly_dashboard(
    year: int = Query(..., description="Année"),
    month: int = Query(..., description="Mois (1-12)"),
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Récupérer les données du dashboard pour un mois spécifique.
    """
    return await get_dashboard_data(f"{year}-{month:02d}", current_user, db)


@router.get("/by-category")
async def get_category_dashboard(
    period: str = Query("current", description="Période"),
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Récupérer les données du dashboard groupées par catégorie.
    """
    dashboard_data = await get_dashboard_data(period, current_user, db)
    return {
        "expenses_by_category": dashboard_data["expenses_by_category"],
        "period": dashboard_data["period"]
    }


@router.get("/trends")
async def get_dashboard_trends(
    period: str = Query("current", description="Période"),
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Récupérer les tendances du dashboard.
    """
    # À implémenter plus tard
    return {"message": "Fonctionnalité en cours de développement"}


@router.get("/alerts")
async def get_budget_alerts(
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Récupérer les alertes budgétaires.
    """
    # À implémenter plus tard
    return {"alerts": []}
