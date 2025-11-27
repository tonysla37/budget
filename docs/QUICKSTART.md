# 🚀 Guide de Démarrage Rapide

## Installation en 3 étapes

### Étape 1 : Vérifier les prérequis ✓

```bash
# Vérifier Python
python3 --version  # Doit être >= 3.9

# Vérifier Node.js
node --version  # Doit être >= 14

# Vérifier MongoDB
mongosh --version  # Doit être installé
```

### Étape 2 : Démarrer les serveurs 🚀

```bash
# Depuis le dossier budget/

# 1️⃣ Démarrer MongoDB
sudo systemctl start mongod

# 2️⃣ Démarrer le backend
cd backend
source venv/bin/activate
nohup python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
cd ..

# 3️⃣ Démarrer le frontend
cd frontend
nohup npm run dev > /tmp/frontend.log 2>&1 &
cd ..
```

### Étape 3 : Tester l'application ✨

```bash
# Exécuter les tests
./test_final.sh
```

**Résultat attendu** :
```
=========================================
TEST FINAL - Application Budget
=========================================

1. Tests Backend
----------------
Testing Swagger Docs... ✓ (HTTP 200)
Testing API Health... ✓ (HTTP 200)

2. Tests Frontend
----------------
Testing Frontend Home... ✓ (HTTP 200)

3. Vérification des processus
------------------------------
✓ Backend running (port 8000)
✓ Frontend running (port 19006)

4. Vérification MongoDB
-----------------------
✓ MongoDB is running
  - Users: 2
  - Categories: 18
  - Transactions: 156
  - Budgets: 3
```

## 🌐 Accéder à l'application

Une fois les serveurs démarrés :

### Frontend (Interface utilisateur)
**URL** : http://localhost:19006

**Première connexion** :
1. Cliquez sur "S'inscrire"
2. Remplissez le formulaire
3. Ou utilisez le compte démo : `demo@example.com` / `Demo1234!`

### Backend (API Documentation)
**URL** : http://localhost:8000/docs

Explorez les endpoints disponibles et testez l'API directement depuis Swagger.

## 📋 Navigation dans l'application

Une fois connecté, vous verrez 7 onglets :

### 1. 📊 Tableau de bord
- Vue d'ensemble de vos finances
- Statistiques du mois en cours
- Graphique des dépenses par catégorie
- Transactions récentes

### 2. 💳 Transactions
- Liste de toutes vos transactions
- Filtrer par catégorie ou date
- Rechercher par description ou merchant
- Modifier ou supprimer des transactions

### 3. ➕ Ajouter
- Créer une nouvelle transaction
- Choisir le type (revenu/dépense)
- Sélectionner une catégorie
- Ajouter un merchant (optionnel)

### 4. 🏷️ Catégories
- Gérer vos catégories
- Créer des catégories parentes
- Ajouter des sous-catégories (max 2 niveaux)
- Personnaliser les couleurs

### 5. 💼 Budgets
- Créer des budgets mensuels
- Suivre vos dépenses vs budget
- Voir les transactions par budget
- Indicateurs visuels (OK/Attention/Dépassé)

### 6. 📈 Statistiques
- Rapports mensuels sur 6 mois
- Graphiques interactifs
- Évolution revenus/dépenses
- Taux d'épargne

### 7. ⚙️ Paramètres
- Informations de profil
- Jour de cycle de facturation
- Déconnexion

## 🎯 Fonctionnalités clés à tester

### ✅ Catégories hiérarchiques
1. Aller dans "Catégories"
2. Créer une catégorie parente (ex: "Alimentation")
3. Créer une sous-catégorie (cliquez sur le parent dans le sélecteur)
4. Les transactions s'affichent "Parent › Sous-catégorie"

### ✅ Budgets avec sous-catégories
1. Aller dans "Budgets"
2. Créer un budget pour une catégorie parente
3. Le calcul inclut automatiquement toutes les sous-catégories
4. Cliquez sur un budget pour voir les transactions détaillées

### ✅ Merchant dans les transactions
1. Aller dans "Ajouter"
2. Remplir une transaction
3. Ajouter un merchant (ex: "Carrefour", "SNCF")
4. Le merchant apparaît dans la liste des transactions

### ✅ Statistiques mensuelles
1. Aller dans "Statistiques"
2. Voir l'évolution sur 6 mois
3. Changer de métrique (revenus/dépenses/économies/net)
4. Consulter le tableau détaillé

## 🔧 Commandes utiles

### Arrêter les serveurs
```bash
# Arrêter le backend
pkill -f "uvicorn app.main:app"

# Arrêter le frontend
pkill -f "vite"

# Arrêter MongoDB
sudo systemctl stop mongod
```

### Voir les logs en temps réel
```bash
# Backend
tail -f /tmp/backend.log

# Frontend
tail -f /tmp/frontend.log
```

### Redémarrer un serveur
```bash
# Backend
pkill -f "uvicorn"
cd backend
source venv/bin/activate
nohup python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &

# Frontend
pkill -f "vite"
cd frontend
nohup npm run dev > /tmp/frontend.log 2>&1 &
```

## 🐛 Problèmes courants

### ❌ "Connection refused" sur le frontend
**Solution** : Le backend n'est pas démarré
```bash
curl http://localhost:8000/docs
# Si erreur, démarrer le backend
```

### ❌ "Not authenticated"
**Solution** : Token expiré, reconnectez-vous
1. Cliquez sur "Paramètres"
2. Cliquez sur "Déconnexion"
3. Reconnectez-vous

### ❌ MongoDB n'est pas accessible
**Solution** : Démarrer MongoDB
```bash
sudo systemctl start mongod
sudo systemctl status mongod
```

### ❌ Page blanche sur le frontend
**Solution** : Vider le cache
1. Ouvrir la console (F12)
2. Vérifier les erreurs
3. Recharger avec Ctrl+Shift+R

## 📚 Documentation complète

Pour aller plus loin :
- **[README.md](README.md)** - Vue d'ensemble et installation
- **[docs/README.md](docs/README.md)** - Documentation complète
- **[docs/FRONTEND.md](docs/FRONTEND.md)** - Architecture frontend
- **[docs/TESTS.md](docs/TESTS.md)** - Tests et validation

## 💡 Conseils

1. **Utilisez le compte démo** pour découvrir l'application avec des données pré-remplies
2. **Créez des catégories** avant d'ajouter des transactions
3. **Organisez vos catégories** avec la hiérarchie (Parent › Sous-catégorie)
4. **Définissez des budgets** pour suivre vos dépenses mensuelles
5. **Consultez les statistiques** pour analyser vos habitudes financières

## 🎉 Vous êtes prêt !

Votre application Budget est maintenant opérationnelle. Bon usage ! 💰📊

---

**Questions ?** Consultez la documentation complète dans le dossier `docs/`
