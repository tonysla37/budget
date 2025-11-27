#!/bin/bash

# Script de test pour les changements de cycle de facturation
# Teste différentes valeurs de billing_cycle_day

# Définir le nom du script AVANT de charger common.sh
SCRIPT_NAME="test_cycle_changes"

# Charger les fonctions communes
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Initialiser le script
init_script

log "=== Test des changements de cycle ==="

# Login
log "Connexion à l'API..."
TOKEN=$(curl -s -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"Demo1234!"}' | \
  grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    log_error "Échec de la connexion"
    exit 1
fi

log_success "Token obtenu"

# Test 1: Changer à 1 (début de mois calendaire)
log ""
log "1. Changement à billing_cycle_day = 1"
curl -s -X PUT "http://localhost:8000/api/settings/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"billing_cycle_day": 1}' | python3 -m json.tool

# Test 2: Changer à 15 (milieu de mois)
log ""
log "2. Changement à billing_cycle_day = 15"
curl -s -X PUT "http://localhost:8000/api/settings/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"billing_cycle_day": 15}' | python3 -m json.tool

# Test 3: Changer à 25 (fin de mois - cas d'usage principal)
log ""
log "3. Changement à billing_cycle_day = 25"
curl -s -X PUT "http://localhost:8000/api/settings/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"billing_cycle_day": 25}' | python3 -m json.tool

# Test 4: Valeur invalide (> 28)
log ""
log "4. Test valeur invalide (30 - devrait échouer)"
curl -s -X PUT "http://localhost:8000/api/settings/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"billing_cycle_day": 30}' | python3 -m json.tool

log ""
log_success "Tests terminés !"
