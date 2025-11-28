#!/usr/bin/env python3
"""
Script de test pour le système de connexions bancaires
Teste le chiffrement et les connecteurs mock
"""

import asyncio
import sys
import os

# Ajouter le dossier backend au path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Import direct sans passer par __init__.py
import importlib.util

# Charger encryption_service
spec = importlib.util.spec_from_file_location(
    "encryption", 
    os.path.join(os.path.dirname(__file__), '..', 'backend', 'app', 'core', 'encryption.py')
)
encryption_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(encryption_module)
encryption_service = encryption_module.encryption_service

# Charger boursobank
spec = importlib.util.spec_from_file_location(
    "boursobank", 
    os.path.join(os.path.dirname(__file__), '..', 'backend', 'app', 'services', 'boursobank.py')
)
boursobank_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(boursobank_module)
BoursobankMockConnector = boursobank_module.BoursobankMockConnector

# Charger cic
spec = importlib.util.spec_from_file_location(
    "cic", 
    os.path.join(os.path.dirname(__file__), '..', 'backend', 'app', 'services', 'cic.py')
)
cic_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cic_module)
CICMockConnector = cic_module.CICMockConnector


def test_encryption():
    """Test du service de chiffrement"""
    print("\n🔐 Test du chiffrement...")
    
    user_id = "test_user_123"
    original_text = "mon_super_mot_de_passe"
    
    # Chiffrer
    encrypted = encryption_service.encrypt(original_text, user_id)
    print(f"   ✓ Texte original : {original_text}")
    print(f"   ✓ Texte chiffré  : {encrypted[:20]}...")
    
    # Déchiffrer
    decrypted = encryption_service.decrypt(encrypted, user_id)
    print(f"   ✓ Texte déchiffré: {decrypted}")
    
    # Vérifier
    assert original_text == decrypted, "❌ Erreur : le texte déchiffré ne correspond pas"
    print("   ✅ Chiffrement/déchiffrement OK")
    
    # Test isolation par utilisateur
    other_user_id = "other_user_456"
    try:
        # Tenter de déchiffrer avec un autre user_id
        wrong_decrypt = encryption_service.decrypt(encrypted, other_user_id)
        print("   ❌ ATTENTION : l'isolation par utilisateur ne fonctionne pas !")
    except:
        print("   ✅ Isolation par utilisateur OK (impossible de déchiffrer avec un autre user_id)")
    
    # Test chiffrement de dictionnaire
    print("\n   Test chiffrement de dictionnaire...")
    data = {
        "username": "test@example.com",
        "password": "secret123",
        "other_field": "non_chiffré"
    }
    
    encrypted_data = encryption_service.encrypt_dict(
        data.copy(),
        ["username", "password"],
        user_id
    )
    
    assert "encrypted_username" in encrypted_data
    assert "encrypted_password" in encrypted_data
    assert "username" not in encrypted_data
    assert "password" not in encrypted_data
    assert encrypted_data["other_field"] == "non_chiffré"
    print("   ✅ Chiffrement de dictionnaire OK")
    
    # Déchiffrement de dictionnaire
    decrypted_data = encryption_service.decrypt_dict(
        encrypted_data.copy(),
        ["username", "password"],
        user_id
    )
    
    assert decrypted_data["username"] == "test@example.com"
    assert decrypted_data["password"] == "secret123"
    print("   ✅ Déchiffrement de dictionnaire OK")


async def test_boursobank_mock():
    """Test du connecteur BoursoBank Mock"""
    print("\n🏦 Test BoursoBank Mock...")
    
    connector = BoursobankMockConnector()
    
    # Login
    logged_in = await connector.login("test@example.com", "password123")
    assert logged_in, "❌ Échec du login"
    print("   ✅ Login OK")
    
    # Récupérer les comptes
    accounts = await connector.get_accounts()
    assert len(accounts) > 0, "❌ Aucun compte récupéré"
    print(f"   ✅ {len(accounts)} compte(s) récupéré(s)")
    
    for account in accounts:
        print(f"      - {account['name']} ({account['type']}) : {account['balance']:.2f} {account['currency']}")
    
    # Récupérer les transactions
    total_transactions = 0
    for account in accounts:
        transactions = await connector.get_transactions(account['id'])
        total_transactions += len(transactions)
        print(f"   ✅ {len(transactions)} transaction(s) pour {account['name']}")
    
    print(f"   ✅ Total : {total_transactions} transactions")
    
    await connector.close()


async def test_cic_mock():
    """Test du connecteur CIC Mock"""
    print("\n🏛️  Test CIC Mock...")
    
    connector = CICMockConnector()
    
    # Login avec format correct
    logged_in = await connector.login("1234567890", "123456")
    assert logged_in, "❌ Échec du login"
    print("   ✅ Login OK")
    
    # Test validation format
    print("\n   Test validation des identifiants...")
    
    # Format incorrect (trop court)
    try:
        await connector.login("12345", "123")
        print("   ❌ La validation du format ne fonctionne pas")
    except ValueError as e:
        print(f"   ✅ Validation OK : {str(e)}")
    
    # Format incorrect (lettres)
    try:
        await connector.login("abcdefghij", "abcdef")
        print("   ❌ La validation du format ne fonctionne pas")
    except ValueError as e:
        print(f"   ✅ Validation OK : {str(e)}")
    
    # Récupérer les comptes
    accounts = await connector.get_accounts()
    assert len(accounts) > 0, "❌ Aucun compte récupéré"
    print(f"\n   ✅ {len(accounts)} compte(s) récupéré(s)")
    
    for account in accounts:
        print(f"      - {account['name']} ({account['type']}) : {account['balance']:.2f} {account['currency']}")
    
    # Récupérer les transactions
    total_transactions = 0
    for account in accounts:
        transactions = await connector.get_transactions(account['id'])
        total_transactions += len(transactions)
        print(f"   ✅ {len(transactions)} transaction(s) pour {account['name']}")
    
    print(f"   ✅ Total : {total_transactions} transactions")
    
    await connector.close()


async def test_all():
    """Lance tous les tests"""
    print("=" * 70)
    print("🧪 Tests du Système de Connexions Bancaires")
    print("=" * 70)
    
    try:
        # Test 1 : Chiffrement
        test_encryption()
        
        # Test 2 : BoursoBank Mock
        await test_boursobank_mock()
        
        # Test 3 : CIC Mock
        await test_cic_mock()
        
        # Résumé
        print("\n" + "=" * 70)
        print("✅ Tous les tests sont passés avec succès !")
        print("=" * 70)
        print("\n📝 Prochaines étapes :")
        print("   1. Générer une clé ENCRYPTION_MASTER_KEY")
        print("   2. L'ajouter dans backend/.env")
        print("   3. Redémarrer le backend")
        print("   4. Tester l'interface frontend")
        print("\n📚 Voir : docs/GUIDE_DEMARRAGE_BANQUES.md")
        print()
        
        return True
        
    except AssertionError as e:
        print(f"\n❌ Échec du test : {e}")
        return False
    except Exception as e:
        print(f"\n❌ Erreur inattendue : {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_all())
    sys.exit(0 if success else 1)
