#!/bin/bash

# Script de déploiement pour tester l'application Budget

# Variables
APP_NAME="budget-app"
BACKEND_DIR="$(pwd)"
VENV_DIR="$BACKEND_DIR/venv"
LOG_FILE="$BACKEND_DIR/deploy_test.log"

# Créer le répertoire pour les logs si nécessaire
mkdir -p "$(dirname "$LOG_FILE")"

echo "=== Démarrage du déploiement de test pour $APP_NAME ===" | tee -a "$LOG_FILE"
echo "$(date)" | tee -a "$LOG_FILE"

# Vérifier si MongoDB est installé
if ! command -v mongod &> /dev/null; then
    echo "MongoDB n'est pas installé. Installation..." | tee -a "$LOG_FILE"
    
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
        echo "Système d'exploitation non supporté pour l'installation automatique de MongoDB" | tee -a "$LOG_FILE"
        echo "Veuillez installer MongoDB manuellement: https://docs.mongodb.com/manual/installation/" | tee -a "$LOG_FILE"
        exit 1
    fi
else
    echo "MongoDB est déjà installé" | tee -a "$LOG_FILE"
fi

# Création d'un environnement virtuel Python
echo "Création de l'environnement virtuel..." | tee -a "$LOG_FILE"
if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR"
fi

# Activer l'environnement virtuel
source "$VENV_DIR/bin/activate"

# Mettre à jour pip sans utiliser --upgrade qui peut causer des erreurs
echo "Mise à jour de pip..." | tee -a "$LOG_FILE"
pip install pip --no-deps --force-reinstall

# Installer les dépendances explicitement
echo "Installation des dépendances..." | tee -a "$LOG_FILE"
pip install fastapi uvicorn pytest pymongo motor passlib python-jose pydantic[email] python-multipart sqlalchemy

# Si un fichier requirements.txt existe, installer ces dépendances aussi
if [ -f "$BACKEND_DIR/requirements.txt" ]; then
    pip install -r "$BACKEND_DIR/requirements.txt"
fi

# Vérifier l'installation des modules clés
python -c "import fastapi; import pytest; import uvicorn; print('Modules installés avec succès!')" || { 
    echo "Erreur : Impossible d'importer les modules requis. Installation manuelle nécessaire." | tee -a "$LOG_FILE" 
    echo "Essayez d'exécuter manuellement : pip install fastapi uvicorn pytest pymongo motor" | tee -a "$LOG_FILE"
    exit 1
}

# Exécuter les tests
echo "Exécution des tests..." | tee -a "$LOG_FILE"
python -m pytest -v || echo "Note: Les tests ont échoué ou pytest n'est pas disponible. Continuons quand même." | tee -a "$LOG_FILE"

# Charger les données de test
echo "Chargement des données de test..." | tee -a "$LOG_FILE"
python -c "
from datetime import datetime, timedelta
from bson import ObjectId
import asyncio
import json
import os

try:
    # Créer un dictionnaire simulé pour les données de test
    user_id = str(ObjectId())
    categories = {
        'Alimentation': str(ObjectId()),
        'Transport': str(ObjectId()),
        'Loisirs': str(ObjectId()),
        'Salaire': str(ObjectId())
    }
    
    now = datetime.utcnow()
    current_month = now.replace(day=15)
    prev_month = (current_month - timedelta(days=30)).replace(day=15)
    
    # Structure des données de test
    test_data = {
        'users': [{
            '_id': user_id,
            'email': 'test@example.com',
            'hashed_password': '\$2b\$12\$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',  # 'password123'
            'first_name': 'Test',
            'last_name': 'User',
            'is_active': True,
            'created_at': current_month.isoformat()
        }],
        'categories': [
            {
                '_id': categories['Alimentation'],
                'name': 'Alimentation',
                'description': 'Dépenses alimentaires',
                'color': '#4CAF50',
                'icon': 'restaurant',
                'user_id': user_id,
                'created_at': current_month.isoformat()
            },
            {
                '_id': categories['Transport'],
                'name': 'Transport',
                'description': 'Dépenses de transport',
                'color': '#2196F3',
                'icon': 'directions_car',
                'user_id': user_id,
                'created_at': current_month.isoformat()
            },
            {
                '_id': categories['Loisirs'],
                'name': 'Loisirs',
                'description': 'Dépenses de loisirs',
                'color': '#FF9800',
                'icon': 'sports_esports',
                'user_id': user_id,
                'created_at': current_month.isoformat()
            },
            {
                '_id': categories['Salaire'],
                'name': 'Salaire',
                'description': 'Revenus de salaire',
                'color': '#4CAF50',
                'icon': 'payments',
                'user_id': user_id,
                'created_at': current_month.isoformat()
            }
        ],
        'transactions': []
    }
    
    # Générer des transactions pour le mois actuel
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
    print(f\"Nombre de transactions créées: {len(test_data['transactions'])}')
    
except Exception as e:
    print(f'Erreur lors de la génération des données de test: {str(e)}')
" || echo "Génération des données de test échouée. Continuons quand même." | tee -a "$LOG_FILE"

# Vérifier si uvicorn est disponible
if command -v uvicorn &> /dev/null; then
    # Démarrer l'application
    echo "Démarrage de l'application..." | tee -a "$LOG_FILE"
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    APP_PID=$!
    
    echo "Application démarrée avec PID $APP_PID" | tee -a "$LOG_FILE"
    echo "Vous pouvez accéder à l'API à http://localhost:8000" | tee -a "$LOG_FILE"
    echo "Documentation Swagger disponible à http://localhost:8000/docs" | tee -a "$LOG_FILE"
    echo "Pour arrêter l'application, exécutez: kill $APP_PID" | tee -a "$LOG_FILE"
    
    # Créer un fichier pour arrêter facilement l'application
    cat > stop_test.sh << EOF
#!/bin/bash
kill $APP_PID
echo "Application arrêtée"
EOF
    
    chmod +x stop_test.sh
    echo "Fichier stop_test.sh créé pour arrêter l'application" | tee -a "$LOG_FILE"
else
    echo "ERREUR: uvicorn n'est pas installé. Impossible de démarrer l'application." | tee -a "$LOG_FILE"
    echo "Essayez d'installer manuellement uvicorn avec: pip install uvicorn" | tee -a "$LOG_FILE"
    exit 1
fi 