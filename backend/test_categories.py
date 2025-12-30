#!/usr/bin/env python3
"""Скрипт для создания тестовых категорий и товаров"""

from sqlalchemy.orm import sessionmaker
from app.db import engine
from app.models import Category, CategoryType, Product

Session = sessionmaker(bind=engine)
db = Session()

try:
    print("📝 Создание тестовых категорий...")

    # Создаем категории товаров
    cat_drinks = Category(
        name="Напитки",
        type=CategoryType.PRODUCT,
        display_order=0,
        color="#3B82F6",
        is_active=True
    )
    cat_snacks = Category(
        name="Закуски",
        type=CategoryType.PRODUCT,
        display_order=1,
        color="#10B981",
        is_active=True
    )

    db.add(cat_drinks)
    db.add(cat_snacks)
    db.flush()

    print(f"✅ Создана категория: {cat_drinks.name} (ID: {cat_drinks.id})")
    print(f"✅ Создана категория: {cat_snacks.name} (ID: {cat_snacks.id})")

    # Создаем тестовые товары
    print("\n📝 Создание тестовых товаров...")

    products = [
        Product(name="Латте", price=450, category_id=cat_drinks.id, display_order=0, show_in_pos=True),
        Product(name="Капучино", price=400, category_id=cat_drinks.id, display_order=1, show_in_pos=True),
        Product(name="Чай зелёный", price=300, category_id=cat_drinks.id, display_order=2, show_in_pos=True),
        Product(name="Чипсы", price=250, category_id=cat_snacks.id, display_order=0, show_in_pos=True),
        Product(name="Сухарики", price=200, category_id=cat_snacks.id, display_order=1, show_in_pos=True),
    ]

    for product in products:
        db.add(product)

    db.commit()

    for product in products:
        print(f"✅ Создан товар: {product.name} - {product.price}₸ (категория_id: {product.category_id})")

    print("\n📊 Итого:")
    print(f"   Категорий: {db.query(Category).count()}")
    print(f"   Товаров: {db.query(Product).count()}")

    print("\n✅ Тестовые данные успешно созданы!")

except Exception as e:
    print(f"❌ Ошибка: {e}")
    db.rollback()
finally:
    db.close()
