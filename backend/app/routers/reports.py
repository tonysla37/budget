from typing import List, Dict, Optional
from datetime import datetime, date
from bson import ObjectId

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.database import get_db
from app.schemas import MonthlyReport, PeriodReport
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/monthly/{year}/{month}", response_model=MonthlyReport)
async def get_monthly_report(
    year: int,
    month: int,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Récupérer le rapport mensuel pour une année et un mois donnés.
    """
    # Calculer les dates de début et fin du mois
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)
    
    # Agréger les données mensuelles (utiliser datetime objects directement)
    user_id = ObjectId(current_user["_id"]) if isinstance(current_user["_id"], str) else current_user["_id"]
    pipeline = [
        {"$match": {
            "user_id": user_id,
            "date": {"$gte": start_date, "$lt": end_date}
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
            "_id": {
                "is_expense": "$computed_is_expense",
                "category_id": "$category_id"
            },
            "total_amount": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"total_amount": -1}}
    ]
    
    collection = await db.get_collection("transactions")
    results = await collection.aggregate(pipeline).to_list(length=None)
    
    # Debug
    import logging
    logger = logging.getLogger("budget-api")
    logger.info(f"Reports monthly - year={year}, month={month}, start={start_date}, end={end_date}")
    logger.info(f"Reports monthly - Results count: {len(results)}")
    if results:
        logger.info(f"Reports monthly - First result: {results[0]}")
    
    # Organiser les données par type (revenus/dépenses)
    income_by_category = {}
    expenses_by_category = {}
    
    for result in results:
        category_id = str(result["_id"].get("category_id")) if result["_id"].get("category_id") else "uncategorized"
        amount = result["total_amount"]
        count = result["count"]
        
        if result["_id"]["is_expense"]:
            expenses_by_category[category_id] = {
                "amount": amount,
                "count": count
            }
        else:
            income_by_category[category_id] = {
                "amount": amount,
                "count": count
            }
    
    # Récupérer les détails des catégories
    categories = await db.find_many("categories", {"user_id": current_user["_id"]})
    category_map = {str(cat["_id"]): cat["name"] for cat in categories}
    
    # Calculer les totaux
    total_income = sum(data["amount"] for data in income_by_category.values())
    total_expenses = sum(data["amount"] for data in expenses_by_category.values())
    net_amount = total_income - total_expenses
    
    # Préparer la réponse
    report = {
        "year": year,
        "month": month,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net": net_amount,
        "income_by_category": [
            {
                "category_id": cat_id,
                "category_name": category_map.get(cat_id, "Non catégorisé"),
                "amount": data["amount"],
                "count": data["count"]
            }
            for cat_id, data in income_by_category.items()
        ],
        "expenses_by_category": [
            {
                "category_id": cat_id,
                "category_name": category_map.get(cat_id, "Non catégorisé"),
                "amount": data["amount"],
                "count": data["count"]
            }
            for cat_id, data in expenses_by_category.items()
        ]
    }
    
    return report


@router.get("/period", response_model=PeriodReport)
async def get_period_report(
    start_date: date = Query(..., description="Date de début (YYYY-MM-DD)"),
    end_date: date = Query(..., description="Date de fin (YYYY-MM-DD)"),
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Récupérer le rapport pour une période donnée.
    """
    # Convertir date en datetime pour la comparaison puis en string pour MongoDB
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())
    
    # Agréger les données pour la période (utiliser datetime objects directement)
    user_id = ObjectId(current_user["_id"]) if isinstance(current_user["_id"], str) else current_user["_id"]
    pipeline = [
        {"$match": {
            "user_id": user_id,
            "date": {"$gte": start_datetime, "$lte": end_datetime}
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
            "_id": {
                "is_expense": "$computed_is_expense",
                "category_id": "$category_id"
            },
            "total_amount": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"total_amount": -1}}
    ]
    
    collection = await db.get_collection("transactions")
    results = await collection.aggregate(pipeline).to_list(length=None)
    
    # Organiser les données
    income_by_category = {}
    expenses_by_category = {}
    
    for result in results:
        category_id = str(result["_id"].get("category_id")) if result["_id"].get("category_id") else "uncategorized"
        amount = result["total_amount"]
        count = result["count"]
        
        if result["_id"]["is_expense"]:
            expenses_by_category[category_id] = {
                "amount": amount,
                "count": count
            }
        else:
            income_by_category[category_id] = {
                "amount": amount,
                "count": count
            }
    
    # Récupérer les détails des catégories
    categories = await db.find_many("categories", {"user_id": current_user["_id"]})
    category_map = {str(cat["_id"]): cat["name"] for cat in categories}
    
    # Calculer les totaux
    total_income = sum(data["amount"] for data in income_by_category.values())
    total_expenses = sum(data["amount"] for data in expenses_by_category.values())
    net_amount = total_income - total_expenses
    
    # Préparer la réponse
    report = {
        "start_date": start_date,
        "end_date": end_date,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_amount": net_amount,
        "income_by_category": [
            {
                "category_id": cat_id,
                "category_name": category_map.get(cat_id, "Non catégorisé"),
                "amount": data["amount"],
                "count": data["count"]
            }
            for cat_id, data in income_by_category.items()
        ],
        "expenses_by_category": [
            {
                "category_id": cat_id,
                "category_name": category_map.get(cat_id, "Non catégorisé"),
                "amount": data["amount"],
                "count": data["count"]
            }
            for cat_id, data in expenses_by_category.items()
        ]
    }
    
    return report


@router.get("/trends")
async def get_trends_report(
    months: int = Query(6, description="Nombre de mois à analyser"),
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Récupérer les tendances sur plusieurs mois.
    """
    # Calculer la date de début
    end_date = datetime.now()
    start_date = datetime(end_date.year, end_date.month - months + 1, 1)
    
    # Convertir en strings pour MongoDB
    
    # Agréger les données par mois (utiliser datetime objects directement)
    pipeline = [
        {"$match": {
            "user_id": current_user["_id"],
            "date": {"$gte": start_date, "$lte": end_date}
        }},
        {"$group": {
            "_id": {
                "year": {"$year": "$date"},
                "month": {"$month": "$date"},
                "is_expense": "$is_expense"
            },
            "total_amount": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1}}
    ]
    
    collection = await db.get_collection("transactions")
    results = await collection.aggregate(pipeline).to_list(length=None)
    
    # Organiser les données par mois
    monthly_data = {}
    
    for result in results:
        year = result["_id"]["year"]
        month = result["_id"]["month"]
        key = f"{year}-{month:02d}"
        
        if key not in monthly_data:
            monthly_data[key] = {
                "year": year,
                "month": month,
                "income": 0,
                "expenses": 0,
                "net": 0
            }
        
        if result["_id"]["is_expense"]:
            monthly_data[key]["expenses"] = result["total_amount"]
        else:
            monthly_data[key]["income"] = result["total_amount"]
        
        monthly_data[key]["net"] = monthly_data[key]["income"] - monthly_data[key]["expenses"]
    
    # Convertir en liste triée
    trends = sorted(monthly_data.values(), key=lambda x: (x["year"], x["month"]))
    
    return {
        "period_months": months,
        "trends": trends
    } 