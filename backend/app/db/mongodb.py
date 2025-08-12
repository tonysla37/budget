import os
import logging
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from app.core.config import settings

# Configuration du logger
logger = logging.getLogger("budget-api")

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
            logger.info(f"Tentative de connexion à MongoDB: {settings.MONGODB_URI}")
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=5000  # 5 secondes de timeout
            )
            
            # Vérifier la connexion en envoyant une simple commande ping
            logger.info("Vérification de la connexion MongoDB avec ping...")
            await self.client.admin.command('ping')
            
            # Connexion réussie, sélectionner la base de données
            db_name = db_name or settings.MONGODB_DB_NAME
            self.db = self.client[db_name]
            logger.info(f"✅ Connecté à MongoDB - Base de données: {db_name}")
            print(f"Connecté à MongoDB - {db_name}")
        except ServerSelectionTimeoutError as e:
            logger.error(f"❌ Timeout lors de la connexion à MongoDB: {str(e)}")
            print(f"Timeout lors de la connexion à MongoDB: {str(e)}")
            raise
        except ConnectionFailure as e:
            logger.error(f"❌ Échec de la connexion à MongoDB: {str(e)}")
            print(f"Échec de la connexion à MongoDB: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"❌ Erreur inattendue lors de la connexion à MongoDB: {str(e)}")
            print(f"Erreur inattendue lors de la connexion à MongoDB: {str(e)}")
            raise

    async def close_database_connection(self) -> None:
        """
        Ferme la connexion à la base de données.
        """
        if self.client:
            self.client.close()
            logger.info("Connexion MongoDB fermée")
            print("Connexion MongoDB fermée")

    async def get_collection(self, collection_name: str):
        """
        Récupère une collection MongoDB.
        """
        if self.db is None:
            logger.warning("DB non initialisée, tentative de connexion...")
            await self.connect()
        
        logger.debug(f"Accès à la collection: {collection_name}")
        return self.db[collection_name]

    # Opérations MongoDB de base

    async def find_one(self, collection_name: str, query: Dict[str, Any]):
        """
        Récupère un document correspondant à la requête.
        """
        try:
            collection = await self.get_collection(collection_name)
            logger.debug(f"find_one dans {collection_name}: {query}")
            return await collection.find_one(query)
        except Exception as e:
            logger.error(f"❌ Erreur lors de find_one dans {collection_name}: {str(e)}")
            raise

    async def find_many(self, collection_name: str, query: Dict[str, Any], skip: int = 0, limit: int = 100):
        """
        Récupère plusieurs documents correspondant à la requête.
        """
        try:
            collection = await self.get_collection(collection_name)
            logger.debug(f"find_many dans {collection_name}: {query}, skip={skip}, limit={limit}")
            cursor = collection.find(query).skip(skip).limit(limit)
            return await cursor.to_list(length=limit)
        except Exception as e:
            logger.error(f"❌ Erreur lors de find_many dans {collection_name}: {str(e)}")
            raise

    async def insert_one(self, collection_name: str, document: Dict[str, Any]):
        """
        Insère un document dans la collection.
        """
        try:
            collection = await self.get_collection(collection_name)
            logger.debug(f"insert_one dans {collection_name}")
            result = await collection.insert_one(document)
            return result.inserted_id
        except Exception as e:
            logger.error(f"❌ Erreur lors de insert_one dans {collection_name}: {str(e)}")
            raise

    async def update_one(self, collection_name: str, query: Dict[str, Any], update: Dict[str, Any]):
        """
        Met à jour un document correspondant à la requête.
        """
        try:
            collection = await self.get_collection(collection_name)
            logger.debug(f"update_one dans {collection_name}: {query}")
            result = await collection.update_one(query, {"$set": update})
            return result.modified_count
        except Exception as e:
            logger.error(f"❌ Erreur lors de update_one dans {collection_name}: {str(e)}")
            raise

    async def delete_one(self, collection_name: str, query: Dict[str, Any]):
        """
        Supprime un document correspondant à la requête.
        """
        try:
            collection = await self.get_collection(collection_name)
            logger.debug(f"delete_one dans {collection_name}: {query}")
            result = await collection.delete_one(query)
            return result.deleted_count
        except Exception as e:
            logger.error(f"❌ Erreur lors de delete_one dans {collection_name}: {str(e)}")
            raise

    async def connect(self) -> None:
        """
        Alias pour connect_to_database pour assurer la compatibilité.
        """
        await self.connect_to_database()


# Singleton de la connexion MongoDB
mongodb = MongoDB()

# Dépendance pour obtenir la base de données
async def get_db() -> MongoDB:
    """
    Dépendance pour obtenir une instance de la base de données.
    """
    return mongodb 