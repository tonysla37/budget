import os
import json
import time
import datetime
from typing import List, Dict, Any, Optional, Tuple
from datetime import date, timedelta

import requests
from bs4 import BeautifulSoup
import pandas as pd
from cryptography.fernet import Fernet

from app.core.config import settings
from app.models.user import User
from app.models.transaction import Transaction


class BoursoramaService:
    """
    Service pour interagir avec Boursorama Banque.
    Ce service utilise du web scraping puisque Boursorama ne fournit pas d'API publique 
    facilement accessible pour les particuliers.
    """

    def __init__(self):
        self.session = requests.Session()
        self.base_url = "https://clients.boursorama.com"
        self.logged_in = False
        
        # Configuration du chiffrement pour les identifiants
        encryption_key = os.getenv("ENCRYPTION_KEY", settings.SECRET_KEY)
        self.cipher = Fernet(Fernet.generate_key() if len(encryption_key) < 32 else encryption_key.encode()[:32])

    def encrypt_credentials(self, username: str, password: str) -> Tuple[str, str]:
        """
        Chiffre les identifiants Boursorama.
        """
        encrypted_username = self.cipher.encrypt(username.encode()).decode()
        encrypted_password = self.cipher.encrypt(password.encode()).decode()
        return encrypted_username, encrypted_password

    def decrypt_credentials(self, encrypted_username: str, encrypted_password: str) -> Tuple[str, str]:
        """
        Déchiffre les identifiants Boursorama.
        """
        username = self.cipher.decrypt(encrypted_username.encode()).decode()
        password = self.cipher.decrypt(encrypted_password.encode()).decode()
        return username, password

    def login(self, username: str, password: str) -> bool:
        """
        Connexion à Boursorama Banque.
        Note: Dans une implémentation réelle, il faudrait gérer les captchas et 
        l'authentification à deux facteurs.
        """
        # Simulation de login pour le moment
        self.logged_in = True
        return self.logged_in
        
        # TODO: Implémentation réelle du login
        # login_url = f"{self.base_url}/connexion"
        # ...

    def get_accounts(self) -> List[Dict[str, Any]]:
        """
        Récupère la liste des comptes.
        """
        if not self.logged_in:
            raise Exception("Non connecté à Boursorama")
        
        # Données de test (à remplacer par une implémentation réelle)
        return [
            {
                "id": "account1",
                "name": "Compte Courant",
                "balance": 1500.75,
                "currency": "EUR",
                "type": "checking"
            },
            {
                "id": "account2",
                "name": "Livret A",
                "balance": 5000.00,
                "currency": "EUR",
                "type": "savings"
            }
        ]

    def get_transactions(
        self, 
        account_id: str, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        """
        Récupère les transactions d'un compte sur une période donnée.
        """
        if not self.logged_in:
            raise Exception("Non connecté à Boursorama")
            
        # Définir la période par défaut (dernier mois)
        if not end_date:
            end_date = date.today()
        if not start_date:
            # Par défaut, on récupère les transactions du mois dernier
            start_date = end_date - timedelta(days=30)
            
        # Données de test (à remplacer par une implémentation réelle)
        return [
            {
                "id": "tx1",
                "date": "2023-05-27",
                "description": "PAIEMENT CB CARREFOUR",
                "amount": -85.32,
                "merchant": "CARREFOUR",
            },
            {
                "id": "tx2",
                "date": "2023-05-25",
                "description": "VIREMENT SALAIRE",
                "amount": 2500.00,
                "merchant": "ENTREPRISE XYZ",
            },
            {
                "id": "tx3",
                "date": "2023-05-20",
                "description": "PRLV FREE MOBILE",
                "amount": -19.99,
                "merchant": "FREE MOBILE",
            }
        ]

    def process_transactions(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Traite les transactions brutes pour normaliser et enrichir les données.
        """
        processed = []
        
        for tx in transactions:
            # Convertir la date
            tx_date = datetime.datetime.strptime(tx["date"], "%Y-%m-%d").date()
            
            # Déterminer s'il s'agit d'une dépense ou d'un revenu
            is_expense = tx["amount"] < 0
            
            # Essayer de déterminer si c'est une transaction récurrente
            # Ceci nécessiterait plus d'analyse dans une implémentation réelle
            is_recurring = "PRLV" in tx["description"] or "VIREMENT" in tx["description"]
            
            # Normaliser le montant (toujours positif)
            amount = abs(tx["amount"])
            
            processed.append({
                "external_id": tx["id"],
                "date": tx_date,
                "description": tx["description"],
                "amount": amount,
                "merchant": tx["merchant"],
                "is_expense": is_expense,
                "is_recurring": is_recurring,
            })
            
        return processed

    def synchronize_user_transactions(self, user: User, db_session) -> int:
        """
        Synchronise les transactions d'un utilisateur.
        Retourne le nombre de nouvelles transactions.
        """
        if not user.bourso_username_encrypted or not user.bourso_password_encrypted:
            raise Exception("Identifiants Boursorama non configurés")
            
        username, password = self.decrypt_credentials(
            user.bourso_username_encrypted, 
            user.bourso_password_encrypted
        )
        
        if not self.login(username, password):
            raise Exception("Échec de la connexion à Boursorama")
            
        accounts = self.get_accounts()
        new_transactions_count = 0
        
        for account in accounts:
            # Déterminer la période à synchroniser
            end_date = datetime.date.today()
            
            # Si c'est la première synchronisation, on récupère les 3 derniers mois
            # Sinon, on récupère depuis la dernière synchronisation
            if user.last_sync:
                start_date = user.last_sync.date()
            else:
                start_date = end_date - timedelta(days=90)
                
            raw_transactions = self.get_transactions(account["id"], start_date, end_date)
            processed_transactions = self.process_transactions(raw_transactions)
            
            for tx_data in processed_transactions:
                # Vérifier si la transaction existe déjà
                existing = db_session.query(Transaction).filter(
                    Transaction.external_id == tx_data["external_id"],
                    Transaction.user_id == user.id
                ).first()
                
                if not existing:
                    # Créer la nouvelle transaction
                    new_tx = Transaction(
                        user_id=user.id,
                        external_id=tx_data["external_id"],
                        date=tx_data["date"],
                        description=tx_data["description"],
                        amount=tx_data["amount"],
                        merchant=tx_data["merchant"],
                        is_expense=tx_data["is_expense"],
                        is_recurring=tx_data["is_recurring"],
                    )
                    
                    db_session.add(new_tx)
                    new_transactions_count += 1
        
        # Mettre à jour la date de dernière synchronisation
        user.last_sync = datetime.datetime.utcnow()
        db_session.commit()
        
        return new_transactions_count 