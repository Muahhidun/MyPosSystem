from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from ..db import get_db
from ..models import Recipe, RecipeIngredient, Ingredient, RecipeSemifinished, Semifinished
from ..schemas import (
    RecipeCreate,
    RecipeUpdate,
    RecipeResponse,
    RecipeListItem,
    RecipeIngredientResponse,
    RecipeSemifinishedResponse
)

router = APIRouter(prefix="/recipes", tags=["recipes"])


def _enrich_recipe_response(recipe: Recipe, db: Session) -> dict:
    """Обогащает данные рецепта информацией об ингредиентах и полуфабрикатах"""
    recipe_dict = {
        "id": recipe.id,
        "name": recipe.name,
        "category": recipe.category,
        "output_weight": recipe.output_weight,
        "price": recipe.price,
        "is_weight_based": recipe.is_weight_based,
        "exclude_from_discounts": recipe.exclude_from_discounts,
        "show_in_pos": recipe.show_in_pos,
        "image_url": recipe.image_url,
        "cost": recipe.cost,
        "markup_percentage": recipe.markup_percentage,
        "profit": recipe.profit,
        "created_at": recipe.created_at,
        "updated_at": recipe.updated_at,
        "ingredients": [],
        "semifinished": []
    }

    # Добавляем информацию об ингредиентах
    for recipe_ing in recipe.ingredients:
        ingredient = db.query(Ingredient).filter(Ingredient.id == recipe_ing.ingredient_id).first()
        if ingredient:
            recipe_dict["ingredients"].append({
                "id": recipe_ing.id,
                "recipe_id": recipe_ing.recipe_id,
                "ingredient_id": recipe_ing.ingredient_id,
                "ingredient_name": ingredient.name,
                "ingredient_unit": ingredient.unit,
                "gross_weight": recipe_ing.gross_weight,
                "net_weight": recipe_ing.net_weight,
                "cooking_method": recipe_ing.cooking_method,
                "is_cleaned": recipe_ing.is_cleaned,
                "cost": recipe_ing.cost
            })

    # Добавляем информацию о полуфабрикатах
    for recipe_sf in recipe.semifinished_items:
        semifinished = db.query(Semifinished).filter(Semifinished.id == recipe_sf.semifinished_id).first()
        if semifinished:
            recipe_dict["semifinished"].append({
                "id": recipe_sf.id,
                "recipe_id": recipe_sf.recipe_id,
                "semifinished_id": recipe_sf.semifinished_id,
                "semifinished_name": semifinished.name,
                "semifinished_unit": semifinished.unit,
                "quantity": recipe_sf.quantity,
                "cost": recipe_sf.cost
            })

    return recipe_dict


@router.get("", response_model=List[RecipeListItem])
def get_recipes(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    db: Session = Depends(get_db)
):
    """Получить список всех техкарт"""
    query = db.query(Recipe)

    if category:
        query = query.filter(Recipe.category == category)

    recipes = query.offset(skip).limit(limit).all()

    # Формируем ответ для списка (без детализации ингредиентов)
    return [
        {
            "id": r.id,
            "name": r.name,
            "category": r.category,
            "output_weight": r.output_weight,
            "price": r.price,
            "cost": r.cost,
            "markup_percentage": r.markup_percentage,
            "is_weight_based": r.is_weight_based,
            "exclude_from_discounts": r.exclude_from_discounts,
            "image_url": r.image_url,
            "created_at": r.created_at
        }
        for r in recipes
    ]


@router.get("/{recipe_id}", response_model=RecipeResponse)
def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    """Получить техкарту по ID с полным составом"""
    recipe = db.query(Recipe).options(
        joinedload(Recipe.ingredients)
    ).filter(Recipe.id == recipe_id).first()

    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Техкарта с ID {recipe_id} не найдена"
        )

    return _enrich_recipe_response(recipe, db)


@router.post("", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
def create_recipe(recipe_data: RecipeCreate, db: Session = Depends(get_db)):
    """Создать новую техкарту"""
    # Проверяем что техкарта с таким названием не существует
    existing = db.query(Recipe).filter(Recipe.name == recipe_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Техкарта '{recipe_data.name}' уже существует"
        )

    # Проверяем что все ингредиенты существуют
    for ing in recipe_data.ingredients:
        ingredient = db.query(Ingredient).filter(Ingredient.id == ing.ingredient_id).first()
        if not ingredient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ингредиент с ID {ing.ingredient_id} не найден"
            )

    # Проверяем что все полуфабрикаты существуют
    for sf in recipe_data.semifinished:
        semifinished = db.query(Semifinished).filter(Semifinished.id == sf.semifinished_id).first()
        if not semifinished:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Полуфабрикат с ID {sf.semifinished_id} не найден"
            )

    # Создаем техкарту
    recipe = Recipe(
        name=recipe_data.name,
        category=recipe_data.category,
        output_weight=recipe_data.output_weight,
        price=recipe_data.price,
        is_weight_based=recipe_data.is_weight_based,
        exclude_from_discounts=recipe_data.exclude_from_discounts,
        show_in_pos=recipe_data.show_in_pos,
        image_url=recipe_data.image_url
    )
    db.add(recipe)
    db.flush()  # Чтобы получить ID

    # Создаем связи с ингредиентами
    for ing_data in recipe_data.ingredients:
        recipe_ingredient = RecipeIngredient(
            recipe_id=recipe.id,
            ingredient_id=ing_data.ingredient_id,
            gross_weight=ing_data.gross_weight,
            net_weight=ing_data.net_weight,
            cooking_method=ing_data.cooking_method,
            is_cleaned=ing_data.is_cleaned
        )
        db.add(recipe_ingredient)

    # Создаем связи с полуфабрикатами
    for sf_data in recipe_data.semifinished:
        recipe_semifinished = RecipeSemifinished(
            recipe_id=recipe.id,
            semifinished_id=sf_data.semifinished_id,
            quantity=sf_data.quantity
        )
        db.add(recipe_semifinished)

    db.commit()
    db.refresh(recipe)

    return _enrich_recipe_response(recipe, db)


@router.put("/{recipe_id}", response_model=RecipeResponse)
def update_recipe(
    recipe_id: int,
    recipe_data: RecipeUpdate,
    db: Session = Depends(get_db)
):
    """Обновить техкарту"""
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Техкарта с ID {recipe_id} не найдена"
        )

    # Обновляем основные поля
    update_data = recipe_data.model_dump(exclude_unset=True, exclude={'ingredients', 'semifinished'})
    for field, value in update_data.items():
        setattr(recipe, field, value)

    # Если переданы ингредиенты - обновляем состав
    if recipe_data.ingredients is not None:
        # Удаляем старые связи
        db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe_id).delete()

        # Создаем новые
        for ing_data in recipe_data.ingredients:
            # Проверяем существование ингредиента
            ingredient = db.query(Ingredient).filter(Ingredient.id == ing_data.ingredient_id).first()
            if not ingredient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Ингредиент с ID {ing_data.ingredient_id} не найден"
                )

            recipe_ingredient = RecipeIngredient(
                recipe_id=recipe.id,
                ingredient_id=ing_data.ingredient_id,
                gross_weight=ing_data.gross_weight,
                net_weight=ing_data.net_weight,
                cooking_method=ing_data.cooking_method,
                is_cleaned=ing_data.is_cleaned
            )
            db.add(recipe_ingredient)

    # Если переданы полуфабрикаты - обновляем состав
    if recipe_data.semifinished is not None:
        # Удаляем старые связи
        db.query(RecipeSemifinished).filter(RecipeSemifinished.recipe_id == recipe_id).delete()

        # Создаем новые
        for sf_data in recipe_data.semifinished:
            # Проверяем существование полуфабриката
            semifinished = db.query(Semifinished).filter(Semifinished.id == sf_data.semifinished_id).first()
            if not semifinished:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Полуфабрикат с ID {sf_data.semifinished_id} не найден"
                )

            recipe_semifinished = RecipeSemifinished(
                recipe_id=recipe.id,
                semifinished_id=sf_data.semifinished_id,
                quantity=sf_data.quantity
            )
            db.add(recipe_semifinished)

    db.commit()
    db.refresh(recipe)

    return _enrich_recipe_response(recipe, db)


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    """Удалить техкарту"""
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Техкарта с ID {recipe_id} не найдена"
        )

    # Связанные RecipeIngredient удалятся автоматически (cascade)
    db.delete(recipe)
    db.commit()
    return None


@router.get("/categories/list", response_model=List[str])
def get_recipe_categories(db: Session = Depends(get_db)):
    """Получить список всех категорий техкарт"""
    categories = db.query(Recipe.category).distinct().filter(Recipe.category.isnot(None)).all()
    return [cat[0] for cat in categories if cat[0]]
