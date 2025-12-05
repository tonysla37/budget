import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def remove_duplicate_rules():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['budget_db']
    rules_collection = db['rules']
    
    # Récupérer toutes les règles
    all_rules = await rules_collection.find({}).to_list(length=None)
    
    print(f"Total de règles: {len(all_rules)}")
    
    # Grouper par user_id + pattern + match_type
    seen = {}
    duplicates = []
    
    for rule in all_rules:
        key = (str(rule.get('user_id')), rule.get('pattern'), rule.get('match_type'))
        if key in seen:
            duplicates.append(rule['_id'])
            print(f"Doublon trouvé: {rule.get('name')} (pattern: {rule.get('pattern')})")
        else:
            seen[key] = rule['_id']
    
    if duplicates:
        result = await rules_collection.delete_many({'_id': {'$in': duplicates}})
        print(f"\n✅ {result.deleted_count} règles en doublon supprimées")
    else:
        print("Aucun doublon trouvé")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(remove_duplicate_rules())
