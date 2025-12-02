#!/usr/bin/env python3
"""
Script pour supprimer un utilisateur de la base de données.
"""

import sys
import json
from datetime import datetime
from bson import ObjectId
from pymongo import MongoClient

class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        elif isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def connect_to_db():
    """Connexion à la base de données MongoDB."""
    try:
        client = MongoClient('mongodb://localhost:27017')
        db = client.budget_db
        return client, db
    except Exception as e:
        print(f"Erreur de connexion à la base de données: {e}")
        sys.exit(1)

def list_users(db):
    """Affiche la liste des utilisateurs."""
    users = list(db.users.find())
    
    if not users:
        print("Aucun utilisateur trouvé dans la base de données.")
        return
    
    print(f"\nNombre d'utilisateurs trouvés : {len(users)}")
    print("=" * 60)
    
    for i, user in enumerate(users, 1):
        print(f"\nUtilisateur {i}:")
        print(f"  ID: {user['_id']}")
        print(f"  Email: {user.get('email', 'N/A')}")
        print(f"  Prénom: {user.get('first_name', 'N/A')}")
        print(f"  Nom: {user.get('last_name', 'N/A')}")
        print(f"  Actif: {user.get('is_active', 'N/A')}")
        print(f"  Créé le: {user.get('created_at', 'N/A')}")
        print("-" * 40)

def delete_user_by_email(db, email):
    """Supprime un utilisateur par son email."""
    user = db.users.find_one({"email": email})
    
    if not user:
        print(f"Aucun utilisateur trouvé avec l'email: {email}")
        return False
    
    print(f"\nUtilisateur trouvé:")
    print(json.dumps(user, indent=2, cls=JSONEncoder))
    
    confirm = input(f"\nÊtes-vous sûr de vouloir supprimer l'utilisateur {email} ? (oui/non): ")
    
    if confirm.lower() in ['oui', 'o', 'yes', 'y']:
        result = db.users.delete_one({"email": email})
        if result.deleted_count > 0:
            print(f"✅ Utilisateur {email} supprimé avec succès.")
            return True
        else:
            print(f"❌ Erreur lors de la suppression de l'utilisateur {email}.")
            return False
    else:
        print("❌ Suppression annulée.")
        return False

def delete_user_by_id(db, user_id):
    """Supprime un utilisateur par son ID."""
    try:
        object_id = ObjectId(user_id)
    except Exception:
        print(f"ID invalide: {user_id}")
        return False
    
    user = db.users.find_one({"_id": object_id})
    
    if not user:
        print(f"Aucun utilisateur trouvé avec l'ID: {user_id}")
        return False
    
    print(f"\nUtilisateur trouvé:")
    print(json.dumps(user, indent=2, cls=JSONEncoder))
    
    confirm = input(f"\nÊtes-vous sûr de vouloir supprimer l'utilisateur {user.get('email', user_id)} ? (oui/non): ")
    
    if confirm.lower() in ['oui', 'o', 'yes', 'y']:
        result = db.users.delete_one({"_id": object_id})
        if result.deleted_count > 0:
            print(f"✅ Utilisateur supprimé avec succès.")
            return True
        else:
            print(f"❌ Erreur lors de la suppression de l'utilisateur.")
            return False
    else:
        print("❌ Suppression annulée.")
        return False

def main():
    """Fonction principale."""
    print("=== Script de suppression d'utilisateur ===")
    
    client, db = connect_to_db()
    
    try:
        # Afficher la liste des utilisateurs
        list_users(db)
        
        if len(sys.argv) > 1:
            # Mode ligne de commande
            identifier = sys.argv[1]
            
            if '@' in identifier:
                # Suppression par email
                delete_user_by_email(db, identifier)
            else:
                # Suppression par ID
                delete_user_by_id(db, identifier)
        else:
            # Mode interactif
            print("\nOptions:")
            print("1. Supprimer par email")
            print("2. Supprimer par ID")
            print("3. Quitter")
            
            choice = input("\nChoisissez une option (1-3): ")
            
            if choice == '1':
                email = input("Entrez l'email de l'utilisateur à supprimer: ")
                delete_user_by_email(db, email)
            elif choice == '2':
                user_id = input("Entrez l'ID de l'utilisateur à supprimer: ")
                delete_user_by_id(db, user_id)
            elif choice == '3':
                print("Au revoir !")
            else:
                print("Option invalide.")
    
    finally:
        client.close()

if __name__ == "__main__":
    main()
