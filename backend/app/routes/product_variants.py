from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from ..db import get_db
from ..models import ProductVariant, Product, Recipe
from ..schemas import (
    ProductVariantCreate,
    ProductVariantUpdate,
    ProductVariantResponse
)

router = APIRouter(prefix="/products", tags=["product_variants"])


@router.get("/{product_id}/variants", response_model=List[ProductVariantResponse])
def get_product_variants(product_id: int, db: Session = Depends(get_db)):
    """Получить все варианты товара"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Товар с ID {product_id} не найден"
        )

    variants = db.query(ProductVariant).filter(
        ProductVariant.base_product_id == product_id
    ).order_by(ProductVariant.display_order, ProductVariant.id).all()

    # Обогащаем данными о техкартах
    result = []
    for variant in variants:
        recipe = db.query(Recipe).filter(Recipe.id == variant.recipe_id).first()
        variant_dict = {
            "id": variant.id,
            "base_product_id": variant.base_product_id,
            "recipe_id": variant.recipe_id,
            "name": variant.name,
            "size_code": variant.size_code,
            "price_adjustment": variant.price_adjustment,
            "display_order": variant.display_order,
            "is_default": variant.is_default,
            "is_active": variant.is_active,
            "recipe_name": recipe.name if recipe else None,
            "created_at": variant.created_at,
            "updated_at": variant.updated_at
        }
        result.append(variant_dict)

    return result


@router.post("/{product_id}/variants", response_model=ProductVariantResponse, status_code=status.HTTP_201_CREATED)
def create_product_variant(
    product_id: int,
    variant_data: ProductVariantCreate,
    db: Session = Depends(get_db)
):
    """Создать вариант товара"""
    # Проверяем существование товара
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Товар с ID {product_id} не найден"
        )

    # Проверяем существование техкарты
    recipe = db.query(Recipe).filter(Recipe.id == variant_data.recipe_id).first()
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Техкарта с ID {variant_data.recipe_id} не найдена"
        )

    # Если это вариант по умолчанию, снимаем флаг с других
    if variant_data.is_default:
        db.query(ProductVariant).filter(
            ProductVariant.base_product_id == product_id
        ).update({"is_default": False})

    # Создаём вариант
    variant = ProductVariant(
        base_product_id=product_id,
        **variant_data.model_dump()
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)

    return {
        "id": variant.id,
        "base_product_id": variant.base_product_id,
        "recipe_id": variant.recipe_id,
        "name": variant.name,
        "size_code": variant.size_code,
        "price_adjustment": variant.price_adjustment,
        "display_order": variant.display_order,
        "is_default": variant.is_default,
        "is_active": variant.is_active,
        "recipe_name": recipe.name,
        "created_at": variant.created_at,
        "updated_at": variant.updated_at
    }


@router.put("/{product_id}/variants/{variant_id}", response_model=ProductVariantResponse)
def update_product_variant(
    product_id: int,
    variant_id: int,
    variant_data: ProductVariantUpdate,
    db: Session = Depends(get_db)
):
    """Обновить вариант товара"""
    variant = db.query(ProductVariant).filter(
        ProductVariant.id == variant_id,
        ProductVariant.base_product_id == product_id
    ).first()

    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Вариант с ID {variant_id} не найден"
        )

    # Если меняем техкарту, проверяем её существование
    if variant_data.recipe_id is not None:
        recipe = db.query(Recipe).filter(Recipe.id == variant_data.recipe_id).first()
        if not recipe:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Техкарта с ID {variant_data.recipe_id} не найдена"
            )

    # Если делаем вариант по умолчанию, снимаем флаг с других
    if variant_data.is_default:
        db.query(ProductVariant).filter(
            ProductVariant.base_product_id == product_id,
            ProductVariant.id != variant_id
        ).update({"is_default": False})

    # Обновляем поля
    update_data = variant_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(variant, field, value)

    db.commit()
    db.refresh(variant)

    recipe = db.query(Recipe).filter(Recipe.id == variant.recipe_id).first()

    return {
        "id": variant.id,
        "base_product_id": variant.base_product_id,
        "recipe_id": variant.recipe_id,
        "name": variant.name,
        "size_code": variant.size_code,
        "price_adjustment": variant.price_adjustment,
        "display_order": variant.display_order,
        "is_default": variant.is_default,
        "is_active": variant.is_active,
        "recipe_name": recipe.name if recipe else None,
        "created_at": variant.created_at,
        "updated_at": variant.updated_at
    }


@router.delete("/{product_id}/variants/{variant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_variant(
    product_id: int,
    variant_id: int,
    db: Session = Depends(get_db)
):
    """Удалить вариант товара"""
    variant = db.query(ProductVariant).filter(
        ProductVariant.id == variant_id,
        ProductVariant.base_product_id == product_id
    ).first()

    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Вариант с ID {variant_id} не найден"
        )

    db.delete(variant)
    db.commit()
    return None
