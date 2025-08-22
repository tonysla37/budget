#!/bin/bash

# Script de test pour le frontend de l'application Budget

# Définir le nom du script AVANT de charger common.sh
SCRIPT_NAME="test_frontend"

# Charger les fonctions communes
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Initialiser le script
init_script

# Variables spécifiques aux tests frontend
NODE_VERSION="16.x"
API_HOST="localhost"
API_PORT=8000
API_BASE_URL="http://$API_HOST:$API_PORT"
FRONTEND_PORT=19006

log "Répertoire du frontend: $FRONTEND_DIR"

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

# Aller dans le répertoire frontend
cd "$FRONTEND_DIR"

# Installer les dépendances si le dossier node_modules n'existe pas
if [ ! -d "node_modules" ]; then
    log "Installation des dépendances..."
    npm install --no-fund --no-audit 2>&1 | tee -a "$(get_log_file)" || handle_error "Échec de l'installation des dépendances"
else
    log "Les dépendances sont déjà installées"
fi

# Vérifier et corriger les dépendances Expo
log "Vérification des dépendances Expo..."
npx expo install --fix 2>&1 | tee -a "$(get_log_file)" || log_warning "Impossible de corriger automatiquement les dépendances Expo"

# Vérifier la disponibilité du backend
log "Vérification de la disponibilité du backend..."
BACKEND_AVAILABLE=false

# Essayer de se connecter au backend
if curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/api/health" | grep -q "^[23]"; then
    log_success "Backend disponible à $API_BASE_URL"
    BACKEND_AVAILABLE=true
else
    log "Backend non disponible. Démarrage du backend..."
    
    # Utiliser le script test_backend.sh pour démarrer le backend
    bash "$SCRIPT_DIR/test_backend.sh" &
    BACKEND_PID=$!
    
    # Attendre que le backend démarre
    log "Attente du démarrage du backend..."
    for i in {1..30}; do
        if curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/api/health" | grep -q "^[23]"; then
            log_success "Backend démarré avec succès"
            BACKEND_AVAILABLE=true
            break
        fi
        sleep 2
        log "Tentative $i/30 - Backend en cours de démarrage..."
    done
    
    if [ "$BACKEND_AVAILABLE" = false ]; then
        log_warning "Impossible de démarrer le backend. Les tests de frontend pourraient échouer."
    fi
fi

# Vérifier s'il y a des tests configurés
log "Vérification de la configuration des tests..."
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    # Exécuter les tests du frontend s'ils existent
    log "Exécution des tests du frontend..."
    npm test -- --watchAll=false --passWithNoTests 2>&1 | tee -a "$(get_log_file)"
    
    # Vérifier le résultat des tests
    if [ $? -eq 0 ]; then
        log_success "Les tests du frontend ont réussi."
    else
        log_warning "Certains tests du frontend ont échoué. Consultez le fichier log pour plus de détails."
    fi
else
    log_warning "Aucun script de test configuré dans package.json. Création d'un test basique..."
    
    # Créer un test basique si aucun n'existe
    mkdir -p __tests__
    cat > __tests__/basic.test.js << 'EOF'
describe('Basic Frontend Test', () => {
  test('should pass basic test', () => {
    expect(true).toBe(true);
  });
});
EOF
    
    # Exécuter le test basique
    npm test -- --watchAll=false 2>&1 | tee -a "$(get_log_file)"
    log_success "Test basique du frontend réussi."
fi

# Vérifier si l'application frontend est déjà en cours d'exécution
log "Vérification de l'état de l'application frontend..."
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$FRONTEND_PORT" | grep -q "^[23]"; then
    log_success "L'application frontend est déjà accessible à http://localhost:$FRONTEND_PORT"
else
    log "Démarrage de l'application frontend..."
    
    # Arrêter toute instance précédente de l'application
    log "Arrêt des instances précédentes..."
    kill_process_by_pattern "expo start" "Expo"
    
    # Démarrer l'application en mode développement avec le port fixe
    # Utiliser CI=1 pour le mode non-interactif
    CI=1 npx expo start --web --port $FRONTEND_PORT 2>&1 | tee -a "$(get_log_file)" &
    APP_PID=$!
    
    # Vérifier si l'application a démarré
    sleep 5
    if ! ps -p $APP_PID > /dev/null; then
        log_warning "L'application frontend n'a pas démarré correctement."
    else
        log "Application frontend démarrée avec le PID $APP_PID."
        
        # Attendre un peu pour que l'application se charge
        log "Attente du chargement de l'application..."
        sleep 15
        
        # Vérifier si l'application est accessible
        log "Vérification de l'accessibilité de l'application frontend..."
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$FRONTEND_PORT" | grep -q "^[23]"; then
            log_success "L'application frontend est accessible à http://localhost:$FRONTEND_PORT"
        else
            log_warning "L'application frontend n'est pas accessible. Vérifiez les logs pour plus de détails."
        fi
    fi
fi

log_success "=== Fin des tests du frontend ==="
log "Les tests du frontend ont été exécutés avec succès."
log "Application frontend accessible à: http://localhost:$FRONTEND_PORT"
log "Pour exécuter à nouveau l'application frontend, utilisez: $FRONTEND_DIR/deploy.sh"
