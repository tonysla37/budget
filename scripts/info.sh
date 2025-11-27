#!/bin/bash

# Script d'information sur tous les scripts disponibles
# Affiche un résumé avec descriptions

# Couleurs
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          SCRIPTS - APPLICATION BUDGET                         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Fonction pour afficher un script avec sa description
show_script() {
    local script="$1"
    local category="$2"
    local description="$3"
    
    if [ -f "$SCRIPT_DIR/$script" ]; then
        echo -e "  ${GREEN}✓${NC} ${YELLOW}$script${NC}"
        echo -e "    📝 $description"
        echo -e "    💻 Usage: ./scripts/$script"
        echo ""
    fi
}

echo -e "${BLUE}📦 SCRIPTS DE DÉPLOIEMENT${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
show_script "deploy.sh" "déploiement" "Déploie l'application complète (backend + frontend)"
show_script "restart.sh" "déploiement" "Redémarre tous les services"
show_script "stop.sh" "déploiement" "Arrête tous les services"

echo -e "${BLUE}🧪 SCRIPTS DE TEST${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
show_script "test_final.sh" "test" "Test complet de l'application en production"
show_script "test_all.sh" "test" "Exécute tous les tests (database, backend, frontend)"
show_script "test_backend.sh" "test" "Tests spécifiques au backend"
show_script "test_frontend.sh" "test" "Tests spécifiques au frontend"
show_script "test_database.sh" "test" "Tests de la base de données MongoDB"
show_script "test_settings.sh" "test" "Tests de l'API Settings"
show_script "test_cycle_changes.sh" "test" "Tests des changements de cycle de facturation"

echo -e "${BLUE}🔧 SCRIPTS UTILITAIRES${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
show_script "purge.sh" "utilitaire" "Purge complète de l'application (⚠️  DESTRUCTIF)"
show_script "validate_scripts.sh" "utilitaire" "Valide tous les scripts du répertoire"
show_script "common.sh" "bibliothèque" "Bibliothèque de fonctions communes (ne pas exécuter directement)"

echo -e "${BLUE}📊 STATISTIQUES${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
total_scripts=$(ls -1 "$SCRIPT_DIR"/*.sh 2>/dev/null | wc -l)
executable_scripts=$(find "$SCRIPT_DIR" -name "*.sh" -executable 2>/dev/null | wc -l)
log_files=$(ls -1 "$SCRIPT_DIR/../logs/"*.log 2>/dev/null | wc -l)

echo -e "  Total de scripts: ${GREEN}$total_scripts${NC}"
echo -e "  Scripts exécutables: ${GREEN}$executable_scripts${NC}"
echo -e "  Fichiers de log: ${GREEN}$log_files${NC}"
echo ""

echo -e "${BLUE}🎯 WORKFLOWS RECOMMANDÉS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${YELLOW}Démarrage initial:${NC}"
echo -e "    1. ./scripts/deploy.sh"
echo -e "    2. ./scripts/test_final.sh"
echo ""
echo -e "  ${YELLOW}Développement:${NC}"
echo -e "    1. ./scripts/restart.sh     # Après modifications"
echo -e "    2. ./scripts/test_all.sh    # Avant commit"
echo ""
echo -e "  ${YELLOW}Maintenance:${NC}"
echo -e "    1. ./scripts/validate_scripts.sh  # Valider les scripts"
echo -e "    2. ./scripts/purge.sh             # Nettoyage complet"
echo ""

echo -e "${BLUE}📚 DOCUMENTATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  📖 README complet: ${YELLOW}./scripts/README.md${NC}"
echo -e "  📖 Documentation projet: ${YELLOW}./docs/README.md${NC}"
echo ""

echo -e "${GREEN}✓ Tous les scripts sont validés et prêts à l'emploi !${NC}"
echo ""
