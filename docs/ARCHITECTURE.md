# Architecture des Scripts de Déploiement

Ce document explique l'architecture et l'organisation des scripts de déploiement du projet Budget.

## Structure des Scripts

Le projet utilise une architecture de scripts organisée de la façon suivante :

```
budget/
├── scripts/               # Répertoire contenant les scripts originaux
│   ├── deploy.sh          # Script de déploiement global (backend + frontend)
│   └── stop_test.sh       # Script d'arrêt global (backend + frontend)
│
├── deploy.sh              # Lien symbolique vers scripts/deploy.sh 
├── stop_test.sh           # Lien symbolique vers scripts/stop_test.sh
│
├── backend/
│   ├── deploy_test.sh     # Script de déploiement spécifique au backend
│   └── stop_test.sh       # Script d'arrêt spécifique au backend
│
└── frontend/
    ├── deploy_test.sh     # Script de déploiement spécifique au frontend
    └── stop_test.sh       # Script d'arrêt spécifique au frontend
```

## Hiérarchie et Fonctionnement

### 1. Scripts Globaux (dans le répertoire `scripts/`)

Ces scripts orchestrent le déploiement et l'arrêt de l'application complète :

- **deploy.sh** : Déploie à la fois le backend et le frontend en séquence, en veillant à ce que le backend soit disponible avant de lancer le frontend. Effectue également des vérifications de santé et configure automatiquement le mode hors-ligne du frontend si le backend ne démarre pas.

- **stop_test.sh** : Arrête tous les composants de l'application (backend et frontend) en identifiant et terminant tous les processus associés.

### 2. Liens Symboliques (à la racine du projet)

Pour faciliter l'utilisation, des liens symboliques sont créés à la racine du projet :

```bash
deploy.sh    → scripts/deploy.sh
stop_test.sh → scripts/stop_test.sh
```

Cela permet d'exécuter les scripts depuis la racine du projet sans avoir à naviguer dans le répertoire `scripts/`.

### 3. Scripts Spécifiques aux Composants

Chaque composant (backend, frontend) possède ses propres scripts de déploiement et d'arrêt :

- **backend/deploy_test.sh** : Configure l'environnement Python, installe les dépendances, prépare la base de données MongoDB et lance le serveur FastAPI.

- **backend/stop_test.sh** : Arrête les processus spécifiques au backend.

- **frontend/deploy_test.sh** : Installe les dépendances npm, configure l'URL du backend et lance le serveur de développement React Native.

- **frontend/stop_test.sh** : Arrête les processus spécifiques au frontend.

## Flux d'Exécution

Le flux d'exécution typique lors du déploiement est le suivant :

1. L'utilisateur exécute `./deploy.sh` depuis la racine du projet
2. Le script global (`scripts/deploy.sh`) est exécuté via le lien symbolique
3. Ce script vérifie si des instances précédentes sont en cours d'exécution et les arrête si nécessaire
4. Il lance `backend/deploy_test.sh` et attend que le backend soit disponible
5. Il lance ensuite `frontend/deploy_test.sh`
6. Il vérifie que tous les composants sont correctement démarrés et fournit un résumé

## Bonnes Pratiques

Pour utiliser correctement ces scripts :

1. **Toujours utiliser les scripts à la racine** pour déployer ou arrêter l'application complète :
   ```bash
   ./deploy.sh     # Pour déployer l'application complète
   ./stop_test.sh  # Pour arrêter l'application complète
   ```

2. **Utiliser les scripts spécifiques** uniquement pour des opérations isolées sur un composant :
   ```bash
   cd backend && ./deploy_test.sh  # Pour déployer uniquement le backend
   cd frontend && ./deploy_test.sh # Pour déployer uniquement le frontend
   ```

3. **Ne pas modifier directement les liens symboliques** à la racine, mais plutôt les scripts sources dans le répertoire `scripts/`.

4. **Consulter les logs** générés par les scripts pour diagnostiquer les problèmes :
   ```bash
   cat logs/deploy_test.log        # Log global de déploiement
   cat backend/deploy_test.log     # Log de déploiement du backend
   cat frontend/deploy_test.log    # Log de déploiement du frontend
   ```

## Maintenance des Scripts

Pour maintenir ou modifier les scripts :

1. Éditer les scripts originaux dans le répertoire `scripts/`
2. Pour les scripts spécifiques, éditer directement ceux dans les répertoires `backend/` et `frontend/`
3. Ne pas oublier de rendre les scripts exécutables après modification : `chmod +x scripts/deploy.sh` 