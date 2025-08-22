# Documentation des Scripts de Test

Ce document décrit les scripts de test disponibles pour l'application Budget, leur fonctionnement et leur utilisation.

## Table des matières

1. [Introduction](#introduction)
2. [Prérequis](#prérequis)
3. [Structure des Données de Test](#structure-des-données-de-test)
4. [Scripts de Test](#scripts-de-test)
   - [Test de la Base de Données](#test-de-la-base-de-données)
   - [Test du Backend](#test-du-backend)
   - [Test du Frontend](#test-du-frontend)
   - [Test d'Ensemble](#test-densemble)
5. [Personnalisation des Données de Test](#personnalisation-des-données-de-test)
6. [Résolution des Problèmes](#résolution-des-problèmes)

## Introduction

Les scripts de test fournis permettent de valider le bon fonctionnement de chaque composant de l'application Budget :
- La base de données MongoDB
- Le backend en Python/FastAPI
- Le frontend en React Native

Ces scripts peuvent être exécutés individuellement pour tester des composants spécifiques ou ensemble pour un test complet de l'application.

## Prérequis

Pour exécuter les scripts de test, vous aurez besoin des éléments suivants :

- **Système d'exploitation** : Linux, macOS ou Windows avec WSL
- **Logiciels requis** :
  - Python 3.8+
  - Node.js 16.x+
  - MongoDB 4.4+
  - Bash
- **Bibliothèques Python** :
  - PyYAML
  - pymongo
  - pytest
  - fastapi
  - uvicorn
- **Bibliothèques Node.js** :
  - React Native
  - Expo
  - Jest

## Structure des Données de Test

Les données de test sont stockées dans des fichiers YAML dans le répertoire `scripts/test_data/` :

- `users.yaml` : Données des utilisateurs pour les tests
- `categories.yaml` : Catégories de transactions pour les tests
- `transactions.yaml` : Transactions pour les tests

Ces fichiers peuvent être modifiés selon vos besoins pour adapter les tests à des scénarios spécifiques.

### Format des Fichiers YAML

#### users.yaml
```yaml
users:
  - _id: "68833617fe0fd7afbb170f41"
    email: "test@example.com"
    hashed_password: "b2/tBBq"
    first_name: "Test"
    last_name: "User"
    is_active: true
    created_at: "2025-07-25T07:45:27.536324+00:00"
```

#### categories.yaml
```yaml
categories:
  - _id: "68833617fe0fd7afbb170f42"
    name: "Alimentation"
    color: "#4CAF50"
    icon: "restaurant"
    user_id: "68833617fe0fd7afbb170f41"
    created_at: "2025-07-25T07:45:27.536337+00:00"
```

#### transactions.yaml
```yaml
transactions:
  - _id: "68833617fe0fd7afbb170f46"
    user_id: "68833617fe0fd7afbb170f41"
    date: "2025-07-05T07:45:27.536350+00:00"
    amount: 2500.0
    description: "Salaire"
    merchant: "Entreprise XYZ"
    is_expense: false
    category_id: "68833617fe0fd7afbb170f45"
    created_at: "2025-07-05T07:45:27.536350+00:00"
```

## Scripts de Test

### Test de la Base de Données

**Script** : `scripts/test_database.sh`

Ce script teste la base de données MongoDB :
- Vérifie l'installation et le démarrage de MongoDB
- Importe les données de test depuis les fichiers YAML
- Exécute des tests CRUD (Create, Read, Update, Delete)
- Vérifie les relations entre les entités
- Teste les performances avec des requêtes d'agrégation

**Utilisation** :
```bash
./scripts/test_database.sh
```

**Fichiers de log** :
- `/logs/database_test.log` : Log des opérations et résultats des tests

### Test du Backend

**Script** : `scripts/test_backend.sh`

Ce script teste le backend de l'application :
- Configure l'environnement virtuel Python
- Vérifie la base de données MongoDB
- Importe les données de test
- Exécute les tests unitaires et d'intégration du backend
- Démarre l'API et vérifie son accessibilité
- Exécute des tests d'API basiques

**Utilisation** :
```bash
./scripts/test_backend.sh
```

**Fichiers de log** :
- `/logs/backend_test.log` : Log des opérations
- `/logs/backend_test_results.log` : Résultats détaillés des tests

### Test du Frontend

**Script** : `scripts/test_frontend.sh`

Ce script teste le frontend de l'application :
- Vérifie l'installation de Node.js et NPM
- Installe les dépendances nécessaires
- Vérifie la disponibilité du backend
- Exécute les tests unitaires du frontend
- Démarre l'application en mode développement
- Vérifie l'accessibilité de l'interface utilisateur

**Utilisation** :
```bash
./scripts/test_frontend.sh
```

**Fichiers de log** :
- `/logs/frontend_test.log` : Log des opérations
- `/logs/frontend_test_results.log` : Résultats détaillés des tests

### Test d'Ensemble

**Script** : `scripts/test_all.sh`

Ce script exécute tous les tests dans l'ordre suivant :
1. Tests de la base de données
2. Tests du backend
3. Tests du frontend

Il génère un rapport de synthèse indiquant le succès ou l'échec de chaque étape.

**Utilisation** :
```bash
./scripts/test_all.sh
```

**Fichiers de log** :
- `/logs/test_all.log` : Log de synthèse des tests
- Les logs individuels de chaque composant sont également générés

## Personnalisation des Données de Test

Pour personnaliser les données de test, modifiez les fichiers YAML dans le répertoire `scripts/test_data/` :

1. Ouvrez le fichier correspondant au type de données que vous souhaitez modifier
2. Modifiez les valeurs selon vos besoins
3. Assurez-vous de maintenir la cohérence entre les fichiers (IDs d'utilisateurs, catégories, etc.)
4. Exécutez à nouveau les scripts de test

### Points importants pour la personnalisation :

- Les IDs doivent être au format ObjectId MongoDB (chaînes de 24 caractères hexadécimaux)
- Les relations entre les entités doivent être préservées (user_id, category_id)
- Les dates doivent être au format ISO 8601
- Les montants des transactions sont en nombre décimal (positif pour les revenus, négatif pour les dépenses)

## Résolution des Problèmes

### MongoDB ne démarre pas

Vérifiez que MongoDB est correctement installé :
```bash
mongod --version
```

Si MongoDB n'est pas installé ou s'il y a un problème, installez-le manuellement :
```bash
# Sur Ubuntu/Debian
sudo apt-get install -y mongodb

# Sur macOS avec Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Problèmes avec le Backend

1. Vérifiez que Python et les dépendances sont installés :
```bash
python3 --version
pip3 list | grep -E 'fastapi|uvicorn|pymongo'
```

2. Vérifiez les logs d'erreur :
```bash
cat /logs/backend_test.log
cat /logs/backend_test_results.log
```

### Problèmes avec le Frontend

1. Vérifiez que Node.js et NPM sont installés :
```bash
node --version
npm --version
```

2. Vérifiez les logs d'erreur :
```bash
cat /logs/frontend_test.log
cat /logs/frontend_test_results.log
```

3. Assurez-vous que le backend est en cours d'exécution lors des tests frontend.

---

Pour toute assistance supplémentaire, veuillez consulter la documentation des composants individuels ou contacter l'équipe de développement.
