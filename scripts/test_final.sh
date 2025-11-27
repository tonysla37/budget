#!/bin/bash

# Script de test final pour l'application Budget
# Vérifie que tous les services sont actifs et fonctionnels

# Définir le nom du script AVANT de charger common.sh
SCRIPT_NAME="test_final"

# Charger les fonctions communes
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Initialiser le script
init_script

log "=== TEST FINAL - Application Budget ==="

# Fonction de test d'endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_code="$3"
    
    echo -n "Testing $name... "
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "$expected_code" ]; then
        log_success "$name (HTTP $response)"
        return 0
    else
        log_warning "$name (Expected $expected_code, got $response)"
        return 1
    fi
}

log "1. Tests Backend"
log "----------------"
test_endpoint "Swagger Docs" "http://localhost:8000/docs" "200"
test_endpoint "API Health" "http://localhost:8000/api/health" "200"
test_endpoint "Auth endpoint (sans données)" "http://localhost:8000/api/auth/login" "422"

log ""
log "2. Tests Frontend"
log "----------------"
test_endpoint "Frontend Home" "http://localhost:19006" "200"

log ""
log "3. Vérification des processus"
log "------------------------------"
if ps aux | grep -q "[u]vicorn.*8000"; then
    log_success "Backend running (port 8000)"
else
    log_error "Backend NOT running"
fi

if ps aux | grep -q "[v]ite"; then
    log_success "Frontend running (port 19006)"
else
    log_error "Frontend NOT running"
fi

log ""
log "4. Vérification MongoDB"
log "-----------------------"
if mongosh --quiet --eval "db.runCommand('ping').ok" > /dev/null 2>&1; then
    log_success "MongoDB is running"
    
    # Compter les documents
    users=$(mongosh budget_db --quiet --eval "db.users.countDocuments()")
    categories=$(mongosh budget_db --quiet --eval "db.categories.countDocuments()")
    transactions=$(mongosh budget_db --quiet --eval "db.transactions.countDocuments()")
    budgets=$(mongosh budget_db --quiet --eval "db.budgets.countDocuments()")
    
    log "  - Users: $users"
    log "  - Categories: $categories"
    log "  - Transactions: $transactions"
    log "  - Budgets: $budgets"
else
    log_error "MongoDB NOT running"
fi

log ""
log_success "=== Test terminé ==="

if ps aux | grep -q "[v]ite"; then
    echo -e "${GREEN}✓${NC} Frontend running (port 19006)"
else
    echo -e "${RED}✗${NC} Frontend NOT running"
fi

echo ""
echo "4. Vérification MongoDB"
echo "-----------------------"
if mongosh --quiet --eval "db.runCommand('ping').ok" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} MongoDB is running"
    
    # Compter les documents
    users=$(mongosh budget_db --quiet --eval "db.users.countDocuments()")
    categories=$(mongosh budget_db --quiet --eval "db.categories.countDocuments()")
    transactions=$(mongosh budget_db --quiet --eval "db.transactions.countDocuments()")
    budgets=$(mongosh budget_db --quiet --eval "db.budgets.countDocuments()")
    
    echo "  - Users: $users"
    echo "  - Categories: $categories"
    echo "  - Transactions: $transactions"
    echo "  - Budgets: $budgets"
else
    echo -e "${RED}✗${NC} MongoDB NOT running"
fi

echo ""
echo "========================================="
echo "Test terminé!"
echo "========================================="
