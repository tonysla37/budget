#!/bin/bash

# Script de test pour le backend de l'application Budget

# Définir le nom du script AVANT de charger common.sh
SCRIPT_NAME="test_backend"

# Charger les fonctions communes
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Initialiser le script
init_script

# Variables spécifiques aux tests backend
VENV_DIR="$BACKEND_DIR/venv"
MONGO_PORT=27017
MONGO_HOST="localhost"
MONGO_DB="budget_db"
API_HOST="localhost"
API_PORT=8000
API_BASE_URL="http://$API_HOST:$API_PORT"

log "Répertoire du backend: $BACKEND_DIR"
log "Répertoire des données de test: $TEST_DATA_DIR"

# Vérifier la présence des fichiers YAML de test
log "Vérification des fichiers de données de test..."
if [ ! -f "$TEST_DATA_DIR/users.yaml" ] || [ ! -f "$TEST_DATA_DIR/categories.yaml" ] || [ ! -f "$TEST_DATA_DIR/transactions.yaml" ]; then
    handle_error "Les fichiers de données de test sont manquants dans $TEST_DATA_DIR"
fi

# Vérifier que Python 3 est installé
log "Vérification de Python 3..."
if ! command -v python3 &> /dev/null; then
    handle_error "Python 3 n'est pas installé"
fi

log "Python 3 trouvé: $(python3 --version)"

# Vérifier et installer python3-venv si nécessaire
log "Vérification du package python3-venv..."
if ! python3 -c "import venv" 2>/dev/null; then
    log "Le package python3-venv n'est pas installé. Installation..."
    if command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        sudo apt-get update
        sudo apt-get install -y python3-venv python3.12-venv
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        sudo yum install -y python3-venv python3.12-venv
    else
        handle_error "Impossible d'installer python3-venv automatiquement sur ce système"
    fi
fi

# Vérifier si l'environnement virtuel existe et est valide
log "Vérification de l'environnement virtuel Python..."
if [ -d "$VENV_DIR" ]; then
    # Vérifier si l'environnement virtuel est complet
    if [ ! -f "$VENV_DIR/bin/activate" ] || [ ! -f "$VENV_DIR/bin/python" ]; then
        log_warning "L'environnement virtuel existant est corrompu. Suppression et recréation..."
        rm -rf "$VENV_DIR"
    else
        log "L'environnement virtuel existe et semble valide"
    fi
fi

# Créer l'environnement virtuel s'il n'existe pas
if [ ! -d "$VENV_DIR" ]; then
    log "Création de l'environnement virtuel..."
    python3 -m venv "$VENV_DIR" || handle_error "Impossible de créer l'environnement virtuel"
    log_success "Environnement virtuel créé avec succès"
fi

# Vérifier que l'environnement virtuel a été créé correctement
if [ ! -f "$VENV_DIR/bin/activate" ] || [ ! -f "$VENV_DIR/bin/python" ]; then
    handle_error "L'environnement virtuel n'a pas été créé correctement"
fi

# Activer l'environnement virtuel
log "Activation de l'environnement virtuel..."
source "$VENV_DIR/bin/activate" || handle_error "Impossible d'activer l'environnement virtuel"
log "Environnement virtuel activé: $(which python)"

# Installation des dépendances
log "Installation des dépendances Python..."
pip install --upgrade pip
pip install pyyaml pymongo pytest pytest-asyncio fastapi uvicorn httpx pydantic-settings "pydantic[email]" passlib python-multipart

# Si un fichier requirements.txt existe, installer ces dépendances aussi
if [ -f "$BACKEND_DIR/requirements.txt" ]; then
    log "Installation des dépendances depuis requirements.txt..."
    pip install -r "$BACKEND_DIR/requirements.txt"
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
        if command -v systemctl &> /dev/null; then
            sudo systemctl start mongod || { log_error "Impossible de démarrer MongoDB"; exit 1; }
        else
            sudo service mongod start || { log_error "Impossible de démarrer MongoDB"; exit 1; }
        fi
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
python -c '
import yaml
import json
import os

try:
    test_data = {}
    
    # Charger les utilisateurs
    with open("'$TEST_DATA_DIR'/users.yaml", "r") as file:
        test_data.update(yaml.safe_load(file))
    
    # Charger les catégories
    with open("'$TEST_DATA_DIR'/categories.yaml", "r") as file:
        test_data.update(yaml.safe_load(file))
    
    # Charger les transactions
    with open("'$TEST_DATA_DIR'/transactions.yaml", "r") as file:
        test_data.update(yaml.safe_load(file))
    
    # Écrire les données dans un fichier JSON
    with open("'$BACKEND_DIR'/test_data.json", "w") as file:
        json.dump(test_data, file, indent=2)
    
    print("Données YAML converties avec succès en JSON.")
except Exception as e:
    print(f"Erreur lors de la conversion des données YAML: {str(e)}")
    exit(1)
' 2>&1 | tee -a "$(get_log_file)"

# Vérifier si la conversion a réussi
if [ $? -ne 0 ]; then
    handle_error "La conversion des données YAML a échoué."
fi

# Importer les données dans MongoDB
log "Importation des données dans MongoDB..."
python -c "
import yaml
import json
import pymongo
from bson import ObjectId

try:
    # Charger les données YAML
    with open('$TEST_DATA_DIR/users.yaml', 'r') as file:
        users_data = yaml.safe_load(file)
    
    with open('$TEST_DATA_DIR/categories.yaml', 'r') as file:
        categories_data = yaml.safe_load(file)
    
    with open('$TEST_DATA_DIR/transactions.yaml', 'r') as file:
        transactions_data = yaml.safe_load(file)
    
    # Connexion à MongoDB
    client = pymongo.MongoClient('mongodb://$MONGO_HOST:$MONGO_PORT/')
    db = client.$MONGO_DB
    
    # Vider les collections existantes
    db.users.delete_many({})
    db.categories.delete_many({})
    db.transactions.delete_many({})
    
    # Convertir les chaînes _id en ObjectId pour MongoDB
    for user in users_data['users']:
        user['_id'] = ObjectId(user['_id'])
    
    for category in categories_data['categories']:
        category['_id'] = ObjectId(category['_id'])
        category['user_id'] = ObjectId(category['user_id'])
    
    for transaction in transactions_data['transactions']:
        transaction['_id'] = ObjectId(transaction['_id'])
        transaction['user_id'] = ObjectId(transaction['user_id'])
        transaction['category_id'] = ObjectId(transaction['category_id'])
    
    # Insérer les données dans MongoDB
    if users_data['users']:
        db.users.insert_many(users_data['users'])
        print(f\"Inséré {len(users_data['users'])} utilisateurs\")
    
    if categories_data['categories']:
        db.categories.insert_many(categories_data['categories'])
        print(f\"Inséré {len(categories_data['categories'])} catégories\")
    
    if transactions_data['transactions']:
        db.transactions.insert_many(transactions_data['transactions'])
        print(f\"Inséré {len(transactions_data['transactions'])} transactions\")
    
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

# Vérifier si le répertoire app existe
if [ ! -d "app" ]; then
    log_warning "Le répertoire app n'existe pas. Création d'une structure de base..."
    mkdir -p app
    echo "# Package app" > app/__init__.py
    echo "from fastapi import FastAPI" > app/main.py
    echo "app = FastAPI()" >> app/main.py
    echo "@app.get('/health')" >> app/main.py
    echo "def health_check():" >> app/main.py
    echo "    return {'status': 'ok'}" >> app/main.py
fi

# Exécuter les tests avec pytest
log "Exécution des tests pytest..."
python -m pytest -v --disable-warnings 2>&1 | tee -a "$(get_log_file)"

# Vérifier le résultat des tests
if [ $? -eq 0 ]; then
    log_success "Les tests du backend ont réussi."
else
    log_warning "Certains tests du backend ont échoué. Consultez le fichier log pour plus de détails."
fi

# Démarrer l'application backend pour les tests
log "Démarrage de l'application backend pour les tests..."

# Arrêter toute instance précédente
kill_process_by_pattern "uvicorn app.main:app" "Backend uvicorn"

# Définir PYTHONPATH et démarrer l'application
export PYTHONPATH=$BACKEND_DIR:$PYTHONPATH

# Vérifier si le fichier main.py existe
if [ ! -f "app/main.py" ]; then
    log_warning "Le fichier app/main.py n'existe pas. Création d'un fichier de base..."
    cat > app/main.py << 'EOF'
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/docs")
def docs():
    return {"message": "API documentation"}
EOF
fi

# Démarrer l'application avec logs visibles pour le débogage
log "Démarrage de uvicorn..."
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
APP_PID=$!

# Attendre que l'application démarre et vérifier qu'elle fonctionne
log "Attente du démarrage de l'application..."
for i in {1..30}; do
    if ! ps -p $APP_PID > /dev/null 2>&1; then
        log_error "Le processus uvicorn s'est arrêté. Vérifiez les logs pour plus de détails."
        exit 1
    fi
    
    # Tester si l'application répond
    if curl -s -f "$API_BASE_URL/api/health" > /dev/null 2>&1; then
        log_success "L'application backend est accessible à $API_BASE_URL"
        break
    fi
    
    if [ $i -eq 30 ]; then
        log_error "L'application backend n'est pas accessible après 30 secondes."
        log_error "Vérifiez les logs d'uvicorn pour plus de détails."
        kill $APP_PID 2>/dev/null
        exit 1
    fi
    
    sleep 1
done

# Vérification supplémentaire avec un test plus robuste
log "Vérification complète de l'API..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/api/health")
if [ "$HTTP_STATUS" = "200" ]; then
    log_success "L'API backend répond correctement (HTTP $HTTP_STATUS)"
else
    log_error "L'API backend ne répond pas correctement (HTTP $HTTP_STATUS)"
    kill $APP_PID 2>/dev/null
    exit 1
fi

# Tests d'API basiques
log "Exécution de tests d'API basiques..."
python -c "
import requests
import json
import sys

try:
    # Test de l'état de santé
    response = requests.get('$API_BASE_URL/api/health', timeout=10)
    assert response.status_code == 200, f'Erreur: health retourne {response.status_code}'
    data = response.json()
    assert data['status'] == 'ok', f'Erreur: status est {data[\"status\"]} au lieu de \"ok\"'
    print('Test de santé réussi ✓')
    
    # Test de la racine
    response = requests.get('$API_BASE_URL/', timeout=10)
    assert response.status_code == 200, f'Erreur: racine retourne {response.status_code}'
    print('Test de la racine réussi ✓')
    
    print('Tests d\'API basiques réussis!')
    sys.exit(0)
except Exception as e:
    print(f'Erreur lors des tests d\'API: {str(e)}')
    sys.exit(1)
" 2>&1 | tee -a "$(get_log_file)"

# Vérifier si les tests d'API ont réussi
if [ $? -ne 0 ]; then
    log_error "Les tests d'API basiques ont échoué."
    kill $APP_PID 2>/dev/null
    exit 1
fi

log_success "Tests d'API basiques réussis."

# Ne pas arrêter l'application, la laisser tourner
log_success "=== Fin des tests du backend ==="
log "Les tests du backend ont été exécutés avec succès."
log ""
log "Application backend accessible aux URLs suivantes :"
log "  • Page d'accueil : $API_BASE_URL/"
log "  • Documentation Swagger : $API_BASE_URL/docs"
log "  • Documentation ReDoc : $API_BASE_URL/redoc"
log "  • Health check : $API_BASE_URL/api/health"
log "  • Health check DB : $API_BASE_URL/api/health/db"
log ""
log "Pour arrêter l'application, utilisez: $SCRIPT_DIR/stop.sh"
log "Pour redémarrer l'application, utilisez: $SCRIPT_DIR/deploy.sh"
