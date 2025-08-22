#!/bin/bash

# Script commun pour tous les scripts de l'application Budget
# Ce fichier contient les fonctions et variables communes

# Variables communes
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
TEST_DATA_DIR="$SCRIPT_DIR/test_data"
LOGS_DIR="$PROJECT_ROOT/logs"

# Ports par défaut
FRONTEND_PORT=19006
BACKEND_PORT=8000

# Créer le répertoire logs s'il n'existe pas
mkdir -p "$LOGS_DIR"

# Variable pour le nom du script (doit être définie par le script appelant)
if [ -z "$SCRIPT_NAME" ]; then
    SCRIPT_NAME="unknown"
fi

# Fonction pour obtenir le fichier de log spécifique au script
get_log_file() {
    echo "$LOGS_DIR/${SCRIPT_NAME}.log"
}

# Fonction pour le logging avec timestamp
log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_file=$(get_log_file)
    echo "[$timestamp] [$SCRIPT_NAME] $1" | tee -a "$log_file"
}

# Fonction pour le logging d'erreur
log_error() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_file=$(get_log_file)
    echo -e "\033[0;31m[$timestamp] [$SCRIPT_NAME] ERREUR: $1\033[0m" | tee -a "$log_file"
}

# Fonction pour le logging d'avertissement
log_warning() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_file=$(get_log_file)
    echo -e "\033[0;33m[$timestamp] [$SCRIPT_NAME] AVERTISSEMENT: $1\033[0m" | tee -a "$log_file"
}

# Fonction pour le logging de succès
log_success() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_file=$(get_log_file)
    echo -e "\033[0;32m[$timestamp] [$SCRIPT_NAME] SUCCÈS: $1\033[0m" | tee -a "$log_file"
}

# Fonction pour le logging de débogage
log_debug() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_file=$(get_log_file)
    echo "[$timestamp] [$SCRIPT_NAME] [DEBUG] $1" >> "$log_file"
}

# Fonction pour gérer les erreurs et terminer proprement
handle_error() {
    local log_file=$(get_log_file)
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "\033[0;31m[$timestamp] [$SCRIPT_NAME] ERREUR: $1\033[0m" | tee -a "$log_file"
    echo -e "\033[0;31m[$timestamp] [$SCRIPT_NAME] ERREUR: Script $SCRIPT_NAME échoué. Consultez le fichier log pour plus de détails: $log_file\033[0m" | tee -a "$log_file"
    exit 1
}

# Fonction pour vérifier les erreurs après chaque commande
check_error() {
    if [ $? -ne 0 ]; then
        handle_error "La commande précédente a échoué avec le code $?"
    fi
}

# Fonction pour afficher des informations de diagnostic système
log_system_info() {
    log_debug "------- INFORMATIONS SYSTÈME -------"
    log_debug "OS: $(uname -a)"
    log_debug "Python: $(python3 --version 2>&1 || echo 'non installé')"
    log_debug "Node: $(node --version 2>&1 || echo 'non installé')"
    log_debug "NPM: $(npm --version 2>&1 || echo 'non installé')"
    
    # Vérifier MongoDB
    if command -v mongod &> /dev/null; then
        log_debug "MongoDB: $(mongod --version | head -n 1)"
        log_debug "MongoDB status: $(if pgrep -x mongod > /dev/null; then echo "running"; else echo "not running"; fi)"
    else
        log_debug "MongoDB: non installé ou non trouvé dans le PATH"
    fi
    
    log_debug "Espace disque: $(df -h . | tail -n 1)"
    log_debug "Mémoire: $(free -h 2>/dev/null | grep Mem || vm_stat 2>/dev/null | grep 'Pages free' || echo 'non disponible')"
    log_debug "----------------------------------"
}

# Fonction pour vérifier si un port est utilisé
check_port() {
    local port=$1
    if command -v lsof >/dev/null; then
        if lsof -i:"$port" >/dev/null 2>&1; then
            return 0  # Le port est utilisé
        fi
    elif command -v netstat >/dev/null; then
        if netstat -tuln | grep -q ":$port "; then
            return 0  # Le port est utilisé
        fi
    fi
    return 1  # Le port est libre
}

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
        log_warning "Certains processus $name ne répondent pas, utilisation de kill -9 (PID: $remaining_pids)"
        echo $remaining_pids | xargs kill -9 2>/dev/null
        sleep 1
        
        # Vérifier à nouveau
        local final_check=$(pgrep -f "$pattern" 2>/dev/null)
        if [ ! -z "$final_check" ]; then
            log_error "Impossible de terminer certains processus $name (PID: $final_check)"
            return 1
        fi
    fi
    
    log_success "Tous les processus $name arrêtés"
    return 0
}

# Fonction pour attendre qu'un service soit disponible
wait_for_service() {
    local url="$1"
    local service_name="$2"
    local max_attempts="${3:-30}"
    local attempts=0
    
    log "Attente de la disponibilité de $service_name (${max_attempts} secondes maximum)..."
    
    while [ $attempts -lt $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "^[23]"; then
            log_success "$service_name prêt ! (après $attempts secondes)"
            return 0
        fi
        
        attempts=$((attempts + 1))
        sleep 1
    done
    
    log_warning "$service_name n'est pas prêt après $max_attempts secondes"
    return 1
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
    log "Vérification des prérequis..."
    
    # Vérifier Python
    if ! command -v python3 &> /dev/null; then
        handle_error "Python 3 n'est pas installé"
    fi
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        handle_error "Node.js n'est pas installé"
    fi
    
    # Vérifier NPM
    if ! command -v npm &> /dev/null; then
        handle_error "NPM n'est pas installé"
    fi
    
    log_success "Tous les prérequis sont satisfaits"
}

# Fonction pour initialiser le script
init_script() {
    local log_file=$(get_log_file)
    
    # Purger le fichier de log
    > "$log_file"
    
    log "=== Démarrage du script $SCRIPT_NAME ==="
    log "Répertoire du projet: $PROJECT_ROOT"
    log "Fichier de log: $log_file"
    log_system_info
}

# Capture des signaux pour nettoyer proprement
trap 'handle_error "Signal d'\''interruption reçu"' INT TERM
