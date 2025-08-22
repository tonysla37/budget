# Application Budget

## Documentation et Guide de Démarrage

### Vue d'ensemble
Cette application de gestion de budget est composée d'un backend FastAPI connecté à une base de données MongoDB, et d'un frontend React Native. Elle permet aux utilisateurs de gérer leurs transactions financières, de les catégoriser et d'obtenir des statistiques sur leurs dépenses.

### Prérequis
- **Python 3.9+** pour le backend
- **Node.js et npm** pour le frontend
- **MongoDB** pour la base de données
- **curl** pour les tests d'API (optionnel)

### Structure du projet
```
budget/
├── backend/             # Code source du backend (FastAPI)
│   ├── app/             # Application principale
│   │   ├── core/        # Configuration et utilitaires
│   │   ├── db/          # Connexion à la base de données
│   │   ├── models/      # Modèles de données
│   │   ├── routers/     # Points d'entrée API
│   │   ├── schemas/     # Schémas Pydantic
│   │   ├── services/    # Services métier
│   │   └── main.py      # Point d'entrée de l'application
│   ├── tests/           # Tests unitaires et d'intégration
│   ├── requirements.txt # Dépendances Python
│   └── venv/            # Environnement virtuel Python
│
├── docs/                # Documentation du projet
│   ├── README.md        # Documentation principale
│   ├── ARCHITECTURE.md  # Architecture du projet
│   ├── DEPLOYMENT.md    # Guide de déploiement et débogage
│   ├── FRONTEND.md      # Documentation du frontend
│   └── backend_troubleshooting_guide.md # Guide de dépannage
│
├── frontend/            # Code source du frontend (React Native)
│   ├── src/             # Code source principal
│   │   ├── config/      # Configuration de l'API
│   │   ├── screens/     # Écrans de l'application
│   │   └── services/    # Services pour les appels API
│   ├── deploy.sh        # Script de déploiement pour le frontend
│   └── stop_test.sh     # Script d'arrêt pour le frontend
│
├── logs/                # Fichiers de logs
│   ├── test_database.log    # Logs des tests de base de données
│   ├── test_backend.log     # Logs des tests du backend
│   ├── test_frontend.log    # Logs des tests du frontend
│   └── test_all.log         # Logs des tests d'ensemble
│
├── scripts/             # Scripts globaux
│   ├── deploy.sh        # Script de déploiement global
│   ├── stop.sh          # Script d'arrêt global
│   ├── test_all.sh      # Script de test d'ensemble
│   ├── test_backend.sh  # Script de test du backend
│   ├── test_frontend.sh # Script de test du frontend
│   ├── test_database.sh # Script de test de la base de données
│   └── common.sh        # Fonctions communes
│
└── test_data/           # Données de test
    ├── users.yaml       # Utilisateurs de test
    ├── categories.yaml  # Catégories de test
    └── transactions.yaml # Transactions de test
```

## Démarrage rapide

### Méthode 1 : Tests et déploiement complet

Pour tester et déployer l'application complète :

```bash
# Exécuter tous les tests
./scripts/test_all.sh

# Déployer l'application complète
./scripts/deploy.sh
```

### Méthode 2 : Tests individuels

```bash
# Test de la base de données
./scripts/test_database.sh

# Test du backend
./scripts/test_backend.sh

# Test du frontend
./scripts/test_frontend.sh
```

### Méthode 3 : Déploiement séparé

```bash
# Démarrer le backend
cd backend && source venv/bin/activate && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Dans un nouveau terminal, démarrer le frontend
cd frontend && npm start
```

## URLs d'accès

### Backend (FastAPI)
- **Page d'accueil** : http://localhost:8000/
- **Documentation Swagger** : http://localhost:8000/docs
- **Documentation ReDoc** : http://localhost:8000/redoc
- **Health check** : http://localhost:8000/api/health
- **Health check DB** : http://localhost:8000/api/health/db

### Frontend (React Native/Expo)
- **Application web** : http://localhost:19006
- **QR Code Expo** : Affiché dans le terminal lors du démarrage

## Informations de connexion pour les tests
- **Email** : test@example.com
- **Mot de passe** : password123

## Journal des logs et débogage

### Logs des tests
- **Tests de base de données** : `logs/test_database.log`
- **Tests du backend** : `logs/test_backend.log`
- **Tests du frontend** : `logs/test_frontend.log`
- **Tests d'ensemble** : `logs/test_all.log`

### Logs de déploiement
- **Backend** : `backend/deploy_output.log`
- **Frontend** : `frontend/deploy_output.log`

## Arrêt de l'application

Pour arrêter tous les composants de l'application :

```bash
./scripts/stop.sh
```

## Résolution des problèmes courants

### Problème : "Non connecté" dans le frontend
**Symptômes :** Le frontend affiche "Statut du backend: Non connecté"

**Solutions :**
1. Vérifiez que le backend est démarré : `curl http://localhost:8000/api/health`
2. Vérifiez la configuration CORS dans `backend/app/core/config.py`
3. Redémarrez le backend après modification de la config CORS

### Problème : Erreur CORS
**Symptômes :** Erreur "OPTIONS /api/health HTTP/1.1" 400 Bad Request

**Solutions :**
1. Vérifiez que le port 19006 est dans `CORS_ORIGINS`
2. Redémarrez le backend
3. Videz le cache du navigateur

### Problème : MongoDB non accessible
**Symptômes :** Erreur de connexion à la base de données

**Solutions :**
1. Vérifiez que MongoDB est démarré : `sudo systemctl status mongod`
2. Démarrez MongoDB : `sudo systemctl start mongod`
3. Vérifiez la connexion : `mongosh --eval "db.runCommand('ping')"`

---

Développé par Tony Auge. Pour toute question ou support, consultez la documentation détaillée dans le répertoire `docs/`. 