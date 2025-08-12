from pymongo import MongoClient
from bson import ObjectId

# Connexion à MongoDB
client = MongoClient('mongodb://localhost:27017')
db = client.budget_db

# Obtenir l'ID de l'utilisateur test
user = db.users.find_one({"email": "test@example.com"})
if not user:
    print("Utilisateur test@example.com non trouvé")
    exit(1)

# Obtenir l'identifiant de l'utilisateur sous forme de string
user_id_str = str(user["_id"])
print(f"ID de l'utilisateur (string): {user_id_str}")

# Mettre à jour les transactions pour utiliser l'ID string de l'utilisateur
result = db.transactions.update_many(
    {"user_id": user["_id"]},  # Rechercher avec ObjectId
    {"$set": {"user_id": user_id_str}}  # Définir comme string
)

print(f"Transactions mises à jour: {result.modified_count}")

# Vérifier les dates des transactions
transactions = list(db.transactions.find({"user_id": user_id_str}))
print(f"Nombre total de transactions: {len(transactions)}")

for tx in transactions[:3]:  # Afficher quelques transactions pour debug
    print(f"Transaction: {tx['description']} - Date: {tx['date']} - Type: {type(tx['date'])}")

