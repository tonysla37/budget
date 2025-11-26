from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.db.mongodb import mongodb, get_db
from app.db.models import create_indexes
from app.routers import auth, users, transactions, categories, reports, dashboard, settings as settings_router, budgets
from app.interceptors import setup_interceptors

# Configuration du logger
logger = logging.getLogger("budget-api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestionnaire de cycle de vie de l'application.
    Se connecte à MongoDB au démarrage et ferme la connexion à l'arrêt.
    """
    # Startup: Initialise la connexion à MongoDB
    try:
        logger.info("Démarrage de l'application - Connexion à MongoDB...")
        await mongodb.connect_to_database()
        await create_indexes(mongodb)
        logger.info("Application démarrée avec succès - MongoDB connecté")
    except Exception as e:
        logger.error(f"Erreur lors du démarrage de l'application: {str(e)}")
        raise
    
    yield
    
    # Shutdown: Ferme la connexion à MongoDB
    try:
        logger.info("Arrêt de l'application - Fermeture de la connexion MongoDB...")
        await mongodb.close_database_connection()
        logger.info("Connexion MongoDB fermée avec succès")
    except Exception as e:
        logger.error(f"Erreur lors de la fermeture de la connexion MongoDB: {str(e)}")
        raise

# Création de l'application FastAPI avec le gestionnaire de cycle de vie
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="""API pour l'application de gestion budgétaire.
    
**Note sur l'authentification dans Swagger UI** :
    
Dans l'interface Swagger, les icônes de cadenas indiquent le statut de sécurité des endpoints :
- 🔓 Cadenas ouvert : Endpoint public, ne nécessite pas d'authentification
- 🔒 Cadenas fermé : Endpoint sécurisé, nécessite une authentification

**Important** : Après vous être authentifié via le bouton "Authorize", les cadenas apparaîtront fermés, ce qui signifie que vous êtes authentifié et pouvez accéder aux endpoints protégés.
    """,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# Configuration CORS - DOIT être ajouté EN PREMIER (exécuté en dernier dans la chaîne)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporaire : autoriser toutes les origines
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration des intercepteurs (logging, monitoring, gestion d'erreurs)
setup_interceptors(app)

# Inclusion des routeurs (les routeurs ont déjà leur prefix /api/... défini)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(reports.router)
app.include_router(dashboard.router)
app.include_router(settings_router.router)
app.include_router(budgets.router)


@app.get("/api/health", tags=["health"])
async def health_check():
    """
    Vérifie l'état de l'API.
    """
    return {
        "status": "ok",
        "version": settings.PROJECT_VERSION,
        "environment": settings.ENVIRONMENT
    }


@app.get("/api/health/db", tags=["health"])
async def db_health_check(db = Depends(get_db)):
    """
    Vérifie l'état de la connexion à la base de données.
    """
    try:
        # Essayer une simple requête pour vérifier que la BD fonctionne
        await db.client.admin.command('ping')
        
        # Essayer d'obtenir quelques statistiques basiques
        db_info = {}
        try:
            collections = await db.db.list_collection_names()
            db_info["collections"] = collections
            db_info["database"] = settings.MONGODB_DB_NAME
        except Exception as e:
            logger.warning(f"Impossible de récupérer les informations de la base de données: {str(e)}")
            db_info["error"] = str(e)
        
        return {
            "status": "ok",
            "database_type": "MongoDB",
            "database_info": db_info
        }
    except Exception as e:
        logger.error(f"Erreur lors de la vérification de la base de données: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"La connexion à la base de données est indisponible: {str(e)}"
        )


@app.get("/", tags=["root"])
async def root():
    """
    Redirection vers la documentation de l'API.
    """
    return {
        "message": "Bienvenue sur l'API de gestion budgétaire",
        "documentation": "/docs",
        "version": settings.PROJECT_VERSION
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG) 