from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..db import get_db
from ..models import Product, Recipe

router = APIRouter(prefix="/pos", tags=["pos"])


@router.get("/items")
def get_pos_items(db: Session = Depends(get_db)):
    """
    Получить все товары и техкарты для отображения на кассе

    Возвращает объединённый список:
    - Products (где show_in_pos=true)
    - Recipes (где show_in_pos=true)

    Каждый элемент имеет поле 'type' для различения
    """
    items = []

    # Получаем Products
    products = db.query(Product).filter(Product.show_in_pos == True).all()
    for product in products:
        items.append({
            "id": product.id,
            "type": "product",  # Тип: товар (покупной)
            "name": product.name,
            "price": product.price,
            "category": product.category,
            "is_available": product.is_available,
            "image_url": product.image_url,
            "cost": None,  # У товаров нет автоматической себестоимости
            "markup_percentage": None
        })

    # Получаем Recipes
    recipes = db.query(Recipe).filter(Recipe.show_in_pos == True).all()
    for recipe in recipes:
        items.append({
            "id": recipe.id,
            "type": "recipe",  # Тип: техкарта (готовится)
            "name": recipe.name,
            "price": recipe.price,
            "category": recipe.category,
            "is_available": True,  # Всегда доступно если показывается
            "image_url": recipe.image_url,
            "cost": recipe.cost,  # Себестоимость из ингредиентов
            "markup_percentage": recipe.markup_percentage,
            "output_weight": recipe.output_weight
        })

    # Сортируем по категории и названию
    items.sort(key=lambda x: (x["category"] or "", x["name"]))

    return items
