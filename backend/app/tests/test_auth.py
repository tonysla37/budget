import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from datetime import datetime, timedelta, UTC

from fastapi.testclient import TestClient
from jose import jwt

from app.main import app
from app.core.config import settings
from app.services.auth import (
    get_password_hash, verify_password, create_access_token
)
from app.db.models import UserModel


# Client de test pour les tests d'intégration
client = TestClient(app)


class TestAuth:
    """Tests unitaires pour l'authentification"""

    def test_password_hashing(self):
        """
        Vérifie que le hachage des mots de passe fonctionne correctement.
        """
        password = "secure_password123"
        hashed = get_password_hash(password)
        
        # Le hash ne doit pas être égal au mot de passe original
        assert hashed != password
        
        # La vérification doit fonctionner
        assert verify_password(password, hashed)
        
        # Un mauvais mot de passe ne doit pas être validé
        assert not verify_password("wrong_password", hashed)

    def test_create_access_token(self):
        """
        Vérifie que la création de tokens JWT fonctionne correctement.
        """
        # Données pour le token
        data = {"sub": "user@example.com"}
        expires_delta = timedelta(minutes=30)
        
        # Création du token
        token = create_access_token(data, expires_delta)
        
        # Décodage du token
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        
        # Vérification du contenu du payload
        assert payload["sub"] == "user@example.com"
        
        # Vérification de l'expiration (avec marge d'erreur de 5 secondes)
        exp_time = datetime.fromtimestamp(payload["exp"], UTC)
        expected_exp = datetime.now(UTC) + expires_delta
        time_diff = abs((exp_time - expected_exp).total_seconds())
        assert time_diff < 5


@pytest.mark.asyncio
class TestAuthAPI:
    """Tests d'intégration pour les endpoints d'authentification"""
    
    @patch("app.routers.auth.authenticate_user")
    @patch("app.routers.auth.create_access_token")
    async def test_login(self, mock_create_token, mock_authenticate):
        """
        Vérifie que l'endpoint de login fonctionne correctement.
        """
        # Configuration des mocks
        mock_user = MagicMock()
        mock_user.email = "user@example.com"
        
        # Configure authenticate_user as AsyncMock to return a value when awaited
        mock_authenticate.return_value = mock_user
        mock_create_token.return_value = "fake_token"
        
        # Envoi de la requête de login
        response = client.post(
            "/api/auth/token",
            data={
                "username": "user@example.com",
                "password": "password123"
            }
        )
        
        # Vérification de la réponse
        assert response.status_code == 200
        assert response.json() == {
            "access_token": "fake_token",
            "token_type": "bearer"
        }
        
        # Vérification des appels aux fonctions mockées
        mock_authenticate.assert_called_once()
        mock_create_token.assert_called_once()

    @patch("app.routers.auth.get_user_by_email")
    @patch("app.routers.auth.create_user")
    async def test_register(self, mock_create_user, mock_get_user):
        """
        Vérifie que l'endpoint d'inscription fonctionne correctement.
        """
        # Configuration du mock pour get_user_by_email (utilisateur n'existe pas)
        mock_get_user.return_value = None
        
        # Configuration du mock pour create_user
        mock_user = MagicMock()
        mock_user.id = "new_user_id"
        mock_user.email = "new_user@example.com"
        mock_user.first_name = "John"
        mock_user.last_name = "Doe"
        mock_user.created_at = datetime.now(UTC)
        
        mock_create_user.return_value = mock_user
        
        # Données pour l'inscription
        user_data = {
            "email": "new_user@example.com",
            "password": "password123",
            "first_name": "John",
            "last_name": "Doe"
        }
        
        # Envoi de la requête d'inscription
        response = client.post("/api/auth/register", json=user_data)
        
        # Vérification de la réponse
        assert response.status_code == 201
        
        # Vérification des appels aux fonctions mockées
        mock_get_user.assert_called_once()
        mock_create_user.assert_called_once() 