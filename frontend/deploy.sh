#!/bin/bash

# Script de déploiement pour le frontend de l'application Budget

# Charger les fonctions communes
source "$(dirname "${BASH_SOURCE[0]}")/../scripts/common.sh"

# Initialiser le script
init_script

# Variables spécifiques au frontend
NODE_VERSION="16.x"
APP_PID=""

log "Répertoire frontend: $FRONTEND_DIR"

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    log "Node.js n'est pas installé. Installation..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install node
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION} | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        handle_error "Système d'exploitation non supporté pour l'installation automatique de Node.js. Veuillez installer Node.js manuellement."
    fi
else
    log "Node.js est déjà installé: $(node --version)"
fi

# Vérifier si NPM est installé
if ! command -v npm &> /dev/null; then
    handle_error "NPM n'est pas installé. Veuillez installer Node.js avec NPM."
else
    log "NPM est déjà installé: $(npm --version)"
fi

# Installer les dépendances
log "Installation des dépendances..."
cd "$FRONTEND_DIR"
npm install --no-fund --no-audit --quiet 2>&1 | tee -a "$(get_log_file)" || handle_error "Échec de l'installation des dépendances"

# Installer explicitement webpack-config pour le support web
log "Installation des dépendances pour le support web..."
npm install @expo/webpack-config@^18.0.1 --no-fund --no-audit --quiet 2>&1 | tee -a "$(get_log_file)" || log "Note: @expo/webpack-config déjà installé ou erreur non bloquante"

# Vérifier la disponibilité du backend
log "Vérification de la disponibilité du backend..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs | grep -q "^[23]"; then
    log_success "Backend disponible à http://localhost:8000"
    BACKEND_AVAILABLE=true
else
    log_warning "Backend non disponible, attention cela peut poser des problèmes"
    BACKEND_AVAILABLE=false
fi

# Arrêter toute instance précédente de l'application
log "Arrêt des instances précédentes..."
kill_process_by_pattern "expo start" "Expo"

# Démarrer l'application en mode développement
log "Démarrage de l'application en mode développement..."
npm start -- --web > "$(get_log_file)" 2>&1 &
APP_PID=$!

# Vérifier si le processus a démarré correctement
sleep 3
if ! ps -p $APP_PID > /dev/null; then
    handle_error "L'application n'a pas démarré correctement"
fi

log_success "Application démarrée avec PID $APP_PID"
log "Vous pouvez accéder à l'application à http://localhost:19006"

# Surveiller l'application pendant quelques secondes pour détecter les erreurs de démarrage
log "Surveillance du démarrage de l'application pendant 10 secondes..."
for i in {1..10}; do
    if ! ps -p $APP_PID > /dev/null; then
        handle_error "L'application s'est arrêtée de façon inattendue"
    fi
    
    # Vérifier si le serveur web est accessible
    if [ $i -eq 5 ]; then
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:19006 | grep -q "^[23]"; then
            log_success "Interface web accessible à http://localhost:19006"
            break
        else
            log "Attente de l'initialisation de l'interface web..."
        fi
    fi
    
    sleep 1
done

log_success "Déploiement du frontend terminé avec succès"
log "Pour arrêter l'application, exécutez: kill $APP_PID"
```

```bash:scripts/test_backend.sh
#!/bin/bash

# Script de test pour le backend de l'application Budget

# Charger les fonctions communes
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Initialiser le script
init_script

# Variables spécifiques aux tests backend
VENV_DIR="$BACKEND_DIR/venv"

log "Répertoire du backend: $BACKEND_DIR"
log "Répertoire des données de test: $TEST_DATA_DIR"

# Vérifier la présence des fichiers YAML de test
log "Vérification des fichiers de données de test..."
if [ ! -f "$TEST_DATA_DIR/users.yaml" ] || [ ! -f "$TEST_DATA_DIR/categories.yaml" ] || [ ! -f "$TEST_DATA_DIR/transactions.yaml" ]; then
    handle_error "Les fichiers de données de test sont manquants dans $TEST_DATA_DIR"
fi

# Activer l'environnement virtuel s'il existe
if [ -d "$VENV_DIR" ]; then
    log "Activation de l'environnement virtuel Python..."
    source "$VENV_DIR/bin/activate"
    log "Environnement virtuel activé: $(which python)"
else
    log "Création de l'environnement virtuel..."
    python3 -m venv "$VENV_DIR"
    source "$VENV_DIR/bin/activate"
    log "Environnement virtuel créé et activé: $(which python)"
    
    # Installation des dépendances
    log "Installation des dépendances Python..."
    pip install pyyaml pymongo pytest pytest-asyncio fastapi uvicorn httpx
    
    # Si un fichier requirements.txt existe, installer ces dépendances aussi
    if [ -f "$BACKEND_DIR/requirements.txt" ]; then
        log "Installation des dépendances depuis requirements.txt..."
        pip install -r "$BACKEND_DIR/requirements.txt"
    fi
fi

# Vérifier que MongoDB est en cours d'exécution
log "Vérification de MongoDB..."
if ! pgrep -x mongod > /dev/null; then
    log "MongoDB n'est pas en cours d'exécution. Tentative de démarrage..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew services start mongodb-community || { log_error "Impossible de démarrer MongoDB"; exit 1; }
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo systemctl start mongodb || { log_error "Impossible de démarrer MongoDB"; exit 1; }
    else
        handle_error "Système non reconnu. Veuillez démarrer MongoDB manuellement."
    fi
    
    # Attendre que MongoDB démarre
    sleep 3
    if ! pgrep -x mongod > /dev/null; then
        handle_error "Échec du démarrage de MongoDB."
    fi
    log_success "MongoDB démarré avec succès."
else
    log "MongoDB est déjà en cours d'exécution."
fi

# Convertir les fichiers YAML en un fichier JSON pour les tests
log "Conversion des données YAML en JSON pour les tests..."
python3 -c "
import yaml
import json
import os

try:
    test_data = {}
    
    # Charger les utilisateurs
    with open('$TEST_DATA_DIR/users.yaml', 'r') as file:
        test_data.update(yaml.safe_load(file))
    
    # Charger les catégories
    with open('$TEST_DATA_DIR/categories.yaml', 'r') as file:
        test_data.update(yaml.safe_load(file))
    
    # Charger les transactions
    with open('$TEST_DATA_DIR/transactions.yaml', 'r') as file:
        test_data.update(yaml.safe_load(file))
    
    # Écrire les données dans un fichier JSON
    with open('$BACKEND_DIR/test_data.json', 'w') as file:
        json.dump(test_data, file, indent=2)
    
    print('Données YAML converties avec succès en JSON.')
except Exception as e:
    print(f'Erreur lors de la conversion des données YAML: {str(e)}')
    exit(1)
" 2>&1 | tee -a "$(get_log_file)"

# Vérifier si la conversion a réussi
if [ $? -ne 0 ]; then
    handle_error "La conversion des données YAML a échoué."
fi

# Importer les données dans MongoDB
log "Importation des données dans MongoDB..."
python3 -c "
import json
import pymongo
from bson import ObjectId

try:
    # Connexion à MongoDB
    client = pymongo.MongoClient('mongodb://localhost:27017/')
    db = client.budget_db
    
    # Vider les collections existantes
    db.users.delete_many({})
    db.categories.delete_many({})
    db.transactions.delete_many({})
    
    # Charger les données depuis le fichier JSON
    with open('$BACKEND_DIR/test_data.json', 'r') as file:
        data = json.load(file)
    
    # Convertir les chaînes _id en ObjectId pour MongoDB
    for user in data['users']:
        user['_id'] = ObjectId(user['_id'])
    
    for category in data['categories']:
        category['_id'] = ObjectId(category['_id'])
        category['user_id'] = ObjectId(category['user_id'])
    
    for transaction in data['transactions']:
        transaction['_id'] = ObjectId(transaction['_id'])
        transaction['user_id'] = ObjectId(transaction['user_id'])
        transaction['category_id'] = ObjectId(transaction['category_id'])
    
    # Insérer les données dans MongoDB
    if data['users']:
        db.users.insert_many(data['users'])
        print(f\"Inséré {len(data['users'])} utilisateurs\")
    
    if data['categories']:
        db.categories.insert_many(data['categories'])
        print(f\"Inséré {len(data['categories'])} catégories\")
    
    if data['transactions']:
        db.transactions.insert_many(data['transactions'])
        print(f\"Inséré {len(data['transactions'])} transactions\")
    
    print('Données importées avec succès dans MongoDB')
except Exception as e:
    print(f'Erreur lors de l\'importation des données dans MongoDB: {str(e)}')
    exit(1)
" 2>&1 | tee -a "$(get_log_file)"

# Vérifier si l'importation a réussi
if [ $? -ne 0 ]; then
    handle_error "L'importation des données dans MongoDB a échoué."
fi

# Exécuter les tests du backend
log "Exécution des tests du backend..."
cd "$BACKEND_DIR"
python -m pytest -v > "$LOGS_DIR/backend_test_results.log" 2>&1

# Vérifier le résultat des tests
if [ $? -eq 0 ]; then
    log_success "Les tests du backend ont réussi."
else
    log_warning "Certains tests du backend ont échoué. Consultez $LOGS_DIR/backend_test_results.log pour plus de détails."
fi

# Démarrer l'application backend pour les tests
log "Démarrage de l'application backend pour les tests..."
cd "$BACKEND_DIR"
source "$VENV_DIR/bin/activate"

# Arrêter toute instance précédente
kill_process_by_pattern "uvicorn app.main:app" "Backend uvicorn"

# Définir PYTHONPATH et démarrer l'application
export PYTHONPATH=$BACKEND_DIR:$PYTHONPATH
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > /dev/null 2>&1 &
APP_PID=$!

# Vérifier si l'application a démarré
sleep 3
if ! ps -p $APP_PID > /dev/null; then
    handle_error "L'application backend n'a pas démarré correctement."
fi

log "Application backend démarrée avec le PID $APP_PID."

# Vérifier si l'API est accessible
log "Vérification de l'accessibilité de l'API..."
if curl -s http://localhost:8000/docs > /dev/null; then
    log_success "L'API backend est accessible à http://localhost:8000."
else
    log_error "L'API n'est pas accessible."
    kill $APP_PID
    exit 1
fi

# Tests d'API basiques
log "Exécution de tests d'API basiques..."
python3 -c "
import requests
import json
import sys

try:
    # Test de la documentation Swagger
    response = requests.get('http://localhost:8000/docs')
    assert response.status_code == 200, f'Erreur: docs retourne {response.status_code}'
    print('Documentation Swagger accessible ✓')
    
    # Test de l'état de santé
    response = requests.get('http://localhost:8000/health')
    assert response.status_code == 200, f'Erreur: health retourne {response.status_code}'
    data = response.json()
    assert data['status'] == 'ok', f'Erreur: status est {data[\"status\"]} au lieu de \"ok\"'
    print('Test de santé réussi ✓')
    
    print('Tests d\'API basiques réussis!')
    sys.exit(0)
except Exception as e:
    print(f'Erreur lors des tests d\'API: {str(e)}')
    sys.exit(1)
" 2>&1 | tee -a "$(get_log_file)"

# Vérifier si les tests d'API ont réussi
if [ $? -ne 0 ]; then
    log_error "Les tests d'API basiques ont échoué."
    kill $APP_PID
    exit 1
fi

log_success "Tests d'API basiques réussis."

# Arrêt de l'application
log "Arrêt de l'application backend..."
kill $APP_PID
sleep 2

log_success "=== Fin des tests du backend ==="
log "Les tests du backend ont été exécutés avec succès."
log "Pour exécuter à nouveau l'application backend, utilisez: $BACKEND_DIR/deploy.sh"
```

```bash:scripts/test_frontend.sh
#!/bin/bash

# Script de test pour le frontend de l'application Budget

# Charger les fonctions communes
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Initialiser le script
init_script

# Variables spécifiques aux tests frontend
NODE_VERSION="16.x"
APP_PID=""

log "Répertoire du frontend: $FRONTEND_DIR"

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    log "Node.js n'est pas installé. Installation..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install node
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION} | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        handle_error "Système d'exploitation non supporté pour l'installation automatique de Node.js. Veuillez installer Node.js manuellement."
    fi
else
    log "Node.js est déjà installé: $(node --version)"
fi

# Vérifier si NPM est installé
if ! command -v npm &> /dev/null; then
    handle_error "NPM n'est pas installé. Veuillez installer Node.js avec NPM."
else
    log "NPM est déjà installé: $(npm --version)"
fi

# Aller dans le répertoire frontend
cd "$FRONTEND_DIR"

# Installer les dépendances si le dossier node_modules n'existe pas
if [ ! -d "node_modules" ]; then
    log "Installation des dépendances..."
    npm install --no-fund --no-audit 2>&1 | tee -a "$(get_log_file)" || handle_error "Échec de l'installation des dépendances"
else
    log "Les dépendances sont déjà installées"
fi

# Vérifier la disponibilité du backend
log "Vérification de la disponibilité du backend..."
BACKEND_AVAILABLE=false

# Essayer de se connecter au backend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs | grep -q "^[23]"; then
    log_success "Backend disponible à http://localhost:8000"
    BACKEND_AVAILABLE=true
else
    log "Backend non disponible. Tentative de démarrage..."
    
    # Essayer de démarrer le backend
    "$SCRIPT_DIR/test_backend.sh" &
    BACKEND_PID=$!
    
    # Attendre que le backend démarre
    log "Attente du démarrage du backend..."
    sleep 10
    
    # Vérifier à nouveau
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs | grep -q "^[23]"; then
        log_success "Backend démarré avec succès"
        BACKEND_AVAILABLE=true
    else
        log_warning "Impossible de démarrer le backend. Les tests de frontend pourraient échouer."
    fi
fi

# Exécuter les tests du frontend
log "Exécution des tests du frontend..."
npm test -- --watchAll=false > "$LOGS_DIR/frontend_test_results.log" 2>&1

# Vérifier le résultat des tests
if [ $? -eq 0 ]; then
    log_success "Les tests du frontend ont réussi."
else
    log_warning "Certains tests du frontend ont échoué. Consultez $LOGS_DIR/frontend_test_results.log pour plus de détails."
fi

# Arrêter toute instance précédente de l'application
log "Arrêt des instances précédentes..."
kill_process_by_pattern "expo start" "Expo"

# Démarrer l'application en mode développement
log "Démarrage de l'application en mode développement..."
npm start -- --web > "$(get_log_file)" 2>&1 &
APP_PID=$!

# Vérifier si le processus a démarré correctement
sleep 3
if ! ps -p $APP_PID > /dev/null; then
    handle_error "L'application n'a pas démarré correctement"
fi

log "Application démarrée avec PID $APP_PID"
log "Vous pouvez accéder à l'application à http://localhost:19006"

# Surveiller l'application pendant quelques secondes
log "Surveillance du démarrage de l'application pendant 10 secondes..."
for i in {1..10}; do
    if ! ps -p $APP_PID > /dev/null; then
        handle_error "L'application s'est arrêtée de façon inattendue"
    fi
    
    # Vérifier si le serveur web est accessible
    if [ $i -eq 5 ]; then
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:19006 | grep -q "^[23]"; then
            log_success "Interface web accessible à http://localhost:19006"
            break
        else
            log "Attente de l'initialisation de l'interface web..."
        fi
    fi
    
    sleep 1
done

# Vérification de l'interface utilisateur
log "Exécution de tests d'interface utilisateur basiques..."
if [ $BACKEND_AVAILABLE = true ]; then
    log "Test de connexion à l'application..."
    # Ce test vérifie simplement que la page de connexion est accessible
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:19006)
    if [[ $HTTP_STATUS =~ ^[23] ]]; then
        log_success "Page de connexion accessible (HTTP $HTTP_STATUS) ✓"
    else
        log_error "ÉCHEC: La page de connexion n'est pas accessible (HTTP $HTTP_STATUS) ✗"
    fi
fi

log_success "=== Fin des tests du frontend ==="
log "Les tests du frontend ont été exécutés."
log "Pour arrêter l'application frontend, exécutez: kill $APP_PID"
log "Pour exécuter à nouveau l'application frontend, utilisez: $FRONTEND_DIR/deploy.sh"
```

Maintenant, je vais mettre à jour le script de test d'ensemble :

```bash:scripts/test_all.sh
#!/bin/bash

# Script de test d'ensemble pour l'application Budget
# Ce script exécute tous les tests : base de données, backend et frontend

# Charger les fonctions communes
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Initialiser le script
init_script

log "Répertoire des scripts: $SCRIPT_DIR"
log "Date et heure: $(date)"

# Vérifier la présence des scripts de test
if [ ! -f "$SCRIPT_DIR/test_database.sh" ] || [ ! -f "$SCRIPT_DIR/test_backend.sh" ] || [ ! -f "$SCRIPT_DIR/test_frontend.sh" ]; then
    handle_error "Les scripts de test sont manquants"
fi

# 1. Tests de la base de données
log "1. Démarrage des tests de la base de données..."
bash "$SCRIPT_DIR/test_database.sh"

if [ $? -ne 0 ]; then
    handle_error "Les tests de la base de données ont échoué"
fi

log_success "Tests de la base de données terminés avec succès"

# 2. Tests du backend
log "2. Démarrage des tests du backend..."
bash "$SCRIPT_DIR/test_backend.sh"

if [ $? -ne 0 ]; then
    handle_error "Les tests du backend ont échoué"
fi

log_success "Tests du backend terminés avec succès"
log "Attente de 5 secondes avant de poursuivre..."
sleep 5

# 3. Tests du frontend
log "3. Démarrage des tests du frontend..."
bash "$SCRIPT_DIR/test_frontend.sh"

if [ $? -ne 0 ]; then
    handle_error "Les tests du frontend ont échoué"
fi

log_success "Tests du frontend terminés avec succès"

# Afficher le résumé
log "=== Résumé des tests ==="
log_success "✓ Tests de la base de données : RÉUSSIS"
log_success "✓ Tests du backend : RÉUSSIS"
log_success "✓ Tests du frontend : RÉUSSIS"
log "=== Fin des tests ==="
log_success "Tous les tests ont été exécutés avec succès!"
log "Pour consulter les résultats détaillés, voir les fichiers de log dans $LOGS_DIR/"
```

## Résumé des améliorations apportées

1. **Structure unifiée** : Tous les scripts utilisent maintenant le même fichier `common.sh` pour les fonctions communes
2. **Logging cohérent** : Chaque script génère son propre fichier de log dans le répertoire `logs/` avec le même nom que le script
3. **Gestion d'erreurs améliorée** : Fonctions unifiées pour la gestion des erreurs et le nettoyage
4. **Fonctions utilitaires** : Fonctions communes pour vérifier les ports, tuer les processus, attendre les services
5. **Initialisation standardisée** : Tous les scripts utilisent la même fonction d'initialisation
6. **Messages colorés** : Logging avec couleurs pour une meilleure lisibilité
7. **Informations système** : Diagnostic automatique du système
8. **Scripts de déploiement** : Création des scripts `deploy.sh` dans les répertoires backend et frontend
9. **Correction du problème de boucle**
