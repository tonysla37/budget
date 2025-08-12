#!/bin/bash

# Script de déploiement pour tester le frontend de l'application Budget

# Variables
APP_NAME="budget-app-frontend"
FRONTEND_DIR="$(pwd)"
LOG_FILE="$FRONTEND_DIR/frontend_deploy.log"
DEBUG_LOG="$FRONTEND_DIR/frontend_debug.log"
NODE_VERSION="16.x"
APP_PID=""
export DEBUG_LEVEL=verbose
export DEBUG_LOG_PATH="$PROJECT_ROOT/logs/frontend_debug.log"

# Fonction pour le logging
log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" | tee -a "$LOG_FILE"
    echo "[$timestamp] $1" >> "$DEBUG_LOG"
}

# Fonction de débogage plus détaillée
debug_log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [DEBUG] $1" >> "$DEBUG_LOG"
}

# Fonction pour afficher des informations de diagnostic système
log_system_info() {
    debug_log "------- INFORMATIONS SYSTÈME -------"
    debug_log "OS: $(uname -a)"
    debug_log "Node: $(node --version 2>&1 || echo 'non installé')"
    debug_log "NPM: $(npm --version 2>&1 || echo 'non installé')"
    debug_log "Espace disque: $(df -h | grep disk1s1)"
    debug_log "Mémoire: $(vm_stat | grep 'Pages free')"
    debug_log "----------------------------------"
}

# Fonction pour gérer les erreurs et terminer proprement
handle_error() {
    log "ERREUR: $1"
    debug_log "ERREUR FATALE: $1"
    log_system_info
    
    if [ ! -z "$APP_PID" ] && ps -p $APP_PID > /dev/null; then
        log "Arrêt du processus de l'application (PID: $APP_PID)..."
        kill $APP_PID
        sleep 2
        if ps -p $APP_PID > /dev/null; then
            log "Le processus ne répond pas, utilisation de kill -9..."
            kill -9 $APP_PID
        fi
    fi
    
    log "Déploiement échoué. Consultez les fichiers log pour plus de détails:"
    log "- Log principal: $LOG_FILE"
    log "- Log de débogage: $DEBUG_LOG"
    exit 1
}

# Capture des signaux pour nettoyer proprement
trap 'handle_error "Signal d'\''interruption reçu"' INT TERM

# Créer le répertoire pour les logs si nécessaire et purger les fichiers de log
mkdir -p "$(dirname "$LOG_FILE")"
> "$LOG_FILE"  # Purge du fichier de log principal
> "$DEBUG_LOG"  # Purge du fichier de log de débogage

log "=== Démarrage du déploiement de test pour $APP_NAME ==="
debug_log "Démarrage du script de déploiement"
log_system_info

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    log "Node.js n'est pas installé. Installation..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install node
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION} | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        handle_error "Système d'exploitation non supporté pour l'installation automatique de Node.js. Veuillez installer Node.js manuellement."
    fi
else
    log "Node.js est déjà installé: $(node --version)"
fi

# Vérifier si NPM est installé
if ! command -v npm &> /dev/null; then
    handle_error "NPM n'est pas installé. Veuillez installer Node.js avec NPM."
else
    log "NPM est déjà installé: $(npm --version)"
fi

# Installer les dépendances
log "Installation des dépendances..."
npm install --no-fund --no-audit --quiet 2>&1 | tee -a "$DEBUG_LOG" || handle_error "Échec de l'installation des dépendances"

# Installer explicitement webpack-config pour le support web
log "Installation des dépendances pour le support web..."
npm install @expo/webpack-config@^18.0.1 --no-fund --no-audit --quiet 2>&1 | tee -a "$DEBUG_LOG" || log "Note: @expo/webpack-config déjà installé ou erreur non bloquante"

# Vérifier la disponibilité du backend
log "Vérification de la disponibilité du backend..."
BACKEND_AVAILABLE=false

# Essayer de se connecter au backend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs | grep -q "^[23]"; then
    log "Backend disponible à http://localhost:8000"
    BACKEND_AVAILABLE=true
else
    log "Backend non disponible, attention cela peut poser des problèmes"
    # Note: le mode hors-ligne a été désactivé conformément aux préférences
fi

# Arrêter toute instance précédente de l'application
log "Arrêt des instances précédentes..."
EXPO_PIDS=$(pgrep -f "expo start")
if [ ! -z "$EXPO_PIDS" ]; then
    log "Processus expo trouvés: $EXPO_PIDS"
    echo $EXPO_PIDS | xargs kill
    sleep 2
    # Vérifier si des processus persistent et les forcer à s'arrêter
    REMAINING_PIDS=$(pgrep -f "expo start")
    if [ ! -z "$REMAINING_PIDS" ]; then
        log "Forçage de l'arrêt des processus restants: $REMAINING_PIDS"
        echo $REMAINING_PIDS | xargs kill -9
    fi
else
    log "Aucune instance expo précédente trouvée"
fi

# Démarrer l'application en mode développement
log "Démarrage de l'application en mode développement..."
npm start -- --web > "$LOG_FILE" 2>&1 &
APP_PID=$!

# Vérifier si le processus a démarré correctement
sleep 3
if ! ps -p $APP_PID > /dev/null; then
    handle_error "L'application n'a pas démarré correctement"
fi

log "Application démarrée avec PID $APP_PID"
log "Vous pouvez accéder à l'application à http://localhost:19006"

# Surveiller l'application pendant quelques secondes pour détecter les erreurs de démarrage
log "Surveillance du démarrage de l'application pendant 10 secondes..."
for i in {1..10}; do
    if ! ps -p $APP_PID > /dev/null; then
        handle_error "L'application s'est arrêtée de façon inattendue"
    fi
    
    # Vérifier si le serveur web est accessible
    if [ $i -eq 5 ]; then
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:19006 | grep -q "^[23]"; then
            log "Interface web accessible à http://localhost:19006"
            break
        else
            log "Attente de l'initialisation de l'interface web..."
        fi
    fi
    
    sleep 1
done

# Créer un script stop_test.sh s'il n'existe pas
if [ ! -f "stop_test.sh" ]; then
    log "Création du script stop_test.sh..."
    cat > stop_test.sh << 'EOF'
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
EOF
    chmod +x stop_test.sh
    log "Script stop_test.sh créé avec succès"
fi

log "Déploiement de test terminé avec succès"
log "Pour arrêter l'application, exécutez: ./stop_test.sh"
