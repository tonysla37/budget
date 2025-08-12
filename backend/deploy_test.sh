#!/bin/bash

# Script de déploiement pour tester l'application Budget

# Variables
APP_NAME="budget-app"
BACKEND_DIR="$(pwd)"
VENV_DIR="$BACKEND_DIR/venv"
LOG_FILE="$BACKEND_DIR/backend_deploy.log"
DEBUG_LOG="$BACKEND_DIR/backend_debug.log"
APP_PID=""

# Fonction pour le logging
log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" | tee -a "$LOG_FILE"
    echo "[$timestamp] $1" >> "$DEBUG_LOG"
}

# Fonction de débogage plus détaillée
debug_log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [DEBUG] $1" >> "$DEBUG_LOG"
}

# Fonction pour vérifier les erreurs après chaque commande
check_error() {
    if [ $? -ne 0 ]; then
        log "ERREUR: La commande précédente a échoué avec le code $?"
        debug_log "Échec de la commande: $1"
        if [ -n "$2" ]; then
            handle_error "$2"
        fi
    else
        debug_log "Succès de la commande: $1"
    fi
}

# Fonction pour afficher des informations de diagnostic système
log_system_info() {
    debug_log "------- INFORMATIONS SYSTÈME -------"
    debug_log "OS: $(uname -a)"
    debug_log "Python: $(python3 --version 2>&1)"
    debug_log "Espace disque: $(df -h | grep disk1s1)"
    debug_log "Mémoire: $(vm_stat | grep 'Pages free')"
    
    # Vérifier MongoDB
    if command -v mongod &> /dev/null; then
        debug_log "MongoDB: $(mongod --version | head -n 1)"
        debug_log "MongoDB status: $(if pgrep -x mongod > /dev/null; then echo "running"; else echo "not running"; fi)"
    else
        debug_log "MongoDB: non installé ou non trouvé dans le PATH"
    fi
    
    debug_log "----------------------------------"
}

# Fonction pour gérer les erreurs et terminer proprement
handle_error() {
    log "ERREUR: $1"
    debug_log "ERREUR FATALE: $1"
    log_system_info
    
    if [ ! -z "$APP_PID" ] && ps -p $APP_PID > /dev/null; then
        log "Arrêt du processus de l'application (PID: $APP_PID)..."
        kill $APP_PID
        sleep 2
        if ps -p $APP_PID > /dev/null; then
            log "Le processus ne répond pas, utilisation de kill -9..."
            kill -9 $APP_PID
        fi
    fi
    
    # Recherche et arrêt de tous les processus uvicorn liés à notre application
    UVICORN_PIDS=$(pgrep -f "uvicorn app.main:app")
    if [ ! -z "$UVICORN_PIDS" ]; then
        log "Arrêt de tous les processus uvicorn liés à l'application: $UVICORN_PIDS"
        echo $UVICORN_PIDS | xargs kill
        sleep 2
        # Vérifier si des processus persistent et les forcer à s'arrêter
        REMAINING_PIDS=$(pgrep -f "uvicorn app.main:app")
        if [ ! -z "$REMAINING_PIDS" ]; then
            log "Forçage de l'arrêt des processus restants: $REMAINING_PIDS"
            echo $REMAINING_PIDS | xargs kill -9
        fi
    fi
    
    log "Déploiement échoué. Consultez les fichiers log pour plus de détails:"
    log "- Log principal: $LOG_FILE"
    log "- Log de débogage: $DEBUG_LOG"
    exit 1
}

# Capture des signaux pour nettoyer proprement
trap 'handle_error "Signal d'\''interruption reçu"' INT TERM

# Créer le répertoire pour les logs si nécessaire et purger les fichiers de log
mkdir -p "$(dirname "$LOG_FILE")"
> "$LOG_FILE"  # Purge du fichier de log principal
> "$DEBUG_LOG"  # Purge du fichier de log de débogage

log "=== Démarrage du déploiement de test pour $APP_NAME ==="
debug_log "Démarrage du script de déploiement"
log_system_info

# Vérifier la structure du projet
debug_log "Vérification de la structure du projet"
debug_log "BACKEND_DIR: $BACKEND_DIR"
debug_log "Contenu du répertoire backend:"
ls -la "$BACKEND_DIR" >> "$DEBUG_LOG" 2>&1
debug_log "Contenu du répertoire app:"
ls -la "$BACKEND_DIR/app" >> "$DEBUG_LOG" 2>&1 || debug_log "Répertoire app introuvable"

# Vérifier si MongoDB est installé
if ! command -v mongod &> /dev/null; then
    log "MongoDB n'est pas installé. Installation..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew tap mongodb/brew
        brew install mongodb-community
        brew services start mongodb-community
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt-get update
        sudo apt-get install -y mongodb
        sudo systemctl start mongodb
    else
        handle_error "Système d'exploitation non supporté pour l'installation automatique de MongoDB. Veuillez installer MongoDB manuellement: https://docs.mongodb.com/manual/installation/"
    fi
else
    log "MongoDB est déjà installé"
fi

# Création d'un environnement virtuel Python
log "Création de l'environnement virtuel..."
if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR" || handle_error "Impossible de créer l'environnement virtuel"
fi

# Activer l'environnement virtuel
source "$VENV_DIR/bin/activate" || handle_error "Impossible d'activer l'environnement virtuel"
log "Environnement virtuel activé: $(which python)"

# Mettre à jour pip sans utiliser --upgrade qui peut causer des erreurs
log "Mise à jour de pip..."
pip install pip --no-deps --force-reinstall 2>&1 | tee -a "$LOG_FILE" || handle_error "Échec de la mise à jour de pip"

# Installer les dépendances explicitement
log "Installation des dépendances..."
pip install fastapi uvicorn pytest pymongo motor passlib python-jose pydantic[email] python-multipart sqlalchemy httpx python-dotenv pydantic-settings pytest-asyncio bcrypt cryptography psutil 2>&1 | tee -a "$LOG_FILE" || handle_error "Échec de l'installation des dépendances"

# Si un fichier requirements.txt existe, installer ces dépendances aussi
if [ -f "$BACKEND_DIR/requirements.txt" ]; then
    log "Installation des dépendances depuis requirements.txt..."
    pip install -r "$BACKEND_DIR/requirements.txt" 2>&1 | tee -a "$LOG_FILE" || handle_error "Échec de l'installation des dépendances depuis requirements.txt"
fi

# Vérifier l'installation des modules clés
log "Vérification des modules installés..."
python -c "import fastapi; import pytest; import uvicorn; import pymongo; import motor; import passlib; import jose; import pydantic; import dotenv; print('Modules installés avec succès!')" 2>&1 | tee -a "$LOG_FILE" || handle_error "Impossible d'importer les modules requis"

# Ajouter le répertoire backend au PYTHONPATH
export PYTHONPATH=$BACKEND_DIR:$PYTHONPATH
log "PYTHONPATH configuré: $PYTHONPATH"

# Exécuter les tests
log "Exécution des tests..."
python -m pytest -v 2>&1 | tee -a "$LOG_FILE"
if [ ${PIPESTATUS[0]} -ne 0 ]; then
    log "ATTENTION: Les tests ont échoué. Vérifiez les erreurs dans le log."
    # Continuer malgré l'échec des tests
fi

# Générer des données de test si le fichier n'existe pas
if [ ! -f "$BACKEND_DIR/test_data.json" ]; then
    log "Chargement des données de test..."
    python -c "
import json
import os
import traceback
from datetime import datetime, timedelta, UTC
from bson import ObjectId

try:
    # Créer un répertoire pour les données de test si nécessaire
    os.makedirs('data', exist_ok=True)
    
    # Générer un ID utilisateur unique
    user_id = str(ObjectId())
    
    # Créer les données de test
    test_data = {
        'users': [
            {
                '_id': user_id,
                'email': 'test@example.com',
                'hashed_password': '$2b$12$WUMmXriOidJLmjUkDRcMVexmchCN91gsDRot3EXFRkLsM1uG/tBBq',  # password123
                'first_name': 'Test',
                'last_name': 'User',
                'is_active': True,
                'created_at': datetime.now(UTC).isoformat()
            }
        ],
        'categories': [
            {
                '_id': str(ObjectId()),
                'name': 'Alimentation',
                'color': '#4CAF50',
                'icon': 'restaurant',
                'user_id': user_id,
                'created_at': datetime.now(UTC).isoformat()
            },
            {
                '_id': str(ObjectId()),
                'name': 'Transport',
                'color': '#2196F3',
                'icon': 'directions_car',
                'user_id': user_id,
                'created_at': datetime.now(UTC).isoformat()
            },
            {
                '_id': str(ObjectId()),
                'name': 'Loisirs',
                'color': '#FF9800',
                'icon': 'sports_esports',
                'user_id': user_id,
                'created_at': datetime.now(UTC).isoformat()
            },
            {
                '_id': str(ObjectId()),
                'name': 'Salaire',
                'color': '#4CAF50',
                'icon': 'payments',
                'user_id': user_id,
                'created_at': datetime.now(UTC).isoformat()
            }
        ],
        'transactions': []
    }
    
    # Créer un dictionnaire pour un accès facile aux catégories par nom
    categories = {cat['name']: cat['_id'] for cat in test_data['categories']}
    
    # Générer des transactions pour le mois en cours
    # Utiliser datetime.now(UTC) au lieu de datetime.utcnow()
    now = datetime.now(UTC)
    current_month = now.replace(day=15)
    prev_month = (current_month - timedelta(days=30)).replace(day=15)
    
    for i in range(1, 6):
        day = min(i * 5, 28)
        date = current_month.replace(day=day)
        if i == 1:
            # Salaire
            test_data['transactions'].append({
                '_id': str(ObjectId()),
                'user_id': user_id,
                'date': date.isoformat(),
                'amount': 2500.0,
                'description': 'Salaire',
                'merchant': 'Entreprise XYZ',
                'is_expense': False,
                'category_id': categories['Salaire'],
                'created_at': date.isoformat()
            })
        else:
            # Dépenses
            explanations = [
                'Courses hebdomadaires',
                'Billet de train Paris-Lyon',
                'Sortie restaurant avec amis',
                'Essence pour la voiture'
            ]
            amounts = [-85.30, -42.50, -65.90, -35.20]
            merchants = ['Carrefour', 'SNCF', 'Restaurant Le Gourmet', 'Total']
            cats = ['Alimentation', 'Transport', 'Loisirs', 'Transport']
            
            idx = (i - 2) % len(explanations)
            test_data['transactions'].append({
                '_id': str(ObjectId()),
                'user_id': user_id,
                'date': date.isoformat(),
                'amount': amounts[idx],
                'description': merchants[idx],
                'merchant': merchants[idx],
                'explanation': explanations[idx],
                'is_expense': True,
                'category_id': categories[cats[idx]],
                'created_at': date.isoformat()
            })
    
    # Générer des transactions pour le mois précédent
    for i in range(1, 6):
        day = min(i * 5, 28)
        date = prev_month.replace(day=day)
        if i == 1:
            # Salaire
            test_data['transactions'].append({
                '_id': str(ObjectId()),
                'user_id': user_id,
                'date': date.isoformat(),
                'amount': 2500.0,
                'description': 'Salaire',
                'merchant': 'Entreprise XYZ',
                'is_expense': False,
                'category_id': categories['Salaire'],
                'created_at': date.isoformat()
            })
        else:
            # Dépenses
            explanations = [
                'Courses mensuelles',
                'Abonnement transport',
                'Cinéma',
                'Carburant'
            ]
            amounts = [-120.45, -75.00, -28.50, -45.80]
            merchants = ['Auchan', 'Navigo', 'UGC Ciné', 'Shell']
            cats = ['Alimentation', 'Transport', 'Loisirs', 'Transport']
            
            idx = (i - 2) % len(explanations)
            test_data['transactions'].append({
                '_id': str(ObjectId()),
                'user_id': user_id,
                'date': date.isoformat(),
                'amount': amounts[idx],
                'description': merchants[idx],
                'merchant': merchants[idx],
                'explanation': explanations[idx],
                'is_expense': True,
                'category_id': categories[cats[idx]],
                'created_at': date.isoformat()
            })
    
    # Écrire les données dans un fichier JSON pour une utilisation ultérieure
    with open('test_data.json', 'w') as f:
        json.dump(test_data, f, indent=2)
    
    print('Données de test générées avec succès et enregistrées dans test_data.json!')
    print('Utilisateur test: email=test@example.com, mot de passe=password123')
    print(f\"Nombre de transactions créées: {len(test_data['transactions'])}\")
    
except Exception as e:
    print(f'Erreur lors de la génération des données de test: {str(e)}')
    print('Traceback complet:')
    traceback.print_exc()
" 2>&1 | tee -a "$LOG_FILE"
if [ ${PIPESTATUS[0]} -ne 0 ]; then
    log "ATTENTION: Génération des données de test échouée."
    # Continuer malgré l'échec
fi
fi

# Charger les données de test dans MongoDB
log "Chargement des données de test dans MongoDB..."
python -c "
import json
from pymongo import MongoClient
from bson import ObjectId

try:
    # Connexion à MongoDB
    client = MongoClient('mongodb://localhost:27017')
    db = client.budget_db
    
    # Vider les collections existantes
    db.users.delete_many({})
    db.categories.delete_many({})
    db.transactions.delete_many({})
    
    # Charger les données depuis le fichier test_data.json
    with open('test_data.json', 'r') as f:
        test_data = json.load(f)
    
    # Convertir les chaînes _id en ObjectId pour MongoDB
    for user in test_data['users']:
        user['_id'] = ObjectId(user['_id'])
    
    for category in test_data['categories']:
        category['_id'] = ObjectId(category['_id'])
        category['user_id'] = ObjectId(category['user_id'])
    
    for transaction in test_data['transactions']:
        transaction['_id'] = ObjectId(transaction['_id'])
        transaction['user_id'] = ObjectId(transaction['user_id'])
        transaction['category_id'] = ObjectId(transaction['category_id'])
    
    # Insérer les données dans MongoDB
    if test_data['users']:
        db.users.insert_many(test_data['users'])
        print(f\"Inséré {len(test_data['users'])} utilisateurs\")
    
    if test_data['categories']:
        db.categories.insert_many(test_data['categories'])
        print(f\"Inséré {len(test_data['categories'])} catégories\")
    
    if test_data['transactions']:
        db.transactions.insert_many(test_data['transactions'])
        print(f\"Inséré {len(test_data['transactions'])} transactions\")
    
    print('Données de test chargées avec succès dans MongoDB')
except Exception as e:
    print(f'Erreur lors du chargement des données de test dans MongoDB: {str(e)}')
" 2>&1 | tee -a "$LOG_FILE"

# Arrêter toute instance précédente de l'application
log "Arrêt des instances précédentes..."
UVICORN_PIDS=$(pgrep -f "uvicorn app.main:app")
if [ ! -z "$UVICORN_PIDS" ]; then
    log "Processus uvicorn trouvés: $UVICORN_PIDS"
    echo $UVICORN_PIDS | xargs kill
    sleep 2
    # Vérifier si des processus persistent et les forcer à s'arrêter
    REMAINING_PIDS=$(pgrep -f "uvicorn app.main:app")
    if [ ! -z "$REMAINING_PIDS" ]; then
        log "Forçage de l'arrêt des processus restants: $REMAINING_PIDS"
        echo $REMAINING_PIDS | xargs kill -9
    fi
else
    log "Aucune instance précédente trouvée"
fi

# Vérifier si uvicorn est disponible
if command -v uvicorn &> /dev/null; then
    # Démarrer l'application avec capture des logs
    log "Démarrage de l'application..."
    
    # Démarrer uvicorn avec PYTHONPATH correct
    cd "$BACKEND_DIR"
    
    # Affichage du répertoire courant pour debug
    log "Répertoire courant: $(pwd)"
    log "Contenu du répertoire courant: $(ls -la)"
    log "Contenu du répertoire app: $(ls -la app)"
    log "Contenu du répertoire app/main.py: $(cat app/main.py | head -n 20)"
    log "PYTHONPATH avant lancement: $PYTHONPATH"
    
    # Créer un fichier d'initialisation si nécessaire
    if [ ! -f "app/__init__.py" ]; then
        log "Création du fichier app/__init__.py pour assurer la détection du package Python"
        echo "# Package app - Ce fichier est nécessaire pour que Python reconnaisse le répertoire comme un package" > app/__init__.py
    fi
    
    # Utiliser python -m uvicorn au lieu de la commande directe
    PYTHONPATH=$BACKEND_DIR:$PYTHONPATH python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > >(tee -a "$LOG_FILE") 2> >(tee -a "$LOG_FILE" >&2) &
    APP_PID=$!
    
    log "Uvicorn démarré avec PID $APP_PID et PYTHONPATH=$PYTHONPATH"
    
    # Vérifier si le processus a démarré correctement
    sleep 3
    if ! ps -p $APP_PID > /dev/null; then
        handle_error "L'application n'a pas démarré correctement"
    fi
    
    log "Application démarrée avec PID $APP_PID"
    log "Vous pouvez accéder à l'API à http://localhost:8000"
    log "Documentation Swagger disponible à http://localhost:8000/docs"
    
    # Surveiller l'application pendant quelques secondes pour détecter les erreurs de démarrage
    log "Surveillance du démarrage de l'application pendant 5 secondes..."
    for i in {1..5}; do
        if ! ps -p $APP_PID > /dev/null; then
            handle_error "L'application s'est arrêtée de façon inattendue"
        fi
        sleep 1
    done
    
    # Vérifier si l'application répond
    log "Vérification de la réponse de l'API..."
    curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs 2>&1 | tee -a "$LOG_FILE"
    if [ $? -ne 0 ]; then
        log "ATTENTION: L'API ne répond pas correctement, mais le processus est en cours d'exécution"
    else
        log "L'API répond correctement"
    fi
    
    log "Pour arrêter l'application manuellement, exécutez: kill $APP_PID"
    
    # Vérifier si le script stop_test.sh existe déjà
    if [ ! -f "stop_test.sh" ]; then
        log "Le fichier stop_test.sh n'existe pas, création..."
        # Créer un fichier pour arrêter facilement l'application
        cat > stop_test.sh << 'EOF'
#!/bin/bash
# Script d'arrêt de l'application de test

# Définir le chemin du fichier de log
LOG_FILE="/Users/tonyauge/Library/Mobile Documents/com~apple~CloudDocs/Code/budget/backend/deploy_test.log"

# Fonction pour obtenir la date et l'heure actuelles
get_timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# Fonction pour logger les messages
log_message() {
    local timestamp=$(get_timestamp)
    echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

# Arrêt de l'application
log_message "Arrêt de l'application..."

# Recherche des processus uvicorn
UVICORN_PIDS=$(pgrep -f "uvicorn app.main:app")
if [ ! -z "$UVICORN_PIDS" ]; then
    log_message "Processus trouvés: $UVICORN_PIDS"
    echo $UVICORN_PIDS | xargs kill
    sleep 2
    
    # Vérifier si des processus persistent
    REMAINING_PIDS=$(pgrep -f "uvicorn app.main:app")
    if [ ! -z "$REMAINING_PIDS" ]; then
        log_message "Forçage de l'arrêt des processus restants: $REMAINING_PIDS"
        echo $REMAINING_PIDS | xargs kill -9
    fi
    
    log_message "Application arrêtée avec succès"
    
    # Supprimer le fichier de log si l'application s'est arrêtée correctement
    if [ -f "$LOG_FILE" ]; then
        log_message "Suppression du fichier de log"
        rm "$LOG_FILE"
    fi
else
    log_message "Aucun processus d'application trouvé"
fi
EOF
        chmod +x stop_test.sh
        log "Fichier stop_test.sh créé pour arrêter l'application"
    else
        log "Le fichier stop_test.sh existe déjà, pas de modification"
    fi
    
    log "Déploiement de test terminé avec succès"
else
    handle_error "uvicorn n'est pas installé. Impossible de démarrer l'application."
fi 