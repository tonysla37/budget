import traceback
from typing import Dict, Any, Union, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from pymongo.errors import PyMongoError
from bson.errors import BSONError, InvalidId

from app.core.config import settings


class ErrorDetails:
    """
    Structure pour les détails d'erreur, avec séparation entre
    message utilisateur et détails techniques.
    """
    def __init__(
        self,
        error_code: str,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        technical_details: Optional[Dict[str, Any]] = None
    ):
        self.error_code = error_code
        self.message = message
        self.status_code = status_code
        self.technical_details = technical_details if technical_details else {}

    def to_dict(self) -> Dict[str, Any]:
        """
        Convertit l'erreur en dictionnaire pour la réponse JSON.
        Les détails techniques ne sont inclus qu'en mode développement.
        """
        error_dict = {
            "error": {
                "code": self.error_code,
                "message": self.message,
            }
        }
        
        # N'inclure les détails techniques qu'en mode développement
        if settings.DEBUG:
            error_dict["error"]["technical_details"] = self.technical_details
            
        return error_dict


async def http_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Gestionnaire d'erreur global.
    """
    error = ErrorDetails(
        error_code="INTERNAL_SERVER_ERROR",
        message="Une erreur interne s'est produite",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        technical_details={
            "exception_type": type(exc).__name__,
            "exception_msg": str(exc),
            "traceback": traceback.format_exc() if settings.DEBUG else None,
            "correlation_id": getattr(request.state, "correlation_id", None)
        }
    )
    
    return JSONResponse(
        status_code=error.status_code,
        content=error.to_dict()
    )


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Gestionnaire d'erreur pour les erreurs de validation des requêtes.
    """
    error = ErrorDetails(
        error_code="VALIDATION_ERROR",
        message="La requête contient des données invalides",
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        technical_details={
            "errors": exc.errors(),
            "body": getattr(exc, 'body', None) if settings.DEBUG else None,
            "correlation_id": getattr(request.state, "correlation_id", None)
        }
    )
    
    return JSONResponse(
        status_code=error.status_code,
        content=error.to_dict()
    )


async def mongodb_error_handler(request: Request, exc: PyMongoError) -> JSONResponse:
    """
    Gestionnaire d'erreur pour les erreurs MongoDB.
    """
    error = ErrorDetails(
        error_code="DATABASE_ERROR",
        message="Une erreur de base de données s'est produite",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        technical_details={
            "exception_type": type(exc).__name__,
            "exception_msg": str(exc),
            "correlation_id": getattr(request.state, "correlation_id", None)
        }
    )
    
    return JSONResponse(
        status_code=error.status_code,
        content=error.to_dict()
    )


async def bson_error_handler(request: Request, exc: Union[BSONError, InvalidId]) -> JSONResponse:
    """
    Gestionnaire d'erreur pour les erreurs de format BSON (comme les ObjectID invalides).
    """
    error = ErrorDetails(
        error_code="INVALID_ID",
        message="L'identifiant fourni est invalide",
        status_code=status.HTTP_400_BAD_REQUEST,
        technical_details={
            "exception_type": type(exc).__name__,
            "exception_msg": str(exc),
            "correlation_id": getattr(request.state, "correlation_id", None)
        }
    )
    
    return JSONResponse(
        status_code=error.status_code,
        content=error.to_dict()
    )


# Configuration des gestionnaires d'exceptions
exception_handlers = {
    Exception: http_error_handler,
    RequestValidationError: validation_error_handler,
    ValidationError: validation_error_handler,
    PyMongoError: mongodb_error_handler,
    BSONError: bson_error_handler,
    InvalidId: bson_error_handler,
} 