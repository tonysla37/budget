import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

# Configuration du logger
logger = logging.getLogger(__name__)

# Configuration du hachage des mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuration OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Vérifie si le mot de passe en clair correspond au hash.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Génère un hash du mot de passe.
    """
    return pwd_context.hash(password)


def create_access_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crée un JWT (JSON Web Token) pour l'authentification.
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)) -> Dict:
    """
    Récupère l'utilisateur actuel à partir du token JWT.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossible de valider les identifiants",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await get_user(user_id, db)
    if user is None:
        raise credentials_exception
    
    return user


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
    # Convertir en ObjectId si nécessaire
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    
    user = await db_session.find_one("users", {"_id": user_id})
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


async def create_user(user_data, db_session) -> Dict:
    """
    Crée un nouvel utilisateur.
    """
    # Convertir l'objet Pydantic en dictionnaire
    user_dict = user_data.model_dump()
    
    hashed_password = get_password_hash(user_dict["password"])
    
    user_dict = {
        "email": user_dict["email"],
        "hashed_password": hashed_password,
        "first_name": user_dict.get("first_name"),
        "last_name": user_dict.get("last_name"),
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
    }
    
    result = await db_session.insert_one("users", user_dict)
    # result est directement un ObjectId, pas un objet avec inserted_id
    user_dict["_id"] = result
    
    return user_dict


async def update_user(user_id: str, user_data: Dict, db_session) -> Optional[Dict]:
    """
    Met à jour un utilisateur existant.
    """
    update_data = {k: v for k, v in user_data.items() if v is not None and k != "password"}
    
    if "password" in user_data and user_data["password"]:
        update_data["hashed_password"] = get_password_hash(user_data["password"])
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    # Convertir en ObjectId si nécessaire
    user_id_obj = user_id
    if isinstance(user_id_obj, str):
        user_id_obj = ObjectId(user_id_obj)
    
    await db_session.update_one(
        "users",
        {"_id": user_id_obj},
        {"$set": update_data}
    )
    
    return await get_user(user_id, db_session)


async def delete_user(user_id: str, db_session) -> bool:
    """
    Supprime un utilisateur.
    """
    # Convertir en ObjectId si nécessaire
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    
    result = await db_session.delete_one("users", {"_id": user_id})
    return result.deleted_count > 0
