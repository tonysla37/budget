#!/bin/bash

# Script de purge complète pour l'application Budget
# Ce script arrête tous les services et supprime tous les fichiers temporaires

# Définir le nom du script AVANT de charger common.sh
SCRIPT_NAME="purge"

# Charger les fonctions communes
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Initialiser le script
init_script

log "=== PURGE COMPLÈTE DE L'APPLICATION BUDGET ==="
log "ATTENTION: Cette opération va supprimer définitivement tous les fichiers temporaires"
log "Date et heure: $(date)"

# 1. Arrêter tous les services avec stop.sh
log "1. Arrêt de tous les services..."
bash "$SCRIPT_DIR/stop.sh"

# 2. Supprimer les environnements virtuels
log "2. Suppression des environnements virtuels..."
if [ -d "$BACKEND_DIR/venv" ]; then
    log "Suppression de l'environnement virtuel backend..."
    rm -rf "$BACKEND_DIR/venv"
    log_success "Environnement virtuel backend supprimé"
fi

if [ -d "$SCRIPT_DIR/.venv" ]; then
    log "Suppression de l'environnement virtuel scripts..."
    rm -rf "$SCRIPT_DIR/.venv"
    log_success "Environnement virtuel scripts supprimé"
fi

# 3. Supprimer les caches Python
log "3. Suppression des caches Python..."
find "$PROJECT_ROOT" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find "$PROJECT_ROOT" -type d -name "*.pyc" -delete 2>/dev/null
find "$PROJECT_ROOT" -type d -name "*.pyo" -delete 2>/dev/null
find "$PROJECT_ROOT" -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null
log_success "Caches Python supprimés"

# 4. Supprimer les caches Node.js
log "4. Suppression des caches Node.js..."
if [ -d "$FRONTEND_DIR/node_modules" ]; then
    log "Suppression de node_modules..."
    rm -rf "$FRONTEND_DIR/node_modules"
    log_success "node_modules supprimé"
fi

if [ -d "$FRONTEND_DIR/.expo" ]; then
    log "Suppression du cache Expo..."
    rm -rf "$FRONTEND_DIR/.expo"
    log_success "Cache Expo supprimé"
fi

# 5. Supprimer les fichiers de logs (mais garder le répertoire)
log "5. Suppression des fichiers de logs..."
if [ -d "$LOGS_DIR" ]; then
    log "Suppression des fichiers de logs..."
    rm -f "$LOGS_DIR"/*.log 2>/dev/null
    log_success "Fichiers de logs supprimés"
fi

# Supprimer les logs individuels
for log_file in "$BACKEND_DIR"/*.log "$FRONTEND_DIR"/*.log "$SCRIPT_DIR"/*.log; do
    if [ -f "$log_file" ]; then
        log "Suppression de $log_file..."
        rm -f "$log_file"
    fi
done

# 6. Supprimer les fichiers de déploiement
log "6. Suppression des fichiers de déploiement..."
for deploy_file in "$BACKEND_DIR/deploy_output.log" "$FRONTEND_DIR/deploy_output.log"; do
    if [ -f "$deploy_file" ]; then
        log "Suppression de $deploy_file..."
        rm -f "$deploy_file"
    fi
done

# 7. Nettoyer les fichiers temporaires
log "7. Suppression des fichiers temporaires..."
find "$PROJECT_ROOT" -name "*.tmp" -delete 2>/dev/null
find "$PROJECT_ROOT" -name "*.temp" -delete 2>/dev/null
find "$PROJECT_ROOT" -name ".DS_Store" -delete 2>/dev/null
find "$PROJECT_ROOT" -name "Thumbs.db" -delete 2>/dev/null

# 8. Nettoyer les fichiers de lock
log "8. Suppression des fichiers de lock..."
if [ -f "$FRONTEND_DIR/package-lock.json" ]; then
    log "Suppression de package-lock.json..."
    rm -f "$FRONTEND_DIR/package-lock.json"
fi

# 9. Nettoyer les bases de données de test
log "9. Nettoyage des bases de données de test..."
log "Suppression des données de test MongoDB..."
mongosh --eval "use budget_db; db.dropDatabase();" 2>/dev/null || log_warning "Impossible de supprimer la base de données MongoDB"
log_success "Base de données de test supprimée"

# 10. Vérification finale
log "10. Vérification de la purge..."
log "Vérification des processus restants..."

# Vérifier qu'aucun processus n'est resté
REMAINING_PROCESSES=$(ps aux | grep -E "(uvicorn|expo|node.*frontend|python.*backend)" | grep -v grep | wc -l)
if [ "$REMAINING_PROCESSES" -eq 0 ]; then
    log_success "Aucun processus restant"
else
    log_warning "$REMAINING_PROCESSES processus encore en cours"
    ps aux | grep -E "(uvicorn|expo|node.*frontend|python.*backend)" | grep -v grep
fi

# Vérifier les ports
log "Vérification des ports..."
if ! lsof -i:8000 >/dev/null 2>&1; then
    log_success "Port 8000 libre"
else
    log_warning "Port 8000 encore occupé"
fi

if ! lsof -i:19006 >/dev/null 2>&1; then
    log_success "Port 19006 libre"
else
    log_warning "Port 19006 encore occupé"
fi

# Résumé de la purge
log "=== RÉSUMÉ DE LA PURGE ==="
log_success "Purge terminée avec succès !"
log ""
log "Éléments supprimés :"
log "  ✓ Environnements virtuels Python"
log "  ✓ Caches Python (__pycache__, .pytest_cache)"
log "  ✓ node_modules et cache Expo"
log "  ✓ Fichiers de logs (répertoire conservé)"
log "  ✓ Fichiers de déploiement"
log "  ✓ Fichiers temporaires"
log "  ✓ package-lock.json"
log "  ✓ Base de données de test MongoDB"
log ""
log "Pour redémarrer l'application proprement :"
log "  1. ./scripts/deploy.sh"
log ""
log "Pour exécuter les tests :"
log "  1. ./scripts/test_all.sh"
log ""
log "Consultez le fichier de log pour plus de détails : $(get_log_file)"
