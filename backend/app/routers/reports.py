from typing import Optional, Dict, Any
from datetime import date, datetime, timedelta
from calendar import monthrange
from bson import ObjectId

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.database import get_db
from app.routers.auth import get_current_active_user

router = APIRouter()


@router.get("/monthly/{year}/{month}")
async def get_monthly_report(
    year: int,
    month: int,
    current_user: Dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """
    Obtenir un rapport financier pour un mois spécifique.
    """
    try:
        user_id = current_user["id"] if "id" in current_user else str(current_user["_id"])
        
        # Définir les limites du mois
        first_day = datetime(year, month, 1)
        last_day = datetime(year, month, monthrange(year, month)[1], 23, 59, 59, 999999)
        
        # Récupérer les transactions du mois
        transactions_collection = await db.get_collection("transactions")
        transactions_cursor = transactions_collection.find({
            "user_id": user_id,
            "date": {
                "$gte": first_day,
                "$lte": last_day
            }
        })
        transactions = await transactions_cursor.to_list(length=1000)
        
        # Calculer les totaux
        total_income = 0
        total_expenses = 0
        
        # Regrouper par catégorie
        categories = {}
        
        for tx in transactions:
            amount = abs(float(tx.get("amount", 0)))
            
            if tx.get("is_expense", True):
                total_expenses += amount
                
                # Ajouter aux statistiques de catégorie
                category_id = tx.get("category_id")
                if category_id:
                    if category_id not in categories:
                        categories[category_id] = {
                            "total": 0,
                            "count": 0
                        }
                    categories[category_id]["total"] += amount
                    categories[category_id]["count"] += 1
            else:
                total_income += amount
        
        # Récupérer les noms des catégories
        category_details = []
        if categories:
            categories_collection = await db.get_collection("categories")
            for cat_id, stats in categories.items():
                try:
                    cat = await categories_collection.find_one({"_id": ObjectId(cat_id)})
                    if cat:
                        category_details.append({
                            "id": str(cat["_id"]),
                            "name": cat.get("name", "Inconnu"),
                            "color": cat.get("color", "#000000"),
                            "total": stats["total"],
                            "count": stats["count"],
                            "percentage": (stats["total"] / total_expenses) * 100 if total_expenses > 0 else 0
                        })
                except Exception:
                    # Ignorer les catégories avec IDs invalides
                    pass
        
        # Trier les catégories par total décroissant
        category_details.sort(key=lambda x: x["total"], reverse=True)
        
        return {
            "year": year,
            "month": month,
            "total_income": total_income,
            "total_expenses": total_expenses,
            "balance": total_income - total_expenses,
            "categories": category_details,
            "transaction_count": len(transactions)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération du rapport mensuel: {str(e)}"
        )


@router.get("/salary-based")
async def get_salary_based_report(
    reference_date: Optional[date] = None,
    salary_day: int = Query(25, ge=1, le=31),
    current_user: Dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """
    Obtenir un rapport financier basé sur le mois budgétaire (d'un salaire à l'autre).
    Si reference_date n'est pas fourni, utilise la date actuelle.
    """
    try:
        user_id = current_user["id"] if "id" in current_user else str(current_user["_id"])
        
        if not reference_date:
            reference_date = date.today()
            
        # Déterminer la période entre deux salaires
        current_year = reference_date.year
        current_month = reference_date.month
        current_day = reference_date.day
        
        if current_day < salary_day:
            # Nous sommes avant le jour de salaire du mois courant
            end_date = datetime(current_year, current_month, salary_day - 1, 23, 59, 59, 999999)
            
            # Le début est le jour du salaire du mois précédent
            if current_month == 1:
                start_date = datetime(current_year - 1, 12, salary_day)
            else:
                start_date = datetime(current_year, current_month - 1, salary_day)
        else:
            # Nous sommes après ou le jour même du jour de salaire
            start_date = datetime(current_year, current_month, salary_day)
            
            # La fin est le jour avant le prochain salaire
            if current_month == 12:
                end_date = datetime(current_year + 1, 1, salary_day - 1, 23, 59, 59, 999999)
            else:
                end_date = datetime(current_year, current_month + 1, salary_day - 1, 23, 59, 59, 999999)
        
        # Récupérer les transactions de la période
        transactions_collection = await db.get_collection("transactions")
        transactions_cursor = transactions_collection.find({
            "user_id": user_id,
            "date": {
                "$gte": start_date,
                "$lte": end_date
            }
        })
        transactions = await transactions_cursor.to_list(length=1000)
        
        # Même logique de traitement que pour le rapport mensuel
        total_income = 0
        total_expenses = 0
        categories = {}
        
        for tx in transactions:
            amount = abs(float(tx.get("amount", 0)))
            
            if tx.get("is_expense", True):
                total_expenses += amount
                
                category_id = tx.get("category_id")
                if category_id:
                    if category_id not in categories:
                        categories[category_id] = {
                            "total": 0,
                            "count": 0
                        }
                    categories[category_id]["total"] += amount
                    categories[category_id]["count"] += 1
            else:
                total_income += amount
        
        # Récupérer les noms des catégories
        category_details = []
        if categories:
            categories_collection = await db.get_collection("categories")
            for cat_id, stats in categories.items():
                try:
                    cat = await categories_collection.find_one({"_id": ObjectId(cat_id)})
                    if cat:
                        category_details.append({
                            "id": str(cat["_id"]),
                            "name": cat.get("name", "Inconnu"),
                            "color": cat.get("color", "#000000"),
                            "total": stats["total"],
                            "count": stats["count"],
                            "percentage": (stats["total"] / total_expenses) * 100 if total_expenses > 0 else 0
                        })
                except Exception:
                    # Ignorer les catégories avec IDs invalides
                    pass
        
        category_details.sort(key=lambda x: x["total"], reverse=True)
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "salary_day": salary_day
            },
            "total_income": total_income,
            "total_expenses": total_expenses,
            "balance": total_income - total_expenses,
            "categories": category_details,
            "transaction_count": len(transactions)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération du rapport entre salaires: {str(e)}"
        )


@router.get("/trends")
async def get_trends(
    months: int = Query(6, ge=1, le=24),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: Dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """
    Obtenir les données de tendance pour les graphiques.
    
    - months: Nombre de mois à inclure dans l'analyse
    - start_date: Date de début pour les données (optionnel)
    - end_date: Date de fin pour les données (optionnel)
    """
    try:
        user_id = current_user["id"] if "id" in current_user else str(current_user["_id"])
        
        # Définir la période
        if not end_date:
            end_date = datetime.now().date()
            
        if not start_date:
            # Par défaut, prendre les X derniers mois
            start_date = (end_date - timedelta(days=30 * months))
        
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        # Récupérer les transactions de la période
        transactions_collection = await db.get_collection("transactions")
        transactions_cursor = transactions_collection.find({
            "user_id": user_id,
            "date": {
                "$gte": start_datetime,
                "$lte": end_datetime
            }
        })
        transactions = await transactions_cursor.to_list(length=None)
        
        # Regrouper les transactions par mois
        monthly_data = {}
        for tx in transactions:
            tx_date = tx.get("date")
            if not tx_date:
                continue
                
            # Clé pour le mois: "2023-01"
            month_key = f"{tx_date.year}-{tx_date.month:02d}"
            
            if month_key not in monthly_data:
                monthly_data[month_key] = {
                    "total_income": 0,
                    "total_expenses": 0,
                    "transaction_count": 0
                }
            
            amount = abs(float(tx.get("amount", 0)))
            if tx.get("is_expense", True):
                monthly_data[month_key]["total_expenses"] += amount
            else:
                monthly_data[month_key]["total_income"] += amount
                
            monthly_data[month_key]["transaction_count"] += 1
        
        # Calculer le solde mensuel
        for month_key, data in monthly_data.items():
            data["balance"] = data["total_income"] - data["total_expenses"]
        
        # Trier les mois chronologiquement
        sorted_months = sorted(monthly_data.keys())
        
        return {
            "monthly_data": monthly_data,
            "months": sorted_months,
            "summary": {
                "total_income": sum(data["total_income"] for data in monthly_data.values()),
                "total_expenses": sum(data["total_expenses"] for data in monthly_data.values()),
                "average_monthly_income": sum(data["total_income"] for data in monthly_data.values()) / len(monthly_data) if monthly_data else 0,
                "average_monthly_expenses": sum(data["total_expenses"] for data in monthly_data.values()) / len(monthly_data) if monthly_data else 0,
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération des tendances: {str(e)}"
        ) 