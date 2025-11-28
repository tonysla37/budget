# Guide de Mise en Route - Connexions Bancaires

Ce guide vous aide à démarrer avec les connexions bancaires dans votre application de gestion budgétaire.

## 🚀 Démarrage Rapide

### 1. Configuration Backend

#### a. Générer une clé de chiffrement

```bash
cd backend
python3 -c "import os, base64; print('ENCRYPTION_MASTER_KEY=' + base64.urlsafe_b64encode(os.urandom(32)).decode())"
```

#### b. Ajouter la clé dans .env

Créez ou modifiez `backend/.env` :

```bash
# Clé de chiffrement pour les credentials bancaires
ENCRYPTION_MASTER_KEY=<votre-clé-générée>

# Autres variables existantes
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=budget_db
SECRET_KEY=<votre-secret-jwt>
```

⚠️ **IMPORTANT** : Ne JAMAIS commiter cette clé dans Git !

#### c. Redémarrer le backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Tester l'Interface

1. **Accédez à l'application** : `http://10.37.16.90:19006`
2. **Connectez-vous** avec votre compte
3. **Cliquez sur "Banques"** dans le menu
4. **Ajoutez une connexion** :
   - Choisissez "BoursoBank" ou "CIC"
   - Sélectionnez "Mode Démo"
   - Remplissez n'importe quels identifiants (non vérifiés en mode démo)
   - Cliquez sur "Ajouter la connexion"
5. **Synchronisez** pour importer les transactions de test

## 📊 Données de Test (Mode Mock)

### BoursoBank Mock

**Comptes générés** :
- Compte Courant : 2 456,78 €
- Livret A : 15 000,00 €

**Transactions générées** :
- VIR SEPA SALAIRE : +2 500,00 €
- PRELEVEMENT EDF : -89,50 €
- CARTE CARREFOUR : -45,30 €
- VIR SNCF : -120,00 €

### CIC Mock

**Comptes générés** :
- Compte Courant : 1 823,45 €
- Livret A : 8 500,00 €
- PEA : 25 600,50 €

**Transactions générées** :
- VIR SALAIRE : +3 200,00 €
- PRLV LOYER : -850,00 €
- CARTE AUCHAN : -67,80 €
- CARTE TOTAL : -55,20 €
- PRLV ELECTRICITE : -95,40 €

## 🔐 Sécurité

### Comment ça fonctionne ?

1. **Saisie** : Vous saisissez vos identifiants dans le frontend
2. **Transmission** : Envoyés via HTTPS au backend
3. **Chiffrement** : Backend chiffre avec AES-256 + clé dérivée unique
4. **Stockage** : MongoDB stocke uniquement les credentials chiffrés
5. **Utilisation** : Déchiffrés temporairement pour la synchronisation
6. **Suppression** : Supprimés automatiquement si vous supprimez la connexion

### Vérifications de Sécurité

✅ **Mots de passe masqués** dans l'interface  
✅ **Chiffrement AES-256** avec Fernet  
✅ **Clé unique par utilisateur** (PBKDF2 avec 100k itérations)  
✅ **Jamais de retour des credentials** via l'API  
✅ **Logs sécurisés** (pas de credentials en clair)  
✅ **HTTPS requis** en production  

## 🏦 Passer en Production

### Option 1 : Budget Insight (Recommandé)

1. **Créer un compte** : https://www.budget-insight.com/
2. **Obtenir les credentials API** : Client ID + Client Secret
3. **Dans l'application** :
   - Ajouter une connexion bancaire
   - Choisir "API Officielle"
   - Saisir vos Client ID et Secret
   - Synchroniser

**Avantages** :
- ✅ 400+ banques supportées
- ✅ Conformité DSP2
- ✅ Pas de violation des CGU
- ✅ Support professionnel

### Option 2 : Bridge API

1. **Créer un compte** : https://bridgeapi.io/
2. **Obtenir les credentials API**
3. **Configuration identique** à Budget Insight

### Option 3 : Scraping Web (Non recommandé)

⚠️ **Avertissements** :
- Viole les CGU des banques
- Peut entraîner le blocage de votre compte
- Non conforme DSP2
- Maintenance complexe (changements fréquents des sites)

Si vous choisissez quand même :

```bash
# Installer Selenium
pip install selenium webdriver-manager

# Dans l'application :
# - Choisir "Scraping Web"
# - Saisir vos vrais identifiants bancaires
# - Accepter les risques
```

## 🧪 Tests

### Tester l'API avec curl

```bash
# 1. Se connecter
TOKEN=$(curl -X POST http://10.37.16.90:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.access_token')

# 2. Créer une connexion bancaire
curl -X POST http://10.37.16.90:8000/api/bank-connections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bank": "boursobank",
    "connection_type": "mock",
    "username": "test@example.com",
    "password": "password123",
    "nickname": "Test BoursoBank"
  }'

# 3. Lister les connexions
curl -X GET http://10.37.16.90:8000/api/bank-connections \
  -H "Authorization: Bearer $TOKEN"

# 4. Synchroniser (remplacer {connection_id})
curl -X POST http://10.37.16.90:8000/api/bank-connections/{connection_id}/sync \
  -H "Authorization: Bearer $TOKEN"
```

### Tester avec Swagger UI

1. Accédez à `http://10.37.16.90:8000/docs`
2. Cliquez sur "Authorize" et entrez votre token JWT
3. Testez les endpoints `/api/bank-connections`

## 📝 Collections MongoDB

### bank_connections

```javascript
{
  _id: ObjectId("..."),
  user_id: "673e8f...",
  bank: "boursobank",
  connection_type: "mock",
  nickname: "Mon compte",
  encrypted_username: "gAAAAABl...",  // Chiffré
  encrypted_password: "gAAAAABl...",  // Chiffré
  is_active: true,
  accounts_count: 2,
  last_sync: ISODate("2025-11-28T11:15:00Z"),
  created_at: ISODate("2025-11-28T10:00:00Z"),
  updated_at: ISODate("2025-11-28T11:15:00Z")
}
```

### bank_accounts

```javascript
{
  _id: ObjectId("..."),
  connection_id: "673e8f...",
  user_id: "673e8f...",
  external_id: "FR7630001007941234567890185",
  name: "Compte Courant",
  account_type: "checking",
  balance: 2456.78,
  currency: "EUR",
  iban: "FR7630001007941234567890185",
  is_active: true,
  last_sync: ISODate("2025-11-28T11:15:00Z"),
  created_at: ISODate("2025-11-28T11:00:00Z"),
  updated_at: ISODate("2025-11-28T11:15:00Z")
}
```

## 🔧 Dépannage

### Erreur "ENCRYPTION_MASTER_KEY manquante"

**Solution** : Générez et ajoutez la clé dans `backend/.env`

```bash
python3 -c "import os, base64; print(base64.urlsafe_b64encode(os.urandom(32)).decode())"
```

### Erreur "Connexion non trouvée"

**Solution** : Vérifiez que l'ID de connexion est correct et appartient à l'utilisateur connecté

### La synchronisation échoue

**En mode Mock** : Vérifiez que le connecteur est bien importé  
**En mode API** : Vérifiez vos Client ID et Secret  
**En mode Scraping** : Vérifiez que Chrome/Selenium est installé

### Les transactions n'apparaissent pas

1. Vérifiez que la synchronisation a réussi (champ `new_transactions` > 0)
2. Allez dans "Transactions" et rechargez la page
3. Vérifiez dans MongoDB : `db.transactions.find({bank_connection_id: "..."})`

## 📚 Ressources

- **Documentation complète** : `docs/CONNECTEURS_BANCAIRES.md`
- **Code source** :
  - Frontend : `frontend/src/screens/BankConnectionsScreen.jsx`
  - Backend : `backend/app/routers/bank_connections.py`
  - Chiffrement : `backend/app/core/encryption.py`
  - Connecteurs : `backend/app/services/boursobank.py`, `backend/app/services/cic.py`
- **API Swagger** : `http://10.37.16.90:8000/docs`

## ✅ Checklist de Mise en Production

- [ ] Clé ENCRYPTION_MASTER_KEY définie et sécurisée
- [ ] HTTPS activé (nginx, Let's Encrypt)
- [ ] Utilisation d'API officielles (Budget Insight ou Bridge)
- [ ] Logs configurés (sans credentials en clair)
- [ ] Monitoring actif (Sentry, New Relic, etc.)
- [ ] Backup régulier de la clé de chiffrement
- [ ] Plan de rotation de la clé (tous les 6-12 mois)
- [ ] Tests de charge effectués
- [ ] Documentation utilisateur fournie
- [ ] Conformité RGPD vérifiée

## 🆘 Support

En cas de problème :

1. Vérifiez les logs backend : `backend/logs/`
2. Consultez la documentation : `docs/CONNECTEURS_BANCAIRES.md`
3. Testez avec le mode Mock d'abord
4. Vérifiez la configuration dans `.env`

---

**Dernière mise à jour** : 28 novembre 2025
