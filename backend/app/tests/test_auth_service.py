"""
Tests unitaires pour app/services/auth.py

Ces tests vérifient que les conversions ObjectId sont correctes dans toutes
les fonctions de gestion des utilisateurs.
"""

import pytest
from datetime import datetime, timezone
from bson import ObjectId
from unittest.mock import AsyncMock, Mock

from app.services.auth import (
    get_user,
    update_user,
    delete_user,
    get_password_hash,
    verify_password
)


class TestGetUser:
    """Tests pour la fonction get_user"""
    
    @pytest.mark.asyncio
    async def test_get_user_with_string_id(self):
        """Vérifie que get_user accepte un ID en string"""
        # Mock de la session DB
        mock_db = AsyncMock()
        
        # Créer un user_id valide
        user_id = ObjectId()
        user_data = {
            "_id": user_id,
            "email": "test@example.com",
            "first_name": "Test",
            "last_name": "User"
        }
        
        # Configurer le mock pour retourner l'utilisateur
        mock_db.find_one.return_value = user_data
        
        # Appeler avec un string ID
        result = await get_user(str(user_id), mock_db)
        
        # Vérifier le résultat
        assert result == user_data
        
        # Vérifier que find_one a été appelé avec le bon filtre
        mock_db.find_one.assert_called_once()
        call_args = mock_db.find_one.call_args
        assert call_args[0][0] == "users"
        
        # Vérifier que le filtre contient un ObjectId
        filter_dict = call_args[0][1]
        assert "_id" in filter_dict
        assert isinstance(filter_dict["_id"], ObjectId)
        assert filter_dict["_id"] == user_id
    
    @pytest.mark.asyncio
    async def test_get_user_with_objectid(self):
        """Vérifie que get_user accepte aussi directement un ObjectId"""
        # Mock de la session DB
        mock_db = AsyncMock()
        
        # Créer un user_id
        user_id = ObjectId()
        user_data = {
            "_id": user_id,
            "email": "test@example.com"
        }
        
        # Configurer le mock
        mock_db.find_one.return_value = user_data
        
        # Appeler avec un ObjectId directement (pas de conversion nécessaire)
        result = await get_user(user_id, mock_db)
        
        # Vérifier le résultat
        assert result == user_data
        
        # Vérifier l'appel
        mock_db.find_one.assert_called_once()
        call_args = mock_db.find_one.call_args
        filter_dict = call_args[0][1]
        assert isinstance(filter_dict["_id"], ObjectId)
    
    @pytest.mark.asyncio
    async def test_get_user_not_found(self):
        """Vérifie le comportement quand l'utilisateur n'existe pas"""
        # Mock de la session DB
        mock_db = AsyncMock()
        mock_db.find_one.return_value = None
        
        # Appeler avec un ID inexistant
        result = await get_user(str(ObjectId()), mock_db)
        
        # Vérifier que None est retourné
        assert result is None
    
    @pytest.mark.asyncio
    async def test_get_user_with_none(self):
        """Vérifie le comportement avec None en entrée"""
        # Mock de la session DB
        mock_db = AsyncMock()
        
        # Appeler avec None devrait lever une erreur ou gérer gracieusement
        # Selon l'implémentation actuelle, cela devrait probablement lever une erreur
        with pytest.raises((TypeError, ValueError)):
            await get_user(None, mock_db)


class TestUpdateUser:
    """Tests pour la fonction update_user"""
    
    @pytest.mark.asyncio
    async def test_update_user_with_string_id(self):
        """Vérifie que update_user convertit correctement le string ID"""
        # Mock de la session DB
        mock_db = AsyncMock()
        
        # Créer un user_id
        user_id = ObjectId()
        
        # Données de mise à jour
        user_data = {
            "first_name": "Updated",
            "last_name": "Name"
        }
        
        # Mock de get_user pour retourner l'utilisateur mis à jour
        updated_user = {
            "_id": user_id,
            "email": "test@example.com",
            "first_name": "Updated",
            "last_name": "Name",
            "updated_at": datetime.now(timezone.utc)
        }
        
        # Configurer les mocks
        mock_db.update_one.return_value = None
        
        with pytest.mock.patch('app.services.auth.get_user', return_value=updated_user):
            # Appeler update_user avec un string ID
            result = await update_user(str(user_id), user_data, mock_db)
            
            # Vérifier que update_one a été appelé
            assert mock_db.update_one.called
            
            # Vérifier les arguments de update_one
            call_args = mock_db.update_one.call_args
            collection_name = call_args[0][0]
            filter_dict = call_args[0][1]
            
            assert collection_name == "users"
            assert "_id" in filter_dict
            assert isinstance(filter_dict["_id"], ObjectId)
            assert filter_dict["_id"] == user_id
    
    @pytest.mark.asyncio
    async def test_update_user_with_password(self):
        """Vérifie que le mot de passe est haché lors de la mise à jour"""
        # Mock de la session DB
        mock_db = AsyncMock()
        
        user_id = ObjectId()
        user_data = {
            "password": "NewPassword123!@#"
        }
        
        updated_user = {
            "_id": user_id,
            "email": "test@example.com",
            "hashed_password": "hashed_new_password"
        }
        
        mock_db.update_one.return_value = None
        
        with pytest.mock.patch('app.services.auth.get_user', return_value=updated_user):
            with pytest.mock.patch('app.services.auth.get_password_hash') as mock_hash:
                mock_hash.return_value = "hashed_new_password"
                
                # Appeler update_user
                result = await update_user(str(user_id), user_data, mock_db)
                
                # Vérifier que get_password_hash a été appelé
                mock_hash.assert_called_once_with("NewPassword123!@#")
                
                # Vérifier que update_one a été appelé
                call_args = mock_db.update_one.call_args
                update_dict = call_args[0][2]["$set"]
                
                # Vérifier que hashed_password est dans l'update
                assert "hashed_password" in update_dict
                assert update_dict["hashed_password"] == "hashed_new_password"
                
                # Vérifier que password n'est PAS dans l'update
                assert "password" not in update_dict
    
    @pytest.mark.asyncio
    async def test_update_user_with_none_values(self):
        """Vérifie que les valeurs None sont filtrées"""
        # Mock de la session DB
        mock_db = AsyncMock()
        
        user_id = ObjectId()
        user_data = {
            "first_name": "Test",
            "last_name": None,  # Cette valeur doit être filtrée
            "email": None       # Cette valeur doit être filtrée
        }
        
        updated_user = {
            "_id": user_id,
            "email": "test@example.com",
            "first_name": "Test"
        }
        
        mock_db.update_one.return_value = None
        
        with pytest.mock.patch('app.services.auth.get_user', return_value=updated_user):
            # Appeler update_user
            result = await update_user(str(user_id), user_data, mock_db)
            
            # Vérifier que update_one a été appelé
            call_args = mock_db.update_one.call_args
            update_dict = call_args[0][2]["$set"]
            
            # Vérifier que first_name est présent
            assert "first_name" in update_dict
            assert update_dict["first_name"] == "Test"
            
            # Vérifier que les None ne sont pas présents
            assert "last_name" not in update_dict or update_dict.get("last_name") is not None
            assert "email" not in update_dict or update_dict.get("email") is not None


class TestDeleteUser:
    """Tests pour la fonction delete_user"""
    
    @pytest.mark.asyncio
    async def test_delete_user_with_string_id(self):
        """Vérifie que delete_user convertit correctement le string ID"""
        # Mock de la session DB
        mock_db = AsyncMock()
        
        # Créer un user_id
        user_id = ObjectId()
        
        # Simuler une suppression réussie
        mock_result = Mock()
        mock_result.deleted_count = 1
        mock_db.delete_one.return_value = mock_result
        
        # Appeler delete_user avec un string ID
        result = await delete_user(str(user_id), mock_db)
        
        # Vérifier que True est retourné (suppression réussie)
        assert result is True
        
        # Vérifier que delete_one a été appelé avec le bon filtre
        mock_db.delete_one.assert_called_once()
        call_args = mock_db.delete_one.call_args
        
        collection_name = call_args[0][0]
        filter_dict = call_args[0][1]
        
        assert collection_name == "users"
        assert "_id" in filter_dict
        assert isinstance(filter_dict["_id"], ObjectId)
        assert filter_dict["_id"] == user_id
    
    @pytest.mark.asyncio
    async def test_delete_user_with_objectid(self):
        """Vérifie que delete_user accepte aussi un ObjectId directement"""
        # Mock de la session DB
        mock_db = AsyncMock()
        
        # Créer un user_id
        user_id = ObjectId()
        
        # Simuler une suppression réussie
        mock_result = Mock()
        mock_result.deleted_count = 1
        mock_db.delete_one.return_value = mock_result
        
        # Appeler avec un ObjectId directement
        result = await delete_user(user_id, mock_db)
        
        # Vérifier le résultat
        assert result is True
        
        # Vérifier l'appel
        call_args = mock_db.delete_one.call_args
        filter_dict = call_args[0][1]
        assert isinstance(filter_dict["_id"], ObjectId)
    
    @pytest.mark.asyncio
    async def test_delete_user_not_found(self):
        """Vérifie le comportement quand l'utilisateur n'existe pas"""
        # Mock de la session DB
        mock_db = AsyncMock()
        
        # Simuler une suppression sans résultat
        mock_result = Mock()
        mock_result.deleted_count = 0
        mock_db.delete_one.return_value = mock_result
        
        # Appeler delete_user
        result = await delete_user(str(ObjectId()), mock_db)
        
        # Vérifier que False est retourné
        assert result is False


class TestPasswordFunctions:
    """Tests pour les fonctions de gestion des mots de passe"""
    
    def test_password_hash_and_verify(self):
        """Vérifie que le hachage et la vérification fonctionnent ensemble"""
        password = "TestPassword123!@#"
        
        # Hasher le mot de passe
        hashed = get_password_hash(password)
        
        # Vérifier que c'est bien un string
        assert isinstance(hashed, str)
        
        # Vérifier que le hash n'est pas le mot de passe en clair
        assert hashed != password
        
        # Vérifier que verify_password fonctionne
        assert verify_password(password, hashed) is True
        
        # Vérifier qu'un mauvais mot de passe ne fonctionne pas
        assert verify_password("WrongPassword", hashed) is False
    
    def test_same_password_different_hashes(self):
        """Vérifie que le même mot de passe génère des hashes différents (salt)"""
        password = "TestPassword123!@#"
        
        # Générer deux hashes du même mot de passe
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        # Les hashes doivent être différents (à cause du salt)
        assert hash1 != hash2
        
        # Mais les deux doivent vérifier le même mot de passe
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True
