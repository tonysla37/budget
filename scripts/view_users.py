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

client = MongoClient('mongodb://localhost:27017')
db = client.budget_db
users = list(db.users.find())

print(f"Nombre d'utilisateurs trouvés : {len(users)}")
print("=" * 50)

for i, user in enumerate(users, 1):
    print(f"Utilisateur {i}:")
    print(json.dumps(user, indent=2, cls=JSONEncoder))
    print("-" * 30)

client.close()
