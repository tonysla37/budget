#!/bin/bash

echo "=== Test des changements de cycle ==="

# Login
TOKEN=$(curl -s -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | \
  grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Test 1: Changer à 1 (début de mois calendaire)
echo -e "\n1. Changement à billing_cycle_day = 1"
curl -s -X PUT "http://localhost:8000/api/settings/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"billing_cycle_day": 1}' | python3 -m json.tool

# Test 2: Changer à 15 (milieu de mois)
echo -e "\n2. Changement à billing_cycle_day = 15"
curl -s -X PUT "http://localhost:8000/api/settings/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"billing_cycle_day": 15}' | python3 -m json.tool

# Test 3: Changer à 25 (fin de mois - cas d'usage principal)
echo -e "\n3. Changement à billing_cycle_day = 25"
curl -s -X PUT "http://localhost:8000/api/settings/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"billing_cycle_day": 25}' | python3 -m json.tool

# Test 4: Valeur invalide (> 28)
echo -e "\n4. Test valeur invalide (30 - devrait échouer)"
curl -s -X PUT "http://localhost:8000/api/settings/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"billing_cycle_day": 30}' | python3 -m json.tool

echo -e "\n✅ Tests terminés !"
