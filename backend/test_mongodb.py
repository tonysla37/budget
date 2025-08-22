#!/usr/bin/env python3

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_mongodb():
    try:
        print("Test de connexion MongoDB...")
        client = AsyncIOMotorClient("mongodb://localhost:27017")
        
        # Test de connexion
        await client.admin.command('ping')
        print("✅ Connexion MongoDB réussie!")
        
        # Lister les bases de données
        db_list = await client.list_database_names()
        print(f"Bases de données disponibles: {db_list}")
        
        # Tester la base budget_db
        db = client.budget_db
        collections = await db.list_collection_names()
        print(f"Collections dans budget_db: {collections}")
        
        client.close()
        print("✅ Test MongoDB terminé avec succès!")
        
    except Exception as e:
        print(f"❌ Erreur MongoDB: {e}")

if __name__ == "__main__":
    asyncio.run(test_mongodb())
