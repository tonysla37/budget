#!/bin/bash

# Script de déploiement complet pour l'application Budget
# Ce script déploie à la fois le backend et le frontend

# Variables
APP_NAME="budget-app"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/deploy.log"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Fonction pour le logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Fonction pour gérer les erreurs et terminer proprement
handle_error() {
    log "ERREUR: $1"
    log "Déploiement échoué. Consultez le fichier log pour plus de détails: $LOG_FILE"
    exit 1
}

# Capture des signaux pour nettoyer proprement
trap 'handle_error "Signal d'\''interruption reçu"' INT TERM

# Créer le répertoire pour les logs si nécessaire et purger le fichier de log
mkdir -p "$(dirname "$LOG_FILE")"
> "$LOG_FILE"  # Purge le fichier de log

log "=== Démarrage du déploiement complet pour $APP_NAME ==="
log "Répertoire du script: $SCRIPT_DIR"
log "Répertoire racine du projet: $PROJECT_ROOT"
log "Répertoire backend: $BACKEND_DIR"
log "Répertoire frontend: $FRONTEND_DIR"

# Vérifier si nous sommes dans le bon répertoire
if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
    handle_error "Répertoires backend ou frontend introuvables. Veuillez vérifier la structure du projet."
fi

# Arrêter toute instance précédente
log "Arrêt des instances précédentes..."
if [ -f "$SCRIPT_DIR/stop_deploy.sh" ]; then
    bash "$SCRIPT_DIR/stop_deploy.sh" 2>&1 | tee -a "$LOG_FILE"
else
    log "Script d'arrêt global non trouvé. Tentative d'arrêt manuel..."
    
    # Arrêt du backend
    if [ -f "$BACKEND_DIR/stop_test.sh" ]; then
        log "Arrêt du backend..."
        bash "$BACKEND_DIR/stop_test.sh" 2>&1 | tee -a "$LOG_FILE"
    else
        log "Script d'arrêt du backend non trouvé. Tentative d'arrêt manuel..."
        UVICORN_PIDS=$(pgrep -f "uvicorn app.main:app")
        if [ ! -z "$UVICORN_PIDS" ]; then
            log "Arrêt des processus uvicorn: $UVICORN_PIDS"
            echo $UVICORN_PIDS | xargs kill
        fi
    fi
    
    # Arrêt du frontend
    if [ -f "$FRONTEND_DIR/stop_test.sh" ]; then
        log "Arrêt du frontend..."
        bash "$FRONTEND_DIR/stop_test.sh" 2>&1 | tee -a "$LOG_FILE"
    else
        log "Script d'arrêt du frontend non trouvé. Tentative d'arrêt manuel..."
        EXPO_PIDS=$(pgrep -f "expo start")
        if [ ! -z "$EXPO_PIDS" ]; then
            log "Arrêt des processus expo: $EXPO_PIDS"
            echo $EXPO_PIDS | xargs kill
        fi
        
        REACT_PIDS=$(pgrep -f "react-native start")
        if [ ! -z "$REACT_PIDS" ]; then
            log "Arrêt des processus react-native: $REACT_PIDS"
            echo $REACT_PIDS | xargs kill
        fi
    fi
fi

# Attendre que tous les processus soient arrêtés
log "Attente de l'arrêt complet des processus..."
sleep 3

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

# Vérifier si les ports nécessaires sont libres
if check_port 8000; then
    handle_error "Le port 8000 est déjà utilisé. Impossible de démarrer le backend."
fi

if check_port 19006; then
    handle_error "Le port 19006 est déjà utilisé. Impossible de démarrer le frontend."
fi

# Déploiement du backend
log "Démarrage du déploiement du backend..."
if [ -f "$BACKEND_DIR/deploy_test.sh" ]; then
    log "Exécution du script de déploiement du backend..."
    
    # Change directory to backend and execute the script
    cd "$BACKEND_DIR" || handle_error "Impossible d'accéder au répertoire backend"
    
    # Run the backend deployment script in the background
    log "Lancement du backend en arrière-plan..."
    bash "$BACKEND_DIR/deploy_test.sh" > "$BACKEND_DIR/deploy_output.log" 2>&1 &
    BACKEND_PID=$!
    
    log "Backend en cours de démarrage avec PID $BACKEND_PID"
    
    # Revenir au répertoire de base
    cd "$SCRIPT_DIR" || handle_error "Impossible de revenir au répertoire de base"
else
    handle_error "Script de déploiement du backend non trouvé: $BACKEND_DIR/deploy_test.sh"
fi

# Attendre que le backend soit disponible
log "Attente du démarrage du backend (30 secondes maximum)..."
ATTEMPTS=0
MAX_ATTEMPTS=30
BACKEND_READY=false

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ] && [ "$BACKEND_READY" = false ]; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs >/dev/null 2>&1; then
        BACKEND_READY=true
        log "Backend prêt ! (après $ATTEMPTS secondes)"
    else
        # Vérifier si le processus de backend est toujours en cours d'exécution
        if ! ps -p $BACKEND_PID > /dev/null; then
            log "Le processus backend s'est arrêté de façon inattendue. Vérifiez les logs: $BACKEND_DIR/deploy_output.log"
            log "$(tail -n 20 $BACKEND_DIR/deploy_output.log)"
            log "Tentative de démarrage sans le backend..."
            break
        fi
        
        ATTEMPTS=$((ATTEMPTS + 1))
        sleep 1
    fi
done

if [ "$BACKEND_READY" = false ]; then
    log "AVERTISSEMENT: Le backend n'est pas prêt après $MAX_ATTEMPTS secondes."
    log "Continuation avec le mode hors-ligne pour le frontend..."
    # Continuer avec le frontend même si le backend n'est pas prêt
    # Le frontend utilisera son mode hors-ligne
fi

# Déploiement du frontend
log "Démarrage du déploiement du frontend..."
if [ -f "$FRONTEND_DIR/deploy_test.sh" ]; then
    log "Exécution du script de déploiement du frontend..."
    
    # Si le backend n'est pas prêt, forcer le mode hors-ligne du frontend
    if [ "$BACKEND_READY" = false ]; then
        # Vérifier si le fichier de configuration API existe
        API_CONFIG_FILE="$FRONTEND_DIR/src/config/api.config.js"
        if [ -f "$API_CONFIG_FILE" ]; then
            log "Activation du mode hors-ligne pour le frontend..."
            
            # Faire une sauvegarde du fichier de configuration original
            cp "$API_CONFIG_FILE" "$API_CONFIG_FILE.bak"
            
            # Modifier le fichier pour activer le mode hors-ligne
            sed -i.tmp 's/DEBUG_IGNORE_BACKEND_FAILURE = false/DEBUG_IGNORE_BACKEND_FAILURE = true/g' "$API_CONFIG_FILE" || true
            sed -i.tmp 's/DEBUG_IGNORE_BACKEND_FAILURE = false;/DEBUG_IGNORE_BACKEND_FAILURE = true;/g' "$API_CONFIG_FILE" || true
            
            log "Mode hors-ligne activé pour le frontend"
        else
            log "AVERTISSEMENT: Impossible de trouver le fichier de configuration API pour activer le mode hors-ligne"
        fi
    fi
    
    # Change directory to frontend and execute the script
    cd "$FRONTEND_DIR" || handle_error "Impossible d'accéder au répertoire frontend"
    
    # Run the frontend deployment script in the background
    log "Lancement du frontend en arrière-plan..."
    bash "$FRONTEND_DIR/deploy_test.sh" > "$FRONTEND_DIR/deploy_output.log" 2>&1 &
    FRONTEND_PID=$!
    
    log "Frontend en cours de démarrage avec PID $FRONTEND_PID"
    
    # Revenir au répertoire de base
    cd "$SCRIPT_DIR" || handle_error "Impossible de revenir au répertoire de base"
else
    handle_error "Script de déploiement du frontend non trouvé: $FRONTEND_DIR/deploy_test.sh"
fi

# Attendre que le frontend soit disponible
log "Attente du démarrage du frontend (30 secondes maximum)..."
ATTEMPTS=0
MAX_ATTEMPTS=30
FRONTEND_READY=false

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ] && [ "$FRONTEND_READY" = false ]; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:19006 >/dev/null 2>&1; then
        FRONTEND_READY=true
        log "Frontend prêt ! (après $ATTEMPTS secondes)"
    else
        # Vérifier si le processus de frontend est toujours en cours d'exécution
        if ! ps -p $FRONTEND_PID > /dev/null; then
            log "Le processus frontend s'est arrêté de façon inattendue. Vérifiez les logs: $FRONTEND_DIR/deploy_output.log"
            log "$(tail -n 20 $FRONTEND_DIR/deploy_output.log)"
            handle_error "Échec du déploiement du frontend"
        fi
        
        ATTEMPTS=$((ATTEMPTS + 1))
        sleep 1
    fi
done

if [ "$FRONTEND_READY" = false ]; then
    log "AVERTISSEMENT: Le frontend n'est pas prêt après $MAX_ATTEMPTS secondes."
    log "Vérifiez les logs: $FRONTEND_DIR/deploy_output.log"
    log "$(tail -n 20 $FRONTEND_DIR/deploy_output.log)"
    handle_error "Échec du déploiement du frontend"
fi

# Résumé du déploiement
log "=== Déploiement terminé avec succès ==="
log "Statut du backend: $(if [ "$BACKEND_READY" = true ]; then echo "DISPONIBLE"; else echo "INDISPONIBLE (mode hors-ligne)"; fi)"
log "Statut du frontend: DISPONIBLE"
log "URLs:"
log "- Frontend: http://localhost:19006"
if [ "$BACKEND_READY" = true ]; then
    log "- Backend API: http://localhost:8000/api"
    log "- Documentation Swagger: http://localhost:8000/docs"
fi
log "Pour vous connecter, utilisez:"
log "- Email: test@example.com"
log "- Mot de passe: password123"
log ""
log "Pour arrêter l'application, exécutez: ./stop_test.sh"
log ""
log "Consultez les fichiers de log pour plus d'informations:"
log "- Log de déploiement global: $LOG_FILE"
log "- Log de déploiement du backend: $BACKEND_DIR/deploy_output.log"
log "- Log de déploiement du frontend: $FRONTEND_DIR/deploy_output.log"
log ""
log "Remarque: Si le backend n'est pas disponible, le frontend fonctionne en mode hors-ligne avec des données simulées."

# Rendre le script exécutable
chmod +x "$SCRIPT_DIR/deploy.sh" 