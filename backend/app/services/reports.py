import calendar
from datetime import datetime, date, timedelta
from typing import Dict, List, Tuple, Optional, Any
from collections import defaultdict

from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.models.transaction import Transaction, Category, Tag
from app.schemas import MonthlyReport, PeriodReport


def get_month_boundaries(year: int, month: int) -> Tuple[date, date]:
    """
    Retourne le premier et le dernier jour du mois spécifié.
    """
    first_day = date(year, month, 1)
    
    # Obtenir le dernier jour du mois
    _, last_day_num = calendar.monthrange(year, month)
    last_day = date(year, month, last_day_num)
    
    return first_day, last_day


def get_salary_month_boundaries(user_id: int, db: Session, reference_date: date) -> Tuple[date, date]:
    """
    Détermine les limites du mois budgétaire basées sur la date de réception du salaire.
    Le mois budgétaire va du jour de réception du salaire jusqu'à la veille de la réception du mois suivant.
    """
    # Essayer de trouver la transaction de salaire la plus récente avant la date de référence
    latest_salary = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.is_expense == False,  # C'est un crédit
        Transaction.amount >= 1000,  # Montant significatif, à ajuster selon les besoins
        Transaction.date <= reference_date,
        Transaction.description.ilike('%salaire%')  # Description contenant "salaire"
    ).order_by(Transaction.date.desc()).first()
    
    if latest_salary:
        # Utiliser le jour du mois du salaire comme point de référence
        salary_day = latest_salary.date.day
        
        # Si la date de référence est avant le jour de salaire du mois courant,
        # le début du mois budgétaire est le jour de salaire du mois précédent
        if reference_date.day < salary_day:
            if reference_date.month == 1:
                start_year = reference_date.year - 1
                start_month = 12
            else:
                start_year = reference_date.year
                start_month = reference_date.month - 1
                
            start_date = date(start_year, start_month, salary_day)
        else:
            start_date = date(reference_date.year, reference_date.month, salary_day)
            
        # La fin du mois budgétaire est la veille du prochain salaire
        if start_date.month == 12:
            end_month = 1
            end_year = start_date.year + 1
        else:
            end_month = start_date.month + 1
            end_year = start_date.year
            
        # Ajuster pour éviter d'avoir un jour invalide (e.g., 30 février)
        _, last_day = calendar.monthrange(end_year, end_month)
        end_day = min(salary_day - 1, last_day)
        if end_day < 1:
            end_day = last_day
            
        end_date = date(end_year, end_month, end_day)
    else:
        # Si pas de salaire trouvé, utiliser le mois calendaire classique
        first_day, last_day = get_month_boundaries(reference_date.year, reference_date.month)
        start_date = first_day
        end_date = last_day
        
    return start_date, end_date


def generate_monthly_report(db: Session, user_id: int, year: int, month: int) -> MonthlyReport:
    """
    Génère un rapport financier mensuel.
    """
    # Obtenir le premier et le dernier jour du mois
    start_date, end_date = get_month_boundaries(year, month)
    
    # Récupérer toutes les transactions du mois
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).all()
    
    # Calculer les totaux
    total_income = sum(tx.amount for tx in transactions if not tx.is_expense)
    total_expenses = sum(tx.amount for tx in transactions if tx.is_expense)
    net = total_income - total_expenses
    
    # Grouper par catégorie
    expenses_by_category = defaultdict(float)
    income_by_category = defaultdict(float)
    
    for tx in transactions:
        category_name = tx.category.name if tx.category else "Non catégorisé"
        
        if tx.is_expense:
            expenses_by_category[category_name] += tx.amount
        else:
            income_by_category[category_name] += tx.amount
    
    return MonthlyReport(
        year=year,
        month=month,
        total_income=total_income,
        total_expenses=total_expenses,
        net=net,
        expenses_by_category=dict(expenses_by_category),
        income_by_category=dict(income_by_category)
    )


def generate_salary_based_monthly_report(db: Session, user_id: int, reference_date: date) -> PeriodReport:
    """
    Génère un rapport financier basé sur le mois budgétaire (d'un salaire à l'autre).
    """
    # Déterminer les limites du mois budgétaire
    start_date, end_date = get_salary_month_boundaries(user_id, db, reference_date)
    
    # Récupérer toutes les transactions de la période
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).all()
    
    # Calculer les totaux
    total_income = sum(tx.amount for tx in transactions if not tx.is_expense)
    total_expenses = sum(tx.amount for tx in transactions if tx.is_expense)
    net = total_income - total_expenses
    
    # Grouper par catégorie
    expenses_by_category = defaultdict(float)
    income_by_category = defaultdict(float)
    expenses_by_tag = defaultdict(float)
    income_by_tag = defaultdict(float)
    
    for tx in transactions:
        # Par catégorie
        category_name = tx.category.name if tx.category else "Non catégorisé"
        
        if tx.is_expense:
            expenses_by_category[category_name] += tx.amount
        else:
            income_by_category[category_name] += tx.amount
            
        # Par tag
        for tag in tx.tags:
            if tx.is_expense:
                expenses_by_tag[tag.name] += tx.amount
            else:
                income_by_tag[tag.name] += tx.amount
    
    return PeriodReport(
        start_date=start_date,
        end_date=end_date,
        total_income=total_income,
        total_expenses=total_expenses,
        net=net,
        expenses_by_category=dict(expenses_by_category),
        income_by_category=dict(income_by_category),
        expenses_by_tag=dict(expenses_by_tag),
        income_by_tag=dict(income_by_tag)
    )


def get_trend_data(
    db: Session, 
    user_id: int, 
    start_date: date, 
    end_date: date, 
    group_by: str = 'month'
) -> Dict[str, List]:
    """
    Obtient les données de tendance pour les graphiques.
    
    Parameters:
    - group_by: 'day', 'week', 'month', or 'year'
    """
    if group_by == 'day':
        date_trunc = func.date(Transaction.date)
    elif group_by == 'week':
        # Supposons que la semaine commence le lundi (0 pour les lundis)
        date_trunc = func.date_trunc('week', Transaction.date)
    elif group_by == 'month':
        date_trunc = func.date_trunc('month', Transaction.date)
    elif group_by == 'year':
        date_trunc = func.date_trunc('year', Transaction.date)
    else:
        raise ValueError("group_by must be 'day', 'week', 'month', or 'year'")
    
    # Requête pour les dépenses par période
    expenses_by_period = db.query(
        date_trunc.label('period'),
        func.sum(Transaction.amount).label('amount')
    ).filter(
        Transaction.user_id == user_id,
        Transaction.is_expense == True,
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).group_by('period').order_by('period').all()
    
    # Requête pour les revenus par période
    income_by_period = db.query(
        date_trunc.label('period'),
        func.sum(Transaction.amount).label('amount')
    ).filter(
        Transaction.user_id == user_id,
        Transaction.is_expense == False,
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).group_by('period').order_by('period').all()
    
    # Formater les résultats
    expenses_data = [{"date": period, "amount": amount} for period, amount in expenses_by_period]
    income_data = [{"date": period, "amount": amount} for period, amount in income_by_period]
    
    return {
        "expenses": expenses_data,
        "income": income_data
    } 