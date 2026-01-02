#!/usr/bin/env python3
"""
Скрипт для создания тестовых данных:
- Категории POS (Напитки, Добавки)
- Ингредиенты (Молоко, Тапиока, Сироп)
- Техкарты разных размеров (Латте 500мл, 700мл, 1000мл)
- Товары с модификациями
- Группы модификаторов (Добавки)
"""

import os
import sys

# Добавляем путь к app для импорта
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.orm import sessionmaker
from app.db import engine
from app.models import (
    Category, Ingredient, Recipe, RecipeIngredient,
    Product, ProductVariant, ModifierGroup, Modifier,
    ProductModifierGroup
)

def create_test_data():
    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        print("🚀 Создание тестовых данных...\n")

        # 1. Создать категории
        print("📁 Создание категорий...")
        cat_drinks = Category(
            name="Напитки",
            type="pos",
            color="#3B82F6",
            display_order=0,
            is_active=True
        )
        cat_toppings = Category(
            name="Добавки",
            type="pos",
            color="#10B981",
            display_order=1,
            is_active=True
        )
        cat_ingredients = Category(
            name="Молочные продукты",
            type="ingredient",
            color="#F59E0B",
            display_order=0,
            is_active=True
        )

        db.add_all([cat_drinks, cat_toppings, cat_ingredients])
        db.flush()
        print(f"✅ Категории созданы (id: {cat_drinks.id}, {cat_toppings.id}, {cat_ingredients.id})")

        # 2. Создать ингредиенты
        print("\n🥛 Создание ингредиентов...")
        ing_milk = Ingredient(
            name="Молоко 2.5%",
            unit="л",
            stock_quantity=50.0,
            min_stock=10.0,
            purchase_price=200.0,
            category_id=cat_ingredients.id
        )
        ing_tapioca = Ingredient(
            name="Тапиока (жемчужины)",
            unit="кг",
            stock_quantity=5.0,
            min_stock=1.0,
            purchase_price=1500.0,
            category_id=cat_ingredients.id
        )
        ing_syrup = Ingredient(
            name="Сироп (ваниль)",
            unit="л",
            stock_quantity=3.0,
            min_stock=0.5,
            purchase_price=800.0,
            category_id=cat_ingredients.id
        )
        ing_coffee = Ingredient(
            name="Кофе эспрессо (зерна)",
            unit="кг",
            stock_quantity=10.0,
            min_stock=2.0,
            purchase_price=3000.0,
            category_id=cat_ingredients.id
        )

        db.add_all([ing_milk, ing_tapioca, ing_syrup, ing_coffee])
        db.flush()
        print(f"✅ Ингредиенты созданы: Молоко, Тапиока, Сироп, Кофе")

        # 3. Создать техкарты разных размеров для Латте
        print("\n☕ Создание техкарт (Латте - разные размеры)...")

        # Латте 500 мл
        recipe_latte_500 = Recipe(
            name="Латте 500мл",
            category_id=cat_drinks.id,
            output_weight=500.0,
            price=500.0,
            show_in_pos=False  # Не показывать напрямую - будет доступно через варианты
        )
        db.add(recipe_latte_500)
        db.flush()

        db.add_all([
            RecipeIngredient(recipe_id=recipe_latte_500.id, ingredient_id=ing_coffee.id, gross_weight=14.0, net_weight=14.0),  # 14г кофе
            RecipeIngredient(recipe_id=recipe_latte_500.id, ingredient_id=ing_milk.id, gross_weight=350.0, net_weight=350.0)  # 350мл молока
        ])

        # Латте 700 мл
        recipe_latte_700 = Recipe(
            name="Латте 700мл",
            category_id=cat_drinks.id,
            output_weight=700.0,
            price=700.0,
            show_in_pos=False
        )
        db.add(recipe_latte_700)
        db.flush()

        db.add_all([
            RecipeIngredient(recipe_id=recipe_latte_700.id, ingredient_id=ing_coffee.id, gross_weight=18.0, net_weight=18.0),  # 18г кофе
            RecipeIngredient(recipe_id=recipe_latte_700.id, ingredient_id=ing_milk.id, gross_weight=500.0, net_weight=500.0)  # 500мл молока
        ])

        # Латте 1000 мл
        recipe_latte_1000 = Recipe(
            name="Латте 1000мл",
            category_id=cat_drinks.id,
            output_weight=1000.0,
            price=900.0,
            show_in_pos=False
        )
        db.add(recipe_latte_1000)
        db.flush()

        db.add_all([
            RecipeIngredient(recipe_id=recipe_latte_1000.id, ingredient_id=ing_coffee.id, gross_weight=21.0, net_weight=21.0),  # 21г кофе
            RecipeIngredient(recipe_id=recipe_latte_1000.id, ingredient_id=ing_milk.id, gross_weight=700.0, net_weight=700.0)  # 700мл молока
        ])

        print(f"✅ Техкарты созданы: 500мл (id:{recipe_latte_500.id}), 700мл (id:{recipe_latte_700.id}), 1000мл (id:{recipe_latte_1000.id})")

        # 4. Создать базовый товар "Латте" с вариантами размеров
        print("\n🛍️ Создание товара 'Латте' с вариантами размеров...")
        product_latte = Product(
            name="Латте",
            price=500.0,  # Базовая цена (минимальный размер)
            category_id=cat_drinks.id,
            show_in_pos=True,
            is_available=True,
            display_order=0
        )
        db.add(product_latte)
        db.flush()

        # Создать варианты (привязка размеров к техкартам)
        variant_500 = ProductVariant(
            base_product_id=product_latte.id,
            recipe_id=recipe_latte_500.id,
            name="500 мл",
            size_code="S",
            price_adjustment=0.0,  # +0₸
            display_order=0,
            is_default=True,
            is_active=True
        )
        variant_700 = ProductVariant(
            base_product_id=product_latte.id,
            recipe_id=recipe_latte_700.id,
            name="700 мл",
            size_code="M",
            price_adjustment=200.0,  # +200₸
            display_order=1,
            is_default=False,
            is_active=True
        )
        variant_1000 = ProductVariant(
            base_product_id=product_latte.id,
            recipe_id=recipe_latte_1000.id,
            name="1000 мл",
            size_code="L",
            price_adjustment=400.0,  # +400₸
            display_order=2,
            is_default=False,
            is_active=True
        )

        db.add_all([variant_500, variant_700, variant_1000])
        db.flush()
        print(f"✅ Варианты созданы: S (+0₸), M (+200₸), L (+400₸)")

        # 5. Создать группу модификаторов "Добавки"
        print("\n🧋 Создание группы модификаторов 'Добавки'...")
        modifier_group = ModifierGroup(
            name="Добавки",
            selection_type="multiple",
            min_selections=0,
            max_selections=None,  # Без ограничений
            is_required=False,
            display_order=0
        )
        db.add(modifier_group)
        db.flush()

        # Создать модификации в группе
        mod_tapioca = Modifier(
            group_id=modifier_group.id,
            name="Тапиока",
            price=200.0,
            ingredient_id=ing_tapioca.id,
            quantity_per_use=0.050,  # 50г
            display_order=0,
            is_available=True
        )
        mod_syrup = Modifier(
            group_id=modifier_group.id,
            name="Сироп (ваниль)",
            price=100.0,
            ingredient_id=ing_syrup.id,
            quantity_per_use=0.030,  # 30мл
            display_order=1,
            is_available=True
        )
        mod_extra_milk = Modifier(
            group_id=modifier_group.id,
            name="Двойное молоко",
            price=150.0,
            ingredient_id=ing_milk.id,
            quantity_per_use=0.100,  # +100мл
            display_order=2,
            is_available=True
        )

        db.add_all([mod_tapioca, mod_syrup, mod_extra_milk])
        db.flush()
        print(f"✅ Модификаторы созданы: Тапиока (+200₸), Сироп (+100₸), Двойное молоко (+150₸)")

        # 6. Привязать группу модификаторов к товару "Латте"
        print("\n🔗 Привязка модификаторов к товару 'Латте'...")
        product_modifier_link = ProductModifierGroup(
            product_id=product_latte.id,
            modifier_group_id=modifier_group.id,
            display_order=0
        )
        db.add(product_modifier_link)

        # Commit всех изменений
        db.commit()

        print("\n" + "="*60)
        print("✅ Тестовые данные успешно созданы!")
        print("="*60)
        print(f"""
📊 Создано:
  • Категории: 3 (Напитки, Добавки, Молочные продукты)
  • Ингредиенты: 4 (Молоко, Тапиока, Сироп, Кофе)
  • Техкарты: 3 (Латте 500мл, 700мл, 1000мл)
  • Товары: 1 (Латте с 3 вариантами размеров)
  • Группы модификаторов: 1 (Добавки)
  • Модификаторы: 3 (Тапиока, Сироп, Двойное молоко)

🧪 Для тестирования:
  1. Откройте /admin/categories - проверьте категории
  2. Откройте /admin - проверьте товар "Латте" → кнопка "Размеры"
  3. Откройте /admin → "Модификации" у товара "Латте"
  4. Откройте /pos - добавьте "Латте" в корзину
  5. Выберите размер и добавки в модальном окне
  6. Создайте заказ и проверьте корректность цены
        """)

        return True

    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    print("MyPOS - Генератор тестовых данных")
    print("=" * 60 + "\n")

    # Проверка подключения к БД
    try:
        with engine.connect() as conn:
            print(f"✅ Подключение к БД успешно")
            print(f"   URL: {engine.url}\n")
    except Exception as e:
        print(f"❌ Ошибка подключения к БД: {e}")
        sys.exit(1)

    # Запуск создания данных
    success = create_test_data()
    sys.exit(0 if success else 1)
