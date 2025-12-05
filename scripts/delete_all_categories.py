import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def delete_all_categories():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['budget_db']
    coll = db['categories']
    
    count = await coll.count_documents({})
    print(f'Nombre de catégories avant suppression: {count}')
    
    result = await coll.delete_many({})
    print(f'✅ {result.deleted_count} catégories supprimées')
    
    client.close()

if __name__ == "__main__":
    asyncio.run(delete_all_categories())
