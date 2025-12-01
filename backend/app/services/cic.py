"""
Service de connexion au Crédit Industriel et Commercial (CIC)

Ce service utilise le scraping web pour se connecter au CIC
et récupérer les comptes et transactions.

IMPORTANT: Ce code est fourni à titre d'exemple éducatif.
L'utilisation de scraping peut violer les CGU de la banque.
Privilégiez l'API officielle si disponible (Budget Insight, Bridge API).
"""

import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class CICConnector:
    """
    Connecteur pour le CIC (scraping web)
    
    Note: Pour un usage en production, utilisez plutôt:
    - Budget Insight API
    - Bridge API
    - Linxo Connect
    """
    
    BASE_URL = "https://www.cic.fr"
    
    def __init__(self, headless: bool = True):
        """
        Initialise le connecteur CIC
        
        Args:
            headless: Exécuter le navigateur en mode headless
        """
        self.headless = headless
        self.driver = None
        
    def _init_driver(self):
        """Initialise le driver Selenium"""
        from selenium import webdriver
        
        options = webdriver.ChromeOptions()
        if self.headless:
            options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        
        self.driver = webdriver.Chrome(options=options)
        
    def close(self):
        """Ferme le driver"""
        if self.driver:
            self.driver.quit()
            self.driver = None
            
    async def login(self, username: str, password: str) -> bool:
        """
        Connexion au CIC
        
        Args:
            username: Identifiant client (10 chiffres)
            password: Code secret (6 chiffres)
            
        Returns:
            True si la connexion réussit
        """
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.common.exceptions import TimeoutException, NoSuchElementException
        
        try:
            if not self.driver:
                self._init_driver()
                
            # Accéder à la page de connexion
            self.driver.get(f"{self.BASE_URL}/fr/banque/compte/connexion.html")
            
            # Attendre le champ identifiant
            username_field = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "identifiant"))
            )
            username_field.send_keys(username)
            
            # Entrer le code secret (clavier virtuel)
            # Note: Le CIC utilise un clavier virtuel pour la sécurité
            # Cette implémentation est simplifiée
            password_field = self.driver.find_element(By.ID, "code_secret")
            password_field.send_keys(password)
            
            # Cliquer sur le bouton de connexion
            login_button = self.driver.find_element(By.ID, "valider")
            login_button.click()
            
            # Attendre que la page des comptes se charge
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "comptes"))
            )
            
            logger.info("Connexion CIC réussie")
            return True
            
        except (TimeoutException, NoSuchElementException) as e:
            logger.error(f"Erreur de connexion CIC: {e}")
            return False
            
    async def get_accounts(self) -> List[Dict[str, Any]]:
        """
        Récupère la liste des comptes
        
        Returns:
            Liste des comptes avec solde
        """
        if not self.driver:
            raise Exception("Non connecté. Appelez login() d'abord.")
            
        accounts = []
        
        try:
            # Récupérer les éléments de compte
            account_elements = self.driver.find_elements(By.CLASS_NAME, "compte")
            
            for element in account_elements:
                account_name = element.find_element(By.CLASS_NAME, "libelle").text
                account_number = element.find_element(By.CLASS_NAME, "numero").text
                balance_text = element.find_element(By.CLASS_NAME, "solde").text
                
                # Parser le solde
                balance = float(
                    balance_text.replace('€', '')
                    .replace(' ', '')
                    .replace(',', '.')
                    .strip()
                )
                
                accounts.append({
                    'id': account_number,
                    'name': account_name,
                    'number': account_number,
                    'balance': balance,
                    'currency': 'EUR',
                    'type': self._detect_account_type(account_name)
                })
                
            logger.info(f"{len(accounts)} comptes récupérés")
            return accounts
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des comptes: {e}")
            return []
            
    async def get_transactions(
        self,
        account_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Récupère les transactions d'un compte
        
        Args:
            account_id: Numéro de compte
            start_date: Date de début (par défaut: 30 jours)
            end_date: Date de fin (par défaut: aujourd'hui)
            
        Returns:
            Liste des transactions
        """
        if not self.driver:
            raise Exception("Non connecté. Appelez login() d'abord.")
            
        if not start_date:
            start_date = datetime.now() - timedelta(days=30)
        if not end_date:
            end_date = datetime.now()
            
        transactions = []
        
        try:
            # Cliquer sur le compte
            account_link = self.driver.find_element(
                By.XPATH,
                f"//div[contains(@class, 'compte') and contains(., '{account_id}')]"
            )
            account_link.click()
            
            # Attendre le chargement des opérations
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "operations"))
            )
            
            # Récupérer les opérations
            operation_elements = self.driver.find_elements(By.CLASS_NAME, "operation")
            
            for element in operation_elements:
                date_text = element.find_element(By.CLASS_NAME, "date").text
                description = element.find_element(By.CLASS_NAME, "libelle").text
                amount_text = element.find_element(By.CLASS_NAME, "montant").text
                
                # Parser la date
                tx_date = datetime.strptime(date_text, "%d/%m/%Y")
                
                # Filtrer par période
                if tx_date < start_date or tx_date > end_date:
                    continue
                    
                # Parser le montant
                amount_str = amount_text.replace('€', '').replace(' ', '').replace(',', '.').strip()
                amount = float(amount_str)
                
                transactions.append({
                    'date': tx_date.isoformat(),
                    'description': description,
                    'amount': amount,
                    'is_expense': amount < 0,
                    'account_id': account_id
                })
                
            logger.info(f"{len(transactions)} transactions récupérées pour {account_id}")
            return transactions
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des transactions: {e}")
            return []
            
    def _detect_account_type(self, account_name: str) -> str:
        """Détecte le type de compte d'après son nom"""
        name_lower = account_name.lower()
        
        if 'courant' in name_lower or 'compte chèque' in name_lower:
            return 'checking'
        elif 'livret' in name_lower or 'épargne' in name_lower:
            return 'savings'
        elif 'pea' in name_lower:
            return 'securities'
        elif 'assurance vie' in name_lower:
            return 'life_insurance'
        elif 'prêt' in name_lower or 'crédit' in name_lower:
            return 'loan'
        else:
            return 'other'


# Version Mock pour développement/tests
class CICMockConnector:
    """Version mock du connecteur CIC pour les tests"""
    
    async def login(self, username: str, password: str) -> bool:
        """Mock de connexion"""
        await asyncio.sleep(0.5)  # Simuler un délai réseau
        # Accepter n'importe quel identifiant sauf "invalid"
        return password != "invalid"
        
    async def get_accounts(self) -> List[Dict[str, Any]]:
        """Mock de récupération des comptes"""
        await asyncio.sleep(0.3)
        return [
            {
                'id': '12345678901',
                'name': 'Compte Chèque',
                'number': '12345678901',
                'balance': 1823.45,
                'currency': 'EUR',
                'type': 'checking'
            },
            {
                'id': '12345678902',
                'name': 'Livret A',
                'number': '12345678902',
                'balance': 8500.00,
                'currency': 'EUR',
                'type': 'savings'
            },
            {
                'id': '12345678903',
                'name': 'PEA',
                'number': '12345678903',
                'balance': 25600.50,
                'currency': 'EUR',
                'type': 'securities'
            }
        ]
        
    async def get_transactions(
        self,
        account_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Mock de récupération des transactions"""
        await asyncio.sleep(0.5)
        
        now = datetime.now()
        
        # Transactions différentes selon le compte
        if account_id == '12345678901':  # Compte Chèque
            return [
                {
                    'date': (now - timedelta(days=1)).isoformat(),
                    'description': 'VIR SALAIRE',
                    'amount': 2800.00,
                    'type': 'income',
                    'account_id': account_id
                },
                {
                    'date': (now - timedelta(days=2)).isoformat(),
                    'description': 'PRLV LOYER',
                    'amount': -950.00,
                    'type': 'expense',
                    'account_id': account_id
                },
                {
                    'date': (now - timedelta(days=3)).isoformat(),
                    'description': 'CB AUCHAN',
                    'amount': -78.45,
                    'type': 'expense',
                    'account_id': account_id
                },
                {
                    'date': (now - timedelta(days=4)).isoformat(),
                    'description': 'PRLV SEPA INTERNET',
                    'amount': -29.99,
                    'type': 'expense',
                    'account_id': account_id
                },
                {
                    'date': (now - timedelta(days=7)).isoformat(),
                    'description': 'PRLV ELECTRICITE',
                    'amount': -125.30,
                    'type': 'expense',
                    'account_id': account_id
                }
            ]
        elif account_id == '12345678902':  # Livret A
            return [
                {
                    'date': (now - timedelta(days=3)).isoformat(),
                    'description': 'VIR EPARGNE MENSUELLE',
                    'amount': 300.00,
                    'type': 'income',
                    'account_id': account_id
                },
                {
                    'date': (now - timedelta(days=20)).isoformat(),
                    'description': 'VIR EPARGNE MENSUELLE',
                    'amount': 300.00,
                    'type': 'income',
                    'account_id': account_id
                },
                {
                    'date': (now - timedelta(days=30)).isoformat(),
                    'description': 'INTERETS LIVRET A',
                    'amount': 25.00,
                    'type': 'income',
                    'account_id': account_id
                }
            ]
        else:  # PEA (12345678903)
            return [
                {
                    'date': (now - timedelta(days=5)).isoformat(),
                    'description': 'ACHAT ACTIONS TOTAL',
                    'amount': -1500.00,
                    'type': 'expense',
                    'account_id': account_id
                },
                {
                    'date': (now - timedelta(days=10)).isoformat(),
                    'description': 'VENTE ACTIONS ORANGE',
                    'amount': 800.00,
                    'type': 'income',
                    'account_id': account_id
                },
                {
                    'date': (now - timedelta(days=15)).isoformat(),
                    'description': 'DIVIDENDES',
                    'amount': 45.20,
                    'type': 'income',
                    'account_id': account_id
                }
            ]
        
        
    def close(self):
        """Mock de fermeture"""
        pass
