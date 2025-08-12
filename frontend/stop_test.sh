#!/bin/bash
# Script d'arrêt du frontend

LOG_FILE="frontend_deploy.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Arrêt du frontend..."

# Recherche des processus expo
EXPO_PIDS=$(pgrep -f "expo start")
if [ ! -z "$EXPO_PIDS" ]; then
    log "Processus expo trouvés: $EXPO_PIDS"
    echo $EXPO_PIDS | xargs kill
    sleep 2
    
    # Vérifier si des processus persistent
    REMAINING_PIDS=$(pgrep -f "expo start")
    if [ ! -z "$REMAINING_PIDS" ]; then
        log "Forçage de l'arrêt des processus restants: $REMAINING_PIDS"
        echo $REMAINING_PIDS | xargs kill -9
    fi
    
    log "Frontend arrêté avec succès"
else
    log "Aucun processus frontend trouvé"
fi

# Recherche des processus npm
NPM_PIDS=$(pgrep -f "npm start")
if [ ! -z "$NPM_PIDS" ]; then
    log "Processus npm trouvés: $NPM_PIDS"
    echo $NPM_PIDS | xargs kill
    sleep 2
    
    # Vérifier si des processus persistent
    REMAINING_PIDS=$(pgrep -f "npm start")
    if [ ! -z "$REMAINING_PIDS" ]; then
        log "Forçage de l'arrêt des processus restants: $REMAINING_PIDS"
        echo $REMAINING_PIDS | xargs kill -9
    fi
    
    log "Processus npm arrêtés avec succès"
fi
