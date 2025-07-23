from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.transaction import Category, Tag
from app.schemas import (
    Category as CategorySchema,
    CategoryCreate,
    CategoryUpdate,
    Tag as TagSchema,
    TagCreate,
    TagUpdate
)
from app.routers.auth import get_current_active_user

router = APIRouter()


# ------ Catégories ------

@router.get("/categories", response_model=List[CategorySchema])
async def get_categories(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer toutes les catégories disponibles pour l'utilisateur.
    Inclut les catégories système et les catégories personnelles.
    """
    # Récupérer les catégories système (user_id == NULL) et les catégories de l'utilisateur
    categories = db.query(Category).filter(
        (Category.user_id.is_(None)) | (Category.user_id == current_user.id)
    ).offset(skip).limit(limit).all()
    
    return categories


@router.post("/categories", response_model=CategorySchema, status_code=status.HTTP_201_CREATED)
async def create_category(
    category: CategoryCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Créer une nouvelle catégorie personnelle.
    """
    db_category = Category(
        name=category.name,
        description=category.description,
        color=category.color,
        icon=category.icon,
        user_id=current_user.id
    )
    
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return db_category


@router.put("/categories/{category_id}", response_model=CategorySchema)
async def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Mettre à jour une catégorie existante.
    Seules les catégories créées par l'utilisateur peuvent être modifiées.
    """
    db_category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id  # Vérifier que c'est une catégorie de l'utilisateur
    ).first()
    
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catégorie non trouvée ou non modifiable"
        )
    
    update_data = category_update.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_category, key, value)
    
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return db_category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Supprimer une catégorie.
    Seules les catégories créées par l'utilisateur peuvent être supprimées.
    """
    db_category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id  # Vérifier que c'est une catégorie de l'utilisateur
    ).first()
    
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catégorie non trouvée ou non supprimable"
        )
    
    db.delete(db_category)
    db.commit()
    
    return None


# ------ Tags ------

@router.get("/tags", response_model=List[TagSchema])
async def get_tags(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer tous les tags disponibles pour l'utilisateur.
    Inclut les tags système et les tags personnels.
    """
    # Récupérer les tags système (user_id == NULL) et les tags de l'utilisateur
    tags = db.query(Tag).filter(
        (Tag.user_id.is_(None)) | (Tag.user_id == current_user.id)
    ).offset(skip).limit(limit).all()
    
    return tags


@router.post("/tags", response_model=TagSchema, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag: TagCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Créer un nouveau tag personnel.
    """
    db_tag = Tag(
        name=tag.name,
        description=tag.description,
        color=tag.color,
        user_id=current_user.id
    )
    
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    
    return db_tag


@router.put("/tags/{tag_id}", response_model=TagSchema)
async def update_tag(
    tag_id: int,
    tag_update: TagUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Mettre à jour un tag existant.
    Seuls les tags créés par l'utilisateur peuvent être modifiés.
    """
    db_tag = db.query(Tag).filter(
        Tag.id == tag_id,
        Tag.user_id == current_user.id  # Vérifier que c'est un tag de l'utilisateur
    ).first()
    
    if not db_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag non trouvé ou non modifiable"
        )
    
    update_data = tag_update.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_tag, key, value)
    
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    
    return db_tag


@router.delete("/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Supprimer un tag.
    Seuls les tags créés par l'utilisateur peuvent être supprimés.
    """
    db_tag = db.query(Tag).filter(
        Tag.id == tag_id,
        Tag.user_id == current_user.id  # Vérifier que c'est un tag de l'utilisateur
    ).first()
    
    if not db_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag non trouvé ou non supprimable"
        )
    
    db.delete(db_tag)
    db.commit()
    
    return None 