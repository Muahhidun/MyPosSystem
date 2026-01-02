from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..db import get_db
from ..models import Product, Recipe, Category, ProductVariant, ProductModifierGroup

router = APIRouter(prefix="/pos", tags=["pos"])


@router.get("/items")
def get_pos_items(db: Session = Depends(get_db)):
    """
    Получить все товары и техкарты для отображения на кассе

    Возвращает объединённый список:
    - Products (где show_in_pos=true)
    - Recipes (где show_in_pos=true)

    Каждый элемент имеет поле 'type' для различения
    Сортировка: category_id (с display_order категории) → display_order товара → name
    """
    items = []

    # Получаем Products с сортировкой
    products = db.query(Product).filter(
        Product.show_in_pos == True
    ).order_by(
        Product.category_id.asc().nulls_last(),
        Product.display_order.asc(),
        Product.name.asc()
    ).all()

    for product in products:
        # Проверяем наличие вариантов и модификаторов
        has_variants = db.query(ProductVariant).filter(
            ProductVariant.base_product_id == product.id,
            ProductVariant.is_active == True
        ).count() > 0

        has_modifiers = db.query(ProductModifierGroup).filter(
            ProductModifierGroup.product_id == product.id
        ).count() > 0

        items.append({
            "id": product.id,
            "type": "product",  # Тип: товар (покупной)
            "name": product.name,
            "price": product.price,
            "category": product.category,  # DEPRECATED: старое поле для обратной совместимости
            "category_id": product.category_id,
            "category_name": product.category_rel.name if product.category_rel else None,
            "display_order": product.display_order,
            "is_available": product.is_available,
            "image_url": product.image_url,
            "cost": None,  # У товаров нет автоматической себестоимости
            "markup_percentage": None,
            "has_variants": has_variants,  # Есть варианты (размеры)
            "has_modifiers": has_modifiers  # Есть модификации (добавки)
        })

    # Получаем Recipes с сортировкой
    recipes = db.query(Recipe).filter(
        Recipe.show_in_pos == True
    ).order_by(
        Recipe.category_id.asc().nulls_last(),
        Recipe.display_order.asc(),
        Recipe.name.asc()
    ).all()

    for recipe in recipes:
        items.append({
            "id": recipe.id,
            "type": "recipe",  # Тип: техкарта (готовится)
            "name": recipe.name,
            "price": recipe.price,
            "category": recipe.category,  # DEPRECATED: старое поле для обратной совместимости
            "category_id": recipe.category_id,
            "category_name": recipe.category_rel.name if recipe.category_rel else None,
            "display_order": recipe.display_order,
            "is_available": True,  # Всегда доступно если показывается
            "image_url": recipe.image_url,
            "cost": recipe.cost,  # Себестоимость из ингредиентов
            "markup_percentage": recipe.markup_percentage,
            "output_weight": recipe.output_weight,
            "has_variants": False,  # Техкарты не имеют вариантов
            "has_modifiers": False  # Техкарты не имеют модификаций
        })

    # Сортировка уже выполнена на уровне БД, возвращаем как есть
    return items


@router.get("/categories")
def get_pos_categories(db: Session = Depends(get_db)):
    """
    Получить категории для отображения на кассе

    Возвращает только активные категории типа POS (или PRODUCT/RECIPE для обратной совместимости),
    отсортированные по display_order
    """
    categories = db.query(Category).filter(
        Category.type.in_(['pos', 'product', 'recipe']),
        Category.is_active == True
    ).order_by(Category.display_order.asc(), Category.name.asc()).all()

    return [
        {
            "id": cat.id,
            "name": cat.name,
            "type": cat.type.value,
            "color": cat.color,
            "display_order": cat.display_order
        }
        for cat in categories
    ]
