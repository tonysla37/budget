import time
from typing import Callable, Dict, List
import threading
import psutil
import logging
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from contextlib import asynccontextmanager

# Configuration du logging
logger = logging.getLogger("budget-api-monitoring")

class Metric:
    """
    Classe pour représenter une métrique avec son nom, sa valeur et ses tags.
    """
    def __init__(self, name: str, value: float, tags: Dict[str, str] = None):
        self.name = name
        self.value = value
        self.tags = tags or {}

    def __str__(self) -> str:
        tag_str = ",".join([f"{k}={v}" for k, v in self.tags.items()]) if self.tags else ""
        return f"{self.name}{{{tag_str}}}={self.value}"


class MetricsCollector:
    """
    Collecteur de métriques avec stockage en mémoire.
    Dans une implémentation réelle, ce collecteur enverrait les métriques
    à un système comme Prometheus, InfluxDB, etc.
    """
    def __init__(self):
        self.metrics: Dict[str, List[Metric]] = {}
        self._lock = threading.Lock()
        
    def collect(self, metric: Metric):
        """
        Collecte une métrique.
        """
        with self._lock:
            if metric.name not in self.metrics:
                self.metrics[metric.name] = []
            self.metrics[metric.name].append(metric)
            
    def get_latest(self, name: str) -> Metric:
        """
        Récupère la dernière valeur d'une métrique.
        """
        with self._lock:
            if name not in self.metrics or not self.metrics[name]:
                return None
            return self.metrics[name][-1]
    
    def get_all(self) -> Dict[str, List[Metric]]:
        """
        Récupère toutes les métriques.
        """
        with self._lock:
            return self.metrics.copy()


class MetricsMiddleware(BaseHTTPMiddleware):
    """
    Middleware pour collecter des métriques sur les requêtes HTTP.
    """
    def __init__(self, app: ASGIApp, collector: MetricsCollector):
        super().__init__(app)
        self.collector = collector

    async def dispatch(self, request: Request, call_next: Callable):
        start_time = time.time()
        
        # Traitement de la requête
        response = await call_next(request)
        
        # Mesure du temps de traitement
        process_time = time.time() - start_time
        
        # Collection des métriques
        path = request.url.path
        method = request.method
        
        # Métrique de temps de traitement
        self.collector.collect(
            Metric(
                name="http_request_duration_seconds",
                value=process_time,
                tags={
                    "path": path,
                    "method": method,
                    "status_code": str(response.status_code)
                }
            )
        )
        
        # Métrique de comptage des requêtes
        self.collector.collect(
            Metric(
                name="http_requests_total",
                value=1,
                tags={
                    "path": path,
                    "method": method,
                    "status_code": str(response.status_code)
                }
            )
        )
        
        return response


class SystemMetricsCollector:
    """
    Collecteur de métriques système (CPU, mémoire, etc.).
    """
    def __init__(self, collector: MetricsCollector, interval: int = 60):
        """
        Initialise le collecteur de métriques système.
        
        Args:
            collector: Collecteur de métriques
            interval: Intervalle de collecte en secondes
        """
        self.collector = collector
        self.interval = interval
        self._running = False
        self._thread = None
    
    def start(self):
        """
        Démarre la collecte périodique de métriques système.
        """
        if self._running:
            return
            
        self._running = True
        self._thread = threading.Thread(target=self._collect_metrics_periodically)
        self._thread.daemon = True
        self._thread.start()
    
    def stop(self):
        """
        Arrête la collecte périodique de métriques système.
        """
        self._running = False
        if self._thread:
            self._thread.join(timeout=1.0)
    
    def _collect_metrics_periodically(self):
        """
        Collecte périodiquement les métriques système.
        """
        while self._running:
            try:
                self._collect_system_metrics()
                time.sleep(self.interval)
            except Exception as e:
                logger.error(f"Erreur lors de la collecte des métriques système: {e}")
    
    def _collect_system_metrics(self):
        """
        Collecte les métriques système.
        """
        # CPU
        cpu_percent = psutil.cpu_percent(interval=1)
        self.collector.collect(
            Metric(
                name="system_cpu_percent",
                value=cpu_percent
            )
        )
        
        # Mémoire
        memory = psutil.virtual_memory()
        self.collector.collect(
            Metric(
                name="system_memory_used_bytes",
                value=memory.used
            )
        )
        
        self.collector.collect(
            Metric(
                name="system_memory_total_bytes",
                value=memory.total
            )
        )
        
        # Disque
        disk = psutil.disk_usage('/')
        self.collector.collect(
            Metric(
                name="system_disk_used_bytes",
                value=disk.used
            )
        )
        
        self.collector.collect(
            Metric(
                name="system_disk_total_bytes",
                value=disk.total
            )
        )


# Méthodes pour configurer les middlewares dans l'application FastAPI
def setup_monitoring(app: FastAPI) -> MetricsCollector:
    """
    Configure le monitoring pour l'application FastAPI.
    
    Returns:
        MetricsCollector: Le collecteur de métriques
    """
    collector = MetricsCollector()
    
    # Middleware pour collecter les métriques HTTP
    app.add_middleware(MetricsMiddleware, collector=collector)
    
    # Collecteur de métriques système
    system_collector = SystemMetricsCollector(collector)
    
    # Utilisation du gestionnaire de cycle de vie pour les métriques
    @app.middleware("http")
    async def metrics_middleware(request: Request, call_next):
        # Cette fonction sera appelée pour chaque requête HTTP
        # et permet d'accéder au collecteur de métriques
        request.state.metrics_collector = collector
        response = await call_next(request)
        return response
    
    # Ajout des gestionnaires de cycle de vie à l'application
    old_lifespan = getattr(app, 'router').lifespan_context
    
    @asynccontextmanager
    async def lifespan_with_metrics(app):
        # Démarre la collecte de métriques système
        system_collector.start()
        try:
            # Exécute le gestionnaire de cycle de vie original s'il existe
            if old_lifespan:
                async with old_lifespan(app):
                    yield
            else:
                yield
        finally:
            # Arrête la collecte de métriques système
            system_collector.stop()
    
    # Remplace le gestionnaire de cycle de vie de l'application
    getattr(app, 'router').lifespan_context = lifespan_with_metrics
    
    # Endpoint pour exposer les métriques (pour Prometheus ou autre)
    @app.get("/metrics")
    async def get_metrics():
        metrics = collector.get_all()
        response = ""
        for name, metric_list in metrics.items():
            for metric in metric_list[-10:]:  # Limite à 10 dernières métriques par nom
                response += f"{str(metric)}\n"
        return Response(content=response, media_type="text/plain")
    
    return collector 