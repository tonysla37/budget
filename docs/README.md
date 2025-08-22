# Application Budget - Documentation Complète

##  Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Prérequis](#prérequis)
4. [Installation et démarrage](#installation-et-démarrage)
5. [Utilisation](#utilisation)
6. [API Backend](#api-backend)
7. [Frontend](#frontend)
8. [Tests et déploiement](#tests-et-déploiement)
9. [Dépannage](#dépannage)
10. [Structure du projet](#structure-du-projet)

##  Vue d'ensemble

L'**Application Budget** est une solution complète de gestion de finances personnelles développée avec :
- **Backend** : FastAPI (Python) + MongoDB
- **Frontend** : React Native avec Expo
- **Base de données** : MongoDB
- **Authentification** : JWT tokens

### Fonctionnalités principales
- ✅ **Authentification sécurisée** avec JWT
- ✅ **Gestion des transactions** (revenus/dépenses)
- ✅ **Catégorisation** des transactions avec couleurs
- ✅ **Tableaux de bord** avec statistiques
- ✅ **Filtres et recherche** avancés
- ✅ **Périodes personnalisées** (fin de mois)
- ✅ **Interface responsive** (mobile/web)

## 🏗️ Architecture

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
│   ├── requirements.txt # Dépendances Python
│   └── venv/            # Environnement virtuel Python
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
│   ├── deploy.sh        # Script de déploiement pour le frontend
│   └── stop_test.sh     # Script d'arrêt pour le frontend
│
├── logs/                # Fichiers de logs
│   ├── test_database.log    # Logs des tests de base de données
│   ├── test_backend.log     # Logs des tests du backend
│   ├── test_frontend.log    # Logs des tests du frontend
│   └── test_all.log         # Logs des tests d'ensemble
│
├── scripts/             # Scripts globaux
│   ├── deploy.sh        # Script de déploiement global
│   ├── stop.sh          # Script d'arrêt global
│   ├── test_all.sh      # Script de test d'ensemble
│   ├── test_backend.sh  # Script de test du backend
│   ├── test_frontend.sh # Script de test du frontend
│   ├── test_database.sh # Script de test de la base de données
│   └── common.sh        # Fonctions communes
│
└── test_data/           # Données de test
    ├── users.yaml       # Utilisateurs de test
    ├── categories.yaml  # Catégories de test
    └── transactions.yaml # Transactions de test
```

## Prérequis

- **Python 3.9+** pour le backend
- **Node.js et npm** pour le frontend
- **MongoDB** pour la base de données
- **curl** pour les tests d'API (optionnel)

## Installation et démarrage

### Méthode 1 : Tests et déploiement complet

Pour tester et déployer l'application complète :

```bash
# Exécuter tous les tests
./scripts/test_all.sh

# Déployer l'application complète
./scripts/deploy.sh
```

### Méthode 2 : Tests individuels

```bash
# Test de la base de données
./scripts/test_database.sh

# Test du backend
./scripts/test_backend.sh

# Test du frontend
./scripts/test_frontend.sh
```

### Méthode 3 : Déploiement séparé

```bash
# Démarrer le backend
cd backend && source venv/bin/activate && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Dans un nouveau terminal, démarrer le frontend
cd frontend && npm start
```

## Utilisation

### Backend (FastAPI)
- **Page d'accueil** : http://localhost:8000/
- **Documentation Swagger** : http://localhost:8000/docs
- **Documentation ReDoc** : http://localhost:8000/redoc
- **Health check** : http://localhost:8000/api/health
- **Health check DB** : http://localhost:8000/api/health/db

### Frontend (React Native/Expo)
- **Application web** : http://localhost:19006
- **QR Code Expo** : Affiché dans le terminal lors du démarrage

## Informations de connexion pour les tests
- **Email** : test@example.com
- **Mot de passe** : password123

## Tests et déploiement

### Logs des tests
- **Tests de base de données** : `logs/test_database.log`
- **Tests du backend** : `logs/test_backend.log`
- **Tests du frontend** : `logs/test_frontend.log`
- **Tests d'ensemble** : `logs/test_all.log`

### Logs de déploiement
- **Backend** : `backend/deploy_output.log`
- **Frontend** : `frontend/deploy_output.log`

## Dépannage

### Problème : "Non connecté" dans le frontend
**Symptômes :** Le frontend affiche "Statut du backend: Non connecté"

**Solutions :**
1. Vérifiez que le backend est démarré : `curl http://localhost:8000/api/health`
2. Vérifiez la configuration CORS dans `backend/app/core/config.py`
3. Redémarrez le backend après modification de la config CORS

### Problème : Erreur CORS
**Symptômes :** Erreur "OPTIONS /api/health HTTP/1.1" 400 Bad Request

**Solutions :**
1. Vérifiez que le port 19006 est dans `CORS_ORIGINS`
2. Redémarrez le backend
3. Videz le cache du navigateur

### Problème : MongoDB non accessible
**Symptômes :** Erreur de connexion à la base de données

**Solutions :**
1. Vérifiez que MongoDB est démarré : `sudo systemctl status mongod`
2. Démarrez MongoDB : `sudo systemctl start mongod`
3. Vérifiez la connexion : `mongosh --eval "db.runCommand('ping')"`

---

Développé par Tony Auge. Pour toute question ou support, consultez la documentation détaillée dans le répertoire `docs/`. 

## 1. Création de l'application web avec Vite

```bash
# Aller à la racine du projet
cd /home/tonya/Code/budget

# Créer l'application web
npm create vite@latest budget-web -- --template react
cd budget-web
npm install
```

## 2. Configuration de l'application web

```javascript:budget-web/src/App.jsx
import React from 'react';
import './App.css';

function App() {
  return (
    <div className="app">
      <div className="container">
        <h1>Budget App</h1>
        
        <div className="status">
          ✅ Application web fonctionne correctement
        </div>
        
        <p className="description">
          Application de gestion de budget
        </p>
        
        <div className="features">
          <h3>Fonctionnalités :</h3>
          <ul>
            <li>Gestion des transactions</li>
            <li>Catégorisation</li>
            <li>Tableaux de bord</li>
            <li>Statistiques</li>
          </ul>
        </div>
        
        <button className="start-button">
          Commencer
        </button>
      </div>
    </div>
  );
}

export default App;
```

## 3. Styles CSS

```css:budget-web/src/App.css
.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  font-family: Arial, sans-serif;
  padding: 20px;
}

.container {
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-align: center;
  max-width: 500px;
}

h1 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.status {
  background-color: #27ae60;
  color: white;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.description {
  color: #7f8c8d;
  margin-bottom: 15px;
}

.features {
  text-align: left;
  margin-bottom: 20px;
}

.features h3 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.features ul {
  color: #7f8c8d;
  padding-left: 20px;
}

.features li {
  margin-bottom: 5px;
}

.start-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.start-button:hover {
  background-color: #2980b9;
}
```

## 4. Configuration du serveur de développement

```javascript:budget-web/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 19006,
    host: true
  }
})
```

## 5. Script de démarrage

```bash:scripts/start_web.sh
#!/bin/bash

echo "🌐 Démarrage de l'application web..."

cd budget-web

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "Installation des dépendances..."
    npm install
fi

# Démarrer l'application
echo "Démarrage sur http://localhost:19006"
npm run dev
```

## 6. Mise à jour de la documentation

```markdown:docs/README.md
<code_block_to_apply_changes_from>
```
budget-web/
├── src/
│   ├── App.jsx          # Composant principal
│   ├── App.css          # Styles
│   └── main.jsx         # Point d'entrée
├── 