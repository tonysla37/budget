#!/usr/bin/env python3
"""
Script pour changer le mot de passe d'un utilisateur.
Usage: python3 scripts/change_password.py <email> <nouveau_mot_de_passe>
"""

import sys
import os
import asyncio
from datetime import datetime, timezone

# Ajouter le répertoire backend au PYTHONPATH
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from pymongo import MongoClient
from passlib.context import CryptContext

# Configuration du hachage des mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Génère un hash du mot de passe."""
    return pwd_context.hash(password)

def update_yaml_file(email: str, new_hash: str):
    """Met à jour le fichier YAML de test avec le nouveau hash."""
    import yaml
    
    yaml_path = os.path.join(os.path.dirname(__file__), 'test_data', 'users.yaml')
    
    try:
        # Lire le fichier YAML
        with open(yaml_path, 'r') as f:
            data = yaml.safe_load(f)
        
        # Mettre à jour le hash
        updated = False
        for user in data.get('users', []):
            if user.get('email') == email:
                user['hashed_password'] = new_hash
                updated = True
                break
        
        if updated:
            # Écrire le fichier YAML
            with open(yaml_path, 'w') as f:
                yaml.dump(data, f, default_flow_style=False, allow_unicode=True)
            
            print(f"✅ Fichier {yaml_path} mis à jour")
            print("   Le mot de passe ne sera plus réinitialisé lors des tests")
        else:
            print(f"⚠️  Utilisateur {email} non trouvé dans le fichier YAML")
    
    except Exception as e:
        print(f"❌ Erreur lors de la mise à jour du fichier YAML: {str(e)}")

async def change_user_password(email: str, new_password: str):
    """Change le mot de passe d'un utilisateur."""
    try:
        # Connexion à MongoDB
        client = MongoClient("mongodb://localhost:27017/")
        db = client["budget_db"]
        users_collection = db["users"]
        
        # Rechercher l'utilisateur
        user = users_collection.find_one({"email": email})
        
        if not user:
            print(f"❌ Utilisateur avec l'email '{email}' non trouvé.")
            return False
        
        # Générer le nouveau hash
        new_hashed_password = get_password_hash(new_password)
        
        print(f"\n📧 Email: {email}")
        print(f"👤 Nom: {user.get('first_name', '')} {user.get('last_name', '')}")
        print(f"🔑 Nouveau hash: {new_hashed_password[:50]}...")
        
        # Demander confirmation
        confirmation = input("\n⚠️  Confirmer le changement de mot de passe ? (oui/non): ")
        
        if confirmation.lower() not in ['oui', 'o', 'yes', 'y']:
            print("❌ Opération annulée.")
            return False
        
        # Mettre à jour le mot de passe
        result = users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "hashed_password": new_hashed_password,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.modified_count > 0:
            print(f"\n✅ Mot de passe changé avec succès pour {email}")
            print(f"🔐 Hash bcrypt: {new_hashed_password}")
            
            # Proposer de mettre à jour le fichier YAML
            update_yaml = input("\n💾 Mettre à jour scripts/test_data/users.yaml ? (oui/non): ")
            if update_yaml.lower() in ['oui', 'o', 'yes', 'y']:
                update_yaml_file(email, new_hashed_password)
            
            return True
        else:
            print("❌ Aucune modification effectuée.")
            return False
            
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")
        return False
    finally:
        client.close()

def main():
    """Fonction principale."""
    if len(sys.argv) < 3:
        print("Usage: python3 scripts/change_password.py <email> <nouveau_mot_de_passe>")
        print("\nExemple:")
        print("  python3 scripts/change_password.py test@example.com MonNouveauMotDePasse123")
        sys.exit(1)
    
    email = sys.argv[1]
    new_password = sys.argv[2]
    
    print(f"\n🔄 Changement de mot de passe pour {email}")
    print("=" * 60)
    
    # Exécuter le changement
    asyncio.run(change_user_password(email, new_password))

if __name__ == "__main__":
    main()
