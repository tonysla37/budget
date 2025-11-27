#!/bin/bash

# Téléchargement manuel des packages i18n depuis CDN
# Pour contourner le blocage du registre npm

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     Installation manuelle i18n (sans registre npm)           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

cd "$FRONTEND_DIR" || exit 1

# Créer un dossier temporaire
TEMP_DIR="/tmp/i18n-packages"
mkdir -p "$TEMP_DIR"

echo "📦 Téléchargement des packages depuis unpkg.com..."
echo ""

# i18next v23.7.6
echo "⬇️  Téléchargement i18next@23.7.6..."
curl -L "https://unpkg.com/i18next@23.7.6/dist/umd/i18next.js" -o "$TEMP_DIR/i18next.js" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ i18next téléchargé"
else
    echo "   ❌ Échec du téléchargement i18next"
fi

# react-i18next v13.5.0
echo "⬇️  Téléchargement react-i18next@13.5.0..."
curl -L "https://unpkg.com/react-i18next@13.5.0/dist/umd/react-i18next.js" -o "$TEMP_DIR/react-i18next.js" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ react-i18next téléchargé"
else
    echo "   ❌ Échec du téléchargement react-i18next"
fi

echo ""
echo "📋 SOLUTION ALTERNATIVE recommandée :"
echo ""
echo "1️⃣  Utiliser un proxy npm (si disponible) :"
echo "   npm config set proxy http://proxy.entreprise.com:8080"
echo "   npm config set https-proxy http://proxy.entreprise.com:8080"
echo ""
echo "2️⃣  Utiliser yarn au lieu de npm :"
echo "   yarn add i18next react-i18next"
echo ""
echo "3️⃣  Télécharger les packages hors réseau entreprise :"
echo "   - Depuis un hotspot mobile"
echo "   - Depuis votre domicile"
echo "   - Puis commit node_modules (exceptionnellement)"
echo ""
echo "4️⃣  Utiliser le CDN directement dans index.html :"
echo "   Voir : $PROJECT_ROOT/docs/I18N_CDN_ALTERNATIVE.md"
echo ""

# Nettoyage
rm -rf "$TEMP_DIR"
