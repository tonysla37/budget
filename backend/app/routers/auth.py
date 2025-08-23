from datetime import datetime, timedelta, timezone
from typing import Optional, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from bson import ObjectId

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas import Token, TokenData, UserCreate, User as UserSchema, BoursoramaCredentials, LoginRequest
from app.services.auth import authenticate_user, create_access_token, get_user_by_email, create_user, update_user, get_current_user

router = APIRouter(tags=["authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db=Depends(get_db)):
    """Enregistrer un nouvel utilisateur."""
    try:
        # Vérifier si l'utilisateur existe déjà
        existing_user = await get_user_by_email(user_data.email, db)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un utilisateur avec cet email existe déjà"
            )

        # Créer l'utilisateur
        user = await create_user(user_data, db)
        
        # Créer le token d'accès
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user["_id"])}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création de l'utilisateur: {str(e)}"
        )


@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest, db=Depends(get_db)):
    """Connexion utilisateur."""
    try:
        user = await authenticate_user(login_data.email, login_data.password, db)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou mot de passe incorrect",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user["_id"])}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la connexion: {str(e)}"
        )


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    """Endpoint OAuth2 pour la connexion."""
    user = await authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user["_id"])}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserSchema)
async def get_current_user_info(current_user: Dict = Depends(get_current_user)):
    """Récupérer les informations de l'utilisateur connecté."""
    try:
        # Convertir l'ObjectId en string pour le schéma
        user_data = dict(current_user)
        user_data["id"] = str(user_data.pop("_id"))
        
        return UserSchema(**user_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des données utilisateur: {str(e)}"
        )


@router.put("/profile", response_model=UserSchema)
async def update_user_profile(
    user_update: UserCreate,
    current_user: Dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Mettre à jour le profil utilisateur."""
    try:
        updated_user = await update_user(str(current_user["_id"]), user_update, db)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        # Convertir l'ObjectId en string pour le schéma
        user_data = dict(updated_user)
        user_data["id"] = str(user_data.pop("_id"))
        
        return UserSchema(**user_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise à jour du profil: {str(e)}"
        ) 