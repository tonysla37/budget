# 💰 Application Budget

Application complète de gestion de finances personnelles développée avec FastAPI (Python) et React (JavaScript).

## 🚀 Démarrage rapide

### Prérequis
- Python 3.9+
- Node.js et npm
- MongoDB

### Installation et lancement

```bash
# 1. Démarrer MongoDB (si pas déjà actif)
sudo systemctl start mongod

# 2. Démarrer le backend
cd backend
source venv/bin/activate
nohup python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &

# 3. Démarrer le frontend
cd ../frontend
nohup npm run dev > /tmp/frontend.log 2>&1 &
```

### Accès à l'application
- **Frontend** : http://localhost:19006
- **Backend API** : http://localhost:8000/docs
- **Utilisateur demo** : demo@example.com / Demo1234!

## ✨ Fonctionnalités principales

### 💳 Gestion des transactions
- Ajout, modification, suppression de transactions
- Revenus et dépenses avec montants
- Champ merchant pour identifier le commerçant
- Filtrage et recherche avancés

### 📊 Catégories hiérarchiques
- Catégories parentes et sous-catégories (2 niveaux max)
- Couleurs personnalisées
- Affichage "Parent › Sous-catégorie"
- Gestion complète (CRUD)

### 💼 Budgets intelligents
- Budgets mensuels par catégorie
- Calcul automatique incluant les sous-catégories
- Indicateurs visuels (OK, Attention, Dépassé)
- Liste détaillée des transactions par budget
- Regroupement par sous-catégorie

### 📈 Statistiques et rapports
- Tableau de bord avec graphiques
- Rapports mensuels sur 6 mois
- Évolution des revenus/dépenses
- Taux d'épargne
- Graphiques interactifs

### 🔐 Authentification sécurisée
- Connexion/Inscription
- Tokens JWT
- Protection des routes
- Gestion de session

## 📁 Structure du projet

```
budget/
├── backend/          # API FastAPI + MongoDB
│   ├── app/
│   │   ├── routers/  # Endpoints API
│   │   ├── models/   # Modèles de données
│   │   ├── schemas/  # Schémas Pydantic
│   │   └── services/ # Logique métier
│   └── venv/         # Environnement virtuel Python
│
├── frontend/         # Application React + Vite
│   ├── src/
│   │   ├── screens/  # Pages de l'app
│   │   ├── components/ # Composants réutilisables
│   │   ├── services/ # Appels API
│   │   └── contexts/ # State management
│   └── node_modules/
│
└── docs/             # Documentation complète
    ├── README.md     # Documentation principale
    ├── FRONTEND.md   # Doc frontend détaillée
    └── TESTS.md      # Tests et validation
```

## 🧪 Tests

### Test rapide
```bash
./test_final.sh
```

### Vérifier les logs
```bash
# Backend
tail -f /tmp/backend.log

# Frontend
tail -f /tmp/frontend.log
```

## 📚 Documentation

- **[Documentation complète](docs/README.md)** - Guide complet de l'application
- **[Frontend](docs/FRONTEND.md)** - Architecture et composants React
- **[Tests](docs/TESTS.md)** - Validation et tests effectués

## 🛠️ Technologies

### Backend
- **FastAPI** - Framework web moderne Python
- **MongoDB** - Base de données NoSQL
- **Motor** - Driver async MongoDB
- **Pydantic** - Validation de données
- **JWT** - Authentification

### Frontend
- **React 18** - Bibliothèque UI
- **Vite** - Build tool ultra-rapide
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Lucide React** - Icônes

## 📊 Données de test

L'application contient des données de démonstration :
- **156 transactions** sur 6 mois (juin-novembre 2025)
- **18 catégories** avec hiérarchie
- **3 budgets** configurés
- **2 utilisateurs** de test

## 🐛 Dépannage

### Backend ne démarre pas
```bash
# Vérifier MongoDB
sudo systemctl status mongod

# Vérifier les logs
tail -50 /tmp/backend.log
```

### Frontend affiche page blanche
```bash
# Vérifier que le backend est actif
curl http://localhost:8000/docs

# Vérifier les logs
tail -50 /tmp/frontend.log

# Vider le cache navigateur (Ctrl+Shift+R)
```

### Erreur "Not authenticated"
- Se déconnecter et se reconnecter
- Le token JWT expire après un certain temps

## 🔄 Commandes utiles

```bash
# Arrêter les serveurs
pkill -f "uvicorn app.main:app"
pkill -f "vite"

# Redémarrer MongoDB
sudo systemctl restart mongod

# Vérifier les processus actifs
ps aux | grep -E "uvicorn|vite"

# Accéder à MongoDB
mongosh budget_db
```

## 📝 Notes de version

**Version actuelle** : 1.0.0  
**Dernière mise à jour** : 27 novembre 2025

### Changements récents
- ✅ Ajout du champ merchant aux transactions
- ✅ Support complet des sous-catégories
- ✅ Calculs de budgets incluant sous-catégories
- ✅ Écran de statistiques avec graphiques sur 6 mois
- ✅ Optimisation de la navigation (gap 12px)
- ✅ Affichage amélioré des budgets dépassés

## 👨‍💻 Développement

Développé par **Tony Auge**

Pour toute question ou problème, consultez la documentation dans le dossier `docs/`.

---

## 🎯 Prochaines étapes

- [ ] Tests unitaires automatisés
- [ ] Tests E2E (Cypress/Playwright)
- [ ] Migration vers TypeScript
- [ ] Déploiement en production
- [ ] Application mobile native
- [ ] Export de données (CSV, PDF)
- [ ] Notifications et rappels
- [ ] Objectifs d'épargne

## 📄 Licence

Projet personnel - Tous droits réservés
