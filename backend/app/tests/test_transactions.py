import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from datetime import datetime, timedelta, date, UTC
from bson import ObjectId
from fastapi.testclient import TestClient

from app.main import app
from app.db.models import TransactionModel, CategoryModel, UserModel
from app.schemas.transaction import TransactionCreate, TransactionUpdate
from app.routers.auth import get_current_active_user, get_db

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
        created_at=datetime.now(UTC)
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
            created_at=datetime.now(UTC)
        ),
        CategoryModel(
            id=TEST_CATEGORY_ID_TRANSPORT,
            name="Transport",
            description="Dépenses de transport",
            color="#2196F3",
            icon="directions_car",
            user_id=TEST_USER_ID,
            created_at=datetime.now(UTC)
        ),
        CategoryModel(
            id=TEST_CATEGORY_ID_LOISIRS,
            name="Loisirs",
            description="Dépenses de loisirs",
            color="#FF9800",
            icon="sports_esports",
            user_id=TEST_USER_ID,
            created_at=datetime.now(UTC)
        ),
        CategoryModel(
            id=TEST_CATEGORY_ID_SALAIRE,
            name="Salaire",
            description="Revenus de salaire",
            color="#4CAF50",
            icon="payments",
            user_id=TEST_USER_ID,
            created_at=datetime.now(UTC)
        )
    ]

@pytest.fixture
def mock_transactions():
    # Générer des transactions de test
    now = datetime.now(UTC)
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

# Fonction pour simuler get_current_active_user
async def mock_get_current_active_user():
    return {
        "id": TEST_USER_ID,
        "email": "test@example.com",
        "hashed_password": "hashed_password",
        "first_name": "Test",
        "last_name": "User",
        "is_active": True,
        "created_at": datetime.now(UTC)
    }

# Fonction pour simuler la base de données MongoDB
class MockDB:
    def __init__(self):
        self.collections = {}
        
    async def get_collection(self, name):
        if name not in self.collections:
            self.collections[name] = MockCollection(name)
        return self.collections[name]

class MockCollection:
    def __init__(self, name):
        self.name = name
        self.data = []
        
    def find(self, filter_query=None):
        # Filtrer les données selon filter_query
        if filter_query is None:
            filter_query = {}
        
        # Simuler un curseur MongoDB
        return MockCursor([item for item in self.data if self._matches(item, filter_query)])
        
    async def find_one(self, filter_query):
        # Trouver le premier élément qui correspond au filtre
        for item in self.data:
            if self._matches(item, filter_query):
                return item
        return None
        
    async def insert_one(self, document):
        # Ajouter un document à la collection
        if "_id" not in document:
            document["_id"] = ObjectId()
        self.data.append(document)
        return MagicMock(inserted_id=document["_id"])
        
    async def update_one(self, filter_query, update):
        # Mettre à jour un document
        for i, item in enumerate(self.data):
            if self._matches(item, filter_query):
                # Appliquer les mises à jour
                if "$set" in update:
                    for key, value in update["$set"].items():
                        self.data[i][key] = value
                return MagicMock(modified_count=1)
        return MagicMock(modified_count=0)
        
    async def delete_one(self, filter_query):
        # Supprimer un document
        for i, item in enumerate(self.data):
            if self._matches(item, filter_query):
                self.data.pop(i)
                return MagicMock(deleted_count=1)
        return MagicMock(deleted_count=0)
        
    def _matches(self, item, filter_query):
        # Vérifier si l'élément correspond au filtre
        for key, value in filter_query.items():
            if key not in item:
                return False
            
            if isinstance(value, dict):
                # Gérer les opérateurs MongoDB comme $gte, $lte, etc.
                for op, op_value in value.items():
                    # Gérer la comparaison de dates avec et sans fuseau horaire
                    if isinstance(item[key], datetime) and isinstance(op_value, datetime):
                        # Convertir les deux dates au même format (avec fuseau horaire)
                        item_date = item[key].replace(tzinfo=UTC) if item[key].tzinfo is None else item[key]
                        op_value_date = op_value.replace(tzinfo=UTC) if op_value.tzinfo is None else op_value
                        
                        if op == "$gte" and item_date < op_value_date:
                            return False
                        elif op == "$gt" and item_date <= op_value_date:
                            return False
                        elif op == "$lte" and item_date > op_value_date:
                            return False
                        elif op == "$lt" and item_date >= op_value_date:
                            return False
                        elif op == "$eq" and item_date != op_value_date:
                            return False
                        elif op == "$ne" and item_date == op_value_date:
                            return False
                    else:
                        # Comparaison standard pour les autres types
                        if op == "$gte" and item[key] < op_value:
                            return False
                        elif op == "$gt" and item[key] <= op_value:
                            return False
                        elif op == "$lte" and item[key] > op_value:
                            return False
                        elif op == "$lt" and item[key] >= op_value:
                            return False
                        elif op == "$eq" and item[key] != op_value:
                            return False
                        elif op == "$ne" and item[key] == op_value:
                            return False
                        elif op == "$in" and item[key] not in op_value:
                            return False
            elif item[key] != value:
                return False
        return True

class MockCursor:
    def __init__(self, data):
        self.data = data
        self._skip_val = 0
        self._limit_val = None
        self._sort_field = None
        self._sort_direction = 1
        
    def sort(self, field, direction):
        self._sort_field = field
        self._sort_direction = direction
        return self
        
    def skip(self, n):
        self._skip_val = n
        return self
        
    def limit(self, n):
        self._limit_val = n
        return self
        
    async def to_list(self, length=None):
        # Trier les données
        if self._sort_field:
            self.data.sort(key=lambda x: x.get(self._sort_field, 0), reverse=self._sort_direction < 0)
        
        # Appliquer skip et limit
        result = self.data[self._skip_val:]
        if self._limit_val is not None:
            result = result[:self._limit_val]
        
        return result

class MockInsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id
        
class MockUpdateResult:
    def __init__(self, modified_count):
        self.modified_count = modified_count
        
class MockDeleteResult:
    def __init__(self, deleted_count):
        self.deleted_count = deleted_count

@pytest.mark.asyncio
class TestTransactionsAPI:
    
    @patch("app.routers.transactions.get_db")
    async def test_get_transactions(self, mock_get_db, mock_transactions):
        # Créer une base de données simulée
        mock_db = MockDB()
        transactions_collection = await mock_db.get_collection("transactions")
        
        # Ajouter les transactions de test à la collection
        for tx in mock_transactions:
            await transactions_collection.insert_one(tx.model_dump())
        
        mock_get_db.return_value = mock_db
        
        # Remplacer les dépendances
        app.dependency_overrides[get_current_active_user] = mock_get_current_active_user
        app.dependency_overrides[get_db] = lambda: mock_db
        
        try:
            # Test sans filtre
            response = client.get("/api/transactions/", headers={"Authorization": "Bearer fake_token"})
            assert response.status_code == 200
            data = response.json()
            assert len(data) == len(mock_transactions)
            
            # Test avec filtre par mois
            current_month = datetime.now(UTC).month
            current_year = datetime.now(UTC).year
            response = client.get(
                f"/api/transactions/?year={current_year}&month={current_month}", 
                headers={"Authorization": "Bearer fake_token"}
            )
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
            response = client.get(
                f"/api/transactions/?year={prev_year}&month={prev_month}", 
                headers={"Authorization": "Bearer fake_token"}
            )
            assert response.status_code == 200
            data = response.json()
            # Vérifier qu'on a bien les 3 transactions du mois précédent
            assert len(data) == 3
        finally:
            # Nettoyer les overrides après le test
            app.dependency_overrides.clear()

    @patch("app.routers.transactions.get_db")
    async def test_create_transaction_with_explanation(self, mock_get_db):
        # Créer une base de données simulée
        mock_db = MockDB()
        
        mock_get_db.return_value = mock_db
        
        # Remplacer les dépendances
        app.dependency_overrides[get_current_active_user] = mock_get_current_active_user
        app.dependency_overrides[get_db] = lambda: mock_db
        
        try:
            # Données de la transaction
            transaction_data = {
                "date": datetime.now(UTC).isoformat(),
                "amount": -45.99,
                "description": "Restaurant La Belle Époque",
                "merchant": "La Belle Époque",
                "explanation": "Dîner avec des amis",
                "is_expense": True,
                "category_id": str(TEST_CATEGORY_ID_LOISIRS)
            }
            
            # Test de création de transaction avec explication
            response = client.post(
                "/api/transactions/", 
                json=transaction_data,
                headers={"Authorization": "Bearer fake_token"}
            )
            assert response.status_code == 201
            data = response.json()
            assert data["explanation"] == "Dîner avec des amis"
        finally:
            # Nettoyer les overrides après le test
            app.dependency_overrides.clear() 