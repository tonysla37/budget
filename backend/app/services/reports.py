import calendar
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any

from app.models.transaction import Transaction, Category, Tag


def get_month_boundaries(year: int, month: int) -> Tuple[date, date]:
    """
    Récupère les dates de début et de fin d'un mois donné.
    """
    # Premier jour du mois
    start_date = date(year, month, 1)
    
    # Dernier jour du mois
    last_day = calendar.monthrange(year, month)[1]
    end_date = date(year, month, last_day)
    
    return start_date, end_date


def get_salary_month_boundaries(year: int, month: int, salary_day: int = 25) -> Tuple[date, date]:
    """
    Récupère les dates de début et de fin d'un mois de salaire (généralement du 25 du mois précédent au 24 du mois courant).
    """
    # Jour du salaire du mois précédent
    if month == 1:
        start_month = 12
        start_year = year - 1
    else:
        start_month = month - 1
        start_year = year
    
    start_date = date(start_year, start_month, salary_day)
    
    # Jour avant le prochain salaire
    end_date = date(year, month, salary_day - 1)
    
    return start_date, end_date


async def generate_monthly_report(db_session, user_id: str, year: int, month: int) -> Dict[str, Any]:
    """
    Génère un rapport mensuel des transactions pour un utilisateur.
    """
    start_date, end_date = get_month_boundaries(year, month)
    
    # Requête pour trouver les transactions du mois
    transactions = await db_session.find({
        "user_id": user_id,
        "date": {
            "$gte": datetime.combine(start_date, datetime.min.time()),
            "$lte": datetime.combine(end_date, datetime.max.time())
        }
    }).to_list(None)
    
    # Statistiques de base
    total_income = sum(tx["amount"] for tx in transactions if not tx["is_expense"])
    total_expense = sum(tx["amount"] for tx in transactions if tx["is_expense"])
    balance = total_income - total_expense
    
    # Transactions par catégorie
    categories = {}
    for tx in transactions:
        if tx["category_id"]:
            cat_id = str(tx["category_id"])
            if cat_id not in categories:
                categories[cat_id] = 0
            
            if tx["is_expense"]:
                categories[cat_id] += tx["amount"]
            else:
                categories[cat_id] -= tx["amount"]
    
    # Récupération des noms des catégories
    category_ids = list(categories.keys())
    cats = await db_session.find({
        "_id": {"$in": category_ids}
    }).to_list(None)
    
    cat_dict = {str(cat["_id"]): cat["name"] for cat in cats}
    
    # Formater les catégories pour le rapport
    category_expenses = [
        {
            "category_id": cat_id,
            "category_name": cat_dict.get(cat_id, "Inconnu"),
            "amount": amount
        }
        for cat_id, amount in categories.items()
    ]
    
    # Tri par montant
    category_expenses.sort(key=lambda x: x["amount"], reverse=True)
    
    return {
        "period": {
            "year": year,
            "month": month,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "summary": {
            "total_income": total_income,
            "total_expense": total_expense,
            "balance": balance
        },
        "categories": category_expenses,
        "transactions": transactions
    }


async def generate_salary_based_monthly_report(db_session, user_id: str, year: int, month: int, salary_day: int = 25) -> Dict[str, Any]:
    """
    Génère un rapport mensuel basé sur la période de salaire (du jour de paie à la veille du jour de paie du mois suivant).
    """
    start_date, end_date = get_salary_month_boundaries(year, month, salary_day)
    
    # Le reste de la fonction est similaire à generate_monthly_report, mais avec des dates différentes
    # Requête pour trouver les transactions de la période
    transactions = await db_session.find({
        "user_id": user_id,
        "date": {
            "$gte": datetime.combine(start_date, datetime.min.time()),
            "$lte": datetime.combine(end_date, datetime.max.time())
        }
    }).to_list(None)
    
    # Statistiques de base
    total_income = sum(tx["amount"] for tx in transactions if not tx["is_expense"])
    total_expense = sum(tx["amount"] for tx in transactions if tx["is_expense"])
    balance = total_income - total_expense
    
    # Transactions par catégorie
    categories = {}
    for tx in transactions:
        if tx["category_id"]:
            cat_id = str(tx["category_id"])
            if cat_id not in categories:
                categories[cat_id] = 0
            
            if tx["is_expense"]:
                categories[cat_id] += tx["amount"]
            else:
                categories[cat_id] -= tx["amount"]
    
    # Récupération des noms des catégories
    category_ids = list(categories.keys())
    cats = await db_session.find({
        "_id": {"$in": category_ids}
    }).to_list(None)
    
    cat_dict = {str(cat["_id"]): cat["name"] for cat in cats}
    
    # Formater les catégories pour le rapport
    category_expenses = [
        {
            "category_id": cat_id,
            "category_name": cat_dict.get(cat_id, "Inconnu"),
            "amount": amount
        }
        for cat_id, amount in categories.items()
    ]
    
    # Tri par montant
    category_expenses.sort(key=lambda x: x["amount"], reverse=True)
    
    return {
        "period": {
            "year": year,
            "month": month,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "salary_day": salary_day
        },
        "summary": {
            "total_income": total_income,
            "total_expense": total_expense,
            "balance": balance
        },
        "categories": category_expenses,
        "transactions": transactions
    }


async def get_trend_data(db_session, user_id: str, months: int = 6) -> Dict[str, Any]:
    """
    Récupère les données de tendance des derniers mois.
    """
    # Date de début (il y a X mois)
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=30 * months)
    
    # Requête pour trouver les transactions des derniers mois
    transactions = await db_session.find({
        "user_id": user_id,
        "date": {
            "$gte": datetime.combine(start_date, datetime.min.time()),
            "$lte": datetime.combine(end_date, datetime.max.time())
        }
    }).to_list(None)
    
    # Grouper les transactions par mois
    monthly_data = {}
    for tx in transactions:
        tx_date = tx["date"]
        key = f"{tx_date.year}-{tx_date.month:02d}"
        
        if key not in monthly_data:
            monthly_data[key] = {
                "income": 0,
                "expense": 0
            }
        
        if tx["is_expense"]:
            monthly_data[key]["expense"] += tx["amount"]
        else:
            monthly_data[key]["income"] += tx["amount"]
    
    # Formater les données pour le graphique
    trend = [
        {
            "period": key,
            "income": data["income"],
            "expense": data["expense"],
            "balance": data["income"] - data["expense"]
        }
        for key, data in sorted(monthly_data.items())
    ]
    
    return {
        "trend": trend,
        "summary": {
            "total_income": sum(item["income"] for item in trend),
            "total_expense": sum(item["expense"] for item in trend),
            "average_income": sum(item["income"] for item in trend) / len(trend) if trend else 0,
            "average_expense": sum(item["expense"] for item in trend) / len(trend) if trend else 0
        }
    }
