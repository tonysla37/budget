#!/bin/bash

# Script de test pour le frontend de l'application Budget

# Définir le nom du script AVANT de charger common.sh
SCRIPT_NAME="test_frontend"

# Charger les fonctions communes
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Initialiser le script
init_script

# Variables spécifiques aux tests frontend
FRONTEND_HOST="localhost"
FRONTEND_PORT=19006
FRONTEND_URL="http://$FRONTEND_HOST:$FRONTEND_PORT"
API_HOST="localhost"
API_PORT=8000
API_BASE_URL="http://$API_HOST:$API_PORT"

log "Répertoire du frontend: $FRONTEND_DIR"

# Vérifier que Node.js est installé
log "Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    handle_error "Node.js n'est pas installé"
fi

log "Node.js trouvé: $(node --version)"

# Vérifier que npm est installé
log "Vérification de npm..."
if ! command -v npm &> /dev/null; then
    handle_error "npm n'est pas installé"
fi

log "npm trouvé: $(npm --version)"

# Vérifier si le backend est disponible
log "Vérification de la disponibilité du backend..."
if curl -s -f "$API_BASE_URL/api/health" > /dev/null 2>&1; then
    log_success "Backend disponible sur $API_BASE_URL"
else
    log_warning "Backend non disponible sur $API_BASE_URL"
    log "Le frontend peut fonctionner sans backend pour les tests de base"
fi

# Aller dans le répertoire frontend
cd "$FRONTEND_DIR" || handle_error "Impossible d'accéder au répertoire frontend"

# Vérifier si package.json existe
if [ ! -f "package.json" ]; then
    handle_error "package.json non trouvé dans le répertoire frontend"
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    log "Installation des dépendances Node.js..."
    npm install || handle_error "Échec de l'installation des dépendances"
fi

# Arrêter les processus frontend existants
log "Arrêt des processus frontend existants..."
kill_process_by_pattern "vite" "Vite"
kill_process_by_pattern "node.*frontend" "Node frontend"

# Attendre que les processus soient arrêtés
sleep 2

# Démarrer le frontend
log "Démarrage du frontend..."
npm run dev &
FRONTEND_PID=$!

# Attendre que le frontend soit disponible
log "Attente du démarrage du frontend..."
for i in {1..30}; do
    if curl -s -f "$FRONTEND_URL" > /dev/null 2>&1; then
        log_success "Frontend prêt !"
        break
    fi
    
    if [ $i -eq 30 ]; then
        log_error "Le frontend n'est pas prêt après 30 secondes"
        kill $FRONTEND_PID 2>/dev/null
        exit 1
    fi
    
    sleep 1
done

# Test de connectivité
log "Test de connectivité du frontend..."
if curl -s "$FRONTEND_URL" | grep -q "Budget App"; then
    log_success "✅ Frontend accessible et affiche le contenu attendu"
else
    log_warning "⚠️ Frontend accessible mais contenu inattendu"
fi

# Test de l'API si le backend est disponible
if curl -s -f "$API_BASE_URL/api/health" > /dev/null 2>&1; then
    log "Test de l'API backend..."
    API_RESPONSE=$(curl -s "$API_BASE_URL/api/health")
    if echo "$API_RESPONSE" | grep -q "status.*ok"; then
        log_success "✅ API backend fonctionnelle"
    else
        log_warning "⚠️ API backend répond mais format inattendu"
    fi
fi

# Arrêter le frontend
log "Arrêt du frontend de test..."
kill $FRONTEND_PID 2>/dev/null

log_success "✅ Tests frontend terminés avec succès"
log " Frontend testé sur: $FRONTEND_URL"
log " Backend testé sur: $API_BASE_URL"
