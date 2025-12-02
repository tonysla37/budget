#!/bin/bash

# Script de déploiement principal pour l'application Budget
# Ce script déploie le backend et le frontend

# Définir le nom du script AVANT de charger common.sh
SCRIPT_NAME="deploy"

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
API_HOST="localhost"
API_PORT=8000
API_BASE_URL="http://$API_HOST:$API_PORT"
FRONTEND_HOST="localhost"
FRONTEND_PORT=19006
FRONTEND_URL="http://$FRONTEND_HOST:$FRONTEND_PORT"

# Fonction pour arrêter les services existants
stop_existing_services() {
    log "Arrêt des services existants..."
    
    # Arrêt du backend
    kill_process_by_pattern "uvicorn app.main:app" "Backend uvicorn"
    
    # Arrêt du frontend
    kill_process_by_pattern "vite" "Vite"
    kill_process_by_pattern "node.*frontend" "Node frontend"
    
    # Attendre que tous les processus soient arrêtés
    sleep 3
}

# Fonction pour démarrer le backend
start_backend() {
    log "Démarrage du backend..."
    
    # Vérifier si l'environnement virtuel existe à la racine
    if [ ! -d "$PROJECT_ROOT/venv" ]; then
        log "Création de l'environnement virtuel Python à la racine..."
        cd "$PROJECT_ROOT" || handle_error "Impossible d'accéder à la racine du projet"
        python3 -m venv venv || handle_error "Impossible de créer l'environnement virtuel"
    fi
    
    # Activer l'environnement virtuel
    source "$PROJECT_ROOT/venv/bin/activate" || handle_error "Impossible d'activer l'environnement virtuel"
    
    cd "$BACKEND_DIR" || handle_error "Impossible d'accéder au répertoire backend"
    
    # Installer les dépendances
    log "Installation des dépendances Python..."
    pip install --upgrade pip
    pip install fastapi uvicorn pytest pymongo motor passlib python-jose pydantic[email] python-multipart httpx python-dotenv pydantic-settings pytest-asyncio bcrypt cryptography psutil pyyaml
    
    # Définir PYTHONPATH
    export PYTHONPATH=$BACKEND_DIR:$PYTHONPATH
    
    # Démarrer l'application avec le venv à la racine
    log "Démarrage de l'application backend..."
    "$PROJECT_ROOT/venv/bin/python" -m uvicorn app.main:app --reload --host 0.0.0.0 --port $API_PORT &
    BACKEND_PID=$!
    
    # Attendre que le backend soit disponible
    log "Attente du démarrage du backend..."
    for i in {1..30}; do
        if curl -s -f "$API_BASE_URL/api/health" > /dev/null 2>&1; then
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
        handle_error "Node.js n'est pas installé"
    fi
    
    # Vérifier si npm est installé
    if ! command -v npm &> /dev/null; then
        handle_error "npm n'est pas installé"
    fi
    
    # Installer les dépendances si nécessaire
    if [ ! -d "node_modules" ]; then
        log "Installation des dépendances Node.js..."
        npm install || handle_error "Échec de l'installation des dépendances"
    fi
    
    # Démarrer le frontend
    log "Démarrage de l'application frontend..."
    npm run dev &
    FRONTEND_PID=$!
    
    # Attendre que le frontend soit disponible
    log "Attente du démarrage du frontend..."
    for i in {1..30}; do
        if curl -s -f "$FRONTEND_URL" > /dev/null 2>&1; then
            log_success "Frontend prêt !"
            FRONTEND_READY=true
            break
        fi
        
        if [ $i -eq 30 ]; then
            log_warning "Le frontend n'est pas prêt après 30 secondes."
            FRONTEND_READY=false
        fi
        
        sleep 1
    done
    
    cd "$SCRIPT_DIR"
}

# Fonction pour afficher les URLs
display_urls() {
    log "URLs d'accès :"
    log "   - Frontend: $FRONTEND_URL"
    log "   - Backend API: $API_BASE_URL"
    log "   - Documentation: $API_BASE_URL/docs"
    log "   - Health check: $API_BASE_URL/api/health"
    log ""
    log "Pour arrêter l'application, exécutez: $SCRIPT_DIR/stop.sh"
    log ""
    log "Consultez les fichiers de log pour plus d'informations:"
    log "   - Log de déploiement: $LOG_FILE"
}

# Exécution principale
main() {
    stop_existing_services
    start_backend
    start_frontend
    display_urls
    
    if [ "$BACKEND_READY" = true ] && [ "$FRONTEND_READY" = true ]; then
        log_success "✅ Déploiement terminé avec succès"
    else
        log_warning "⚠️ Déploiement terminé avec des avertissements"
        if [ "$BACKEND_READY" = false ]; then
            log_warning "   - Backend non prêt"
        fi
        if [ "$FRONTEND_READY" = false ]; then
            log_warning "   - Frontend non prêt"
        fi
    fi
}

# Exécuter la fonction principale
main
