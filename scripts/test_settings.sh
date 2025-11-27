#!/bin/bash

# Script de test pour l'API Settings
# Teste la récupération et la mise à jour des paramètres utilisateur

# Définir le nom du script AVANT de charger common.sh
SCRIPT_NAME="test_settings"

# Charger les fonctions communes
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Initialiser le script
init_script

log "=== Test de l'API Settings ==="

# 1. Login
log ""
log "1. Connexion..."
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"Demo1234!"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  log_error "Échec de la connexion"
  echo $LOGIN_RESPONSE
  exit 1
fi

log_success "Token obtenu: ${TOKEN:0:30}..."

# 2. GET /api/settings/
log ""
log "2. Récupération des paramètres actuels..."
CURRENT_SETTINGS=$(curl -s -X GET "http://localhost:8000/api/settings/" \
  -H "Authorization: Bearer $TOKEN")
echo "$CURRENT_SETTINGS" | python3 -m json.tool

# 3. PUT /api/settings/ - Changer le billing_cycle_day à 25
log ""
log "3. Mise à jour du billing_cycle_day à 25..."
UPDATE_RESPONSE=$(curl -s -X PUT "http://localhost:8000/api/settings/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"billing_cycle_day": 25}')
echo "$UPDATE_RESPONSE" | python3 -m json.tool

# 4. Vérification
log ""
log "4. Vérification après mise à jour..."
UPDATED_SETTINGS=$(curl -s -X GET "http://localhost:8000/api/settings/" \
  -H "Authorization: Bearer $TOKEN")
echo "$UPDATED_SETTINGS" | python3 -m json.tool

log ""
log_success "Tests terminés !"
