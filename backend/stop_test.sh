#!/bin/bash
# Script d'arrêt de l'application de test

# Définir le chemin du fichier de log
LOG_FILE="/Users/tonyauge/Library/Mobile Documents/com~apple~CloudDocs/Code/budget/backend/deploy_test.log"

# Fonction pour obtenir la date et l'heure actuelles
get_timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# Fonction pour logger les messages
log_message() {
    local timestamp=$(get_timestamp)
    echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

# Arrêt de l'application
log_message "Arrêt de l'application..."

# Recherche des processus uvicorn
UVICORN_PIDS=$(pgrep -f "uvicorn app.main:app")
if [ ! -z "$UVICORN_PIDS" ]; then
    log_message "Processus trouvés: $UVICORN_PIDS"
    echo $UVICORN_PIDS | xargs kill
    sleep 2
    
    # Vérifier si des processus persistent
    REMAINING_PIDS=$(pgrep -f "uvicorn app.main:app")
    if [ ! -z "$REMAINING_PIDS" ]; then
        log_message "Forçage de l'arrêt des processus restants: $REMAINING_PIDS"
        echo $REMAINING_PIDS | xargs kill -9
    fi
    
    log_message "Application arrêtée avec succès"
    
    # Supprimer le fichier de log si l'application s'est arrêtée correctement
    if [ -f "$LOG_FILE" ]; then
        log_message "Suppression du fichier de log"
        rm "$LOG_FILE"
    fi
else
    log_message "Aucun processus d'application trouvé"
fi
