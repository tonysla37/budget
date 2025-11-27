# Scripts - Application Budget

Ce répertoire contient tous les scripts de gestion de l'application Budget.

## 📋 Liste des scripts

### Scripts de déploiement

#### `deploy.sh`
**Déploie l'application complète (backend + frontend)**
```bash
./deploy.sh
```
- Arrête les services existants
- Démarre le backend (uvicorn sur port 8000)
- Démarre le frontend (Vite sur port 19006)
- Vérifie que les services sont opérationnels
- Affiche les URLs d'accès

#### `restart.sh`
**Redémarre tous les services**
```bash
./restart.sh
```
- Arrête tous les services (backend, frontend)
- Relance deploy.sh
- Vérifie le bon redémarrage

#### `stop.sh`
**Arrête tous les services**
```bash
./stop.sh
```
- Arrête le backend (uvicorn)
- Arrête le frontend (Vite)
- Libère les ports 8000 et 19006
- Vérifie que tous les processus sont arrêtés

### Scripts de test

#### `test_final.sh`
**Test complet de l'application en production**
```bash
./test_final.sh
```
- Teste les endpoints backend (Swagger, Health, Auth)
- Teste le frontend (page d'accueil)
- Vérifie les processus actifs
- Compte les données MongoDB (users, categories, transactions, budgets)

#### `test_all.sh`
**Exécute tous les tests (database, backend, frontend)**
```bash
./test_all.sh
```
- Lance test_database.sh
- Lance test_backend.sh
- Lance test_frontend.sh
- Génère un rapport de synthèse

#### `test_backend.sh`
**Tests spécifiques au backend**
```bash
./test_backend.sh
```
- Teste la connexion MongoDB
- Teste les endpoints API
- Vérifie l'authentification
- Teste les CRUD (catégories, transactions, budgets)

#### `test_frontend.sh`
**Tests spécifiques au frontend**
```bash
./test_frontend.sh
```
- Vérifie le serveur Vite
- Teste le chargement de la page
- Vérifie les assets statiques

#### `test_database.sh`
**Tests de la base de données MongoDB**
```bash
./test_database.sh
```
- Vérifie que MongoDB est actif
- Teste la connexion
- Compte les documents dans chaque collection
- Vérifie l'intégrité des données

#### `test_settings.sh`
**Tests de l'API Settings**
```bash
./test_settings.sh
```
- Test de connexion
- Récupération des paramètres utilisateur
- Mise à jour du billing_cycle_day
- Vérification des modifications

#### `test_cycle_changes.sh`
**Tests des changements de cycle de facturation**
```bash
./test_cycle_changes.sh
```
- Test avec billing_cycle_day = 1 (début de mois)
- Test avec billing_cycle_day = 15 (milieu de mois)
- Test avec billing_cycle_day = 25 (fin de mois)
- Test avec valeur invalide (> 28)

### Scripts utilitaires

#### `purge.sh`
**Purge complète de l'application**
```bash
./purge.sh
```
⚠️ **ATTENTION : Suppression définitive de données**
- Arrête tous les services
- Supprime les environnements virtuels (venv)
- Supprime les caches Python et Node
- Supprime les logs
- Nettoie les fichiers temporaires

#### `validate_scripts.sh`
**Valide tous les scripts du répertoire**
```bash
./validate_scripts.sh
```
- Vérifie le shebang
- Valide la syntaxe bash
- Vérifie les permissions d'exécution
- Vérifie l'utilisation de common.sh
- Vérifie la présence de SCRIPT_NAME
- Vérifie les commentaires de description

#### `common.sh`
**Bibliothèque de fonctions communes**
- Variables communes (répertoires, ports)
- Fonctions de logging (log, log_error, log_warning, log_success)
- Fonctions utilitaires (kill_process_by_pattern, wait_for_service, etc.)
- Ne pas exécuter directement (sourcé par les autres scripts)

## 🎯 Workflows courants

### Démarrage initial
```bash
# 1. Démarrer l'application
./deploy.sh

# 2. Vérifier que tout fonctionne
./test_final.sh
```

### Développement quotidien
```bash
# Redémarrer après des modifications
./restart.sh

# Tester une fonctionnalité spécifique
./test_backend.sh
./test_frontend.sh
```

### Avant un commit
```bash
# Valider tous les scripts
./validate_scripts.sh

# Exécuter tous les tests
./test_all.sh
```

### Nettoyage complet
```bash
# Purger et redémarrer de zéro
./purge.sh
./deploy.sh
./test_all.sh
```

### Arrêt pour la journée
```bash
# Arrêter tous les services
./stop.sh
```

## 📝 Convention des scripts

Tous les scripts (sauf common.sh) suivent cette structure :

```bash
#!/bin/bash

# Description du script

# Définir le nom du script AVANT de charger common.sh
SCRIPT_NAME="nom_du_script"

# Charger les fonctions communes
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Initialiser le script
init_script

# Code du script...
log "Message"
log_success "Succès"
log_warning "Avertissement"
log_error "Erreur"
```

## 🔧 Variables d'environnement

Définies dans `common.sh` :

```bash
PROJECT_ROOT="/home/lab-telegraf/code/budget"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
LOGS_DIR="$PROJECT_ROOT/logs"
FRONTEND_PORT=19006
BACKEND_PORT=8000
```

## 📊 Logs

Tous les scripts génèrent des logs dans `/home/lab-telegraf/code/budget/logs/` :

- `deploy.log` - Logs de déploiement
- `test_final.log` - Logs des tests finaux
- `test_backend.log` - Logs des tests backend
- `test_frontend.log` - Logs des tests frontend
- `test_database.log` - Logs des tests database
- etc.

Format des logs :
```
[2025-11-27 07:30:19] [script_name] Message
```

## ✅ Checklist de validation

Avant d'ajouter ou modifier un script :

- [ ] Shebang `#!/bin/bash` en première ligne
- [ ] Commentaire de description
- [ ] Définition de `SCRIPT_NAME`
- [ ] Source de `common.sh`
- [ ] Appel à `init_script`
- [ ] Utilisation des fonctions de log
- [ ] Permissions d'exécution (`chmod +x`)
- [ ] Test avec `bash -n script.sh` (syntaxe)
- [ ] Validation avec `./validate_scripts.sh`

## 🐛 Dépannage

### Script ne se lance pas
```bash
# Vérifier les permissions
ls -l script.sh

# Donner les permissions d'exécution
chmod +x script.sh
```

### Erreur "common.sh not found"
```bash
# S'assurer d'être dans le bon répertoire
cd /home/lab-telegraf/code/budget/scripts

# Ou utiliser le chemin absolu
/home/lab-telegraf/code/budget/scripts/script.sh
```

### Logs non générés
```bash
# Vérifier que le répertoire logs existe
ls -ld /home/lab-telegraf/code/budget/logs

# Le créer si nécessaire
mkdir -p /home/lab-telegraf/code/budget/logs
```

## 📚 Ressources

- **Documentation complète** : `/home/lab-telegraf/code/budget/docs/README.md`
- **Guide frontend** : `/home/lab-telegraf/code/budget/docs/FRONTEND.md`
- **Tests et validation** : `/home/lab-telegraf/code/budget/docs/TESTS.md`

---

**Dernière mise à jour** : 27 novembre 2025  
**Scripts validés** : ✅ 13/13
