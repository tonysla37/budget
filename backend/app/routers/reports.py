from typing import Optional
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.routers.auth import get_current_active_user
from app.services.reports import (
    generate_monthly_report, generate_salary_based_monthly_report, 
    get_trend_data
)
from app.schemas import MonthlyReport, PeriodReport

router = APIRouter()


@router.get("/monthly/{year}/{month}", response_model=MonthlyReport)
async def get_monthly_report(
    year: int,
    month: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Obtenir un rapport financier pour un mois spécifique.
    """
    try:
        return generate_monthly_report(db, current_user.id, year, month)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/salary-based", response_model=PeriodReport)
async def get_salary_based_report(
    reference_date: Optional[date] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Obtenir un rapport financier basé sur le mois budgétaire (d'un salaire à l'autre).
    Si reference_date n'est pas fourni, utilise la date actuelle.
    """
    if not reference_date:
        reference_date = date.today()
        
    try:
        return generate_salary_based_monthly_report(db, current_user.id, reference_date)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/trends")
async def get_trends(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    group_by: str = Query("month", enum=["day", "week", "month", "year"]),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Obtenir les données de tendance pour les graphiques.
    
    - start_date: Date de début pour les données
    - end_date: Date de fin pour les données
    - group_by: 'day', 'week', 'month', or 'year' pour regrouper les données
    """
    # Par défaut, prendre les 12 derniers mois
    if not end_date:
        end_date = date.today()
    if not start_date:
        # Start date = 12 mois avant
        if end_date.month == 1:
            start_date = date(end_date.year - 1, 12, 1)
        else:
            start_date = date(end_date.year, end_date.month - 1, 1)
            
    try:
        return get_trend_data(
            db=db, 
            user_id=current_user.id, 
            start_date=start_date, 
            end_date=end_date, 
            group_by=group_by
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) 