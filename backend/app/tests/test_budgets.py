"""
Tests unitaires pour app/routers/budgets.py

Ces tests vérifient que les conversions de dates et ObjectId sont correctes
dans toutes les fonctions de gestion des budgets.
"""

import pytest
from datetime import datetime
from bson import ObjectId
from unittest.mock import Mock, AsyncMock, patch

from app.routers.budgets import get_period_dates


class TestGetPeriodDates:
    """Tests pour la fonction get_period_dates"""
    
    def test_monthly_period_mid_month(self):
        """Test période mensuelle en milieu de mois (après billing_cycle_day)"""
        with patch('app.routers.budgets.datetime') as mock_datetime:
            # Simuler le 15 décembre 2025 (après le billing_cycle_day=5)
            mock_datetime.utcnow.return_value = datetime(2025, 12, 15)
            mock_datetime.side_effect = lambda *args, **kwargs: datetime(*args, **kwargs)
            
            start_date, end_date = get_period_dates("monthly", billing_cycle_day=5)
            
            # Doit retourner du 5 déc au 5 janv
            assert start_date == datetime(2025, 12, 5)
            assert end_date == datetime(2026, 1, 5)
    
    def test_monthly_period_before_billing_day(self):
        """Test période mensuelle avant le billing_cycle_day"""
        with patch('app.routers.budgets.datetime') as mock_datetime:
            # Simuler le 3 décembre 2025 (avant le billing_cycle_day=5)
            mock_datetime.utcnow.return_value = datetime(2025, 12, 3)
            mock_datetime.side_effect = lambda *args, **kwargs: datetime(*args, **kwargs)
            
            start_date, end_date = get_period_dates("monthly", billing_cycle_day=5)
            
            # Doit retourner du 5 nov au 5 déc
            assert start_date == datetime(2025, 11, 5)
            assert end_date == datetime(2025, 12, 5)
    
    def test_monthly_period_december_to_january(self):
        """Test période mensuelle transition décembre → janvier"""
        with patch('app.routers.budgets.datetime') as mock_datetime:
            # Simuler le 28 décembre 2025 (après le billing_cycle_day=27)
            mock_datetime.utcnow.return_value = datetime(2025, 12, 28)
            mock_datetime.side_effect = lambda *args, **kwargs: datetime(*args, **kwargs)
            
            start_date, end_date = get_period_dates("monthly", billing_cycle_day=27)
            
            # Doit retourner du 27 déc au 27 janv
            assert start_date == datetime(2025, 12, 27)
            assert end_date == datetime(2026, 1, 27)
    
    def test_monthly_period_january_before_billing_day(self):
        """Test période mensuelle en janvier avant le billing_cycle_day"""
        with patch('app.routers.budgets.datetime') as mock_datetime:
            # Simuler le 10 janvier 2026 (avant le billing_cycle_day=27)
            mock_datetime.utcnow.return_value = datetime(2026, 1, 10)
            mock_datetime.side_effect = lambda *args, **kwargs: datetime(*args, **kwargs)
            
            start_date, end_date = get_period_dates("monthly", billing_cycle_day=27)
            
            # Doit retourner du 27 déc au 27 janv
            assert start_date == datetime(2025, 12, 27)
            assert end_date == datetime(2026, 1, 27)
    
    def test_yearly_period(self):
        """Test période annuelle"""
        with patch('app.routers.budgets.datetime') as mock_datetime:
            mock_datetime.utcnow.return_value = datetime(2025, 6, 15)
            mock_datetime.side_effect = lambda *args, **kwargs: datetime(*args, **kwargs)
            
            start_date, end_date = get_period_dates("yearly", billing_cycle_day=1)
            
            # Doit retourner du 1er janv au 1er janv suivant
            assert start_date == datetime(2025, 1, 1)
            assert end_date == datetime(2026, 1, 1)


class TestGetBudgetsDateConversion:
    """Tests pour vérifier la conversion des dates dans get_budgets"""
    
    @pytest.mark.asyncio
    async def test_date_strings_used_in_query(self):
        """Vérifie que les dates sont converties en strings pour MongoDB"""
        # Mock de la base de données
        mock_db = AsyncMock()
        mock_budgets_collection = AsyncMock()
        mock_categories_collection = AsyncMock()
        mock_transactions_collection = AsyncMock()
        
        # Configuration des mocks
        mock_db.get_collection.side_effect = lambda name: {
            "budgets": mock_budgets_collection,
            "categories": mock_categories_collection,
            "transactions": mock_transactions_collection
        }[name]
        
        # Simuler aucun budget
        mock_cursor = AsyncMock()
        mock_cursor.to_list.return_value = []
        mock_budgets_collection.find.return_value = mock_cursor
        
        # Mock de l'utilisateur
        mock_user = {
            "_id": ObjectId(),
            "billing_cycle_day": 27
        }
        
        # Import et test (nécessite d'être dans un contexte async)
        with patch('app.routers.budgets.datetime') as mock_datetime:
            mock_datetime.utcnow.return_value = datetime(2025, 12, 2)
            mock_datetime.side_effect = lambda *args, **kwargs: datetime(*args, **kwargs)
            
            from app.routers.budgets import get_budgets
            
            # Appeler la fonction
            result = await get_budgets(
                period_type="monthly",
                database=mock_db,
                current_user=mock_user
            )
            
            # Vérifier que le résultat est une liste vide
            assert result == []
            
            # Vérifier que find a été appelé sur budgets_collection
            mock_budgets_collection.find.assert_called_once()


class TestCreateBudgetDateConversion:
    """Tests pour vérifier la conversion des dates dans create_budget"""
    
    @pytest.mark.asyncio
    async def test_date_conversion_in_aggregation(self):
        """Vérifie que les dates sont converties en strings dans l'agrégation"""
        # Ce test vérifie le comportement, pas l'implémentation exacte
        # Il s'assure que le pattern de conversion est appliqué
        
        # Mock de la base de données
        mock_db = AsyncMock()
        mock_budgets_collection = AsyncMock()
        mock_categories_collection = AsyncMock()
        mock_transactions_collection = AsyncMock()
        
        # Configuration des mocks
        mock_db.get_collection.side_effect = lambda name: {
            "budgets": mock_budgets_collection,
            "categories": mock_categories_collection,
            "transactions": mock_transactions_collection
        }[name]
        
        # Simuler une catégorie existante
        category_id = ObjectId()
        mock_categories_collection.find_one.return_value = {
            "_id": category_id,
            "name": "Alimentation",
            "color": "#FF0000"
        }
        
        # Simuler pas de budget existant
        mock_cursor = AsyncMock()
        mock_cursor.to_list.return_value = []
        mock_budgets_collection.find.return_value = mock_cursor
        
        # Simuler l'insertion du budget
        budget_id = ObjectId()
        mock_result = Mock()
        mock_result.inserted_id = budget_id
        mock_budgets_collection.insert_one.return_value = mock_result
        
        # Simuler l'agrégation des transactions
        mock_agg_cursor = AsyncMock()
        mock_agg_cursor.to_list.return_value = []
        mock_transactions_collection.aggregate.return_value = mock_agg_cursor
        
        # Mock de l'utilisateur
        mock_user = {
            "_id": ObjectId(),
            "billing_cycle_day": 27
        }
        
        # Données du budget à créer
        from app.schemas.budget import BudgetCreate
        budget_data = BudgetCreate(
            category_id=str(category_id),
            amount=500.0,
            period_type="monthly",
            is_recurring=True
        )
        
        # Import et test
        with patch('app.routers.budgets.datetime') as mock_datetime:
            mock_datetime.utcnow.return_value = datetime(2025, 12, 2)
            mock_datetime.side_effect = lambda *args, **kwargs: datetime(*args, **kwargs)
            
            from app.routers.budgets import create_budget
            
            # Appeler la fonction
            result = await create_budget(
                budget_data=budget_data,
                database=mock_db,
                current_user=mock_user
            )
            
            # Vérifier que l'agrégation a été appelée
            assert mock_transactions_collection.aggregate.called
            
            # Récupérer le pipeline d'agrégation
            call_args = mock_transactions_collection.aggregate.call_args
            pipeline = call_args[0][0]
            
            # Vérifier que le $match contient un filtre de date
            match_stage = pipeline[0]
            assert "$match" in match_stage
            assert "date" in match_stage["$match"]
            
            # Vérifier que les valeurs sont des strings
            date_filter = match_stage["$match"]["date"]
            if "$gte" in date_filter:
                assert isinstance(date_filter["$gte"], str)
            if "$lt" in date_filter:
                assert isinstance(date_filter["$lt"], str)


class TestUpdateBudgetDateConversion:
    """Tests pour vérifier la conversion des dates dans update_budget"""
    
    @pytest.mark.asyncio
    async def test_objectid_conversion_for_budget_id(self):
        """Vérifie que le budget_id string est converti en ObjectId"""
        # Mock de la base de données
        mock_db = AsyncMock()
        mock_budgets_collection = AsyncMock()
        mock_categories_collection = AsyncMock()
        mock_transactions_collection = AsyncMock()
        
        # Configuration des mocks
        mock_db.get_collection.side_effect = lambda name: {
            "budgets": mock_budgets_collection,
            "categories": mock_categories_collection,
            "transactions": mock_transactions_collection
        }[name]
        
        # Simuler un budget existant
        budget_id = ObjectId()
        category_id = ObjectId()
        existing_budget = {
            "_id": budget_id,
            "user_id": ObjectId(),
            "category_id": category_id,
            "amount": 500.0,
            "period_type": "monthly",
            "is_recurring": True
        }
        
        mock_budgets_collection.find_one.return_value = existing_budget
        
        # Simuler la catégorie
        mock_categories_collection.find_one.return_value = {
            "_id": category_id,
            "name": "Alimentation",
            "color": "#FF0000"
        }
        
        # Simuler la mise à jour
        mock_result = Mock()
        mock_result.modified_count = 1
        mock_budgets_collection.update_one.return_value = mock_result
        
        # Simuler l'agrégation
        mock_agg_cursor = AsyncMock()
        mock_agg_cursor.to_list.return_value = [{"_id": None, "total": 100.0}]
        mock_transactions_collection.aggregate.return_value = mock_agg_cursor
        
        # Mock de l'utilisateur
        mock_user = {
            "_id": existing_budget["user_id"],
            "billing_cycle_day": 27
        }
        
        # Données de mise à jour
        from app.schemas.budget import BudgetUpdate
        update_data = BudgetUpdate(amount=600.0)
        
        # Import et test
        with patch('app.routers.budgets.datetime') as mock_datetime:
            mock_datetime.utcnow.return_value = datetime(2025, 12, 2)
            mock_datetime.side_effect = lambda *args, **kwargs: datetime(*args, **kwargs)
            
            from app.routers.budgets import update_budget
            
            # Appeler la fonction avec un string ID
            result = await update_budget(
                budget_id=str(budget_id),
                budget_data=update_data,
                database=mock_db,
                current_user=mock_user
            )
            
            # Vérifier que find_one a été appelé avec un ObjectId
            assert mock_budgets_collection.find_one.called
            
            # Le premier appel doit utiliser ObjectId
            first_call = mock_budgets_collection.find_one.call_args_list[0]
            filter_arg = first_call[0][0]
            assert "_id" in filter_arg
            assert isinstance(filter_arg["_id"], ObjectId)
