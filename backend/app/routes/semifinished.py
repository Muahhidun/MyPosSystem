from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..db import get_db
from ..models import Semifinished, SemifinishedIngredient, Ingredient
from ..schemas import (
    SemifinishedCreate,
    SemifinishedUpdate,
    SemifinishedResponse,
    SemifinishedListItem
)

router = APIRouter(prefix="/semifinished", tags=["semifinished"])


def _enrich_semifinished_response(semifinished: Semifinished, db: Session) -> dict:
    """Обогащает данные полуфабриката информацией об ингредиентах"""
    semifinished_dict = {
        "id": semifinished.id,
        "name": semifinished.name,
        "category": semifinished.category,
        "unit": semifinished.unit,
        "output_quantity": semifinished.output_quantity,
        "cost": semifinished.cost,
        "created_at": semifinished.created_at,
        "updated_at": semifinished.updated_at,
        "ingredients": []
    }

    # Добавляем информацию об ингредиентах
    for sf_ing in semifinished.ingredients:
        ingredient = db.query(Ingredient).filter(Ingredient.id == sf_ing.ingredient_id).first()
        if ingredient:
            semifinished_dict["ingredients"].append({
                "id": sf_ing.id,
                "semifinished_id": sf_ing.semifinished_id,
                "ingredient_id": sf_ing.ingredient_id,
                "ingredient_name": ingredient.name,
                "ingredient_unit": ingredient.unit,
                "weight": sf_ing.weight,
                "cost": sf_ing.cost
            })

    return semifinished_dict


@router.get("", response_model=List[SemifinishedListItem])
def get_semifinished_list(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    db: Session = Depends(get_db)
):
    """Получить список всех полуфабрикатов"""
    query = db.query(Semifinished)

    if category:
        query = query.filter(Semifinished.category == category)

    semifinished = query.offset(skip).limit(limit).all()

    # Формируем ответ для списка (без детализации ингредиентов)
    return [
        {
            "id": sf.id,
            "name": sf.name,
            "category": sf.category,
            "unit": sf.unit,
            "output_quantity": sf.output_quantity,
            "cost": sf.cost,
            "created_at": sf.created_at
        }
        for sf in semifinished
    ]


@router.get("/{semifinished_id}", response_model=SemifinishedResponse)
def get_semifinished(semifinished_id: int, db: Session = Depends(get_db)):
    """Получить полуфабрикат по ID с полным составом"""
    semifinished = db.query(Semifinished).filter(Semifinished.id == semifinished_id).first()

    if not semifinished:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Полуфабрикат с ID {semifinished_id} не найден"
        )

    return _enrich_semifinished_response(semifinished, db)


@router.post("", response_model=SemifinishedResponse, status_code=status.HTTP_201_CREATED)
def create_semifinished(semifinished_data: SemifinishedCreate, db: Session = Depends(get_db)):
    """Создать новый полуфабрикат"""
    # Проверяем что полуфабрикат с таким названием не существует
    existing = db.query(Semifinished).filter(Semifinished.name == semifinished_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Полуфабрикат '{semifinished_data.name}' уже существует"
        )

    # Проверяем что все ингредиенты существуют
    for ing in semifinished_data.ingredients:
        ingredient = db.query(Ingredient).filter(Ingredient.id == ing.ingredient_id).first()
        if not ingredient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ингредиент с ID {ing.ingredient_id} не найден"
            )

    # Создаем полуфабрикат
    semifinished = Semifinished(
        name=semifinished_data.name,
        category=semifinished_data.category,
        unit=semifinished_data.unit,
        output_quantity=semifinished_data.output_quantity
    )
    db.add(semifinished)
    db.flush()  # Чтобы получить ID

    # Создаем связи с ингредиентами
    for ing_data in semifinished_data.ingredients:
        sf_ingredient = SemifinishedIngredient(
            semifinished_id=semifinished.id,
            ingredient_id=ing_data.ingredient_id,
            weight=ing_data.weight
        )
        db.add(sf_ingredient)

    db.commit()
    db.refresh(semifinished)

    return _enrich_semifinished_response(semifinished, db)


@router.put("/{semifinished_id}", response_model=SemifinishedResponse)
def update_semifinished(
    semifinished_id: int,
    semifinished_data: SemifinishedUpdate,
    db: Session = Depends(get_db)
):
    """Обновить полуфабрикат"""
    semifinished = db.query(Semifinished).filter(Semifinished.id == semifinished_id).first()
    if not semifinished:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Полуфабрикат с ID {semifinished_id} не найден"
        )

    # Обновляем основные поля
    update_data = semifinished_data.model_dump(exclude_unset=True, exclude={'ingredients'})
    for field, value in update_data.items():
        setattr(semifinished, field, value)

    # Если переданы ингредиенты - обновляем состав
    if semifinished_data.ingredients is not None:
        # Удаляем старые связи
        db.query(SemifinishedIngredient).filter(SemifinishedIngredient.semifinished_id == semifinished_id).delete()

        # Создаем новые
        for ing_data in semifinished_data.ingredients:
            # Проверяем существование ингредиента
            ingredient = db.query(Ingredient).filter(Ingredient.id == ing_data.ingredient_id).first()
            if not ingredient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Ингредиент с ID {ing_data.ingredient_id} не найден"
                )

            sf_ingredient = SemifinishedIngredient(
                semifinished_id=semifinished.id,
                ingredient_id=ing_data.ingredient_id,
                weight=ing_data.weight
            )
            db.add(sf_ingredient)

    db.commit()
    db.refresh(semifinished)

    return _enrich_semifinished_response(semifinished, db)


@router.delete("/{semifinished_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_semifinished(semifinished_id: int, db: Session = Depends(get_db)):
    """Удалить полуфабрикат"""
    semifinished = db.query(Semifinished).filter(Semifinished.id == semifinished_id).first()
    if not semifinished:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Полуфабрикат с ID {semifinished_id} не найден"
        )

    # Связанные SemifinishedIngredient удалятся автоматически (cascade)
    db.delete(semifinished)
    db.commit()
    return None


@router.get("/categories/list", response_model=List[str])
def get_semifinished_categories(db: Session = Depends(get_db)):
    """Получить список всех категорий полуфабрикатов"""
    categories = db.query(Semifinished.category).distinct().filter(Semifinished.category.isnot(None)).all()
    return [cat[0] for cat in categories if cat[0]]
