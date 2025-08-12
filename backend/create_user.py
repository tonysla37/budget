from datetime import datetime, UTC
from bson import ObjectId
from pymongo import MongoClient
from passlib.context import CryptContext

# Configuration du hachage de mot de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Connexion à MongoDB
client = MongoClient('mongodb://localhost:27017')
db = client.budget_db

# Nettoyer la collection users
db.users.delete_many({})

# Créer un nouvel utilisateur
hashed_password = pwd_context.hash("password123")
print(f"Mot de passe haché généré: {hashed_password}")

user_id = ObjectId()
user = {
    "_id": user_id,
    "email": "test@example.com",
    "hashed_password": hashed_password,
    "first_name": "Test",
    "last_name": "User",
    "is_active": True,
    "created_at": datetime.now(UTC).isoformat()
}

result = db.users.insert_one(user)
print(f"Utilisateur inséré avec ID: {result.inserted_id}")

# Vérifier l'utilisateur inséré
user_db = db.users.find_one({"email": "test@example.com"})
print("Utilisateur récupéré de la base de données:")
print(f"  Email: {user_db.get('email')}")
print(f"  Mot de passe haché: {user_db.get('hashed_password')}")

# Vérifier le mot de passe
is_valid = pwd_context.verify("password123", user_db.get("hashed_password", ""))
print(f"Vérification du mot de passe: {'Succès' if is_valid else 'Échec'}")
