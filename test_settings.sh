#!/bin/bash

echo "=== Test de l'API Settings ==="

# 1. Login
echo -e "\n1. Connexion..."
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Échec de la connexion"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo "✅ Token obtenu: ${TOKEN:0:30}..."

# 2. GET /api/settings/
echo -e "\n2. Récupération des paramètres actuels..."
CURRENT_SETTINGS=$(curl -s -X GET "http://localhost:8000/api/settings/" \
  -H "Authorization: Bearer $TOKEN")
echo "$CURRENT_SETTINGS" | python3 -m json.tool

# 3. PUT /api/settings/ - Changer le billing_cycle_day à 25
echo -e "\n3. Mise à jour du billing_cycle_day à 25..."
UPDATE_RESPONSE=$(curl -s -X PUT "http://localhost:8000/api/settings/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"billing_cycle_day": 25}')
echo "$UPDATE_RESPONSE" | python3 -m json.tool

# 4. Vérification
echo -e "\n4. Vérification après mise à jour..."
UPDATED_SETTINGS=$(curl -s -X GET "http://localhost:8000/api/settings/" \
  -H "Authorization: Bearer $TOKEN")
echo "$UPDATED_SETTINGS" | python3 -m json.tool

echo -e "\n✅ Tests terminés !"
