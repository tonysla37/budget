"""
Utilitaires pour la gestion des types MongoDB.

Ce module fournit des fonctions helper pour gérer les conversions de types
entre Python et MongoDB de manière cohérente dans toute l'application.
"""

from datetime import datetime, date
from typing import Union, Any
from bson import ObjectId


def ensure_objectid(value: Union[str, ObjectId, None]) -> Union[ObjectId, None]:
    """
    Convertit une string en ObjectId si nécessaire.
    
    Cette fonction garantit qu'un ID est bien un ObjectId MongoDB, même si
    il est passé comme string (par exemple depuis un JWT ou une API).
    
    Args:
        value: Une string représentant un ObjectId, un ObjectId existant, ou None
        
    Returns:
        ObjectId: L'ObjectId correspondant
        None: Si la valeur d'entrée est None
        
    Examples:
        >>> ensure_objectid("507f1f77bcf86cd799439011")
        ObjectId('507f1f77bcf86cd799439011')
        
        >>> ensure_objectid(ObjectId("507f1f77bcf86cd799439011"))
        ObjectId('507f1f77bcf86cd799439011')
        
        >>> ensure_objectid(None)
        None
    """
    if value is None:
        return None
    
    if isinstance(value, str):
        return ObjectId(value)
    
    return value


def to_mongo_date(date_value: Union[datetime, date, str, None]) -> Union[str, None]:
    """
    Convertit une date en string au format MongoDB (YYYY-MM-DD).
    
    MongoDB stocke les dates comme des strings "YYYY-MM-DD" dans ce projet.
    Cette fonction garantit que toutes les dates sont converties dans le bon format.
    
    Args:
        date_value: Un objet datetime, date, une string, ou None
        
    Returns:
        str: La date au format "YYYY-MM-DD"
        None: Si la valeur d'entrée est None
        
    Examples:
        >>> to_mongo_date(datetime(2025, 12, 2))
        '2025-12-02'
        
        >>> to_mongo_date(date(2025, 12, 2))
        '2025-12-02'
        
        >>> to_mongo_date("2025-12-02")
        '2025-12-02'
        
        >>> to_mongo_date(None)
        None
    """
    if date_value is None:
        return None
    
    if isinstance(date_value, datetime):
        return date_value.strftime("%Y-%m-%d")
    
    if isinstance(date_value, date):
        return date_value.strftime("%Y-%m-%d")
    
    if isinstance(date_value, str):
        # Vérifier que le format est correct (basique)
        if len(date_value) == 10 and date_value[4] == '-' and date_value[7] == '-':
            return date_value
        # Sinon essayer de parser et reformater
        try:
            parsed = datetime.fromisoformat(date_value.replace('Z', '+00:00'))
            return parsed.strftime("%Y-%m-%d")
        except ValueError:
            return date_value
    
    return str(date_value)


def ensure_objectid_dict(data: dict, fields: list[str]) -> dict:
    """
    Convertit plusieurs champs d'un dictionnaire en ObjectId si nécessaire.
    
    Pratique pour préparer des filtres MongoDB avec plusieurs IDs.
    
    Args:
        data: Le dictionnaire contenant les données
        fields: Liste des noms de champs à convertir en ObjectId
        
    Returns:
        dict: Le dictionnaire avec les champs convertis
        
    Examples:
        >>> data = {"user_id": "507f1f77bcf86cd799439011", "category_id": "507f191e810c19729de860ea"}
        >>> ensure_objectid_dict(data, ["user_id", "category_id"])
        {'user_id': ObjectId('507f1f77bcf86cd799439011'), 
         'category_id': ObjectId('507f191e810c19729de860ea')}
    """
    result = data.copy()
    for field in fields:
        if field in result and result[field] is not None:
            result[field] = ensure_objectid(result[field])
    return result


def to_mongo_date_range(start_date: Any, end_date: Any) -> dict:
    """
    Crée un filtre de plage de dates pour MongoDB.
    
    Args:
        start_date: Date de début (datetime, date, ou string)
        end_date: Date de fin (datetime, date, ou string)
        
    Returns:
        dict: Filtre MongoDB pour une plage de dates
        
    Examples:
        >>> to_mongo_date_range(date(2025, 11, 1), date(2025, 11, 30))
        {'$gte': '2025-11-01', '$lte': '2025-11-30'}
    """
    date_filter = {}
    
    if start_date is not None:
        date_filter["$gte"] = to_mongo_date(start_date)
    
    if end_date is not None:
        # Utiliser $lt au lieu de $lte pour exclure le dernier jour
        # Ou $lte pour l'inclure - à adapter selon le besoin
        date_filter["$lt"] = to_mongo_date(end_date)
    
    return date_filter


def serialize_objectid(obj: Any) -> Any:
    """
    Convertit récursivement les ObjectId en strings dans une structure de données.
    
    Utile pour sérialiser des documents MongoDB avant de les retourner via l'API.
    
    Args:
        obj: L'objet à sérialiser (dict, list, ObjectId, ou autre)
        
    Returns:
        L'objet avec tous les ObjectId convertis en strings
        
    Examples:
        >>> doc = {"_id": ObjectId("507f1f77bcf86cd799439011"), "name": "Test"}
        >>> serialize_objectid(doc)
        {'_id': '507f1f77bcf86cd799439011', 'name': 'Test'}
    """
    if isinstance(obj, ObjectId):
        return str(obj)
    
    if isinstance(obj, dict):
        return {key: serialize_objectid(value) for key, value in obj.items()}
    
    if isinstance(obj, list):
        return [serialize_objectid(item) for item in obj]
    
    return obj
