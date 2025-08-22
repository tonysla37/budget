import logging
from pymongo.errors import PyMongoError

# Configuration du logger
logger = logging.getLogger("budget-api")

# Stubs pour les modèles (pour compatibilité avec les tests)
# Ces classes acceptent les arguments et simulent le comportement Pydantic
class UserModel:
    """Stub pour UserModel - utilisé uniquement pour les tests"""
    def __init__(self, **kwargs):
        # Stocke tous les arguments comme attributs pour compatibilité
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def model_dump(self):
        """Simule la méthode model_dump() de Pydantic"""
        return {key: value for key, value in self.__dict__.items()}

class CategoryModel:
    """Stub pour CategoryModel - utilisé uniquement pour les tests"""
    def __init__(self, **kwargs):
        # Stocke tous les arguments comme attributs pour compatibilité
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def model_dump(self):
        """Simule la méthode model_dump() de Pydantic"""
        return {key: value for key, value in self.__dict__.items()}

class TransactionModel:
    """Stub pour TransactionModel - utilisé uniquement pour les tests"""
    def __init__(self, **kwargs):
        # Stocke tous les arguments comme attributs pour compatibilité
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def model_dump(self):
        """Simule la méthode model_dump() de Pydantic"""
        return {key: value for key, value in self.__dict__.items()}

async def create_indexes(mongodb):
    """
    Crée les index nécessaires pour les collections MongoDB.
    """
    try:
        logger.info("Création des index pour les collections MongoDB...")
        
        # Collection transactions
        transactions_collection = await mongodb.get_collection("transactions")
        await transactions_collection.create_index("user_id")
        await transactions_collection.create_index("date")
        await transactions_collection.create_index("category_id")
        await transactions_collection.create_index([("description", "text"), ("merchant", "text")])
        
        # Collection categories
        categories_collection = await mongodb.get_collection("categories")
        await categories_collection.create_index("user_id")
        await categories_collection.create_index("name")
        
        # Collection tags
        tags_collection = await mongodb.get_collection("tags")
        await tags_collection.create_index("user_id")
        await tags_collection.create_index("name")
        
        # Collection users
        users_collection = await mongodb.get_collection("users")
        await users_collection.create_index("email", unique=True)
        
        logger.info("Index créés avec succès.")
        
        # Créer les collections par défaut si elles n'existent pas
        await ensure_default_collections(mongodb)
    except PyMongoError as e:
        logger.error(f"Erreur lors de la création des index: {str(e)}")
        raise

async def ensure_default_collections(mongodb):
    """
    S'assure que toutes les collections nécessaires existent et contiennent les documents par défaut.
    """
    try:
        db = mongodb.db
        collections = await db.list_collection_names()
        
        # Liste des collections requises
        required_collections = ["transactions", "categories", "tags", "users"]
        
        # Créer les collections manquantes
        for collection_name in required_collections:
            if collection_name not in collections:
                logger.info(f"Création de la collection '{collection_name}'")
                await db.create_collection(collection_name)
        
        # Vérifier si des catégories par défaut existent
        categories_collection = await mongodb.get_collection("categories")
        default_categories_count = await categories_collection.count_documents({"user_id": None})
        
        if default_categories_count == 0:
            # Insérer les catégories par défaut
            default_categories = [
                {"name": "Alimentation", "color": "#4CAF50", "icon": "shopping-cart", "user_id": None},
                {"name": "Transport", "color": "#2196F3", "icon": "car", "user_id": None},
                {"name": "Logement", "color": "#FFC107", "icon": "home", "user_id": None},
                {"name": "Loisirs", "color": "#9C27B0", "icon": "film", "user_id": None},
                {"name": "Santé", "color": "#F44336", "icon": "medkit", "user_id": None},
                {"name": "Éducation", "color": "#3F51B5", "icon": "book", "user_id": None},
                {"name": "Revenus", "color": "#009688", "icon": "wallet", "user_id": None}
            ]
            
            logger.info(f"Ajout de {len(default_categories)} catégories par défaut")
            await categories_collection.insert_many(default_categories)
        
        # Vérifier si des tags par défaut existent
        tags_collection = await mongodb.get_collection("tags")
        default_tags_count = await tags_collection.count_documents({"user_id": None})
        
        if default_tags_count == 0:
            # Insérer les tags par défaut
            default_tags = [
                {"name": "Essentiel", "color": "#e74c3c", "user_id": None},
                {"name": "Facultatif", "color": "#3498db", "user_id": None},
                {"name": "Investissement", "color": "#2ecc71", "user_id": None},
                {"name": "Remboursé", "color": "#f39c12", "user_id": None}
            ]
            
            logger.info(f"Ajout de {len(default_tags)} tags par défaut")
            await tags_collection.insert_many(default_tags)
        
        logger.info("Vérification des collections terminée avec succès")
    except Exception as e:
        logger.error(f"Erreur lors de la vérification des collections: {str(e)}")
        raise 