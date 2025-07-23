from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from bson import ObjectId

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.db.mongodb import MongoDB
from app.db.models import UserModel, USERS_COLLECTION
from app.schemas.user import UserCreate, UserUpdate

# Configurer le contexte de cryptage pour les mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Vérifie qu'un mot de passe en clair correspond au mot de passe hashé.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash un mot de passe.
    """
    return pwd_context.hash(password)


async def authenticate_user(db: MongoDB, email: str, password: str) -> Optional[UserModel]:
    """
    Authentifie un utilisateur par email et mot de passe.
    """
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_access_token(
    data: Dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """
    Crée un nouveau token JWT.
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


async def get_user(db: MongoDB, user_id: str) -> Optional[UserModel]:
    """
    Récupère un utilisateur par ID.
    """
    user_dict = await db.find_one(USERS_COLLECTION, {"_id": ObjectId(user_id)})
    if user_dict:
        return UserModel(**user_dict)
    return None


async def get_user_by_email(db: MongoDB, email: str) -> Optional[UserModel]:
    """
    Récupère un utilisateur par email.
    """
    user_dict = await db.find_one(USERS_COLLECTION, {"email": email})
    if user_dict:
        return UserModel(**user_dict)
    return None


async def create_user(db: MongoDB, user: UserCreate) -> UserModel:
    """
    Crée un nouvel utilisateur.
    """
    hashed_password = get_password_hash(user.password)
    
    user_dict = {
        "email": user.email,
        "hashed_password": hashed_password,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_active": user.is_active,
        "is_superuser": False,
        "created_at": datetime.utcnow(),
    }
    
    user_id = await db.insert_one(USERS_COLLECTION, user_dict)
    user_dict["_id"] = user_id
    
    return UserModel(**user_dict)


async def update_user(db: MongoDB, user_id: str, user_update: UserUpdate) -> Optional[UserModel]:
    """
    Met à jour un utilisateur.
    """
    user = await get_user(db, user_id)
    
    if not user:
        return None
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data["password"])
        del update_data["password"]
    
    update_data["updated_at"] = datetime.utcnow()
    
    modified_count = await db.update_one(
        USERS_COLLECTION, 
        {"_id": ObjectId(user_id)}, 
        update_data
    )
    
    if modified_count:
        return await get_user(db, user_id)
    return None


async def delete_user(db: MongoDB, user_id: str) -> bool:
    """
    Supprime un utilisateur.
    """
    deleted_count = await db.delete_one(USERS_COLLECTION, {"_id": ObjectId(user_id)})
    return deleted_count > 0 