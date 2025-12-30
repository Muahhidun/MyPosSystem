from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..db import get_db
from ..models import Category, CategoryType
from ..schemas import CategoryCreate, CategoryUpdate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=List[CategoryResponse])
def get_categories(
    type: Optional[CategoryType] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """
    Получить список категорий

    Параметры:
    - type: фильтр по типу (product/recipe/ingredient/semifinished)
    - active_only: показывать только активные категории
    """
    query = db.query(Category).order_by(Category.display_order, Category.name)

    if type:
        query = query.filter(Category.type == type)

    if active_only:
        query = query.filter(Category.is_active == True)

    return query.all()


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    """Получить категорию по ID"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id {category_id} not found"
        )
    return category


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    """
    Создать новую категорию

    Проверяет уникальность комбинации (name + type)
    """
    # Проверка уникальности (name + type)
    existing = db.query(Category).filter(
        Category.name == category.name,
        Category.type == category.type
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{category.name}' already exists for type '{category.type}'"
        )

    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    db: Session = Depends(get_db)
):
    """Обновить категорию"""
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id {category_id} not found"
        )

    # Проверка уникальности при изменении имени
    if category_update.name and category_update.name != db_category.name:
        existing = db.query(Category).filter(
            Category.name == category_update.name,
            Category.type == db_category.type,
            Category.id != category_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category '{category_update.name}' already exists"
            )

    # Обновляем только переданные поля
    update_data = category_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_category, field, value)

    db.commit()
    db.refresh(db_category)
    return db_category


@router.patch("/reorder", status_code=status.HTTP_200_OK)
def reorder_categories(order: List[dict], db: Session = Depends(get_db)):
    """
    Обновить порядок категорий

    Body: [{"id": 1, "display_order": 0}, {"id": 3, "display_order": 1}, ...]
    """
    for item in order:
        category_id = item.get("id")
        display_order = item.get("display_order")

        if category_id is None or display_order is None:
            continue

        category = db.query(Category).filter(Category.id == category_id).first()
        if category:
            category.display_order = display_order

    db.commit()
    return {"status": "ok", "updated": len(order)}


@router.delete("/{category_id}", status_code=status.HTTP_200_OK)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    """
    Удалить категорию

    Проверяет что нет связанных товаров/техкарт перед удалением
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id {category_id} not found"
        )

    # Проверить что нет связанных товаров/техкарт
    if category.products:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete category. {len(category.products)} products are using it"
        )

    if category.recipes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete category. {len(category.recipes)} recipes are using it"
        )

    db.delete(category)
    db.commit()
    return {"status": "deleted", "id": category_id}
