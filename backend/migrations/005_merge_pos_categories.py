#!/usr/bin/env python3
"""
Миграция: Объединить категории товаров и техкарт в общие категории кассы (POS)

Эта миграция:
1. Конвертирует все категории типа 'product' и 'recipe' в тип 'pos'
2. Объединяет дублирующиеся категории (например, если есть "Напитки" для товаров и для техкарт)
3. Обновляет связи товаров и техкарт с новыми категориями
"""
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Добавляем путь к app для импорта моделей
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models import Category, Product, Recipe


def main():
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not set!")
        return 1

    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        print("📝 Начало миграции категорий товаров и техкарт в POS...")

        # Шаг 0: Добавить значение 'pos' в ENUM categorytype
        print("🔧 Добавляем значение 'pos' в ENUM categorytype...")
        with engine.connect() as conn:
            try:
                conn.execute(text("ALTER TYPE categorytype ADD VALUE IF NOT EXISTS 'pos'"))
                conn.commit()
                print("✅ Значение 'pos' добавлено в ENUM")
            except Exception as e:
                # Возможно значение уже есть
                print(f"⚠️  Не удалось добавить 'pos' в ENUM (возможно уже существует): {e}")
                conn.rollback()

        # Шаг 1: Получить все категории типа 'product' и 'recipe'
        product_categories = db.query(Category).filter(Category.type == 'product').all()
        recipe_categories = db.query(Category).filter(Category.type == 'recipe').all()

        print(f"📊 Найдено категорий товаров: {len(product_categories)}")
        print(f"📊 Найдено категорий техкарт: {len(recipe_categories)}")

        # Шаг 2: Создаем словарь уникальных категорий по имени
        # Объединяем категории с одинаковыми именами
        merged_categories = {}

        for cat in product_categories:
            if cat.name not in merged_categories:
                merged_categories[cat.name] = {
                    'id': cat.id,
                    'name': cat.name,
                    'display_order': cat.display_order,
                    'color': cat.color,
                    'is_active': cat.is_active,
                    'product_ids': [],
                    'recipe_ids': []
                }
            # Собираем все товары этой категории
            products = db.query(Product).filter(Product.category_id == cat.id).all()
            merged_categories[cat.name]['product_ids'].extend([p.id for p in products])

        for cat in recipe_categories:
            if cat.name not in merged_categories:
                # Создаем новую категорию
                merged_categories[cat.name] = {
                    'id': cat.id,
                    'name': cat.name,
                    'display_order': cat.display_order,
                    'color': cat.color,
                    'is_active': cat.is_active,
                    'product_ids': [],
                    'recipe_ids': []
                }
            else:
                # Категория уже есть - используем существующую
                # Берем минимальный display_order
                merged_categories[cat.name]['display_order'] = min(
                    merged_categories[cat.name]['display_order'],
                    cat.display_order
                )
                # Если цвета нет у первой категории, берем из второй
                if not merged_categories[cat.name]['color'] and cat.color:
                    merged_categories[cat.name]['color'] = cat.color

            # Собираем все техкарты этой категории
            recipes = db.query(Recipe).filter(Recipe.category_id == cat.id).all()
            merged_categories[cat.name]['recipe_ids'].extend([r.id for r in recipes])

        print(f"✅ Объединенных уникальных категорий: {len(merged_categories)}")

        # Шаг 3: Удаляем все старые категории product/recipe и создаем новые POS
        category_mapping = {}  # старый id -> новый id

        for cat_name, cat_data in merged_categories.items():
            # Создаем или обновляем категорию с типом 'pos'
            pos_category = db.query(Category).filter(
                Category.id == cat_data['id']
            ).first()

            if pos_category:
                # Обновляем существующую
                pos_category.type = 'pos'
                pos_category.display_order = cat_data['display_order']
                if cat_data['color']:
                    pos_category.color = cat_data['color']
                pos_category.is_active = cat_data['is_active']
                db.flush()
                category_mapping[cat_data['id']] = pos_category.id
                print(f"  🔄 Обновлена категория '{cat_name}' (ID: {pos_category.id}) -> type='pos'")
            else:
                # Создаем новую (этот случай маловероятен)
                new_category = Category(
                    name=cat_name,
                    type='pos',
                    display_order=cat_data['display_order'],
                    color=cat_data['color'],
                    is_active=cat_data['is_active']
                )
                db.add(new_category)
                db.flush()
                category_mapping[cat_data['id']] = new_category.id
                print(f"  ✨ Создана категория '{cat_name}' (ID: {new_category.id}) -> type='pos'")

            # Обновляем связи товаров
            for product_id in cat_data['product_ids']:
                product = db.query(Product).filter(Product.id == product_id).first()
                if product:
                    product.category_id = category_mapping[cat_data['id']]

            # Обновляем связи техкарт
            for recipe_id in cat_data['recipe_ids']:
                recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
                if recipe:
                    recipe.category_id = category_mapping[cat_data['id']]

        # Шаг 4: Удаляем дублирующиеся категории
        duplicate_category_ids = set()
        for cat_name, cat_data in merged_categories.items():
            # Ищем все категории с этим именем
            all_cats = db.query(Category).filter(Category.name == cat_name).all()
            if len(all_cats) > 1:
                # Оставляем только первую (с наименьшим ID)
                keep_cat = min(all_cats, key=lambda c: c.id)
                for cat in all_cats:
                    if cat.id != keep_cat.id:
                        # Перенаправляем все товары и техкарты на оставляемую категорию
                        for product in cat.products:
                            product.category_id = keep_cat.id
                        for recipe in cat.recipes:
                            recipe.category_id = keep_cat.id

                        duplicate_category_ids.add(cat.id)

        # Удаляем дубликаты
        if duplicate_category_ids:
            print(f"🗑️  Удаляем {len(duplicate_category_ids)} дублирующихся категорий...")
            for cat_id in duplicate_category_ids:
                cat = db.query(Category).filter(Category.id == cat_id).first()
                if cat:
                    db.delete(cat)

        db.commit()
        print("✅ Миграция завершена успешно!")
        print(f"📊 Итого категорий POS: {db.query(Category).filter(Category.type == 'pos').count()}")

        return 0

    except Exception as e:
        print(f"❌ Ошибка миграции: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    exit(main())
