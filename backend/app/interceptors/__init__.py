from fastapi import FastAPI

from app.interceptors.logging import LoggingMiddleware
from app.interceptors.monitoring import setup_monitoring
from app.interceptors.error_handling import exception_handlers


def setup_interceptors(app: FastAPI):
    """
    Configure tous les intercepteurs pour l'application FastAPI.
    
    Cette fonction doit être appelée lors de l'initialisation de l'application
    pour configurer tous les intercepteurs (middlewares, gestionnaires d'exceptions, etc.).
    """
    # Configuration du middleware de logging
    app.add_middleware(LoggingMiddleware)
    
    # Configuration du système de monitoring
    setup_monitoring(app)
    
    # Configuration des gestionnaires d'exceptions
    for exc, handler in exception_handlers.items():
        app.add_exception_handler(exc, handler) 