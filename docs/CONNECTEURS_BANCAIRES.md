# Guide des Connecteurs Bancaires

Ce document explique comment utiliser les connecteurs bancaires pour synchroniser automatiquement vos comptes et transactions.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Banques supportées](#banques-supportées)
- [Méthodes de connexion](#méthodes-de-connexion)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Interface Frontend](#interface-frontend)
- [Sécurité](#sécurité)
- [Alternatives recommandées](#alternatives-recommandées)
- [API Backend](#api-backend)
- [FAQ](#faq)

## Vue d'ensemble

Les connecteurs bancaires permettent de :
- ✅ Récupérer automatiquement vos comptes bancaires
- ✅ Synchroniser vos transactions
- ✅ Mettre à jour les soldes
- ✅ Catégoriser automatiquement les transactions

## Banques supportées

### 1. BoursoBank (anciennement Boursorama)

**Type de compte** : Banque en ligne  
**Méthode** : Mock/Scraping web  
**Statut** : ⚠️ Version démo

**Identifiants requis** :
- Identifiant client (email ou numéro)
- Mot de passe

### 2. CIC (Crédit Industriel et Commercial)

**Type de compte** : Banque traditionnelle  
**Méthode** : Mock/Scraping web  
**Statut** : ⚠️ Version démo

**Identifiants requis** :
- Identifiant client (10 chiffres)
- Code secret (6 chiffres)

## Méthodes de connexion

### Option 1 : Connecteurs Mock (Recommandé pour les tests)

Les connecteurs mock simulent une connexion bancaire sans accéder réellement à vos comptes. Idéal pour le développement et les tests.

**Avantages** :
- ✅ Aucun risque de sécurité
- ✅ Données de test réalistes
- ✅ Fonctionnement hors ligne
- ✅ Rapide et fiable

**Utilisation** :

```python
from app.services.boursobank import BoursobankMockConnector
from app.services.cic import CICMockConnector

# BoursoBank Mock
connector = BoursobankMockConnector()
await connector.login("test@email.com", "password123")
accounts = await connector.get_accounts()
transactions = await connector.get_transactions(accounts[0]['id'])
connector.close()

# CIC Mock
connector = CICMockConnector()
await connector.login("1234567890", "123456")
accounts = await connector.get_accounts()
transactions = await connector.get_transactions(accounts[0]['id'])
connector.close()
```

### Option 2 : Scraping Web (Non recommandé)

⚠️ **ATTENTION** : Cette méthode présente plusieurs risques :
- Violation potentielle des CGU bancaires
- Compte pouvant être bloqué
- Maintenance complexe (changements d'interface)
- Peu sécurisé pour les identifiants

**Configuration requise** :

```bash
# Installation de Selenium et ChromeDriver
pip install selenium
apt-get install chromium-chromedriver  # Linux
# ou brew install chromedriver  # macOS
```

**Utilisation** :

```python
from app.services.boursobank import BoursobankConnector
from app.services.cic import CICConnector

# BoursoBank
connector = BoursobankConnector(headless=True)
await connector.login("votre_email", "votre_mot_de_passe")
accounts = await connector.get_accounts()
transactions = await connector.get_transactions(accounts[0]['id'])
connector.close()

# CIC
connector = CICConnector(headless=True)
await connector.login("1234567890", "123456")
accounts = await connector.get_accounts()
transactions = await connector.get_transactions(accounts[0]['id'])
connector.close()
```

### Option 3 : APIs officielles (Recommandé pour la production)

Pour un usage en production, utilisez des agrégateurs bancaires certifiés :

#### Budget Insight

**Site** : https://www.budget-insight.com/  
**Prix** : À partir de 0.10€ par synchronisation  
**Conformité** : DSP2, RGPD

```python
import budgetinsight

client = budgetinsight.Client(
    client_id="votre_client_id",
    client_secret="votre_secret"
)

# Connexion utilisateur
user = client.create_user()
connection = user.add_connection(id_bank=40, login="...", password="...")

# Récupération des comptes
accounts = connection.get_accounts()
transactions = connection.get_transactions()
```

#### Bridge API

**Site** : https://bridgeapi.io/  
**Prix** : À partir de 0.15€ par utilisateur/mois  
**Conformité** : DSP2, RGPD

```python
from bridge import Client

client = Client(
    client_id="votre_client_id",
    client_secret="votre_secret"
)

# Créer un utilisateur
user = client.create_user(email="user@example.com")

# Lier un compte bancaire
item = client.create_item(
    user_uuid=user['uuid'],
    bank_id=408  # BoursoBank
)

# Récupérer les données
accounts = client.list_accounts(item_id=item['id'])
transactions = client.list_transactions(account_id=accounts[0]['id'])
```

## Configuration

### 1. Variables d'environnement

Ajoutez dans votre `.env` :

```bash
# Choix du mode de connexion
BANK_CONNECTOR_MODE=mock  # mock, scraping, ou api

# Pour le mode API (Budget Insight)
BUDGET_INSIGHT_CLIENT_ID=your_client_id
BUDGET_INSIGHT_CLIENT_SECRET=your_secret

# Pour le mode API (Bridge)
BRIDGE_CLIENT_ID=your_client_id
BRIDGE_CLIENT_SECRET=your_secret

# Clé de chiffrement des identifiants
ENCRYPTION_KEY=votre_cle_secrete_32_caracteres
```

### 2. Installation des dépendances

```bash
# Pour le mode Mock (déjà inclus)
pip install -r backend/requirements.txt

# Pour le scraping web
pip install selenium webdriver-manager

# Pour Budget Insight
pip install budgetinsight

# Pour Bridge API
pip install bridge-python
```

## Interface Frontend

### Écran de Gestion des Connexions Bancaires

L'application frontend fournit une interface complète pour gérer vos connexions bancaires :

#### Fonctionnalités disponibles

1. **Ajouter une connexion bancaire**
   - Sélectionner la banque (BoursoBank, CIC)
   - Choisir le type de connexion :
     - **Mode Démo** : Données de test (recommandé pour les tests)
     - **Scraping Web** : Connexion réelle via web scraping (non recommandé en production)
     - **API Officielle** : Via Budget Insight / Bridge (recommandé pour la production)
   - Saisir les identifiants (selon le type de connexion)
   - Définir un surnom optionnel pour identifier la connexion

2. **Visualiser vos connexions**
   - Liste des connexions avec statut (active/inactive)
   - Nombre de comptes synchronisés
   - Date de dernière synchronisation
   - Type de connexion utilisé

3. **Synchroniser une connexion**
   - Bouton "Synchroniser" pour récupérer les dernières transactions
   - Indicateur de progression pendant la synchronisation
   - Notification du nombre de nouvelles transactions

4. **Supprimer une connexion**
   - Suppression sécurisée avec confirmation
   - Les credentials chiffrés sont automatiquement supprimés

#### Sécurité de l'Interface

- **Masquage des mots de passe** : Icône œil pour afficher/masquer les credentials
- **Chiffrement automatique** : Les identifiants sont chiffrés avant envoi au backend
- **Avertissement de sécurité** : Information claire sur le chiffrement AES-256
- **Validation des formats** : Pour CIC (10 chiffres + 6 chiffres)

#### Navigation

Accédez à l'écran via le menu principal :
```
Navigation → Banques
```

URL : `/bank-connections`

#### Captures d'écran des formulaires

**Formulaire de connexion Mock/Scraping** :
- Identifiant (email ou numéro selon la banque)
- Mot de passe (masqué par défaut)
- Surnom optionnel

**Formulaire de connexion API** :
- Client ID
- Client Secret (masqué par défaut)
- Surnom optionnel

## Utilisation

### Depuis l'Interface Frontend (Recommandé)

1. **Connectez-vous à l'application**
2. **Accédez à "Banques"** dans le menu
3. **Cliquez sur "Ajouter une banque"**
4. **Sélectionnez votre banque** (BoursoBank ou CIC)
5. **Choisissez le type de connexion** :
   - Mode Démo pour tester
   - API Officielle pour la production
6. **Saisissez vos identifiants**
7. **Cliquez sur "Ajouter la connexion"**
8. **Synchronisez** pour importer vos transactions

### Depuis l'API Backend

#### Endpoint : Créer une connexion bancaire

```http
POST /api/bank-connections
Content-Type: application/json
Authorization: Bearer {token}

{
  "bank": "boursobank",
  "connection_type": "mock",  // ou "scraping", "api"
  "username": "votre_identifiant",  // Pour mock/scraping
  "password": "votre_mot_de_passe",  // Pour mock/scraping
  "nickname": "Mon compte principal"
}
```

**Pour API** :

```json
{
  "bank": "boursobank",
  "connection_type": "api",
  "api_client_id": "votre_client_id",
  "api_client_secret": "votre_client_secret",
  "nickname": "BoursoBank via Budget Insight"
}
```

**Réponse** :

```json
{
  "id": "abc123",
  "bank": "boursobank",
  "connection_type": "mock",
  "nickname": "Mon compte principal",
  "is_active": true,
  "accounts_count": 0,
  "last_sync": null,
  "created_at": "2025-11-28T10:00:00Z",
  "updated_at": "2025-11-28T10:00:00Z"
}
```

#### Endpoint : Synchroniser les transactions

```http
POST /api/bank-connections/{connection_id}/sync
Authorization: Bearer {token}
```

**Réponse** :

```json
{
  "success": true,
  "new_transactions": 15,
  "last_sync": "2025-11-28T15:30:00Z"
}
```

### Depuis le code Python

```python
from app.services.boursobank import BoursobankMockConnector

async def sync_user_bank_account(user_id: str, bank: str, credentials: dict):
    """
    Synchronise le compte bancaire d'un utilisateur
    """
    # Choisir le connecteur
    if bank == "boursobank":
        connector = BoursobankMockConnector()
    elif bank == "cic":
        from app.services.cic import CICMockConnector
        connector = CICMockConnector()
    else:
        raise ValueError(f"Banque non supportée: {bank}")
    
    try:
        # Connexion
        logged_in = await connector.login(
            credentials['username'],
            credentials['password']
        )
        
        if not logged_in:
            return {"success": False, "error": "Identifiants invalides"}
        
        # Récupérer les comptes
        accounts = await connector.get_accounts()
        
        # Récupérer les transactions
        all_transactions = []
        for account in accounts:
            transactions = await connector.get_transactions(account['id'])
            all_transactions.extend(transactions)
        
        # Sauvegarder en base de données
        # ... (code de sauvegarde)
        
        return {
            "success": True,
            "accounts": len(accounts),
            "transactions": len(all_transactions)
        }
        
    finally:
        connector.close()
```

## Sécurité

### Architecture de Sécurité

L'application implémente plusieurs couches de sécurité pour protéger vos identifiants bancaires :

1. **Chiffrement côté backend** : AES-256 avec Fernet
2. **Clés dérivées par utilisateur** : PBKDF2 avec 100 000 itérations
3. **Jamais de stockage en clair** : Credentials chiffrés avant insertion en base
4. **Jamais de retour des credentials** : Les API ne renvoient jamais les identifiants
5. **HTTPS obligatoire** : Toutes les communications sont chiffrées en transit

### Service de Chiffrement

Le service de chiffrement utilise **Fernet** (chiffrement symétrique AES-256) :

```python
from app.core.encryption import encryption_service

# Chiffrer des identifiants
encrypted_username = encryption_service.encrypt("mon_identifiant", user_id)
encrypted_password = encryption_service.encrypt("mon_mot_de_passe", user_id)

# Déchiffrer des identifiants
username = encryption_service.decrypt(encrypted_username, user_id)
password = encryption_service.decrypt(encrypted_password, user_id)

# Chiffrer un dictionnaire entier
data = {"username": "test", "password": "secret"}
encrypted_data = encryption_service.encrypt_dict(
    data, 
    ["username", "password"], 
    user_id
)
# Résultat: {"encrypted_username": "...", "encrypted_password": "..."}
```

### Fonctionnement du Chiffrement

1. **Clé maître** : Définie dans `ENCRYPTION_MASTER_KEY` (variable d'environnement)
2. **Dérivation de clé** : Pour chaque utilisateur, une clé unique est dérivée avec PBKDF2
   - Salt : user_id de l'utilisateur
   - Algorithme : SHA-256
   - Itérations : 100 000
3. **Chiffrement** : Les données sont chiffrées avec la clé dérivée (Fernet/AES-256)
4. **Stockage** : Seules les données chiffrées sont stockées en base

### Configuration de Production

**Variables d'environnement requises** :

```bash
# backend/.env
ENCRYPTION_MASTER_KEY=<clé-générée-de-32-bytes-en-base64>
```

**Génération d'une clé maître sécurisée** :

```python
import os
import base64

# Générer une clé aléatoire de 32 bytes
key = base64.urlsafe_b64encode(os.urandom(32)).decode()
print(f"ENCRYPTION_MASTER_KEY={key}")
```

⚠️ **IMPORTANT** :
- Ne jamais commiter la clé maître dans Git
- Stocker la clé dans un gestionnaire de secrets (AWS Secrets Manager, Azure Key Vault, etc.)
- Faire une rotation de la clé régulièrement (tous les 6-12 mois)
- Sauvegarder la clé de manière sécurisée (perte = impossibilité de déchiffrer)

### Bonnes pratiques de Sécurité

1. ✅ **HTTPS obligatoire** : Toutes les communications entre frontend et backend
2. ✅ **Authentification forte** : JWT tokens avec expiration courte
3. ✅ **Chiffrement des identifiants** : Avant stockage en base de données
4. ✅ **Isolation par utilisateur** : Chaque utilisateur a sa propre clé dérivée
5. ✅ **Logging sécurisé** : Ne jamais logger les credentials en clair
6. ✅ **Validation des entrées** : Format des identifiants validé (CIC: 10+6 chiffres)
7. ✅ **Suppression sécurisée** : Credentials supprimés à la déconnexion
8. ✅ **Principe du moindre privilège** : Seul le propriétaire accède à ses credentials
9. ✅ **Masquage dans l'UI** : Mots de passe masqués par défaut
10. ✅ **Avertissements utilisateur** : Information claire sur le chiffrement

### Flux de Sécurité

**Création d'une connexion** :
```
Frontend → Backend → Chiffrement → MongoDB
(clair)    (clair)    (AES-256)    (chiffré)
```

**Synchronisation** :
```
API Request → Déchiffrement → Connecteur → Banque
             (user_id)         (clair)      (HTTPS)
```

### Audit de Sécurité

Tous les accès aux credentials sont loggés :
- Date et heure
- User ID
- Action (create, read, delete)
- IP source
- Succès ou échec

## Alternatives recommandées

### 1. Budget Insight

**Avantages** :
- 🏆 Leader français de l'agrégation bancaire
- ✅ 400+ banques supportées
- ✅ Conformité DSP2
- ✅ Support excellent
- ✅ API REST complète

**Prix** : À partir de 0.10€/sync  
**Documentation** : https://docs.budget-insight.com/

### 2. Bridge API

**Avantages** :
- 🚀 API moderne et simple
- ✅ 200+ banques européennes
- ✅ Webhooks en temps réel
- ✅ SDK JavaScript/Python
- ✅ Sandbox gratuit

**Prix** : À partir de 0.15€/user/month  
**Documentation** : https://docs.bridgeapi.io/

### 3. Linxo Connect

**Avantages** :
- 🇫🇷 100% français
- ✅ Interface utilisateur clé en main
- ✅ Catégorisation automatique
- ✅ Conformité bancaire

**Prix** : Sur devis  
**Documentation** : https://www.linxo.com/connect/

## API Backend

### Endpoints disponibles

#### 1. Lister les connexions bancaires

```http
GET /api/bank-connections
Authorization: Bearer {token}
```

**Réponse** :

```json
[
  {
    "id": "673e8f...",
    "bank": "boursobank",
    "connection_type": "mock",
    "nickname": "Mon compte principal",
    "is_active": true,
    "accounts_count": 2,
    "last_sync": "2025-11-28T10:30:00Z",
    "created_at": "2025-11-27T09:00:00Z",
    "updated_at": "2025-11-28T10:30:00Z"
  }
]
```

#### 2. Créer une connexion bancaire

```http
POST /api/bank-connections
Authorization: Bearer {token}
Content-Type: application/json

{
  "bank": "boursobank",
  "connection_type": "mock",
  "username": "test@example.com",
  "password": "password123",
  "nickname": "Compte perso"
}
```

**Validation** :
- `bank` : "boursobank" ou "cic"
- `connection_type` : "mock", "scraping", ou "api"
- Pour `connection_type=api` : fournir `api_client_id` et `api_client_secret`
- Pour CIC : username = 10 chiffres, password = 6 chiffres

**Réponse** : `201 Created`

```json
{
  "id": "673e8f...",
  "bank": "boursobank",
  "connection_type": "mock",
  "nickname": "Compte perso",
  "is_active": true,
  "accounts_count": 0,
  "last_sync": null,
  "created_at": "2025-11-28T11:00:00Z",
  "updated_at": "2025-11-28T11:00:00Z"
}
```

#### 3. Mettre à jour une connexion

```http
PUT /api/bank-connections/{connection_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "nickname": "Nouveau nom",
  "is_active": false
}
```

**Champs modifiables** :
- `nickname` : Nouveau surnom
- `is_active` : Activer/désactiver
- `username`, `password` : Mettre à jour les credentials
- `api_client_id`, `api_client_secret` : Mettre à jour les clés API

#### 4. Supprimer une connexion

```http
DELETE /api/bank-connections/{connection_id}
Authorization: Bearer {token}
```

**Réponse** : `204 No Content`

**Effet** :
- Supprime la connexion
- Supprime tous les comptes associés
- Supprime les credentials chiffrés

#### 5. Synchroniser une connexion

```http
POST /api/bank-connections/{connection_id}/sync
Authorization: Bearer {token}
```

**Réponse** :

```json
{
  "success": true,
  "new_transactions": 15,
  "updated_accounts": 2,
  "error": null,
  "synced_at": "2025-11-28T11:15:00Z"
}
```

**En cas d'erreur** :

```json
{
  "success": false,
  "new_transactions": 0,
  "updated_accounts": 0,
  "error": "Identifiants invalides",
  "synced_at": "2025-11-28T11:15:00Z"
}
```

#### 6. Récupérer les comptes d'une connexion

```http
GET /api/bank-connections/{connection_id}/accounts
Authorization: Bearer {token}
```

**Réponse** :

```json
[
  {
    "id": "673e8f...",
    "connection_id": "673e8f...",
    "external_id": "FR76...",
    "name": "Compte Courant",
    "account_type": "checking",
    "balance": 2456.78,
    "currency": "EUR",
    "iban": "FR76...",
    "is_active": true,
    "last_sync": "2025-11-28T11:15:00Z",
    "created_at": "2025-11-28T11:00:00Z"
  },
  {
    "id": "673e90...",
    "connection_id": "673e8f...",
    "external_id": "FR89...",
    "name": "Livret A",
    "account_type": "savings",
    "balance": 15000.00,
    "currency": "EUR",
    "iban": "FR89...",
    "is_active": true,
    "last_sync": "2025-11-28T11:15:00Z",
    "created_at": "2025-11-28T11:00:00Z"
  }
]
```

### Modèles de données

#### BankConnection

```python
{
  "id": str,                    # ID MongoDB
  "user_id": str,               # Propriétaire
  "bank": str,                  # "boursobank" ou "cic"
  "connection_type": str,       # "mock", "scraping", "api"
  "nickname": str | None,       # Surnom optionnel
  
  # Credentials (chiffrés, jamais renvoyés par l'API)
  "encrypted_username": str | None,
  "encrypted_password": str | None,
  "encrypted_api_client_id": str | None,
  "encrypted_api_client_secret": str | None,
  
  # Métadonnées
  "is_active": bool,
  "accounts_count": int,
  "last_sync": datetime | None,
  "created_at": datetime,
  "updated_at": datetime
}
```

#### BankAccount

```python
{
  "id": str,
  "connection_id": str,
  "user_id": str,
  "external_id": str,           # ID chez la banque
  "name": str,
  "account_type": str,          # checking, savings, securities, etc.
  "balance": float,
  "currency": str,
  "iban": str | None,
  "is_active": bool,
  "last_sync": datetime | None,
  "created_at": datetime,
  "updated_at": datetime
}
```

### Codes d'erreur

| Code | Description |
|------|-------------|
| 400 | Données invalides (banque non supportée, type incorrect) |
| 401 | Non authentifié (token manquant ou invalide) |
| 403 | Accès refusé (connexion appartient à un autre utilisateur) |
| 404 | Connexion non trouvée |
| 500 | Erreur serveur (échec chiffrement, base de données, etc.) |
| 503 | Service indisponible (banque inaccessible) |

## FAQ

### Mes identifiants sont-ils sécurisés ?

Avec les **connecteurs Mock** : Aucun identifiant réel n'est utilisé.  
Avec le **scraping** : Identifiants chiffrés en base de données.  
Avec les **APIs officielles** : Identifiants ne transitent jamais par nos serveurs.

### Quelle banque choisir pour mes tests ?

Utilisez les **connecteurs Mock** qui simulent parfaitement le comportement des banques sans aucun risque.

### Puis-je utiliser le scraping en production ?

❌ **Non recommandé** :
- Violation des CGU bancaires
- Risque de blocage de compte
- Maintenance complexe
- Non conforme DSP2

### Comment migrer vers une API officielle ?

1. Créez un compte sur Budget Insight ou Bridge
2. Obtenez vos clés API
3. Configurez les variables d'environnement
4. Changez `BANK_CONNECTOR_MODE=api`
5. Testez avec le sandbox

### Les synchronisations sont-elles automatiques ?

Par défaut, non. Vous pouvez configurer un **cron job** :

```python
# Synchronisation quotidienne à 6h du matin
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', hour=6, minute=0)
async def sync_all_bank_accounts():
    """Synchronise tous les comptes bancaires"""
    # ... logique de synchronisation

scheduler.start()
```

### Combien de temps prend une synchronisation ?

- **Mock** : < 1 seconde
- **Scraping** : 5-15 secondes
- **API officielle** : 2-5 secondes

## Support

Pour toute question ou problème :

- 📧 Email : support@budget-app.com
- 📖 Documentation : `/docs/README.md`
- 🐛 Issues : GitHub Issues
- 💬 Discord : [Lien Discord]

## Changelog

### v1.0.0 (2025-11-28)
- ✨ Ajout des connecteurs Mock pour BoursoBank et CIC
- 📝 Documentation complète
- 🔒 Chiffrement des identifiants
- 🧪 Tests unitaires

### À venir
- 🔄 Synchronisation automatique programmable
- 🏦 Support de plus de banques
- 📊 Statistiques de synchronisation
- 🔔 Notifications de nouvelles transactions
