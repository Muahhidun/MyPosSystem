from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from ..db import get_db
from ..models import (
    ModifierGroup,
    Modifier,
    ProductModifierGroup,
    Product,
    Ingredient
)
from ..schemas import (
    ModifierGroupCreate,
    ModifierGroupUpdate,
    ModifierGroupResponse,
    ModifierCreate,
    ModifierUpdate,
    ModifierResponse,
    ProductModifierGroupCreate,
    ProductModifierGroupResponse
)

router = APIRouter(tags=["modifiers"])


# ============= Modifier Groups =============

@router.get("/modifier-groups", response_model=List[ModifierGroupResponse])
def get_modifier_groups(
    active_only: bool = False,
    db: Session = Depends(get_db)
):
    """Получить все группы модификаций"""
    query = db.query(ModifierGroup).options(joinedload(ModifierGroup.modifiers))

    if active_only:
        query = query.filter(ModifierGroup.is_active == True)

    groups = query.order_by(ModifierGroup.display_order, ModifierGroup.name).all()

    # Обогащаем данными об ингредиентах в модификаторах
    result = []
    for group in groups:
        modifiers_data = []
        for modifier in sorted(group.modifiers, key=lambda m: (m.display_order, m.name)):
            ingredient = db.query(Ingredient).filter(
                Ingredient.id == modifier.ingredient_id
            ).first() if modifier.ingredient_id else None

            modifiers_data.append({
                "id": modifier.id,
                "group_id": modifier.group_id,
                "name": modifier.name,
                "price": modifier.price,
                "ingredient_id": modifier.ingredient_id,
                "ingredient_name": ingredient.name if ingredient else None,
                "quantity_per_use": modifier.quantity_per_use,
                "display_order": modifier.display_order,
                "is_available": modifier.is_available,
                "created_at": modifier.created_at,
                "updated_at": modifier.updated_at
            })

        group_dict = {
            "id": group.id,
            "name": group.name,
            "selection_type": group.selection_type,
            "min_selections": group.min_selections,
            "max_selections": group.max_selections,
            "is_required": group.is_required,
            "display_order": group.display_order,
            "is_active": group.is_active,
            "modifiers": modifiers_data,
            "created_at": group.created_at,
            "updated_at": group.updated_at
        }
        result.append(group_dict)

    return result


@router.post("/modifier-groups", response_model=ModifierGroupResponse, status_code=status.HTTP_201_CREATED)
def create_modifier_group(
    group_data: ModifierGroupCreate,
    db: Session = Depends(get_db)
):
    """Создать группу модификаций"""
    # Создаём группу
    group = ModifierGroup(
        name=group_data.name,
        selection_type=group_data.selection_type,
        min_selections=group_data.min_selections,
        max_selections=group_data.max_selections,
        is_required=group_data.is_required,
        display_order=group_data.display_order,
        is_active=group_data.is_active
    )
    db.add(group)
    db.flush()

    # Создаём модификации в группе
    modifiers_data = []
    for modifier_data in group_data.modifiers:
        # Проверяем ингредиент если указан
        if modifier_data.ingredient_id:
            ingredient = db.query(Ingredient).filter(
                Ingredient.id == modifier_data.ingredient_id
            ).first()
            if not ingredient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Ингредиент с ID {modifier_data.ingredient_id} не найден"
                )

        modifier = Modifier(
            group_id=group.id,
            **modifier_data.model_dump()
        )
        db.add(modifier)
        db.flush()

        ingredient = db.query(Ingredient).filter(
            Ingredient.id == modifier.ingredient_id
        ).first() if modifier.ingredient_id else None

        modifiers_data.append({
            "id": modifier.id,
            "group_id": modifier.group_id,
            "name": modifier.name,
            "price": modifier.price,
            "ingredient_id": modifier.ingredient_id,
            "ingredient_name": ingredient.name if ingredient else None,
            "quantity_per_use": modifier.quantity_per_use,
            "display_order": modifier.display_order,
            "is_available": modifier.is_available,
            "created_at": modifier.created_at,
            "updated_at": modifier.updated_at
        })

    db.commit()
    db.refresh(group)

    return {
        "id": group.id,
        "name": group.name,
        "selection_type": group.selection_type,
        "min_selections": group.min_selections,
        "max_selections": group.max_selections,
        "is_required": group.is_required,
        "display_order": group.display_order,
        "is_active": group.is_active,
        "modifiers": modifiers_data,
        "created_at": group.created_at,
        "updated_at": group.updated_at
    }


@router.put("/modifier-groups/{group_id}", response_model=ModifierGroupResponse)
def update_modifier_group(
    group_id: int,
    group_data: ModifierGroupUpdate,
    db: Session = Depends(get_db)
):
    """Обновить группу модификаций"""
    group = db.query(ModifierGroup).filter(ModifierGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Группа с ID {group_id} не найдена"
        )

    # Обновляем поля
    update_data = group_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(group, field, value)

    db.commit()
    db.refresh(group)

    # Загружаем модификации
    modifiers = db.query(Modifier).filter(Modifier.group_id == group_id).order_by(
        Modifier.display_order, Modifier.name
    ).all()

    modifiers_data = []
    for modifier in modifiers:
        ingredient = db.query(Ingredient).filter(
            Ingredient.id == modifier.ingredient_id
        ).first() if modifier.ingredient_id else None

        modifiers_data.append({
            "id": modifier.id,
            "group_id": modifier.group_id,
            "name": modifier.name,
            "price": modifier.price,
            "ingredient_id": modifier.ingredient_id,
            "ingredient_name": ingredient.name if ingredient else None,
            "quantity_per_use": modifier.quantity_per_use,
            "display_order": modifier.display_order,
            "is_available": modifier.is_available,
            "created_at": modifier.created_at,
            "updated_at": modifier.updated_at
        })

    return {
        "id": group.id,
        "name": group.name,
        "selection_type": group.selection_type,
        "min_selections": group.min_selections,
        "max_selections": group.max_selections,
        "is_required": group.is_required,
        "display_order": group.display_order,
        "is_active": group.is_active,
        "modifiers": modifiers_data,
        "created_at": group.created_at,
        "updated_at": group.updated_at
    }


@router.delete("/modifier-groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_modifier_group(group_id: int, db: Session = Depends(get_db)):
    """Удалить группу модификаций"""
    group = db.query(ModifierGroup).filter(ModifierGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Группа с ID {group_id} не найдена"
        )

    # Связанные модификации удалятся автоматически (cascade)
    db.delete(group)
    db.commit()
    return None


# ============= Modifiers (в группе) =============

@router.post("/modifier-groups/{group_id}/modifiers", response_model=ModifierResponse, status_code=status.HTTP_201_CREATED)
def create_modifier(
    group_id: int,
    modifier_data: ModifierCreate,
    db: Session = Depends(get_db)
):
    """Создать модификацию в группе"""
    group = db.query(ModifierGroup).filter(ModifierGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Группа с ID {group_id} не найдена"
        )

    # Проверяем ингредиент если указан
    ingredient = None
    if modifier_data.ingredient_id:
        ingredient = db.query(Ingredient).filter(
            Ingredient.id == modifier_data.ingredient_id
        ).first()
        if not ingredient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ингредиент с ID {modifier_data.ingredient_id} не найден"
            )

    modifier = Modifier(
        group_id=group_id,
        **modifier_data.model_dump()
    )
    db.add(modifier)
    db.commit()
    db.refresh(modifier)

    return {
        "id": modifier.id,
        "group_id": modifier.group_id,
        "name": modifier.name,
        "price": modifier.price,
        "ingredient_id": modifier.ingredient_id,
        "ingredient_name": ingredient.name if ingredient else None,
        "quantity_per_use": modifier.quantity_per_use,
        "display_order": modifier.display_order,
        "is_available": modifier.is_available,
        "created_at": modifier.created_at,
        "updated_at": modifier.updated_at
    }


@router.put("/modifier-groups/{group_id}/modifiers/{modifier_id}", response_model=ModifierResponse)
def update_modifier(
    group_id: int,
    modifier_id: int,
    modifier_data: ModifierUpdate,
    db: Session = Depends(get_db)
):
    """Обновить модификацию"""
    modifier = db.query(Modifier).filter(
        Modifier.id == modifier_id,
        Modifier.group_id == group_id
    ).first()

    if not modifier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Модификация с ID {modifier_id} не найдена"
        )

    # Проверяем ингредиент если меняем
    if modifier_data.ingredient_id is not None:
        ingredient = db.query(Ingredient).filter(
            Ingredient.id == modifier_data.ingredient_id
        ).first()
        if not ingredient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ингредиент с ID {modifier_data.ingredient_id} не найден"
            )

    # Обновляем поля
    update_data = modifier_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(modifier, field, value)

    db.commit()
    db.refresh(modifier)

    ingredient = db.query(Ingredient).filter(
        Ingredient.id == modifier.ingredient_id
    ).first() if modifier.ingredient_id else None

    return {
        "id": modifier.id,
        "group_id": modifier.group_id,
        "name": modifier.name,
        "price": modifier.price,
        "ingredient_id": modifier.ingredient_id,
        "ingredient_name": ingredient.name if ingredient else None,
        "quantity_per_use": modifier.quantity_per_use,
        "display_order": modifier.display_order,
        "is_available": modifier.is_available,
        "created_at": modifier.created_at,
        "updated_at": modifier.updated_at
    }


@router.delete("/modifier-groups/{group_id}/modifiers/{modifier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_modifier(
    group_id: int,
    modifier_id: int,
    db: Session = Depends(get_db)
):
    """Удалить модификацию"""
    modifier = db.query(Modifier).filter(
        Modifier.id == modifier_id,
        Modifier.group_id == group_id
    ).first()

    if not modifier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Модификация с ID {modifier_id} не найдена"
        )

    db.delete(modifier)
    db.commit()
    return None


# ============= Product-Modifier Links =============

@router.get("/products/{product_id}/modifiers", response_model=List[ModifierGroupResponse])
def get_product_modifiers(product_id: int, db: Session = Depends(get_db)):
    """Получить доступные модификаторы для товара"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Товар с ID {product_id} не найден"
        )

    # Получаем связанные группы модификаторов
    links = db.query(ProductModifierGroup).filter(
        ProductModifierGroup.product_id == product_id
    ).order_by(ProductModifierGroup.display_order).all()

    result = []
    for link in links:
        group = db.query(ModifierGroup).options(
            joinedload(ModifierGroup.modifiers)
        ).filter(ModifierGroup.id == link.modifier_group_id).first()

        if not group:
            continue

        modifiers_data = []
        for modifier in sorted(group.modifiers, key=lambda m: (m.display_order, m.name)):
            if not modifier.is_available:
                continue

            ingredient = db.query(Ingredient).filter(
                Ingredient.id == modifier.ingredient_id
            ).first() if modifier.ingredient_id else None

            modifiers_data.append({
                "id": modifier.id,
                "group_id": modifier.group_id,
                "name": modifier.name,
                "price": modifier.price,
                "ingredient_id": modifier.ingredient_id,
                "ingredient_name": ingredient.name if ingredient else None,
                "quantity_per_use": modifier.quantity_per_use,
                "display_order": modifier.display_order,
                "is_available": modifier.is_available,
                "created_at": modifier.created_at,
                "updated_at": modifier.updated_at
            })

        result.append({
            "id": group.id,
            "name": group.name,
            "selection_type": group.selection_type,
            "min_selections": group.min_selections,
            "max_selections": group.max_selections,
            "is_required": group.is_required,
            "display_order": group.display_order,
            "is_active": group.is_active,
            "modifiers": modifiers_data,
            "created_at": group.created_at,
            "updated_at": group.updated_at
        })

    return result


@router.post("/products/{product_id}/modifiers", status_code=status.HTTP_201_CREATED)
def link_modifier_group_to_product(
    product_id: int,
    link_data: ProductModifierGroupCreate,
    db: Session = Depends(get_db)
):
    """Привязать группу модификаторов к товару"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Товар с ID {product_id} не найден"
        )

    group = db.query(ModifierGroup).filter(
        ModifierGroup.id == link_data.modifier_group_id
    ).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Группа модификаторов с ID {link_data.modifier_group_id} не найдена"
        )

    # Проверяем что связь не существует
    existing = db.query(ProductModifierGroup).filter(
        ProductModifierGroup.product_id == product_id,
        ProductModifierGroup.modifier_group_id == link_data.modifier_group_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Эта группа модификаторов уже привязана к товару"
        )

    link = ProductModifierGroup(
        product_id=product_id,
        modifier_group_id=link_data.modifier_group_id,
        display_order=link_data.display_order
    )
    db.add(link)
    db.commit()
    db.refresh(link)

    return {"status": "ok", "link_id": link.id}


@router.delete("/products/{product_id}/modifiers/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def unlink_modifier_group_from_product(
    product_id: int,
    group_id: int,
    db: Session = Depends(get_db)
):
    """Отвязать группу модификаторов от товара"""
    link = db.query(ProductModifierGroup).filter(
        ProductModifierGroup.product_id == product_id,
        ProductModifierGroup.modifier_group_id == group_id
    ).first()

    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Связь не найдена"
        )

    db.delete(link)
    db.commit()
    return None
