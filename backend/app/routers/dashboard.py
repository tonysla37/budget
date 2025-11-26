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
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Récupérer les données du tableau de bord.
    """
    try:
        # Calculer la période
        now = datetime.now()
        if period == "current":
            start_date = datetime(now.year, now.month, 1)
            if now.month == 12:
                end_date = datetime(now.year + 1, 1, 1)
            else:
                end_date = datetime(now.year, now.month + 1, 1)
        elif period == "previous":
            if now.month == 1:
                start_date = datetime(now.year - 1, 12, 1)
                end_date = datetime(now.year, 1, 1)
            else:
                start_date = datetime(now.year, now.month - 1, 1)
                end_date = datetime(now.year, now.month, 1)
        else:  # year
            start_date = datetime(now.year, 1, 1)
            end_date = datetime(now.year + 1, 1, 1)

        # Récupérer les transactions de la période
        collection = await db.get_collection("transactions")
        
        # Pipeline pour les statistiques générales
        stats_pipeline = [
            {"$match": {
                "user_id": current_user["_id"],
                "date": {"$gte": start_date, "$lt": end_date}
            }},
            {"$group": {
                "_id": "$is_expense",
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
                "date": {"$gte": start_date, "$lt": end_date},
                "is_expense": True
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
                "date": {"$gte": start_date, "$lt": end_date},
                "is_expense": False
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
                category_data.update({
                    "name": category_map[category_id]["name"],
                    "color": category_map[category_id].get("color", "#6b7280")
                })
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
                category_data.update({
                    "name": category_map[category_id]["name"],
                    "color": category_map[category_id].get("color", "#6b7280")
                })
            else:
                category_data.update({
                    "name": "Non catégorisé",
                    "color": "#6b7280"
                })
            
            income_by_category.append(category_data)
        
        # Récupérer les transactions récentes
        recent_transactions = await collection.find({
            "user_id": current_user["_id"]
        }).sort("date", -1).limit(10).to_list(length=10)
        
        # Préparer les transactions récentes
        recent_transactions_data = []
        for transaction in recent_transactions:
            transaction_data = {
                "id": str(transaction["_id"]),
                "description": transaction["description"],
                "amount": transaction["amount"],
                "is_expense": transaction["is_expense"],
                "date": transaction["date"],
                "category": None
            }
            
            if transaction.get("category_id"):
                category = category_map.get(str(transaction["category_id"]))
                if category:
                    transaction_data["category"] = {
                        "id": str(category["_id"]),
                        "name": category["name"]
                    }
            
            recent_transactions_data.append(transaction_data)
        
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
            "period": {
                "start": start_date,
                "end": end_date,
                "label": f"{start_date.strftime('%B %Y')}"
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
