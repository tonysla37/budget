#!/bin/bash

# Script d'arrêt global pour l'application Budget

# Variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/stop.log"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Fonction pour le logging
log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

# Fonction pour les messages colorés
log_success() {
    echo -e "\033[0;32m[$1] $2\033[0m" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "\033[0;33m[$1] $2\033[0m" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "\033[0;31m[$1] $2\033[0m" | tee -a "$LOG_FILE"
}

# Créer le répertoire pour les logs si nécessaire
mkdir -p "$(dirname "$LOG_FILE")"
> "$LOG_FILE"  # Purge le fichier de log

log "=== Arrêt de l'application Budget ==="

# Fonction pour tuer des processus en fonction d'un motif
kill_process_by_pattern() {
    local pattern="$1"
    local name="$2"
    local pids=$(pgrep -f "$pattern" 2>/dev/null)
    
    if [ -z "$pids" ]; then
        log "Aucun processus $name trouvé"
        return 0
    fi
    
    log "Arrêt des processus $name (PID: $pids)..."
    
    # Tentative d'arrêt normal
    echo $pids | xargs kill 2>/dev/null
    sleep 2
    
    # Vérifier si des processus persistent
    local remaining_pids=$(pgrep -f "$pattern" 2>/dev/null)
    if [ ! -z "$remaining_pids" ]; then
        log_warning "$name" "Certains processus ne répondent pas, utilisation de kill -9 (PID: $remaining_pids)"
        echo $remaining_pids | xargs kill -9 2>/dev/null
        sleep 1
        
        # Vérifier à nouveau
        local final_check=$(pgrep -f "$pattern" 2>/dev/null)
        if [ ! -z "$final_check" ]; then
            log_error "$name" "Impossible de terminer certains processus (PID: $final_check)"
            return 1
        fi
    fi
    
    log_success "$name" "Tous les processus arrêtés"
    return 0
}

# Arrêt des processus backend
log "Arrêt du backend..."
kill_process_by_pattern "uvicorn app.main:app" "Backend uvicorn"
kill_process_by_pattern "python.*backend/deploy_test.sh" "Script de déploiement backend"

# Arrêt des processus frontend
log "Arrêt du frontend..."
kill_process_by_pattern "expo start" "Expo"
kill_process_by_pattern "react-native start" "React Native"
kill_process_by_pattern "npm.*start" "NPM Start"
kill_process_by_pattern "node.*frontend/deploy_test.sh" "Script de déploiement frontend"

# Arrêt des processus de déploiement global
log "Arrêt des scripts de déploiement globaux..."
kill_process_by_pattern "bash.*deploy.sh" "Script de déploiement principal"

log "=== Arrêt terminé ==="
log "Pour redémarrer l'application: bash $SCRIPT_DIR/deploy.sh" 