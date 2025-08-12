import json
import logging
import time
import uuid
from datetime import datetime, UTC
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger("budget-api")


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware pour le logging structuré des requêtes et réponses HTTP.
    Capture les informations suivantes :
    - ID de corrélation unique pour chaque requête
    - Méthode HTTP et chemin
    - Adresse IP du client
    - User-Agent
    - Temps de traitement
    - Code de statut de la réponse
    - Taille de la réponse
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        # Génération d'un ID de corrélation unique
        correlation_id = str(uuid.uuid4())
        request.state.correlation_id = correlation_id

        # Enregistrement du début de la requête
        start_time = time.time()
        log_dict = {
            "correlation_id": correlation_id,
            "client_ip": request.client.host if request.client else None,
            "method": request.method,
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "user_agent": request.headers.get("User-Agent", "Unknown"),
            "timestamp": datetime.now(UTC).isoformat(),
        }

        # Ajout du header X-Correlation-ID
        request.headers.__dict__["_list"].append(
            (b"x-correlation-id", correlation_id.encode())
        )

        try:
            # Traitement de la requête
            response = await call_next(request)

            # Calcul du temps de traitement
            process_time = time.time() - start_time

            # Enregistrement de la réponse
            log_dict.update({
                "status_code": response.status_code,
                "processing_time_ms": round(process_time * 1000, 2),
                "level": "INFO" if response.status_code < 400 else "WARNING" if response.status_code < 500 else "ERROR"
            })

            # Ajout du header X-Correlation-ID à la réponse
            response.headers["X-Correlation-ID"] = correlation_id

            # Log structuré
            log_message = json.dumps(log_dict)
            if response.status_code < 400:
                logger.info(log_message)
            elif response.status_code < 500:
                logger.warning(log_message)
            else:
                logger.error(log_message)

            return response
        except Exception as e:
            # Calcul du temps de traitement
            process_time = time.time() - start_time

            # Enregistrement de l'erreur
            log_dict.update({
                "status_code": 500,
                "processing_time_ms": round(process_time * 1000, 2),
                "level": "ERROR",
                "error": str(e),
                "error_type": type(e).__name__
            })

            # Log structuré de l'erreur
            logger.error(json.dumps(log_dict))

            # Propagation de l'exception pour la gestion d'erreur globale
            raise 