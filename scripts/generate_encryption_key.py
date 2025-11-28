#!/usr/bin/env python3
"""
Script pour générer une clé de chiffrement sécurisée
pour les connexions bancaires
"""

import os
import base64

print("=" * 70)
print("🔐 Générateur de Clé de Chiffrement")
print("=" * 70)
print()

# Générer une clé aléatoire de 32 bytes
key = base64.urlsafe_b64encode(os.urandom(32)).decode()

print("Clé générée avec succès !")
print()
print("Copiez cette ligne dans votre fichier backend/.env :")
print()
print(f"ENCRYPTION_MASTER_KEY={key}")
print()
print("=" * 70)
print("⚠️  IMPORTANT - Sécurité")
print("=" * 70)
print()
print("1. ❌ Ne JAMAIS commiter cette clé dans Git")
print("2. ✅ Sauvegarder la clé de manière sécurisée")
print("3. ✅ En production, utiliser un gestionnaire de secrets")
print("4. ✅ Faire une rotation de la clé tous les 6-12 mois")
print("5. ⚠️  Si la clé est perdue, impossible de déchiffrer !")
print()
print("=" * 70)
print()
