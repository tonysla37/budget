#!/bin/bash

# Script d'arrêt global pour l'application Budget

# Charger les fonctions communes
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Initialiser le script
init_script

log "=== Arrêt de l'application Budget ==="

# Arrêt des processus backend
log "Arrêt du backend..."
kill_process_by_pattern "uvicorn app.main:app" "Backend uvicorn"
kill_process_by_pattern "python.*backend/deploy.sh" "Script de déploiement backend"

# Arrêt des processus frontend
log "Arrêt du frontend..."
kill_process_by_pattern "expo start" "Expo"
kill_process_by_pattern "react-native start" "React Native"
kill_process_by_pattern "npm.*start" "NPM Start"
kill_process_by_pattern "node.*frontend/deploy.sh" "Script de déploiement frontend"

# Arrêt des processus de déploiement global
log "Arrêt des scripts de déploiement globaux..."
kill_process_by_pattern "bash.*deploy.sh" "Script de déploiement principal"

log_success "=== Arrêt terminé ==="
log "Pour redémarrer l'application: $SCRIPT_DIR/deploy.sh"
