#!/bin/bash

# Script d'installation et démarrage avec i18n
# Date : 27 novembre 2025

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║        Installation Frontend avec i18n (FR/EN)               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

cd "$FRONTEND_DIR" || exit 1

echo "📦 Installation des dépendances..."
echo "   - i18next@^23.7.6"
echo "   - react-i18next@^13.5.0"
echo ""

# Vérifier si les packages sont déjà installés
if [ ! -d "node_modules/i18next" ] || [ ! -d "node_modules/react-i18next" ]; then
    echo "🔄 Installation en cours..."
    npm install
    
    if [ $? -eq 0 ]; then
        echo "✅ Dépendances installées avec succès"
    else
        echo "❌ Erreur lors de l'installation"
        echo "💡 Essayez manuellement :"
        echo "   cd $FRONTEND_DIR"
        echo "   npm install"
        exit 1
    fi
else
    echo "✅ Dépendances déjà installées"
fi

echo ""
echo "🚀 Démarrage du serveur frontend..."
echo ""

npm run dev

