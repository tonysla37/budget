# Guide de dépannage de l'Application Budget

## Procédure de déploiement et diagnostic

### 1. Préparation de l'environnement

Avant de déployer l'application, assurez-vous que :

1. MongoDB est installé et en cours d'exécution :
   ```bash
   # Vérifier si MongoDB est installé
   mongod --version
   
   # Vérifier si MongoDB est en cours d'exécution
   ps aux | grep mongod
   
   # Démarrer MongoDB si nécessaire (macOS)
   brew services start mongodb-community
   ```

2. Python 3.9+ est installé :
   ```bash
   python3 --version
   ```

3. Node.js et npm sont installés :
   ```bash
   node --version
   npm --version
   ```

### 2. Déploiement avec traçage détaillé

#### Déploiement du backend

```bash
cd budget/backend
./deploy_test.sh
```

Le script `deploy_test.sh` génère des logs détaillés dans `deploy_test.log`. Si le démarrage échoue, consultez ce fichier pour identifier les erreurs.

#### Déploiement du frontend

```bash
cd budget/frontend
./deploy_test.sh
```

Le script `deploy_test.sh` génère des logs dans `deploy_test.log` et `frontend_debug.log`.

### 3. Vérification du bon fonctionnement

Après le déploiement, vérifiez :

1. **Le backend** :
   ```bash
   # Vérifier si le processus uvicorn est en cours d'exécution
   ps aux | grep uvicorn
   
   # Tester la disponibilité de l'API
   curl http://localhost:8000/api/health
   
   # Vérifier la documentation Swagger
   curl -I http://localhost:8000/docs
   ```

2. **Le frontend** :
   ```bash
   # Vérifier si le processus de l'application est en cours d'exécution
   ps aux | grep "expo start"
   
   # Tester la disponibilité de l'interface web
   curl -I http://localhost:19006
   ```

3. **La connectivité entre frontend et backend** :
   ```bash
   # Test CORS du backend
   curl -I -H "Origin: http://localhost:19006" http://localhost:8000/api/health
   ```

### 4. Journalisation et débogage avancé

#### Journaux du backend

Pour une journalisation plus détaillée du backend :

```bash
# Depuis le répertoire backend
cd budget/backend

# Activer l'environnement virtuel
source venv/bin/activate

# Démarrer le backend avec journalisation détaillée
PYTHONPATH=$(pwd) LOG_LEVEL=DEBUG python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Journaux du frontend

Pour une journalisation plus détaillée du frontend :

```bash
# Depuis le répertoire frontend
cd budget/frontend

# Démarrer le frontend avec journalisation détaillée
DEBUG=true npm run web
```

## Problèmes courants et solutions

### 1. Problèmes de démarrage du backend

#### Symptôme : "Le module app.main n'a pas pu être importé"

**Vérification** :
```bash
cd backend
ls -la app
cat app/main.py | head -n 10
```

**Solutions** :
- Vérifier que le fichier `app/main.py` existe
- Vérifier la syntaxe Python du fichier
- Vérifier que `app/__init__.py` existe
- Corriger la variable d'environnement PYTHONPATH : `export PYTHONPATH=$(pwd)`

#### Symptôme : "Impossible de se connecter à MongoDB"

**Vérification** :
```bash
# Vérifier si MongoDB est en cours d'exécution
ps aux | grep mongod

# Tester la connexion à MongoDB
mongo --eval "db.version()"
```

**Solutions** :
- Démarrer MongoDB : `brew services start mongodb-community` (macOS)
- Vérifier la configuration de connexion dans `app/core/config.py`

### 2. Problèmes de démarrage du frontend

#### Symptôme : "Error: Cannot find module 'react-native'"

**Solutions** :
- Réinstaller les dépendances : `npm install`
- Effacer le cache npm : `npm cache clean --force`
- Vérifier la version de Node.js (recommandé : v14+)

#### Symptôme : "Error: Unable to resolve module @react-navigation/native"

**Solutions** :
- Installer les dépendances manquantes : `npm install @react-navigation/native`
- Redémarrer le bundler Metro : `npm start -- --reset-cache`

### 3. Problèmes d'authentification

#### Symptôme : "Email ou mot de passe incorrect"

**Solutions** :
- Vérifier les identifiants : email=`test@example.com`, mot de passe=`password123`
- Réinitialiser les données de test : supprimer la base de données MongoDB et redémarrer le backend

#### Symptôme : "Token JWT expiré ou invalide"

**Solutions** :
- Se reconnecter pour obtenir un nouveau token
- Vérifier la date/heure du système (le JWT utilise l'heure système)
- Augmenter la durée de validité du token dans `app/services/auth.py`

### 4. Problèmes de connectivité

#### Symptôme : "Impossible de se connecter au serveur"

**Vérification** :
```bash
# Ping le serveur backend
ping localhost

# Tester la connexion réseau au port du backend
nc -vz localhost 8000

# Vérifier les paramètres CORS dans le backend
curl -I -H "Origin: http://localhost:19006" http://localhost:8000/api/health
```

**Solutions** :
1. Si le backend n'est pas accessible :
   - Vérifier que le serveur backend est en cours d'exécution
   - Vérifier que le port 8000 est disponible : `lsof -i :8000`

2. Si le problème est lié au CORS :
   - Vérifier les paramètres CORS dans `app/main.py`

3. Si tout échoue, activer le mode hors-ligne :
   ```javascript
   // Modifier frontend/src/config/api.config.js
   export const DEBUG_IGNORE_BACKEND_FAILURE = true;
   ```

### 5. Mode de débogage avancé

Pour un débogage approfondi :

#### Backend (FastAPI)

```bash
cd backend
source venv/bin/activate
PYTHONPATH=$(pwd) LOG_LEVEL=DEBUG python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 2>&1 | tee backend_debug.log
```

#### Frontend (React Native)

```bash
cd frontend
EXPO_DEBUG=true npm run web -- --verbose 2>&1 | tee frontend_verbose.log
```

### 6. Capture des journaux et rapport d'erreurs

Pour collecter des informations complètes sur un problème :

```bash
# Créer un dossier pour les logs
mkdir -p ~/budget_app_logs

# Collecter les informations système
echo "=== Informations système ===" > ~/budget_app_logs/system_info.log
date >> ~/budget_app_logs/system_info.log
uname -a >> ~/budget_app_logs/system_info.log
python3 --version >> ~/budget_app_logs/system_info.log
node --version >> ~/budget_app_logs/system_info.log
npm --version >> ~/budget_app_logs/system_info.log
mongod --version >> ~/budget_app_logs/system_info.log

# Copier les logs existants
cp backend/deploy_test.log ~/budget_app_logs/
cp frontend/deploy_test.log ~/budget_app_logs/
cp frontend/frontend_debug.log ~/budget_app_logs/

# Créer une archive
cd ~
tar -czf budget_app_debug_logs.tar.gz budget_app_logs/
```

---

## Procédure de sauvegarde et restauration

### Sauvegarde de la base de données

```bash
# Sauvegarde de la base de données
mongodump --db budget_db --out ~/mongodb_backup

# Restauration de la base de données
mongorestore --db budget_db ~/mongodb_backup/budget_db
```

### Procédure de réinitialisation complète

Si vous souhaitez réinitialiser complètement l'application :

```bash
# Arrêter tous les processus
cd budget
./stop_test.sh

# Supprimer les fichiers temporaires et caches
rm -rf backend/venv
rm -rf frontend/node_modules
rm frontend/.expo

# Réinitialiser la base de données
mongo budget_db --eval "db.dropDatabase()"

# Redémarrer proprement
cd backend && ./deploy_test.sh
cd ../frontend && ./deploy_test.sh
```

---

Pour toute assistance supplémentaire, veuillez consulter la documentation officielle ou contacter le support technique. 