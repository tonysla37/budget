from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.mongodb import mongodb, get_db
from app.db.models import create_indexes
from app.routers import auth, users, transactions, categories, reports
from app.interceptors import setup_interceptors

# Création de l'application FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="API pour l'application de gestion budgétaire",
    debug=settings.DEBUG,
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration des intercepteurs (logging, monitoring, gestion d'erreurs)
setup_interceptors(app)

# Inclusion des routeurs
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])


@app.on_event("startup")
async def startup_db_client():
    """
    Initialise la connexion à MongoDB au démarrage de l'application.
    """
    await mongodb.connect_to_database()
    await create_indexes(mongodb)
    
    
@app.on_event("shutdown")
async def shutdown_db_client():
    """
    Ferme la connexion à MongoDB à l'arrêt de l'application.
    """
    await mongodb.close_database_connection()


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