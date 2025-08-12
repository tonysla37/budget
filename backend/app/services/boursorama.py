import base64
import os
from datetime import datetime, timedelta, UTC
from typing import List, Dict, Any, Optional, Tuple

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from bson import ObjectId

from app.core.config import settings


class BoursoramaService:
    """
    Service pour l'interaction avec Boursorama.
    Pour le moment, cette classe est un mock qui simule
    l'authentification et le chiffrement des identifiants.
    """
    
    def __init__(self):
        """
        Initialise le service Boursorama.
        """
        self.key = self._get_encryption_key()
        
    def _get_encryption_key(self):
        """
        Génère une clé de chiffrement à partir de la clé secrète.
        """
        # Dérivation de clé à partir du secret
        encryption_key = os.getenv("ENCRYPTION_KEY", settings.SECRET_KEY)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'boursorama_salt',  # Salt fixe pour la démonstration
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(encryption_key.encode()))
        return key
        
    def login(self, username: str, password: str) -> bool:
        """
        Simule une authentification à Boursorama.
        Pour la démonstration, tout utilisateur dont le mot de passe
        ne commence pas par 'invalid_' est considéré comme valide.
        """
        # Simulation d'authentification
        if password.startswith('invalid_'):
            return False
        return True
    
    def encrypt_credentials(self, username: str, password: str) -> Tuple[str, str]:
        """
        Chiffre les identifiants Boursorama.
        """
        f = Fernet(self.key)
        encrypted_username = f.encrypt(username.encode()).decode()
        encrypted_password = f.encrypt(password.encode()).decode()
        return encrypted_username, encrypted_password
        
    def decrypt_credentials(self, encrypted_username: str, encrypted_password: str) -> Tuple[str, str]:
        """
        Déchiffre les identifiants Boursorama.
        """
        f = Fernet(self.key)
        username = f.decrypt(encrypted_username.encode()).decode()
        password = f.decrypt(encrypted_password.encode()).decode()
        return username, password
        
    def sync_accounts(self, username: str, password: str) -> List[Dict[str, Any]]:
        """
        Simule la synchronisation des comptes Boursorama.
        Renvoie une liste de comptes fictifs.
        """
        # Simulation de comptes
        return [
            {
                'id': 'acc1',
                'name': 'Compte courant',
                'balance': 1250.45,
                'currency': 'EUR'
            },
            {
                'id': 'acc2',
                'name': 'Livret A',
                'balance': 4500.00,
                'currency': 'EUR'
            }
        ]
        
    def sync_transactions(self, username: str, password: str, account_id: str = None) -> List[Dict[str, Any]]:
        """
        Simule la récupération des transactions Boursorama.
        Renvoie une liste de transactions fictives.
        """
        # Simulation de transactions
        now = datetime.now(UTC)
        
        return [
            {
                'id': 'tr1',
                'date': (now - timedelta(days=1)).isoformat(),
                'amount': -25.40,
                'label': 'CARREFOUR CITY',
                'category': 'Alimentation'
            },
            {
                'id': 'tr2',
                'date': (now - timedelta(days=3)).isoformat(),
                'amount': -42.00,
                'label': 'SNCF',
                'category': 'Transport'
            },
            {
                'id': 'tr3',
                'date': (now - timedelta(days=7)).isoformat(),
                'amount': 1200.00,
                'label': 'VIREMENT SALAIRE',
                'category': 'Revenus'
            }
        ]
        
    def get_accounts(self) -> List[Dict[str, Any]]:
        """
        Récupère la liste des comptes.
        """
        # This method is now a mock, so it will return dummy data.
        return [
            {
                "id": "cc123456",
                "type": "COMPTE_COURANT",
                "name": "Compte Courant",
                "balance": 1250.45
            },
            {
                "id": "la789012",
                "type": "LIVRET_A",
                "name": "Livret A",
                "balance": 4500.00
            }
        ]
        
    def get_transactions(self, account_id: str = None, start_date: datetime = None, end_date: datetime = None) -> List[Dict[str, Any]]:
        """
        Récupère les transactions d'un compte sur une période donnée.
        """
        # This method is now a mock, so it will return dummy data.
        return [
            {
                "id": "tx123",
                "date": "2023-07-15",
                "amount": -42.50,
                "label": "SUPERMARCHE CARREFOUR",
                "category": "Alimentation"
            },
            {
                "id": "tx456",
                "date": "2023-07-10",
                "amount": -29.90,
                "label": "SNCF",
                "category": "Transport"
            },
            {
                "id": "tx789",
                "date": "2023-07-01",
                "amount": 2500.00,
                "label": "VIREMENT SALAIRE",
                "category": "Revenus"
            }
        ]
        
    def process_transactions(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Traite les transactions brutes pour normaliser et enrichir les données.
        """
        processed = []
        
        for tx in transactions:
            # Convertir la date
            tx_date = datetime.strptime(tx["date"], "%Y-%m-%d").date() if isinstance(tx["date"], str) else tx["date"]
            
            # Déterminer s'il s'agit d'une dépense ou d'un revenu
            is_expense = tx["amount"] < 0
            
            # Essayer de déterminer si c'est une transaction récurrente
            description = tx.get("description", tx.get("label", ""))
            is_recurring = "PRLV" in description or "VIREMENT" in description
            
            # Normaliser le montant (toujours positif)
            amount = abs(tx["amount"])
            
            processed.append({
                "external_id": tx["id"],
                "date": tx_date,
                "description": description,
                "amount": amount,
                "merchant": tx.get("merchant", ""),
                "is_expense": is_expense,
                "is_recurring": is_recurring,
            })
            
        return processed
        
    async def synchronize_user_transactions(self, user, db) -> int:
        """
        Synchronise les transactions d'un utilisateur avec MongoDB.
        Retourne le nombre de nouvelles transactions.
        Cette méthode est un mock et simule l'ajout de transactions.
        """
        # Vérifier que l'utilisateur a configuré ses identifiants Boursorama
        if not hasattr(user, 'bourso_username_encrypted') or not hasattr(user, 'bourso_password_encrypted'):
            raise Exception("Identifiants Boursorama non configurés")
        
        # Simuler la récupération de transactions
        mock_transactions = [
            {
                "external_id": f"tx{i}",
                "date": datetime.now(UTC) - timedelta(days=i),
                "description": f"Transaction {i}",
                "amount": 50.0 * (i % 3 + 1),
                "merchant": f"Merchant {i}",
                "is_expense": i % 2 == 0,
                "is_recurring": i % 5 == 0,
                "user_id": user.id,
                "created_at": datetime.now(UTC)
            }
            for i in range(1, 6)  # 5 transactions
        ]
        
        # Simuler l'insertion dans MongoDB
        transactions_collection = await db.get_collection("transactions")
        
        # Vérifier quelles transactions existent déjà (par external_id)
        existing_external_ids = []
        for tx in mock_transactions:
            existing = await transactions_collection.find_one({"external_id": tx["external_id"], "user_id": user.id})
            if existing:
                existing_external_ids.append(tx["external_id"])
        
        # Filtrer les nouvelles transactions
        new_transactions = [tx for tx in mock_transactions if tx["external_id"] not in existing_external_ids]
        
        # Insérer les nouvelles transactions
        if new_transactions:
            await transactions_collection.insert_many(new_transactions)
        
        # Retourner le nombre de nouvelles transactions
        return len(new_transactions)
