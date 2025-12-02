# Scripts - Application Budget

Documentation complète de tous les scripts disponibles après nettoyage du 2 décembre 2025.

## 📋 Table des Matières

- [Scripts de Déploiement](#-scripts-de-déploiement)
- [Scripts de Test](#-scripts-de-test)
- [Scripts Utilitaires](#-scripts-utilitaires)
- [Scripts Python Backend](#-scripts-python-backend)
- [Workflows Recommandés](#-workflows-recommandés)
- [Scripts Supprimés](#-scripts-supprimés)

---

## 📦 Scripts de Déploiement

### `deploy.sh`
Déploie l'application complète (backend + frontend)

```bash
./scripts/deploy.sh
```

**Fonctionnalités** :
- Arrête les services existants
- Démarre le backend FastAPI (port 8000)
- Démarre le frontend Vite (port 19006)
- Vérifie la disponibilité des services
- Affiche les URLs d'accès

### `restart.sh`
Redémarre tous les services

```bash
./scripts/restart.sh
```

**Utilisation** : Après modification du code.

### `stop.sh`
Arrête tous les services

```bash
./scripts/stop.sh
```

**Fonctionnalités** : Libère les ports 8000 et 19006.

---

## 🧪 Scripts de Test

### `test_all.sh`
Exécute tous les tests (database, backend, frontend)

```bash
./scripts/test_all.sh
```

**Logs** : `logs/test_all.log`

### `test_backend.sh`
Tests spécifiques au backend

```bash
./scripts/test_backend.sh
```

**Fonctionnalités** :
- Crée l'environnement virtuel Python
- Importe les données de test YAML
- Lance pytest
- Teste l'API

### `test_frontend.sh`
Tests spécifiques au frontend

```bash
./scripts/test_frontend.sh
```

### `test_database.sh`
Tests MongoDB

```bash
./scripts/test_database.sh
```

**Fonctionnalités** :
- Charge les données depuis `test_data/*.yaml`
- Teste les opérations CRUD
- Teste les requêtes d'agrégation

---

## 🔧 Scripts Utilitaires

### `purge.sh`
⚠️ Purge complète (DESTRUCTIF)

```bash
./scripts/purge.sh
```

**Supprime** :
- Environnements virtuels Python
- Caches (`__pycache__`, `node_modules`)
- Logs
- Base de données MongoDB `budget_db`

### `info.sh`
Documentation interactive

```bash
./scripts/info.sh
```

### `common.sh`
Bibliothèque de fonctions (ne pas exécuter directement)

**Fonctions** : `log()`, `log_error()`, `log_success()`, `handle_error()`, etc.

---

## 🐍 Scripts Python Backend

### `test_mongodb.py`
Test de connexion MongoDB

```bash
cd backend && venv/bin/python test_mongodb.py
```

### `view_users.py`
Affiche tous les utilisateurs

```bash
cd backend && venv/bin/python view_users.py
```

### `check_users.py`
Vérification rapide

```bash
cd backend && venv/bin/python check_users.py
```

### `delete_user.py`
Suppression interactive

```bash
cd backend && venv/bin/python delete_user.py [email_ou_id]
```

### `generate_realistic_data.py`
Génère 6 mois de données réalistes

```bash
cd backend && venv/bin/python generate_realistic_data.py
```

**Données** :
- Salaire cadre : 3200€/mois
- Catégories : alimentation, transport, logement, loisirs, etc.
- Merchants réalistes

### `scripts/generate_encryption_key.py`
Génère une clé de chiffrement

```bash
python3 scripts/generate_encryption_key.py
```

### `backend/scripts/check_objectid_pattern.py`
Validation du pattern ObjectId (pre-commit hook)

```bash
python3 backend/scripts/check_objectid_pattern.py
```

---

## 🎯 Workflows Recommandés

### Démarrage Initial
```bash
./scripts/deploy.sh
./scripts/test_all.sh
```

### Développement
```bash
./scripts/restart.sh  # Après modifications
./scripts/test_all.sh # Avant commit
```

### Génération de Données
```bash
cd backend
venv/bin/python generate_realistic_data.py
venv/bin/python view_users.py
```

---

## ❌ Scripts Supprimés

**Date** : 2 décembre 2025

### Scripts Shell Obsolètes
- `test_final.sh` - Doublon de test_all.sh
- `test_settings.sh` - API obsolète
- `test_cycle_changes.sh` - Trop spécifique
- `validate_scripts.sh` - Non utilisé
- `install_services.sh` - Obsolète
- `install_i18n_offline.sh` - Obsolète
- `start_frontend_i18n.sh` - Obsolète

### Scripts Python Obsolètes
- `test_password.py` - Debug uniquement
- `create_user.py` - Utiliser l'API `/auth/register`
- `create_transactions.py` - Utiliser `generate_realistic_data.py`
- `add_merchants.py` - Migration unique
- `migrate_add_bank_to_transactions.py` - Migration unique
- `test_bank_connections.py` - Imports cassés

---

## ✅ Scripts Validés

**Validation** : 2 décembre 2025

- ✅ Syntaxe shell correcte
- ✅ Compilation Python OK
- ✅ Tests fonctionnels passés
- ✅ 13 scripts obsolètes supprimés
- ✅ 10 scripts shell conservés
- ✅ 6 scripts Python conservés

---

## 📝 Logs

Tous les logs sont dans `/logs/` :
- `deploy.log`, `restart.log`, `stop.log`
- `test_all.log`, `test_backend.log`, `test_frontend.log`
- `test_database.log`, `purge.log`

**Format** : `[YYYY-MM-DD HH:MM:SS] [script_name] Message`

---

**Dernière mise à jour** : 2 décembre 2025
