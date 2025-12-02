from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017')
db = client.budget_db
users = list(db.users.find())
print('Nombre d\'utilisateurs:', len(users))

if users:
    print('Premier utilisateur:')
    print('  Email:', users[0].get('email', 'Non trouvé'))
    print('  Mot de passe haché:', users[0].get('hashed_password', 'Non trouvé'))
    print('  Tous les champs:', list(users[0].keys()))
