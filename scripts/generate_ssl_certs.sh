#!/bin/bash

# Script de génération de certificats SSL auto-signés pour le développement
# Usage: ./scripts/generate_ssl_certs.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CERTS_DIR="$PROJECT_ROOT/certs"

echo "=== Génération des certificats SSL auto-signés ==="

# Créer le répertoire des certificats
mkdir -p "$CERTS_DIR"

# Générer la clé privée et le certificat (valide 365 jours)
openssl req -x509 -newkey rsa:4096 -nodes \
    -keyout "$CERTS_DIR/key.pem" \
    -out "$CERTS_DIR/cert.pem" \
    -days 365 \
    -subj "/C=FR/ST=IDF/L=Paris/O=Budget App/OU=Development/CN=localhost"

# Permissions sécurisées
chmod 600 "$CERTS_DIR/key.pem"
chmod 644 "$CERTS_DIR/cert.pem"

echo "✅ Certificats générés avec succès:"
echo "   - Certificat: $CERTS_DIR/cert.pem"
echo "   - Clé privée: $CERTS_DIR/key.pem"
echo "   - Validité: 365 jours"
echo ""
echo "⚠️  ATTENTION: Ces certificats sont auto-signés et destinés au développement uniquement."
echo "    Le navigateur affichera un avertissement de sécurité."
echo ""
echo "Pour faire confiance au certificat localement:"
echo "  - Chrome/Edge: chrome://settings/security → Gérer les certificats"
echo "  - Firefox: about:preferences#privacy → Certificats → Afficher les certificats"
