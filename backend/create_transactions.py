from datetime import datetime, timedelta, UTC
from bson import ObjectId
from pymongo import MongoClient
import json

# Connexion à MongoDB
client = MongoClient('mongodb://localhost:27017')
db = client.budget_db

# Obtenir l'ID de l'utilisateur test
user = db.users.find_one({"email": "test@example.com"})
if not user:
    print("Utilisateur test@example.com non trouvé")
    exit(1)

user_id = user["_id"]
print(f"ID de l'utilisateur: {user_id}")

# Vider les collections de transactions et catégories
db.transactions.delete_many({})
db.categories.delete_many({})

# Créer des catégories
categories = [
    {
        "_id": ObjectId(),
        "name": "Alimentation",
        "color": "#4CAF50",
        "icon": "shopping-cart",
        "type": "expense",
        "user_id": user_id
    },
    {
        "_id": ObjectId(),
        "name": "Transport",
        "color": "#2196F3",
        "icon": "car",
        "type": "expense",
        "user_id": user_id
    },
    {
        "_id": ObjectId(),
        "name": "Loisirs",
        "color": "#9C27B0",
        "icon": "film",
        "type": "expense",
        "user_id": user_id
    },
    {
        "_id": ObjectId(),
        "name": "Salaire",
        "color": "#009688",
        "icon": "wallet",
        "type": "income",
        "user_id": user_id
    },
    {
        "_id": ObjectId(),
        "name": "Freelance",
        "color": "#00BCD4",
        "icon": "briefcase",
        "type": "income",
        "user_id": user_id
    },
    {
        "_id": ObjectId(),
        "name": "Investissements",
        "color": "#4CAF50",
        "icon": "trending-up",
        "type": "income",
        "user_id": user_id
    }
]

result = db.categories.insert_many(categories)
print(f"Catégories insérées: {len(result.inserted_ids)}")

# Mapping des catégories pour un accès facile
category_map = {
    "Alimentation": categories[0]["_id"],
    "Transport": categories[1]["_id"],
    "Loisirs": categories[2]["_id"],
    "Salaire": categories[3]["_id"],
    "Freelance": categories[4]["_id"],
    "Investissements": categories[5]["_id"]
}

# Créer des transactions pour les 2 derniers mois
transactions = []
now = datetime.now(UTC)

# Mois actuel
current_month = now.replace(day=1)
# Mois précédent
prev_month = (current_month - timedelta(days=31)).replace(day=1)

# Transactions mois actuel
transactions.append({
    "_id": ObjectId(),
    "user_id": user_id,
    "date": current_month.replace(day=5).isoformat(),
    "amount": 2500.0,
    "description": "Salaire",
    "merchant": "Entreprise XYZ",
    "is_expense": False,
    "category_id": category_map["Salaire"],
    "created_at": now.isoformat()
})

transactions.extend([
    {
        "_id": ObjectId(),
        "user_id": user_id,
        "date": current_month.replace(day=10).isoformat(),
        "amount": -85.30,
        "description": "Courses hebdomadaires",
        "merchant": "Carrefour",
        "is_expense": True,
        "category_id": category_map["Alimentation"],
        "created_at": now.isoformat()
    },
    {
        "_id": ObjectId(),
        "user_id": user_id,
        "date": current_month.replace(day=15).isoformat(),
        "amount": -42.50,
        "description": "Billet de train Paris-Lyon",
        "merchant": "SNCF",
        "is_expense": True,
        "category_id": category_map["Transport"],
        "created_at": now.isoformat()
    },
    {
        "_id": ObjectId(),
        "user_id": user_id,
        "date": current_month.replace(day=20).isoformat(),
        "amount": -65.90,
        "description": "Restaurant Le Gourmet",
        "merchant": "Restaurant Le Gourmet",
        "is_expense": True,
        "category_id": category_map["Loisirs"],
        "created_at": now.isoformat()
    },
    {
        "_id": ObjectId(),
        "user_id": user_id,
        "date": current_month.replace(day=25).isoformat(),
        "amount": -35.20,
        "description": "Essence",
        "merchant": "Total",
        "is_expense": True,
        "category_id": category_map["Transport"],
        "created_at": now.isoformat()
    }
])

# Transactions mois précédent
transactions.append({
    "_id": ObjectId(),
    "user_id": user_id,
    "date": prev_month.replace(day=5).isoformat(),
    "amount": 2500.0,
    "description": "Salaire",
    "merchant": "Entreprise XYZ",
    "is_expense": False,
    "category_id": category_map["Salaire"],
    "created_at": (now - timedelta(days=30)).isoformat()
})

transactions.extend([
    {
        "_id": ObjectId(),
        "user_id": user_id,
        "date": prev_month.replace(day=10).isoformat(),
        "amount": -120.45,
        "description": "Courses mensuelles",
        "merchant": "Auchan",
        "is_expense": True,
        "category_id": category_map["Alimentation"],
        "created_at": (now - timedelta(days=30)).isoformat()
    },
    {
        "_id": ObjectId(),
        "user_id": user_id,
        "date": prev_month.replace(day=15).isoformat(),
        "amount": -75.0,
        "description": "Abonnement transport",
        "merchant": "Navigo",
        "is_expense": True,
        "category_id": category_map["Transport"],
        "created_at": (now - timedelta(days=30)).isoformat()
    },
    {
        "_id": ObjectId(),
        "user_id": user_id,
        "date": prev_month.replace(day=20).isoformat(),
        "amount": -28.50,
        "description": "Cinéma",
        "merchant": "UGC Ciné",
        "is_expense": True,
        "category_id": category_map["Loisirs"],
        "created_at": (now - timedelta(days=30)).isoformat()
    },
    {
        "_id": ObjectId(),
        "user_id": user_id,
        "date": prev_month.replace(day=25).isoformat(),
        "amount": -45.80,
        "description": "Carburant",
        "merchant": "Shell",
        "is_expense": True,
        "category_id": category_map["Transport"],
        "created_at": (now - timedelta(days=30)).isoformat()
    }
])

result = db.transactions.insert_many(transactions)
print(f"Transactions insérées: {len(result.inserted_ids)}")

# Vérifier les collections
print(f"Nombre de catégories: {db.categories.count_documents({})}")
print(f"Nombre de transactions: {db.transactions.count_documents({})}")
