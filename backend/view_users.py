import json
from bson import ObjectId
from pymongo import MongoClient

class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)

client = MongoClient('mongodb://localhost:27017')
db = client.budget_db
users = list(db.users.find())

for user in users:
    print(json.dumps(user, indent=2, cls=JSONEncoder))
