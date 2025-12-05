#!/bin/bash

# Script de démarrage du backend avec HTTPS
# Usage: ./scripts/start_backend_https.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CERTS_DIR="$PROJECT_ROOT/certs"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Vérifier que les certificats existent
if [ ! -f "$CERTS_DIR/cert.pem" ] || [ ! -f "$CERTS_DIR/key.pem" ]; then
    echo "❌ Certificats SSL non trouvés. Génération..."
    "$SCRIPT_DIR/generate_ssl_certs.sh"
fi

# Arrêter les instances existantes
pkill -f uvicorn 2>/dev/null || true

echo "=== Démarrage du backend avec HTTPS ==="
echo "Port: 8000"
echo "Certificat: $CERTS_DIR/cert.pem"
echo "Clé privée: $CERTS_DIR/key.pem"
echo ""

cd "$BACKEND_DIR"

# Démarrer uvicorn avec SSL
"$PROJECT_ROOT/venv/bin/uvicorn" app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --ssl-keyfile="$CERTS_DIR/key.pem" \
    --ssl-certfile="$CERTS_DIR/cert.pem" \
    --reload

