#!/usr/bin/env python3
"""
Миграция 002: Миграция существующих категорий в таблицу categories

Что делает:
1. Собирает уникальные категории из products, recipes, ingredients, semifinished
2. Создает записи в таблице categories
3. Обновляет category_id во всех таблицах на основе старого текстового поля category
"""

import os
import sys

# Добавляем путь к backend для импорта моделей
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.category import Category, CategoryType
from app.models.product import Product
from app.models.recipe import Recipe
from app.models.ingredient import Ingredient
from app.models.semifinished import Semifinished


def main():
    """Основная функция миграции"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not set!")
        return 1

    print(f"📝 Connecting to database...")
    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        print("\n=== Миграция 002: Миграция данных категорий ===\n")

        # 1. Миграция категорий Products
        print("📝 Шаг 1: Миграция категорий Products...")
        product_categories = db.query(Product.category).distinct().filter(Product.category.isnot(None)).all()
        product_categories = [cat[0] for cat in product_categories if cat[0]]

        print(f"   Найдено {len(product_categories)} уникальных категорий товаров")

        for idx, cat_name in enumerate(product_categories):
            # Проверяем существует ли уже такая категория
            existing = db.query(Category).filter(
                Category.name == cat_name,
                Category.type == CategoryType.PRODUCT
            ).first()

            if not existing:
                category = Category(
                    name=cat_name,
                    type=CategoryType.PRODUCT,
                    display_order=idx,
                    is_active=True
                )
                db.add(category)
                print(f"   ✅ Создана категория: {cat_name}")
            else:
                print(f"   ⏭️  Категория уже существует: {cat_name}")

        db.flush()

        # Обновляем Product.category_id
        print("\n   Обновление category_id в products...")
        for product in db.query(Product).filter(Product.category.isnot(None)).all():
            if product.category:
                cat = db.query(Category).filter(
                    Category.name == product.category,
                    Category.type == CategoryType.PRODUCT
                ).first()
                if cat:
                    product.category_id = cat.id

        db.commit()
        print("   ✅ Products обновлены")

        # 2. Миграция категорий Recipes
        print("\n📝 Шаг 2: Миграция категорий Recipes...")
        recipe_categories = db.query(Recipe.category).distinct().filter(Recipe.category.isnot(None)).all()
        recipe_categories = [cat[0] for cat in recipe_categories if cat[0]]

        print(f"   Найдено {len(recipe_categories)} уникальных категорий техкарт")

        for idx, cat_name in enumerate(recipe_categories):
            existing = db.query(Category).filter(
                Category.name == cat_name,
                Category.type == CategoryType.RECIPE
            ).first()

            if not existing:
                category = Category(
                    name=cat_name,
                    type=CategoryType.RECIPE,
                    display_order=idx,
                    is_active=True
                )
                db.add(category)
                print(f"   ✅ Создана категория: {cat_name}")
            else:
                print(f"   ⏭️  Категория уже существует: {cat_name}")

        db.flush()

        # Обновляем Recipe.category_id
        print("\n   Обновление category_id в recipes...")
        for recipe in db.query(Recipe).filter(Recipe.category.isnot(None)).all():
            if recipe.category:
                cat = db.query(Category).filter(
                    Category.name == recipe.category,
                    Category.type == CategoryType.RECIPE
                ).first()
                if cat:
                    recipe.category_id = cat.id

        db.commit()
        print("   ✅ Recipes обновлены")

        # 3. Миграция категорий Ingredients
        print("\n📝 Шаг 3: Миграция категорий Ingredients...")
        ingredient_categories = db.query(Ingredient.category).distinct().filter(Ingredient.category.isnot(None)).all()
        ingredient_categories = [cat[0] for cat in ingredient_categories if cat[0]]

        print(f"   Найдено {len(ingredient_categories)} уникальных категорий ингредиентов")

        for idx, cat_name in enumerate(ingredient_categories):
            existing = db.query(Category).filter(
                Category.name == cat_name,
                Category.type == CategoryType.INGREDIENT
            ).first()

            if not existing:
                category = Category(
                    name=cat_name,
                    type=CategoryType.INGREDIENT,
                    display_order=idx,
                    is_active=True
                )
                db.add(category)
                print(f"   ✅ Создана категория: {cat_name}")
            else:
                print(f"   ⏭️  Категория уже существует: {cat_name}")

        db.flush()

        # Обновляем Ingredient.category_id
        print("\n   Обновление category_id в ingredients...")
        for ingredient in db.query(Ingredient).filter(Ingredient.category.isnot(None)).all():
            if ingredient.category:
                cat = db.query(Category).filter(
                    Category.name == ingredient.category,
                    Category.type == CategoryType.INGREDIENT
                ).first()
                if cat:
                    ingredient.category_id = cat.id

        db.commit()
        print("   ✅ Ingredients обновлены")

        # 4. Миграция категорий Semifinished
        print("\n📝 Шаг 4: Миграция категорий Semifinished...")
        semifinished_categories = db.query(Semifinished.category).distinct().filter(Semifinished.category.isnot(None)).all()
        semifinished_categories = [cat[0] for cat in semifinished_categories if cat[0]]

        print(f"   Найдено {len(semifinished_categories)} уникальных категорий полуфабрикатов")

        for idx, cat_name in enumerate(semifinished_categories):
            existing = db.query(Category).filter(
                Category.name == cat_name,
                Category.type == CategoryType.SEMIFINISHED
            ).first()

            if not existing:
                category = Category(
                    name=cat_name,
                    type=CategoryType.SEMIFINISHED,
                    display_order=idx,
                    is_active=True
                )
                db.add(category)
                print(f"   ✅ Создана категория: {cat_name}")
            else:
                print(f"   ⏭️  Категория уже существует: {cat_name}")

        db.flush()

        # Обновляем Semifinished.category_id
        print("\n   Обновление category_id в semifinished...")
        for semifinished in db.query(Semifinished).filter(Semifinished.category.isnot(None)).all():
            if semifinished.category:
                cat = db.query(Category).filter(
                    Category.name == semifinished.category,
                    Category.type == CategoryType.SEMIFINISHED
                ).first()
                if cat:
                    semifinished.category_id = cat.id

        db.commit()
        print("   ✅ Semifinished обновлены")

        # Подсчет итогов
        print("\n📊 Итоги миграции:")
        total_categories = db.query(Category).count()
        print(f"   Всего категорий в БД: {total_categories}")

        for cat_type in CategoryType:
            count = db.query(Category).filter(Category.type == cat_type).count()
            print(f"   - {cat_type.value}: {count}")

        print("\n✅ Миграция 002 завершена успешно!")
        print("\n📌 Следующие шаги:")
        print("   1. Проверьте что все category_id заполнены корректно")
        print("   2. Протестируйте API /api/categories")
        print("   3. После проверки можно будет удалить старое поле 'category' из моделей")

    except Exception as e:
        print(f"\n❌ ОШИБКА миграции: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return 1
    finally:
        db.close()
        engine.dispose()

    return 0


if __name__ == "__main__":
    sys.exit(main())
