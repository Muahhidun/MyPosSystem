from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..db import get_db
from ..models import Ingredient
from ..schemas import (
    IngredientCreate,
    IngredientUpdate,
    IngredientResponse,
    IngredientStockUpdate
)

router = APIRouter(prefix="/ingredients", tags=["ingredients"])


@router.get("/", response_model=List[IngredientResponse])
def get_ingredients(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    low_stock: bool = None,
    db: Session = Depends(get_db)
):
    """
    Получить список ингредиентов с фильтрацией

    Параметры:
    - skip: сколько пропустить (для пагинации)
    - limit: максимальное количество
    - category: фильтр по категории
    - low_stock: показать только с низким остатком
    """
    query = db.query(Ingredient)

    # Фильтр по категории
    if category:
        query = query.filter(Ingredient.category == category)

    # Фильтр по низкому остатку
    if low_stock is True:
        query = query.filter(Ingredient.stock_quantity <= Ingredient.min_stock)

    ingredients = query.offset(skip).limit(limit).all()
    return ingredients


@router.get("/{ingredient_id}", response_model=IngredientResponse)
def get_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    """Получить ингредиент по ID"""
    ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ингредиент с ID {ingredient_id} не найден"
        )
    return ingredient


@router.post("/", response_model=IngredientResponse, status_code=status.HTTP_201_CREATED)
def create_ingredient(ingredient_data: IngredientCreate, db: Session = Depends(get_db)):
    """Создать новый ингредиент"""
    # Проверяем что такого ингредиента еще нет
    existing = db.query(Ingredient).filter(Ingredient.name == ingredient_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ингредиент '{ingredient_data.name}' уже существует"
        )

    # Создаем ингредиент
    ingredient = Ingredient(**ingredient_data.model_dump())
    db.add(ingredient)
    db.commit()
    db.refresh(ingredient)
    return ingredient


@router.put("/{ingredient_id}", response_model=IngredientResponse)
def update_ingredient(
    ingredient_id: int,
    ingredient_data: IngredientUpdate,
    db: Session = Depends(get_db)
):
    """Обновить ингредиент"""
    ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ингредиент с ID {ingredient_id} не найден"
        )

    # Обновляем только переданные поля
    update_data = ingredient_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ingredient, field, value)

    db.commit()
    db.refresh(ingredient)
    return ingredient


@router.patch("/{ingredient_id}/stock", response_model=IngredientResponse)
def update_stock(
    ingredient_id: int,
    stock_update: IngredientStockUpdate,
    db: Session = Depends(get_db)
):
    """
    Обновить остаток ингредиента (приход/расход)

    Параметры:
    - quantity: положительное для прихода, отрицательное для расхода
    - reason: причина изменения
    """
    ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ингредиент с ID {ingredient_id} не найден"
        )

    # Обновляем остаток
    new_quantity = ingredient.stock_quantity + stock_update.quantity

    # Проверяем что остаток не уходит в минус
    if new_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недостаточно ингредиента. Доступно: {ingredient.stock_quantity}, запрошено: {abs(stock_update.quantity)}"
        )

    ingredient.stock_quantity = new_quantity
    db.commit()
    db.refresh(ingredient)
    return ingredient


@router.delete("/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    """Удалить ингредиент"""
    ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ингредиент с ID {ingredient_id} не найден"
        )

    # TODO: Проверить что ингредиент не используется в техкартах
    # Пока просто удаляем

    db.delete(ingredient)
    db.commit()
    return None


@router.get("/categories/list", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    """Получить список всех категорий ингредиентов"""
    categories = db.query(Ingredient.category).distinct().filter(Ingredient.category.isnot(None)).all()
    return [cat[0] for cat in categories if cat[0]]
