import os
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure

from app.core.config import settings

class MongoDB:
    """
    Gestionnaire de connexion MongoDB utilisant Motor (client MongoDB asynchrone).
    """
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

    async def connect_to_database(self, db_name: Optional[str] = None) -> None:
        """
        Établit la connexion à la base de données MongoDB.
        """
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URI)
            
            # Vérifier la connexion en envoyant une simple commande ping
            await self.client.admin.command('ping')
            
            # Connexion réussie, sélectionner la base de données
            db_name = db_name or settings.MONGODB_DB_NAME
            self.db = self.client[db_name]
            print(f"Connecté à MongoDB - {db_name}")
        except ConnectionFailure:
            print("Échec de la connexion à MongoDB")
            raise

    async def close_database_connection(self) -> None:
        """
        Ferme la connexion à la base de données.
        """
        if self.client:
            self.client.close()
            print("Connexion MongoDB fermée")

    def get_collection(self, collection_name: str):
        """
        Récupère une collection MongoDB.
        """
        if not self.db:
            raise ConnectionError("La connexion à la base de données n'est pas établie")
        return self.db[collection_name]

    # Opérations MongoDB de base

    async def find_one(self, collection_name: str, query: Dict[str, Any]):
        """
        Récupère un document correspondant à la requête.
        """
        collection = self.get_collection(collection_name)
        return await collection.find_one(query)

    async def find_many(self, collection_name: str, query: Dict[str, Any], skip: int = 0, limit: int = 100):
        """
        Récupère plusieurs documents correspondant à la requête.
        """
        collection = self.get_collection(collection_name)
        cursor = collection.find(query).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def insert_one(self, collection_name: str, document: Dict[str, Any]):
        """
        Insère un document dans la collection.
        """
        collection = self.get_collection(collection_name)
        result = await collection.insert_one(document)
        return result.inserted_id

    async def update_one(self, collection_name: str, query: Dict[str, Any], update: Dict[str, Any]):
        """
        Met à jour un document correspondant à la requête.
        """
        collection = self.get_collection(collection_name)
        result = await collection.update_one(query, {"$set": update})
        return result.modified_count

    async def delete_one(self, collection_name: str, query: Dict[str, Any]):
        """
        Supprime un document correspondant à la requête.
        """
        collection = self.get_collection(collection_name)
        result = await collection.delete_one(query)
        return result.deleted_count


# Singleton de la connexion MongoDB
mongodb = MongoDB()

# Dépendance pour obtenir la base de données
async def get_db() -> MongoDB:
    """
    Dépendance pour obtenir une instance de la base de données.
    """
    return mongodb 