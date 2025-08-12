# Guide de Déploiement et Débogage

## Introduction

Ce document détaille les procédures de déploiement et de débogage de l'application Budget, qui comprend un backend FastAPI avec MongoDB et un frontend React Native.

## Prérequis

- **Python 3.9+** pour le backend
- **Node.js et npm** pour le frontend
- **MongoDB** pour la base de données
- **curl** pour les tests d'API (optionnel)

## Scripts de Déploiement

L'application dispose de plusieurs scripts de déploiement à différents niveaux :

### Script Principal

Le script principal `scripts/deploy.sh` lance à la fois le backend et le frontend :

```bash
# À la racine du projet
./scripts/deploy.sh
```

Ce script :
- Arrête toute instance précédente via `scripts/stop_deploy.sh`
- Déploie le backend en arrière-plan
- Vérifie la disponibilité du backend
- Déploie le frontend en arrière-plan
- Vérifie la disponibilité du frontend
- Fournit un résumé du déploiement

### Scripts Spécifiques

Si vous préférez déployer les composants séparément :

**Backend uniquement :**
```bash
cd backend && ./deploy_test.sh
```

**Frontend uniquement :**
```bash
cd frontend && ./deploy_test.sh
```

## Fichiers de Logs

Les logs sont essentiels pour le débogage. Voici leur emplacement :

### Logs Principaux

- **Log de déploiement global** : `logs/deploy.log` et `logs/deploy_main.log`
- **Log d'arrêt global** : `logs/stop.log`

### Logs Backend

- **Log de déploiement** : `backend/backend_deploy.log`
- **Log de débogage** : `backend/backend_debug.log`

### Logs Frontend

- **Log de déploiement** : `frontend/frontend_deploy.log`
- **Log de débogage** : `frontend/frontend_debug.log`

## Résolution des Problèmes Courants

### 1. Erreur "Port déjà utilisé"

**Symptôme :** Message d'erreur indiquant que le port 8000 (backend) ou 19006 (frontend) est déjà utilisé.

**Solution :**
```bash
# Arrêter toutes les instances
./scripts/stop_deploy.sh

# Vérifier manuellement si des processus persistent
lsof -i :8000  # Pour le backend
lsof -i :19006  # Pour le frontend

# Tuer les processus restants si nécessaire
kill -9 <PID>
```

### 2. Le Backend Ne Démarre Pas

**Symptôme :** Le script de déploiement s'arrête avec une erreur concernant le backend.

**Solutions :**
1. Vérifiez les logs de débogage :
   ```bash
   cat backend/backend_debug.log
   ```

2. Vérifiez que MongoDB est en cours d'exécution :
   ```bash
   # Sur macOS avec Homebrew
   brew services list | grep mongo
   
   # Démarrer MongoDB si nécessaire
   brew services start mongodb-community
   ```

3. Vérifiez les erreurs Python :
   ```bash
   # Activer l'environnement virtuel
   cd backend && source venv/bin/activate
   
   # Exécuter manuellement l'application avec plus de détails
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### 3. Le Frontend Ne Démarre Pas

**Symptôme :** Le script de déploiement s'arrête avec une erreur concernant le frontend.

**Solutions :**
1. Vérifiez les logs de débogage :
   ```bash
   cat frontend/frontend_debug.log
   ```

2. Vérifiez les modules Node.js :
   ```bash
   cd frontend
   rm -rf node_modules
   npm install
   ```

3. Exécutez manuellement le frontend :
   ```bash
   cd frontend
   npm start -- --web
   ```

### 4. Connexion au backend impossible

**Symptôme :** Le frontend n'arrive pas à se connecter au backend.

**Solution :**
1. Vérifiez que le backend est en cours d'exécution :
   ```bash
   ps aux | grep uvicorn
   ```

2. Testez l'API directement :
   ```bash
   curl http://localhost:8000/api/health
   ```

3. Vérifiez les logs du backend pour identifier des erreurs potentielles :
   ```bash
   cat backend/backend_debug.log
   ```

4. Redémarrez le backend :
   ```bash
   cd backend
   ./stop_test.sh
   ./deploy_test.sh
   ```

## Commandes Utiles

### Vérification des Processus

```bash
# Vérifier les processus backend
ps aux | grep uvicorn

# Vérifier les processus frontend
ps aux | grep "npm start"
ps aux | grep "expo start"

# Vérifier les ports utilisés
lsof -i :8000  # Backend
lsof -i :19006  # Frontend
```

### Nettoyage des Logs

```bash
# Nettoyer tous les logs
rm -f logs/*.log backend/*.log frontend/*.log

# Nettoyer uniquement les logs de débogage
rm -f backend/backend_debug.log frontend/frontend_debug.log
```

### Tests Rapides

```bash
# Tester l'API backend
curl http://localhost:8000/api/health

# Tester le frontend
curl http://localhost:19006
```

## Conclusion

Ce guide devrait vous aider à déployer et déboguer l'application Budget. Si vous rencontrez des problèmes non couverts ici, consultez les logs de débogage qui contiennent des informations détaillées sur les erreurs. 