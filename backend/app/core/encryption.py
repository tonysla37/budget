"""
Service de chiffrement pour les credentials bancaires
Utilise Fernet (AES 256 bits) pour un chiffrement symétrique sécurisé
"""

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import base64
import os
from typing import Optional

class EncryptionService:
    """
    Service de chiffrement/déchiffrement des données sensibles
    
    Utilise:
    - Fernet (chiffrement symétrique AES-256)
    - PBKDF2 pour la dérivation de clé à partir de la clé maître
    - Salt unique par utilisateur pour plus de sécurité
    """
    
    def __init__(self):
        # Clé maître (à stocker dans les variables d'environnement en production)
        self.master_key = os.getenv('ENCRYPTION_MASTER_KEY')
        
        if not self.master_key:
            # Générer une clé maître pour le développement
            # EN PRODUCTION: stocker cette clé de manière sécurisée (env var, secrets manager, etc.)
            self.master_key = base64.urlsafe_b64encode(os.urandom(32)).decode()
            print(f"⚠️  ATTENTION: Clé de chiffrement générée automatiquement")
            print(f"   En production, définir ENCRYPTION_MASTER_KEY dans les variables d'environnement")
    
    def _derive_key(self, user_id: str) -> bytes:
        """
        Dérive une clé spécifique à l'utilisateur à partir de la clé maître
        
        Args:
            user_id: Identifiant de l'utilisateur (utilisé comme salt)
        
        Returns:
            Clé dérivée (32 bytes)
        """
        # Utiliser l'user_id comme salt (unique par utilisateur)
        salt = user_id.encode()
        
        # Dérivation de clé avec PBKDF2
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        
        key = base64.urlsafe_b64encode(
            kdf.derive(self.master_key.encode())
        )
        
        return key
    
    def encrypt(self, plaintext: str, user_id: str) -> str:
        """
        Chiffre une chaîne de caractères
        
        Args:
            plaintext: Texte en clair à chiffrer
            user_id: ID de l'utilisateur (pour dériver la clé)
        
        Returns:
            Texte chiffré (base64)
        """
        if not plaintext:
            return ""
        
        key = self._derive_key(user_id)
        f = Fernet(key)
        
        encrypted = f.encrypt(plaintext.encode())
        return encrypted.decode()
    
    def decrypt(self, ciphertext: str, user_id: str) -> str:
        """
        Déchiffre une chaîne de caractères
        
        Args:
            ciphertext: Texte chiffré (base64)
            user_id: ID de l'utilisateur (pour dériver la clé)
        
        Returns:
            Texte en clair
        """
        if not ciphertext:
            return ""
        
        key = self._derive_key(user_id)
        f = Fernet(key)
        
        try:
            decrypted = f.decrypt(ciphertext.encode())
            return decrypted.decode()
        except Exception as e:
            raise ValueError(f"Erreur de déchiffrement: {str(e)}")
    
    def encrypt_dict(self, data: dict, fields: list, user_id: str) -> dict:
        """
        Chiffre certains champs d'un dictionnaire
        
        Args:
            data: Dictionnaire contenant les données
            fields: Liste des champs à chiffrer
            user_id: ID de l'utilisateur
        
        Returns:
            Dictionnaire avec les champs chiffrés
        """
        encrypted_data = data.copy()
        
        for field in fields:
            if field in encrypted_data and encrypted_data[field]:
                encrypted_data[f"encrypted_{field}"] = self.encrypt(
                    encrypted_data[field], 
                    user_id
                )
                # Supprimer le champ en clair
                del encrypted_data[field]
        
        return encrypted_data
    
    def decrypt_dict(self, data: dict, fields: list, user_id: str) -> dict:
        """
        Déchiffre certains champs d'un dictionnaire
        
        Args:
            data: Dictionnaire contenant les données chiffrées
            fields: Liste des champs à déchiffrer (noms originaux, sans 'encrypted_')
            user_id: ID de l'utilisateur
        
        Returns:
            Dictionnaire avec les champs déchiffrés
        """
        decrypted_data = data.copy()
        
        for field in fields:
            encrypted_field = f"encrypted_{field}"
            if encrypted_field in decrypted_data and decrypted_data[encrypted_field]:
                decrypted_data[field] = self.decrypt(
                    decrypted_data[encrypted_field],
                    user_id
                )
        
        return decrypted_data

# Instance globale du service
encryption_service = EncryptionService()
