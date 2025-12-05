"""
Gestion des permissions et vérification des rôles.
"""

from fastapi import HTTPException, status, Depends
from typing import Dict
from ..routers.auth import get_current_user


def require_admin(current_user: Dict = Depends(get_current_user)) -> Dict:
    """
    Vérifie que l'utilisateur connecté a le rôle admin.
    
    Args:
        current_user: Utilisateur connecté (injecté par Depends)
        
    Returns:
        Dict: Données de l'utilisateur si admin
        
    Raises:
        HTTPException: Si l'utilisateur n'est pas admin
    """
    user_role = current_user.get("role", "user")
    
    if user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs"
        )
    
    return current_user


def is_admin(user: Dict) -> bool:
    """
    Vérifie si un utilisateur a le rôle admin.
    
    Args:
        user: Données de l'utilisateur
        
    Returns:
        bool: True si admin, False sinon
    """
    return user.get("role", "user") == "admin"
