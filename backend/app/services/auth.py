import os
from datetime import datetime, timedelta, UTC
from typing import Dict, Optional, Union, List

from bson import ObjectId
from jose import jwt
from passlib.context import CryptContext
from pydantic import EmailStr

from app.core.config import settings
from app.models.user import User

# Configuration de l'algorithme de hachage de mot de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Vérifie si un mot de passe en clair correspond au mot de passe haché.
    """
    try:
        print(f"Vérification du mot de passe: {plain_password}, hash: {hashed_password}")
        result = pwd_context.verify(plain_password, hashed_password)
        print(f"Résultat de la vérification: {result}")
        return result
    except Exception as e:
        print(f"Erreur lors de la vérification du mot de passe: {e}")
        return False


def get_password_hash(password: str) -> str:
    """
    Génère un hash sécurisé à partir d'un mot de passe en clair.
    """
    return pwd_context.hash(password)


def create_access_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crée un JWT (JSON Web Token) pour l'authentification.
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


async def get_user_by_email(email: str, db_session) -> Optional[Dict]:
    """
    Récupère un utilisateur par son adresse email.
    """
    user = await db_session.find_one("users", {"email": email})
    return user


async def get_user(user_id: str, db_session) -> Optional[Dict]:
    """
    Récupère un utilisateur par son ID.
    """
    user = await db_session.find_one("users", {"_id": ObjectId(user_id)})
    return user


async def authenticate_user(email: str, password: str, db_session) -> Optional[Dict]:
    """
    Authentifie un utilisateur en vérifiant son email et son mot de passe.
    """
    user = await get_user_by_email(email, db_session)
    
    if not user:
        return None
    
    if not verify_password(password, user["hashed_password"]):
        return None
    
    return user


async def create_user(user_data: Dict, db_session) -> Dict:
    """
    Crée un nouvel utilisateur.
    """
    hashed_password = get_password_hash(user_data["password"])
    
    user_dict = {
        "email": user_data["email"],
        "hashed_password": hashed_password,
        "first_name": user_data.get("first_name"),
        "last_name": user_data.get("last_name"),
        "is_active": True,
        "created_at": datetime.now(UTC),
    }
    
    result = await db_session.insert_one("users", user_dict)
    user_dict["id"] = str(result.inserted_id)
    
    return user_dict


async def update_user(user_id: str, user_data: Dict, db_session) -> Optional[Dict]:
    """
    Met à jour un utilisateur existant.
    """
    update_data = {k: v for k, v in user_data.items() if v is not None and k != "password"}
    
    if "password" in user_data and user_data["password"]:
        update_data["hashed_password"] = get_password_hash(user_data["password"])
    
    update_data["updated_at"] = datetime.now(UTC)
    
    await db_session.update_one(
        "users",
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    return await get_user(user_id, db_session)


async def delete_user(user_id: str, db_session) -> bool:
    """
    Supprime un utilisateur.
    """
    result = await db_session.delete_one("users", {"_id": ObjectId(user_id)})
    return result.deleted_count > 0
