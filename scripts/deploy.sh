#!/bin/bash

# Script de déploiement principal pour l'application Budget
# Ce script déploie le backend et le frontend

# Charger les fonctions communes
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Initialiser le script
init_script

log "Répertoire des scripts: $SCRIPT_DIR"
log "Date et heure: $(date)"

# Variables pour les services
BACKEND_READY=false
FRONTEND_READY=false
BACKEND_PID=""
FRONTEND_PID=""

# Fonction pour arrêter les services existants
stop_existing_services() {
    log "Arrêt des services existants..."
    
    # Arrêt du backend
    kill_process_by_pattern "uvicorn app.main:app" "Backend uvicorn"
    
    # Arrêt du frontend
    kill_process_by_pattern "expo start" "Expo"
    kill_process_by_pattern "react-native start" "React Native"
    kill_process_by_pattern "npm.*start" "NPM Start"
    
    # Attendre que tous les processus soient arrêtés
    sleep 3
}

# Fonction pour démarrer le backend
start_backend() {
    log "Démarrage du backend..."
    
    cd "$BACKEND_DIR" || handle_error "Impossible d'accéder au répertoire backend"
    
    # Vérifier si l'environnement virtuel existe
    if [ ! -d "venv" ]; then
        log "Création de l'environnement virtuel Python..."
        python3 -m venv venv || handle_error "Impossible de créer l'environnement virtuel"
    fi
    
    # Activer l'environnement virtuel
    source venv/bin/activate || handle_error "Impossible d'activer l'environnement virtuel"
    
    # Installer les dépendances
    log "Installation des dépendances Python..."
    pip install --upgrade pip
    pip install fastapi uvicorn pytest pymongo motor passlib python-jose pydantic[email] python-multipart httpx python-dotenv pydantic-settings pytest-asyncio bcrypt cryptography psutil pyyaml
    
    # Définir PYTHONPATH
    export PYTHONPATH=$BACKEND_DIR:$PYTHONPATH
    
    # Démarrer l'application
    log "Démarrage de l'application backend..."
    python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    
    # Attendre que le backend soit disponible
    log "Attente du démarrage du backend..."
    for i in {1..30}; do
        if curl -s -f "http://localhost:8000/api/health" > /dev/null 2>&1; then
            log_success "Backend prêt !"
            BACKEND_READY=true
            break
        fi
        
        if [ $i -eq 30 ]; then
            log_warning "Le backend n'est pas prêt après 30 secondes."
            BACKEND_READY=false
        fi
        
        sleep 1
    done
    
    cd "$SCRIPT_DIR"
}

# Fonction pour démarrer le frontend
start_frontend() {
    log "Démarrage du frontend..."
    
    cd "$FRONTEND_DIR" || handle_error "Impossible d'accéder au répertoire frontend"
    
    # Vérifier si Node.js est installé
    if ! command -v node &> /dev/null; then
        log "Node.js n'est pas installé. Installation..."
        curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Installer les dépendances
    log "Installation des dépendances Node.js..."
    npm install
    
    # Démarrer l'application
    log "Démarrage de l'application frontend..."
    CI=1 npx expo start --port 19006 --non-interactive &
    FRONTEND_PID=$!
    
    # Attendre que le frontend soit disponible
    log "Attente du démarrage du frontend..."
    for i in {1..30}; do
        if curl -s -f "http://localhost:19006" > /dev/null 2>&1; then
            log_success "Frontend prêt !"
            FRONTEND_READY=true
            break
        fi
        
        if [ $i -eq 30 ]; then
            log_error "Le frontend n'est pas prêt après 30 secondes."
            FRONTEND_READY=false
        fi
        
        sleep 1
    done
    
    cd "$SCRIPT_DIR"
}

# Arrêter les services existants
stop_existing_services

# Démarrer le backend
start_backend

# Démarrer le frontend
start_frontend

# Résumé du déploiement
log "=== Déploiement terminé ==="
log "Statut du backend: $(if [ "$BACKEND_READY" = true ]; then echo "DISPONIBLE"; else echo "INDISPONIBLE"; fi)"
log "Statut du frontend: $(if [ "$FRONTEND_READY" = true ]; then echo "DISPONIBLE"; else echo "INDISPONIBLE"; fi)"
log ""
log "URLs:"
if [ "$BACKEND_READY" = true ]; then
    log "- Backend API: http://localhost:8000/"
    log "- Documentation Swagger: http://localhost:8000/docs"
    log "- Health check: http://localhost:8000/api/health"
fi
if [ "$FRONTEND_READY" = true ]; then
    log "- Frontend: http://localhost:19006"
fi
log ""
log "Pour arrêter l'application, exécutez: $SCRIPT_DIR/stop.sh"
log ""
log "Consultez les fichiers de log pour plus d'informations:"
log "- Log de déploiement: $(get_log_file)"
