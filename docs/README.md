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
│   ├── deploy_test.sh   # Script de déploiement pour le backend
│   ├── requirements.txt # Dépendances Python
│   └── stop_test.sh     # Script d'arrêt pour le backend
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
│   ├── deploy_test.sh   # Script de déploiement pour le frontend
│   └── stop_test.sh     # Script d'arrêt pour le frontend
│
├── logs/                # Fichiers de logs
│   └── deploy_test.log  # Journal de déploiement
│
├── scripts/             # Scripts globaux
│   ├── deploy.sh        # Script de déploiement global
│   └── stop_deploy.sh   # Script d'arrêt global
│
├── shared/              # Ressources partagées entre backend et frontend
│   └── core/            # Configuration commune
│
└── test_data.json       # Données de test pour MongoDB
```

## Démarrage rapide

### Méthode 1 : Déploiement complet (backend + frontend)

Pour déployer l'application complète (backend et frontend), exécutez :

```bash
# Arrêter toute instance précédente
./scripts/stop_deploy.sh

# Démarrer l'application complète (backend et frontend)
./scripts/deploy.sh
```

### Méthode 2 : Déploiement séparé

```bash
# Démarrer le backend
cd backend && ./deploy_test.sh

# Dans un nouveau terminal, démarrer le frontend
cd frontend && ./deploy_test.sh
```

## Documentation supplémentaire

- [Architecture du projet](./ARCHITECTURE.md) - Vue d'ensemble de l'architecture et des décisions techniques
- [Guide de déploiement et débogage](./DEPLOYMENT.md) - Instructions détaillées pour le déploiement et la résolution des problèmes
- [Documentation du frontend](./FRONTEND.md) - Détails sur l'implémentation et l'architecture du frontend
- [Guide de dépannage](./backend_troubleshooting_guide.md) - Solutions aux problèmes courants

## Guide détaillé du déploiement

Pour des instructions détaillées sur le déploiement et le débogage, consultez le [Guide de déploiement et débogage](./DEPLOYMENT.md).

### Déploiement du backend

Le backend est une API FastAPI qui se connecte à une base de données MongoDB.

```bash
cd backend
./deploy_test.sh
```

Ce script effectue les opérations suivantes :
1. Création d'un environnement virtuel Python
2. Installation des dépendances depuis `requirements.txt`
3. Vérification/démarrage de MongoDB
4. Chargement des données de test
5. Démarrage du serveur FastAPI avec uvicorn

Une fois démarré, le backend est accessible à :
- API : http://localhost:8000/api
- Documentation Swagger : http://localhost:8000/docs

#### Informations de connexion pour les tests :
- Email : test@example.com
- Mot de passe : password123

### Déploiement du frontend

Le frontend est une application React Native qui peut être exécutée dans un navigateur web.

```bash
cd frontend
./deploy_test.sh
```

Ce script effectue les opérations suivantes :
1. Installation des dépendances npm
2. Configuration de l'URL du backend
3. Démarrage du serveur de développement

Une fois démarré, le frontend est accessible à :
- http://localhost:19006

## Journal des logs et débogage

### Logs du backend
- Journal principal : `logs/deploy_test.log` et `backend/backend_deploy.log`
- Logs détaillés : `backend/backend_debug.log`

### Logs du frontend
- Journal principal : `frontend/frontend_deploy.log`
- Logs détaillés : `frontend/frontend_debug.log`

## Résolution des problèmes courants

Pour un guide complet de dépannage, consultez [le guide de dépannage](budget_app_troubleshooting_guide.md).

### Problème : "Impossible de se connecter au serveur"
**Symptômes :** Le frontend affiche "Impossible de se connecter au serveur. Veuillez vérifier qu'il est bien démarré."

**Solutions :**
1. Vérifiez que le backend est démarré : `ps aux | grep uvicorn`
2. Vérifiez que MongoDB est démarré : `ps aux | grep mongod`
3. Vérifiez la connectivité avec : `curl http://localhost:8000/api/health`

### Problème : "Impossible de charger les données"
**Symptômes :** Le frontend affiche "Impossible de charger les données. Veuillez réessayer."

**Solutions :**
1. Vérifiez la connexion au backend
2. Vérifiez les logs du backend pour les erreurs
3. Assurez-vous d'être authentifié (le token JWT peut être expiré)

## Arrêt de l'application

Pour arrêter tous les composants de l'application :

```bash
./scripts/stop_deploy.sh
```

Ou pour arrêter les composants individuellement :

```bash
# Arrêter le backend
cd backend && ./stop_test.sh

# Arrêter le frontend
cd frontend && ./stop_test.sh
```

---

Développé par Tony Auge. Pour toute question ou support, consultez la documentation détaillée dans le répertoire `docs/`. 