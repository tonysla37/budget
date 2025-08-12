from datetime import datetime, UTC
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

user_id_str = str(user["_id"])

# Récupérer toutes les transactions de l'utilisateur
transactions = list(db.transactions.find({"user_id": user_id_str}))
print(f"Nombre de transactions à traiter: {len(transactions)}")

# Mise à jour des dates au format datetime
updated_count = 0
for tx in transactions:
    # Si la date est une chaîne, convertir en datetime
    if isinstance(tx["date"], str):
        try:
            # Essayer de parser la date ISO
            date_obj = datetime.fromisoformat(tx["date"].replace('Z', '+00:00'))
            
            # Mettre à jour la transaction avec un objet datetime
            result = db.transactions.update_one(
                {"_id": tx["_id"]},
                {"$set": {"date": date_obj}}
            )
            
            if result.modified_count > 0:
                updated_count += 1
                print(f"Transaction {tx['description']} mise à jour: {tx['date']} -> {date_obj}")
        except Exception as e:
            print(f"Erreur lors de la conversion de la date pour {tx['_id']}: {e}")

print(f"Nombre total de transactions mises à jour: {updated_count}")

# Vérifier les transactions après mise à jour
updated_transactions = list(db.transactions.find({"user_id": user_id_str}))
for tx in updated_transactions[:3]:
    print(f"Transaction après mise à jour: {tx['description']} - Date: {tx['date']} - Type: {type(tx['date'])}")

