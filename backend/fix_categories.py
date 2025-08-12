from bson import ObjectId
from pymongo import MongoClient
import json

# Connexion à MongoDB
client = MongoClient('mongodb://localhost:27017')
db = client.budget_db

# Vérifier les collections
categories = list(db.categories.find())
print(f"Nombre de catégories avant correction: {len(categories)}")
for cat in categories[:2]:  # Afficher quelques catégories pour debug
    print(f"Catégorie: {cat}")

# Obtenir l'ID de l'utilisateur test
user = db.users.find_one({"email": "test@example.com"})
if not user:
    print("Utilisateur test@example.com non trouvé")
    exit(1)

# Obtenir l'identifiant de l'utilisateur sous forme de string
user_id_str = str(user["_id"])
print(f"ID de l'utilisateur (string): {user_id_str}")
print(f"ID de l'utilisateur (ObjectId): {user['_id']}")

# Mettre à jour les catégories pour utiliser l'ID string de l'utilisateur
db.categories.update_many(
    {"user_id": user["_id"]},  # Rechercher avec ObjectId
    {"$set": {"user_id": user_id_str}}  # Définir comme string
)

print("Catégories mises à jour pour utiliser l'ID string")

# Vérifier les catégories après mise à jour
updated_categories = list(db.categories.find())
print(f"Nombre de catégories après correction: {len(updated_categories)}")
for cat in updated_categories:  # Afficher les catégories pour debug
    print(f"Catégorie mise à jour: {cat}")

