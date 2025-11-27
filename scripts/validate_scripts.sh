#!/bin/bash

# Script de validation de tous les scripts
# Vérifie la syntaxe, l'uniformité et la présence des éléments requis

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ERRORS=0
WARNINGS=0

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}VALIDATION DES SCRIPTS${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Fonction de validation
validate_script() {
    local script="$1"
    local script_name=$(basename "$script")
    
    echo -e "${BLUE}Validation de $script_name${NC}"
    echo "-----------------------------------"
    
    # 1. Vérifier le shebang
    if head -1 "$script" | grep -q "^#!/bin/bash"; then
        echo -e "  ${GREEN}✓${NC} Shebang correct"
    else
        echo -e "  ${RED}✗${NC} Shebang manquant ou incorrect"
        ((ERRORS++))
    fi
    
    # 2. Vérifier la syntaxe bash
    if bash -n "$script" 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} Syntaxe bash valide"
    else
        echo -e "  ${RED}✗${NC} Erreur de syntaxe bash"
        bash -n "$script"
        ((ERRORS++))
    fi
    
    # 3. Vérifier les permissions d'exécution
    if [ -x "$script" ]; then
        echo -e "  ${GREEN}✓${NC} Permissions d'exécution"
    else
        echo -e "  ${YELLOW}⚠${NC} Permissions d'exécution manquantes"
        ((WARNINGS++))
    fi
    
    # 4. Pour les scripts autres que common.sh, vérifier l'utilisation de common.sh
    if [ "$script_name" != "common.sh" ]; then
        if grep -q "source.*common.sh" "$script"; then
            echo -e "  ${GREEN}✓${NC} Utilise common.sh"
        else
            echo -e "  ${YELLOW}⚠${NC} N'utilise pas common.sh"
            ((WARNINGS++))
        fi
        
        # Vérifier SCRIPT_NAME
        if grep -q "SCRIPT_NAME=" "$script"; then
            echo -e "  ${GREEN}✓${NC} Définit SCRIPT_NAME"
        else
            echo -e "  ${YELLOW}⚠${NC} SCRIPT_NAME non défini"
            ((WARNINGS++))
        fi
        
        # Vérifier init_script
        if grep -q "init_script" "$script"; then
            echo -e "  ${GREEN}✓${NC} Appelle init_script"
        else
            echo -e "  ${YELLOW}⚠${NC} init_script non appelé"
            ((WARNINGS++))
        fi
    fi
    
    # 5. Vérifier le commentaire de description
    if head -5 "$script" | grep -q "^#.*[Ss]cript"; then
        echo -e "  ${GREEN}✓${NC} Commentaire de description"
    else
        echo -e "  ${YELLOW}⚠${NC} Commentaire de description manquant"
        ((WARNINGS++))
    fi
    
    echo ""
}

# Valider tous les scripts .sh
for script in "$SCRIPT_DIR"/*.sh; do
    if [ -f "$script" ] && [ "$script" != "$SCRIPT_DIR/validate_scripts.sh" ]; then
        validate_script "$script"
    fi
done

# Résumé
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}RÉSUMÉ${NC}"
echo -e "${BLUE}=========================================${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ Tous les scripts sont valides !${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS avertissement(s) trouvé(s)${NC}"
    exit 0
else
    echo -e "${RED}✗ $ERRORS erreur(s) et $WARNINGS avertissement(s) trouvé(s)${NC}"
    exit 1
fi
