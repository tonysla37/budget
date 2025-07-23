from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas import Token, TokenData, UserCreate, User as UserSchema, BoursoramaCredentials
from app.services.auth import authenticate_user, create_access_token, get_user_by_email, create_user
from app.services.boursorama import BoursoramaService

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")
boursorama_service = BoursoramaService()


async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current user from the token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Identifiants non valides",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        
        if email is None:
            raise credentials_exception
            
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
        
    user = get_user_by_email(db, email=token_data.email)
    
    if user is None:
        raise credentials_exception
        
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Check if the current user is active.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Utilisateur inactif"
        )
    return current_user


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=UserSchema)
async def register_user(
    user_create: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user.
    """
    db_user = get_user_by_email(db, email=user_create.email)
    
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est déjà utilisé"
        )
        
    return create_user(db=db, user=user_create)


@router.post("/boursorama", status_code=status.HTTP_200_OK)
async def link_boursorama_account(
    credentials: BoursoramaCredentials,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Link a Boursorama account to the user.
    """
    try:
        # Vérifier les identifiants Boursorama
        if not boursorama_service.login(credentials.username, credentials.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Identifiants Boursorama non valides"
            )
            
        # Chiffrer et stocker les identifiants
        encrypted_username, encrypted_password = boursorama_service.encrypt_credentials(
            credentials.username, 
            credentials.password
        )
        
        current_user.bourso_username_encrypted = encrypted_username
        current_user.bourso_password_encrypted = encrypted_password
        
        db.add(current_user)
        db.commit()
        
        return {"status": "success", "message": "Compte Boursorama lié avec succès"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la liaison du compte: {str(e)}"
        ) 