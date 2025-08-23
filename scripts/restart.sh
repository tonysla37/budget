#!/bin/bash

# Script de redémarrage pour l'application Budget
# Ce script arrête tous les services puis les redémarre

# Définir le nom du script AVANT de charger common.sh
SCRIPT_NAME="restart"

# Charger les fonctions communes
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Initialiser le script
init_script

log "=== Redémarrage de l'application Budget ==="

# Étape 1: Arrêt des services
log "Étape 1: Arrêt des services existants..."

# Arrêt des processus backend
log "Arrêt du backend..."
kill_process_by_pattern "uvicorn app.main:app" "Backend uvicorn"
kill_process_by_pattern "python.*backend/deploy.sh" "Script de déploiement backend"
kill_process_by_pattern "python.*uvicorn" "Uvicorn Python"

# Arrêt des processus frontend
log "Arrêt du frontend..."
kill_process_by_pattern "expo start" "Expo"
kill_process_by_pattern "expo" "Expo CLI"
kill_process_by_pattern "react-native start" "React Native"
kill_process_by_pattern "npm.*start" "NPM Start"
kill_process_by_pattern "node.*frontend/deploy.sh" "Script de déploiement frontend"
kill_process_by_pattern "node.*expo" "Node Expo"
kill_process_by_pattern "vite" "Vite"

# Arrêt des processus de déploiement global
log "Arrêt des scripts de déploiement globaux..."
kill_process_by_pattern "bash.*deploy.sh" "Script de déploiement principal"
kill_process_by_pattern "bash.*test_.*\.sh" "Scripts de test"

# Arrêt des processus sur les ports spécifiques
log "Arrêt des processus sur les ports spécifiques..."
PORT_8000_PID=$(lsof -ti:8000 2>/dev/null)
if [ ! -z "$PORT_8000_PID" ]; then
    log "Arrêt du processus sur le port 8000 (PID: $PORT_8000_PID)..."
    kill -9 $PORT_8000_PID 2>/dev/null
fi

PORT_19006_PID=$(lsof -ti:19006 2>/dev/null)
if [ ! -z "$PORT_19006_PID" ]; then
    log "Arrêt du processus sur le port 19006 (PID: $PORT_19006_PID)..."
    kill -9 $PORT_19006_PID 2>/dev/null
fi

PORT_19007_PID=$(lsof -ti:19007 2>/dev/null)
if [ ! -z "$PORT_19007_PID" ]; then
    log "Arrêt du processus sur le port 19007 (PID: $PORT_19007_PID)..."
    kill -9 $PORT_19007_PID 2>/dev/null
fi

# Attendre que tous les processus soient arrêtés
log "Attente de l'arrêt complet des processus..."
sleep 5

# Vérification de l'arrêt
log "Vérification de l'arrêt des processus..."
if lsof -i:8000 >/dev/null 2>&1; then
    log_warning "Le port 8000 est encore occupé"
else
    log_success "Port 8000 libéré"
fi

if lsof -i:19006 >/dev/null 2>&1; then
    log_warning "Le port 19006 est encore occupé"
else
    log_success "Port 19006 libéré"
fi

if lsof -i:19007 >/dev/null 2>&1; then
    log_warning "Le port 19007 est encore occupé"
else
    log_success "Port 19007 libéré"
fi

# Étape 2: Redémarrage des services
log "Étape 2: Redémarrage des services..."

# Redémarrer en utilisant le script de déploiement
log "Lancement du script de déploiement..."
"$SCRIPT_DIR/deploy.sh"

# Vérification finale
log "Étape 3: Vérification du redémarrage..."

# Attendre un peu pour que les services démarrent
sleep 10

# Vérifier le backend
if curl -s -f "http://localhost:8000/api/health" > /dev/null 2>&1; then
    log_success "Backend redémarré avec succès"
else
    log_error "Le backend n'est pas accessible"
fi

# Vérifier le frontend
if curl -s -f "http://localhost:19006" > /dev/null 2>&1 || curl -s -f "http://localhost:19007" > /dev/null 2>&1; then
    log_success "Frontend redémarré avec succès"
else
    log_warning "Le frontend pourrait ne pas être encore prêt"
fi

log_success "=== Redémarrage terminé ==="
log "URLs d'accès :"
log "  - Frontend: http://localhost:19006 (ou 19007)"
log "  - Backend API: http://localhost:8000"
log "  - Documentation: http://localhost:8000/docs"
log "  - Health check: http://localhost:8000/api/health"
