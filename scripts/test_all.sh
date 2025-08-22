#!/bin/bash

# Script de test d'ensemble pour l'application Budget
# Ce script exécute tous les tests : base de données, backend et frontend

# Définir le nom du script AVANT de charger common.sh
SCRIPT_NAME="test_all"

# Charger les fonctions communes
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Initialiser le script
init_script

log "Répertoire des scripts: $SCRIPT_DIR"
log "Date et heure: $(date)"

# Vérifier la présence des scripts de test
if [ ! -f "$SCRIPT_DIR/test_database.sh" ] || [ ! -f "$SCRIPT_DIR/test_backend.sh" ] || [ ! -f "$SCRIPT_DIR/test_frontend.sh" ]; then
    handle_error "Les scripts de test sont manquants"
fi

# 1. Tests de la base de données
log "1. Démarrage des tests de la base de données..."
bash "$SCRIPT_DIR/test_database.sh"

if [ $? -ne 0 ]; then
    handle_error "Les tests de la base de données ont échoué"
fi

log_success "Tests de la base de données terminés avec succès"

# 2. Tests du backend
log "2. Démarrage des tests du backend..."
bash "$SCRIPT_DIR/test_backend.sh"

if [ $? -ne 0 ]; then
    handle_error "Les tests du backend ont échoué"
fi

log_success "Tests du backend terminés avec succès"
log "Attente de 5 secondes avant de poursuivre..."
sleep 5

# 3. Tests du frontend
log "3. Démarrage des tests du frontend..."
bash "$SCRIPT_DIR/test_frontend.sh"

if [ $? -ne 0 ]; then
    handle_error "Les tests du frontend ont échoué"
fi

log_success "Tests du frontend terminés avec succès"

# Afficher le résumé
log "=== Résumé des tests ==="
log_success "✓ Tests de la base de données : RÉUSSIS"
log_success "✓ Tests du backend : RÉUSSIS"
log_success "✓ Tests du frontend : RÉUSSIS"
log "=== Fin des tests ==="
log_success "Tous les tests ont été exécutés avec succès!"
log "Pour consulter les résultats détaillés, voir les fichiers de log dans $LOGS_DIR/"

log_success "=== Fin des tests d'ensemble ==="
log "Tous les tests ont été exécutés avec succès."
log "Fichiers de log générés :"
log "  - $LOGS_DIR/test_database.log"
log "  - $LOGS_DIR/test_backend.log"
log "  - $LOGS_DIR/test_frontend.log"
log "  - $LOGS_DIR/test_all.log"
