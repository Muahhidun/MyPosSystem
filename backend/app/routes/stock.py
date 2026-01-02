from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from ..db import get_db
from ..models import Stock, Ingredient, Location
from ..schemas import (
    StockCreate,
    StockUpdate,
    StockAdjust,
    StockResponse,
    StockListItem
)

router = APIRouter(prefix="/stock", tags=["stock"])


@router.get("", response_model=List[StockListItem])
def get_stock(
    location_id: int = 1,
    low_stock: bool = None,
    db: Session = Depends(get_db)
):
    """
    Получить остатки всех ингредиентов для указанной точки

    Параметры:
    - location_id: ID точки (по умолчанию 1)
    - low_stock: показать только с низким остатком
    """
    # Проверяем что точка существует
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location with id {location_id} not found"
        )

    # Получаем остатки для этой точки
    query = db.query(Stock, Ingredient).join(
        Ingredient, Stock.ingredient_id == Ingredient.id
    ).filter(Stock.location_id == location_id)

    if low_stock is True:
        query = query.filter(Stock.quantity <= Stock.min_stock)

    stocks = query.all()

    # Формируем ответ
    result = []
    for stock, ingredient in stocks:
        result.append(StockListItem(
            ingredient_id=ingredient.id,
            ingredient_name=ingredient.name,
            unit=ingredient.unit,
            quantity=stock.quantity,
            min_stock=stock.min_stock,
            is_low_stock=stock.is_low_stock,
            purchase_price=ingredient.purchase_price,
            stock_value=stock.stock_value
        ))

    return result


@router.get("/{ingredient_id}", response_model=StockResponse)
def get_stock_for_ingredient(
    ingredient_id: int,
    location_id: int = 1,
    db: Session = Depends(get_db)
):
    """
    Получить остаток конкретного ингредиента на точке

    Параметры:
    - ingredient_id: ID ингредиента
    - location_id: ID точки (по умолчанию 1)
    """
    stock = db.query(Stock).filter(
        and_(
            Stock.ingredient_id == ingredient_id,
            Stock.location_id == location_id
        )
    ).first()

    if not stock:
        # Если остатка нет - создаем с нулевым количеством
        ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
        if not ingredient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ingredient with id {ingredient_id} not found"
            )

        stock = Stock(
            location_id=location_id,
            ingredient_id=ingredient_id,
            quantity=0.0,
            min_stock=0.0
        )
        db.add(stock)
        db.commit()
        db.refresh(stock)

    # Получаем дополнительную информацию
    ingredient = db.query(Ingredient).filter(Ingredient.id == stock.ingredient_id).first()
    location = db.query(Location).filter(Location.id == stock.location_id).first()

    response = StockResponse(
        id=stock.id,
        location_id=stock.location_id,
        location_name=location.name if location else None,
        ingredient_id=stock.ingredient_id,
        ingredient_name=ingredient.name if ingredient else None,
        ingredient_unit=ingredient.unit if ingredient else None,
        quantity=stock.quantity,
        min_stock=stock.min_stock,
        is_low_stock=stock.is_low_stock,
        stock_value=stock.stock_value,
        created_at=stock.created_at,
        updated_at=stock.updated_at
    )

    return response


@router.post("", response_model=StockResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_stock(stock_data: StockCreate, db: Session = Depends(get_db)):
    """
    Создать или обновить остаток ингредиента на точке

    Если остаток уже существует - обновляет его, иначе создает новый
    """
    # Проверяем что ингредиент существует
    ingredient = db.query(Ingredient).filter(Ingredient.id == stock_data.ingredient_id).first()
    if not ingredient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ingredient with id {stock_data.ingredient_id} not found"
        )

    # Проверяем что точка существует
    location = db.query(Location).filter(Location.id == stock_data.location_id).first()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location with id {stock_data.location_id} not found"
        )

    # Ищем существующий остаток
    existing_stock = db.query(Stock).filter(
        and_(
            Stock.ingredient_id == stock_data.ingredient_id,
            Stock.location_id == stock_data.location_id
        )
    ).first()

    if existing_stock:
        # Обновляем существующий
        existing_stock.quantity = stock_data.quantity
        existing_stock.min_stock = stock_data.min_stock
        db.commit()
        db.refresh(existing_stock)
        stock = existing_stock
    else:
        # Создаем новый
        stock = Stock(**stock_data.model_dump())
        db.add(stock)
        db.commit()
        db.refresh(stock)

    return StockResponse(
        id=stock.id,
        location_id=stock.location_id,
        location_name=location.name,
        ingredient_id=stock.ingredient_id,
        ingredient_name=ingredient.name,
        ingredient_unit=ingredient.unit,
        quantity=stock.quantity,
        min_stock=stock.min_stock,
        is_low_stock=stock.is_low_stock,
        stock_value=stock.stock_value,
        created_at=stock.created_at,
        updated_at=stock.updated_at
    )


@router.patch("/{ingredient_id}/adjust", response_model=StockResponse)
def adjust_stock(
    ingredient_id: int,
    adjustment: StockAdjust,
    location_id: int = 1,
    db: Session = Depends(get_db)
):
    """
    Скорректировать остаток ингредиента (добавить или вычесть)

    Параметры:
    - ingredient_id: ID ингредиента
    - location_id: ID точки (по умолчанию 1)
    - adjustment: количество для добавления (+100) или вычитания (-50)
    """
    stock = db.query(Stock).filter(
        and_(
            Stock.ingredient_id == ingredient_id,
            Stock.location_id == location_id
        )
    ).first()

    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock for ingredient {ingredient_id} at location {location_id} not found. Create it first."
        )

    new_quantity = stock.quantity + adjustment.adjustment

    # Проверяем что остаток не уходит в минус
    if new_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Available: {stock.quantity}, requested: {abs(adjustment.adjustment)}"
        )

    stock.quantity = new_quantity
    db.commit()
    db.refresh(stock)

    # Получаем дополнительную информацию
    ingredient = db.query(Ingredient).filter(Ingredient.id == stock.ingredient_id).first()
    location = db.query(Location).filter(Location.id == stock.location_id).first()

    return StockResponse(
        id=stock.id,
        location_id=stock.location_id,
        location_name=location.name if location else None,
        ingredient_id=stock.ingredient_id,
        ingredient_name=ingredient.name if ingredient else None,
        ingredient_unit=ingredient.unit if ingredient else None,
        quantity=stock.quantity,
        min_stock=stock.min_stock,
        is_low_stock=stock.is_low_stock,
        stock_value=stock.stock_value,
        created_at=stock.created_at,
        updated_at=stock.updated_at
    )


@router.delete("/{ingredient_id}", status_code=status.HTTP_200_OK)
def delete_stock(
    ingredient_id: int,
    location_id: int = 1,
    db: Session = Depends(get_db)
):
    """Удалить запись об остатке (обнулить склад для ингредиента)"""
    stock = db.query(Stock).filter(
        and_(
            Stock.ingredient_id == ingredient_id,
            Stock.location_id == location_id
        )
    ).first()

    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock for ingredient {ingredient_id} at location {location_id} not found"
        )

    db.delete(stock)
    db.commit()
    return {"status": "deleted", "ingredient_id": ingredient_id, "location_id": location_id}
