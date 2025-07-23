import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta, date
from bson import ObjectId
from fastapi.testclient import TestClient

from app.main import app
from app.db.models import TransactionModel, CategoryModel, UserModel
from app.schemas.transaction import TransactionCreate, TransactionUpdate

client = TestClient(app)

# Données de test
TEST_USER_ID = str(ObjectId())
TEST_CATEGORY_ID_ALIMENTATION = str(ObjectId())
TEST_CATEGORY_ID_TRANSPORT = str(ObjectId())
TEST_CATEGORY_ID_LOISIRS = str(ObjectId())
TEST_CATEGORY_ID_SALAIRE = str(ObjectId())

# Création d'un jeu de données de test
@pytest.fixture
def mock_user():
    return UserModel(
        id=TEST_USER_ID,
        email="test@example.com",
        hashed_password="hashed_password",
        first_name="Test",
        last_name="User",
        created_at=datetime.utcnow()
    )

@pytest.fixture
def mock_categories():
    return [
        CategoryModel(
            id=TEST_CATEGORY_ID_ALIMENTATION,
            name="Alimentation",
            description="Dépenses alimentaires",
            color="#4CAF50",
            icon="restaurant",
            user_id=TEST_USER_ID,
            created_at=datetime.utcnow()
        ),
        CategoryModel(
            id=TEST_CATEGORY_ID_TRANSPORT,
            name="Transport",
            description="Dépenses de transport",
            color="#2196F3",
            icon="directions_car",
            user_id=TEST_USER_ID,
            created_at=datetime.utcnow()
        ),
        CategoryModel(
            id=TEST_CATEGORY_ID_LOISIRS,
            name="Loisirs",
            description="Dépenses de loisirs",
            color="#FF9800",
            icon="sports_esports",
            user_id=TEST_USER_ID,
            created_at=datetime.utcnow()
        ),
        CategoryModel(
            id=TEST_CATEGORY_ID_SALAIRE,
            name="Salaire",
            description="Revenus de salaire",
            color="#4CAF50",
            icon="payments",
            user_id=TEST_USER_ID,
            created_at=datetime.utcnow()
        )
    ]

@pytest.fixture
def mock_transactions():
    # Génération de transactions sur 3 mois (actuel, précédent, et celui d'avant)
    now = datetime.utcnow()
    current_month = now.replace(day=15)
    prev_month = (current_month - timedelta(days=30)).replace(day=15)
    two_months_ago = (current_month - timedelta(days=60)).replace(day=15)
    
    transactions = [
        # Mois actuel
        TransactionModel(
            id=str(ObjectId()),
            user_id=TEST_USER_ID,
            date=current_month,
            amount=-42.99,
            description="Supermarché Casino",
            merchant="Casino",
            explanation="Courses hebdomadaires",
            is_expense=True,
            category_id=TEST_CATEGORY_ID_ALIMENTATION,
            created_at=current_month
        ),
        TransactionModel(
            id=str(ObjectId()),
            user_id=TEST_USER_ID,
            date=current_month + timedelta(days=2),
            amount=-15.80,
            description="SNCF",
            merchant="SNCF",
            explanation="Billet de train Paris-Lyon",
            is_expense=True,
            category_id=TEST_CATEGORY_ID_TRANSPORT,
            created_at=current_month
        ),
        TransactionModel(
            id=str(ObjectId()),
            user_id=TEST_USER_ID,
            date=current_month + timedelta(days=5),
            amount=2500.00,
            description="Salaire",
            merchant="Entreprise XYZ",
            is_expense=False,
            category_id=TEST_CATEGORY_ID_SALAIRE,
            created_at=current_month
        ),
        
        # Mois précédent
        TransactionModel(
            id=str(ObjectId()),
            user_id=TEST_USER_ID,
            date=prev_month,
            amount=-35.50,
            description="Carrefour",
            merchant="Carrefour",
            explanation="Courses alimentaires",
            is_expense=True,
            category_id=TEST_CATEGORY_ID_ALIMENTATION,
            created_at=prev_month
        ),
        TransactionModel(
            id=str(ObjectId()),
            user_id=TEST_USER_ID,
            date=prev_month + timedelta(days=3),
            amount=-29.90,
            description="Netflix",
            merchant="Netflix",
            explanation="Abonnement mensuel",
            is_expense=True,
            category_id=TEST_CATEGORY_ID_LOISIRS,
            created_at=prev_month
        ),
        TransactionModel(
            id=str(ObjectId()),
            user_id=TEST_USER_ID,
            date=prev_month + timedelta(days=7),
            amount=2500.00,
            description="Salaire",
            merchant="Entreprise XYZ",
            is_expense=False,
            category_id=TEST_CATEGORY_ID_SALAIRE,
            created_at=prev_month
        ),
        
        # Deux mois avant
        TransactionModel(
            id=str(ObjectId()),
            user_id=TEST_USER_ID,
            date=two_months_ago,
            amount=-68.20,
            description="Leroy Merlin",
            merchant="Leroy Merlin",
            explanation="Achats de matériel de bricolage",
            is_expense=True,
            category_id=None,
            created_at=two_months_ago
        ),
        TransactionModel(
            id=str(ObjectId()),
            user_id=TEST_USER_ID,
            date=two_months_ago + timedelta(days=5),
            amount=2500.00,
            description="Salaire",
            merchant="Entreprise XYZ",
            is_expense=False,
            category_id=TEST_CATEGORY_ID_SALAIRE,
            created_at=two_months_ago
        )
    ]
    return transactions

@pytest.mark.asyncio
class TestTransactionsAPI:
    
    @patch("app.routers.auth.get_current_active_user")
    @patch("app.routers.transactions.get_db")
    async def test_get_transactions(self, mock_get_db, mock_get_current_user, mock_user, mock_transactions):
        # Configuration des mocks
        mock_get_current_user.return_value = mock_user
        
        # Mock pour la base de données
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.get_collection.return_value = mock_collection
        mock_collection.find.return_value = mock_transactions
        mock_get_db.return_value = mock_db
        
        # Test sans filtre
        response = client.get("/api/transactions/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == len(mock_transactions)
        
        # Test avec filtre par mois
        current_month = datetime.utcnow().month
        current_year = datetime.utcnow().year
        response = client.get(f"/api/transactions/?year={current_year}&month={current_month}")
        assert response.status_code == 200
        data = response.json()
        # Vérifier qu'on a bien les 3 transactions du mois actuel
        assert len(data) == 3
        
        # Test du mois précédent
        prev_month = current_month - 1
        prev_year = current_year
        if prev_month == 0:
            prev_month = 12
            prev_year -= 1
        response = client.get(f"/api/transactions/?year={prev_year}&month={prev_month}")
        assert response.status_code == 200
        data = response.json()
        # Vérifier qu'on a bien les 3 transactions du mois précédent
        assert len(data) == 3

    @patch("app.routers.auth.get_current_active_user")
    @patch("app.routers.transactions.get_db")
    async def test_create_transaction_with_explanation(self, mock_get_db, mock_get_current_user, mock_user):
        # Configuration des mocks
        mock_get_current_user.return_value = mock_user
        
        # Mock pour la base de données
        mock_db = MagicMock()
        mock_db.add = MagicMock()
        mock_db.commit = MagicMock()
        mock_db.refresh = MagicMock()
        mock_get_db.return_value = mock_db
        
        # Données de la transaction
        transaction_data = {
            "date": datetime.utcnow().isoformat(),
            "amount": -45.99,
            "description": "Restaurant La Belle Époque",
            "merchant": "La Belle Époque",
            "explanation": "Dîner avec des amis",
            "is_expense": True,
            "category_id": str(TEST_CATEGORY_ID_LOISIRS)
        }
        
        # Test de création de transaction avec explication
        response = client.post("/api/transactions/", json=transaction_data)
        assert response.status_code == 201
        data = response.json()
        assert data["explanation"] == "Dîner avec des amis"
        
        # Vérifier que les méthodes ont été appelées
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once() 