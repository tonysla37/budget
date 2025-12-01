#!/bin/bash
# Script d'installation des services systemd pour Budget App
# Usage: ./install_services.sh

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Installation des services Budget App ===${NC}"
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "scripts/install_services.sh" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté depuis la racine du projet${NC}"
    echo "   Usage: cd /path/to/budget && ./scripts/install_services.sh"
    exit 1
fi

# Récupérer le nom d'utilisateur actuel
USER_NAME=$(whoami)
echo -e "${YELLOW}👤 Utilisateur: ${USER_NAME}${NC}"

# Créer le répertoire systemd utilisateur s'il n'existe pas
SYSTEMD_USER_DIR="$HOME/.config/systemd/user"
mkdir -p "$SYSTEMD_USER_DIR"
echo -e "${GREEN}✅ Répertoire systemd créé: ${SYSTEMD_USER_DIR}${NC}"

# Créer le répertoire logs s'il n'existe pas
LOGS_DIR="$(pwd)/logs"
mkdir -p "$LOGS_DIR"
echo -e "${GREEN}✅ Répertoire logs créé: ${LOGS_DIR}${NC}"

# Fonction pour installer un service
install_service() {
    local SERVICE_FILE=$1
    local SERVICE_NAME=$2
    
    echo ""
    echo -e "${YELLOW}📦 Installation de ${SERVICE_NAME}...${NC}"
    
    # Remplacer %i par le nom d'utilisateur dans le fichier de service
    sed "s/%i/${USER_NAME}/g" "$SERVICE_FILE" > "${SYSTEMD_USER_DIR}/${SERVICE_NAME}"
    
    echo -e "${GREEN}   ✓ Fichier copié: ${SYSTEMD_USER_DIR}/${SERVICE_NAME}${NC}"
    
    # Recharger systemd
    systemctl --user daemon-reload
    echo -e "${GREEN}   ✓ Daemon rechargé${NC}"
    
    # Activer le service au démarrage
    systemctl --user enable "${SERVICE_NAME}"
    echo -e "${GREEN}   ✓ Service activé au démarrage${NC}"
}

# Arrêter les anciens processus manuels
echo ""
echo -e "${YELLOW}🛑 Arrêt des processus manuels existants...${NC}"
pkill -f "vite" 2>/dev/null || echo "   Aucun processus vite à arrêter"
pkill -f "uvicorn app.main:app" 2>/dev/null || echo "   Aucun processus uvicorn à arrêter"
sleep 2

# Installer les services
install_service "backend/budget-backend.service" "budget-backend.service"
install_service "frontend/budget-frontend.service" "budget-frontend.service"

# Démarrer les services
echo ""
echo -e "${YELLOW}🚀 Démarrage des services...${NC}"

systemctl --user start budget-backend.service
echo -e "${GREEN}   ✓ Backend démarré${NC}"

systemctl --user start budget-frontend.service
echo -e "${GREEN}   ✓ Frontend démarré${NC}"

# Afficher le statut
echo ""
echo -e "${GREEN}=== Statut des services ===${NC}"
systemctl --user status budget-backend.service --no-pager -l | head -10
echo ""
systemctl --user status budget-frontend.service --no-pager -l | head -10

echo ""
echo -e "${GREEN}=== Installation terminée ! ===${NC}"
echo ""
echo "Commandes utiles:"
echo "  - Voir les logs backend:  journalctl --user -u budget-backend.service -f"
echo "  - Voir les logs frontend: journalctl --user -u budget-frontend.service -f"
echo "  - Redémarrer backend:     systemctl --user restart budget-backend.service"
echo "  - Redémarrer frontend:    systemctl --user restart budget-frontend.service"
echo "  - Arrêter tous:           systemctl --user stop budget-backend.service budget-frontend.service"
echo "  - Statut:                 systemctl --user status budget-backend.service budget-frontend.service"
echo ""
echo -e "${YELLOW}💡 Les services redémarreront automatiquement après un reboot${NC}"
echo ""
