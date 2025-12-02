#!/bin/bash

# Script de test pour la base de données MongoDB de l'application Budget

# Définir le nom du script AVANT de charger common.sh
SCRIPT_NAME="test_database"

# Charger les fonctions communes
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Initialiser le script
init_script

# Variables spécifiques aux tests de base de données
MONGO_PORT=27017
MONGO_HOST="localhost"
MONGO_DB="budget_db"

log "Répertoire des données de test: $TEST_DATA_DIR"

# Vérifier la présence des fichiers YAML de test
log "Vérification des fichiers de données de test..."
if [ ! -f "$TEST_DATA_DIR/users.yaml" ] || [ ! -f "$TEST_DATA_DIR/categories.yaml" ] || [ ! -f "$TEST_DATA_DIR/transactions.yaml" ]; then
    handle_error "Les fichiers de données de test sont manquants dans $TEST_DATA_DIR"
fi

# Fonction pour installer MongoDB sur Ubuntu
install_mongodb_ubuntu() {
    log "Installation de MongoDB sur Ubuntu..."
    
    # Importer la clé GPG publique de MongoDB
    wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
    
    # Créer un fichier de liste pour MongoDB
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    
    # Mettre à jour les paquets
    sudo apt-get update
    
    # Installer MongoDB
    sudo apt-get install -y mongodb-org
    
    # Démarrer MongoDB
    sudo systemctl start mongod
    
    # Activer MongoDB au démarrage
    sudo systemctl enable mongod
    
    log_success "MongoDB installé et démarré avec succès"
}

# Fonction pour installer les dépendances Python
install_python_dependencies() {
    log "Vérification des dépendances Python..."
    
    # Utiliser le venv à la racine du projet
    local venv_dir="$PROJECT_ROOT/venv"
    
    if [ ! -d "$venv_dir" ]; then
        log "Création d'un environnement virtuel Python à la racine..."
        
        # Vérifier que python3-venv est installé
        if ! python3 -m venv --help &> /dev/null; then
            log "Installation de python3-venv..."
            sudo apt update
            sudo apt install -y python3-venv python3-pip
        fi
        
        # Créer l'environnement virtuel à la racine du projet
        cd "$PROJECT_ROOT" || handle_error "Impossible d'accéder à la racine du projet"
        python3 -m venv venv
        if [ $? -ne 0 ]; then
            handle_error "Échec de la création de l'environnement virtuel"
        fi
        
        log_success "Environnement virtuel créé à la racine"
    else
        log "Environnement virtuel existant trouvé à la racine"
    fi
    
    # Activer l'environnement virtuel
    source "$venv_dir/bin/activate"
    
    # Mettre à jour pip dans l'environnement virtuel
    pip install --upgrade pip
    
    # Installer PyYAML si nécessaire
    if ! python -c "import yaml" 2>/dev/null; then
        log "Installation de PyYAML..."
        pip install PyYAML
        if [ $? -ne 0 ]; then
            handle_error "Échec de l'installation de PyYAML"
        fi
    else
        log "PyYAML est déjà installé"
    fi
    
    # Installer pymongo si nécessaire
    if ! python -c "import pymongo" 2>/dev/null; then
        log "Installation de pymongo..."
        pip install pymongo
        if [ $? -ne 0 ]; then
            handle_error "Échec de l'installation de pymongo"
        fi
    else
        log "pymongo est déjà installé"
    fi
    
    log_success "Toutes les dépendances Python sont installées"
}

# Vérifier que MongoDB est installé
log "Vérification de l'installation de MongoDB..."
if ! command -v mongod &> /dev/null; then
    log "MongoDB n'est pas installé. Installation..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew tap mongodb/brew
        brew install mongodb-community
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux - détecter la distribution
        if command -v apt-get &> /dev/null; then
            # Ubuntu/Debian
            install_mongodb_ubuntu
        elif command -v yum &> /dev/null; then
            # CentOS/RHEL
            log "Installation de MongoDB sur CentOS/RHEL..."
            sudo yum install -y mongodb-org
            sudo systemctl start mongod
            sudo systemctl enable mongod
        else
            handle_error "Distribution Linux non supportée pour l'installation automatique de MongoDB"
        fi
    else
        handle_error "Système d'exploitation non supporté pour l'installation automatique de MongoDB"
    fi
else
    log "MongoDB est déjà installé: $(mongod --version | head -n 1)"
fi

# Vérifier que MongoDB est en cours d'exécution
log "Vérification de l'exécution de MongoDB..."
if ! pgrep -x mongod > /dev/null; then
    log "MongoDB n'est pas en cours d'exécution. Démarrage..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew services start mongodb-community
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v systemctl &> /dev/null; then
            sudo systemctl start mongod
        else
            # Fallback pour les systèmes sans systemctl
            sudo service mongod start
        fi
    else
        handle_error "Impossible de démarrer MongoDB automatiquement sur ce système"
    fi
    
    # Attendre que MongoDB démarre
    sleep 5
    if ! pgrep -x mongod > /dev/null; then
        handle_error "Impossible de démarrer MongoDB"
    fi
    
    log_success "MongoDB démarré avec succès"
else
    log "MongoDB est déjà en cours d'exécution"
fi

# Installer les dépendances Python
install_python_dependencies

# Avertissement avant importation
echo ""
echo "⚠️  ATTENTION: Ce script va supprimer et réimporter les données de test !"
echo "   Les collections suivantes seront affectées:"
echo "   - users (suppression complète)"
echo "   - categories (suppression complète)"
echo "   - transactions (suppression complète)"
echo ""
echo "💡 Pour changer le mot de passe sans perdre de données:"
echo "   venv/bin/python scripts/change_password.py <email> <nouveau_mdp>"
echo ""

# Charger les données de test dans MongoDB
log "Importation des données de test dans MongoDB..."
# Activer l'environnement virtuel pour l'exécution Python
source "$PROJECT_ROOT/venv/bin/activate"
python -c "
import yaml
import json
import pymongo
from bson import ObjectId

try:
    # Charger les données YAML
    data = {}
    
    # Charger les utilisateurs
    with open('$TEST_DATA_DIR/users.yaml', 'r') as file:
        data.update(yaml.safe_load(file))
    
    # Charger les catégories
    with open('$TEST_DATA_DIR/categories.yaml', 'r') as file:
        data.update(yaml.safe_load(file))
    
    # Charger les transactions
    with open('$TEST_DATA_DIR/transactions.yaml', 'r') as file:
        data.update(yaml.safe_load(file))
    
    # Connexion à MongoDB
    client = pymongo.MongoClient('mongodb://$MONGO_HOST:$MONGO_PORT/')
    db = client.$MONGO_DB
    
    # Vider les collections existantes
    db.users.delete_many({})
    db.categories.delete_many({})
    db.transactions.delete_many({})
    
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
    
    print('Données de test chargées avec succès dans MongoDB')
except Exception as e:
    print(f'Erreur lors du chargement des données de test: {str(e)}')
    exit(1)
" 2>&1 | tee -a "$(get_log_file)"

# Vérifier si l'importation a réussi
if [ $? -ne 0 ]; then
    handle_error "Échec de l'importation des données dans MongoDB"
fi

# Exécuter des tests de base de données
log "Exécution des tests de base de données..."
# Activer l'environnement virtuel pour l'exécution Python
source "$PROJECT_ROOT/venv/bin/activate"

# Créer un fichier Python temporaire pour les tests
cat > "$SCRIPT_DIR/temp_db_tests.py" << 'EOF'
import pymongo
import datetime
import sys
from bson import ObjectId

# Récupérer les arguments de ligne de commande
if len(sys.argv) != 4:
    print("Usage: python temp_db_tests.py <host> <port> <database>")
    sys.exit(1)

mongo_host = sys.argv[1]
mongo_port = sys.argv[2]
mongo_db = sys.argv[3]

try:
    # Connexion à MongoDB
    client = pymongo.MongoClient(f'mongodb://{mongo_host}:{mongo_port}/')
    db = client[mongo_db]
    
    # Test 1: Vérifier que les utilisateurs ont été importés
    user_count = db.users.count_documents({})
    print(f'Test 1: {user_count} utilisateurs trouvés dans la base de données')
    assert user_count > 0, 'Aucun utilisateur trouvé'
    
    # Test 2: Vérifier que les catégories ont été importées
    category_count = db.categories.count_documents({})
    print(f'Test 2: {category_count} catégories trouvées dans la base de données')
    assert category_count > 0, 'Aucune catégorie trouvée'
    
    # Test 3: Vérifier que les transactions ont été importées
    transaction_count = db.transactions.count_documents({})
    print(f'Test 3: {transaction_count} transactions trouvées dans la base de données')
    assert transaction_count > 0, 'Aucune transaction trouvée'
    
    # Test 4: Vérifier les relations entre les entités
    test_user = db.users.find_one({})
    if test_user:
        user_id = test_user['_id']
        user_categories = list(db.categories.find({'user_id': user_id}))
        print(f'Test 4: {len(user_categories)} catégories trouvées pour l\'utilisateur')
        assert len(user_categories) > 0, 'Aucune catégorie trouvée pour l\'utilisateur'
        
        user_transactions = list(db.transactions.find({'user_id': user_id}))
        print(f'Test 4: {len(user_transactions)} transactions trouvées pour l\'utilisateur')
        assert len(user_transactions) > 0, 'Aucune transaction trouvée pour l\'utilisateur'
    
    # Test 5: Tester une opération d'insertion
    new_user = {
        '_id': ObjectId(),
        'email': 'testdb@example.com',
        'hashed_password': 'test_hash',
        'first_name': 'Test',
        'last_name': 'Database',
        'is_active': True,
        'created_at': datetime.datetime.now(datetime.UTC).isoformat()
    }
    db.users.insert_one(new_user)
    inserted_user = db.users.find_one({'email': 'testdb@example.com'})
    print(f'Test 5: Nouvel utilisateur inséré avec ID {inserted_user["_id"]}')
    assert inserted_user is not None, 'Échec de l\'insertion d\'un nouvel utilisateur'
    
    # Test 6: Tester une opération de mise à jour
    try:
        result = db.users.update_one(
            {'email': 'testdb@example.com'},
            {'$set': {'first_name': 'Updated'}}
        )
        if result.modified_count > 0:
            updated_user = db.users.find_one({'email': 'testdb@example.com'})
            print(f'Test 6: Utilisateur mis à jour, nouveau prénom: {updated_user["first_name"]}')
            assert updated_user['first_name'] == 'Updated', 'Échec de la mise à jour d\'un utilisateur'
        else:
            print('Test 6: Aucun utilisateur modifié')
            assert False, 'Échec de la mise à jour d\'un utilisateur'
    except Exception as update_error:
        print(f'Test 6: Erreur lors de la mise à jour: {update_error}')
        # Essayer une approche alternative
        try:
            db.users.replace_one(
                {'email': 'testdb@example.com'},
                {**inserted_user, 'first_name': 'Updated'}
            )
            updated_user = db.users.find_one({'email': 'testdb@example.com'})
            print(f'Test 6: Utilisateur mis à jour (méthode alternative), nouveau prénom: {updated_user["first_name"]}')
            assert updated_user['first_name'] == 'Updated', 'Échec de la mise à jour d\'un utilisateur'
        except Exception as replace_error:
            print(f'Test 6: Échec de la méthode alternative: {replace_error}')
            assert False, 'Échec de la mise à jour d\'un utilisateur'
    
    # Test 7: Tester une opération de suppression
    try:
        result = db.users.delete_one({'email': 'testdb@example.com'})
        if result.deleted_count > 0:
            deleted_user = db.users.find_one({'email': 'testdb@example.com'})
            print('Test 7: Utilisateur supprimé avec succès')
            assert deleted_user is None, 'Échec de la suppression d\'un utilisateur'
        else:
            print('Test 7: Aucun utilisateur supprimé')
            assert False, 'Échec de la suppression d\'un utilisateur'
    except Exception as delete_error:
        print(f'Test 7: Erreur lors de la suppression: {delete_error}')
        assert False, 'Échec de la suppression d\'un utilisateur'
    
    # Test 8: Tester la performance avec des requêtes d'agrégation
    start_time = datetime.datetime.now()
    
    pipeline = [
        {'$match': {'is_expense': True}},
        {'$group': {
            '_id': '$category_id',
            'total': {'$sum': '$amount'},
            'count': {'$sum': 1}
        }},
        {'$sort': {'total': 1}}
    ]
    
    expense_by_category = list(db.transactions.aggregate(pipeline))
    end_time = datetime.datetime.now()
    execution_time = (end_time - start_time).total_seconds() * 1000
    
    print(f'Test 8: Requête d\'agrégation exécutée en {execution_time:.2f} ms')
    print(f'Résultats de l\'agrégation: {len(expense_by_category)} catégories avec dépenses')
    
    print('Tous les tests de base de données ont réussi!')
except AssertionError as e:
    print(f'Échec du test: {str(e)}')
    sys.exit(1)
except Exception as e:
    print(f'Erreur lors des tests: {str(e)}')
    sys.exit(1)
EOF

# Exécuter le fichier Python temporaire avec les variables comme arguments
python "$SCRIPT_DIR/temp_db_tests.py" "$MONGO_HOST" "$MONGO_PORT" "$MONGO_DB" 2>&1 | tee -a "$(get_log_file)"

# Nettoyer le fichier temporaire
rm -f "$SCRIPT_DIR/temp_db_tests.py"

# Vérifier si les tests ont réussi
if [ $? -ne 0 ]; then
    handle_error "Échec des tests de base de données"
fi

# Afficher le résumé
log_success "=== Fin des tests de la base de données MongoDB ==="
log "Les tests de la base de données ont été exécutés avec succès."
