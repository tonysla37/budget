import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def remove_duplicate_categories():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['budget_db']
    categories_collection = db['categories']
    
    # Récupérer toutes les catégories
    all_categories = await categories_collection.find({}).to_list(length=None)
    
    print(f"Total de catégories: {len(all_categories)}")
    
    # Créer un index des catégories parentes par ID
    parent_categories = {str(cat['_id']): cat for cat in all_categories if not cat.get('parent_id')}
    
    # Grouper par user_id + name + type + parent_name (au lieu de parent_id)
    seen = {}
    duplicates = []
    
    for cat in all_categories:
        user_id = str(cat.get('user_id'))
        name = cat.get('name')
        cat_type = cat.get('type')
        
        # Pour les sous-catégories, utiliser le nom du parent au lieu de l'ID
        if cat.get('parent_id'):
            parent = parent_categories.get(str(cat.get('parent_id')))
            parent_name = parent.get('name') if parent else 'unknown'
        else:
            parent_name = 'None'
        
        key = (user_id, name, cat_type, parent_name)
        
        if key in seen:
            duplicates.append(cat['_id'])
            print(f"Doublon trouvé: {name} ({cat_type}) - parent: {parent_name}")
        else:
            seen[key] = cat['_id']
    
    if duplicates:
        result = await categories_collection.delete_many({'_id': {'$in': duplicates}})
        print(f"\n✅ {result.deleted_count} catégories en doublon supprimées")
    else:
        print("Aucun doublon trouvé")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(remove_duplicate_categories())
