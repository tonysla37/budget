"""
Module de compatibilité pour rediriger les importations de app.core.database vers app.db.mongodb.
Ce fichier est nécessaire car certaines parties du code importent depuis app.core.database.
"""

from app.db.mongodb import get_db

# Exporter les symboles de app.db.mongodb
__all__ = ['get_db'] 