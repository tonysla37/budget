from datetime import datetime, timedelta, UTC
from typing import Optional, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from bson import ObjectId

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas import Token, TokenData, UserCreate, User as UserSchema, BoursoramaCredentials
from app.services.auth import authenticate_user, create_access_token, get_user_by_email, create_user, update_user
from app.services.boursorama import BoursoramaService

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    """
    Récupère l'utilisateur actuel à partir du token JWT.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Identifiants invalides",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    user = await get_user_by_email(token_data.email, db)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)):
    """
    Vérifie que l'utilisateur actuel est actif.
    """
    if not current_user.get("is_active", True):
        raise HTTPException(status_code=400, detail="Utilisateur inactif")
    return current_user


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    """
    Endpoint pour l'authentification et la génération de token JWT.
    """
    user = await authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate, db = Depends(get_db)):
    """
    Endpoint pour l'enregistrement d'un nouvel utilisateur.
    """
    # Vérifier si l'utilisateur existe déjà
    db_user = await get_user_by_email(user_data.email, db)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email déjà enregistré"
        )
    
    # Créer l'utilisateur
    user = await create_user(user_data, db)
    return user


@router.post("/boursorama/credentials", status_code=status.HTTP_200_OK)
async def set_boursorama_credentials(
    credentials: BoursoramaCredentials,
    current_user: User = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """
    Enregistre les identifiants Boursorama chiffrés pour l'utilisateur.
    """
    # Chiffrer les identifiants
    boursorama_service = BoursoramaService()
    encrypted_username, encrypted_password = boursorama_service.encrypt_credentials(
        credentials.username, credentials.password
    )
    
    # Vérifier que les identifiants sont valides
    if not boursorama_service.login(credentials.username, credentials.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Identifiants Boursorama invalides"
        )
    
    # Mettre à jour l'utilisateur
    user_update = {
        "bourso_username_encrypted": encrypted_username,
        "bourso_password_encrypted": encrypted_password,
        "bourso_last_sync": datetime.now(UTC)
    }
    
    await update_user(current_user["id"], user_update, db)
    
    return {"message": "Identifiants Boursorama enregistrés avec succès"}


@router.post("/sync/boursorama", status_code=status.HTTP_200_OK)
async def sync_boursorama(
    current_user: User = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """
    Synchronise les transactions de l'utilisateur avec Boursorama.
    """
    try:
        # Vérifier que l'utilisateur a configuré ses identifiants Boursorama
        if not hasattr(current_user, "bourso_username_encrypted") or not hasattr(current_user, "bourso_password_encrypted"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Identifiants Boursorama non configurés"
            )
        
        # Synchroniser les transactions
        boursorama_service = BoursoramaService()
        new_transactions_count = await boursorama_service.synchronize_user_transactions(current_user, db)
        
        # Mettre à jour la date de dernière synchronisation
        users_collection = await db.get_collection("users")
        await users_collection.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": {"bourso_last_sync": datetime.now(UTC)}}
        )
        
        return {"message": f"{new_transactions_count} nouvelles transactions importées"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la synchronisation: {str(e)}"
        ) 