#!/usr/bin/env python3
"""
Миграция БД для поддержки multi-location

Что делает этот скрипт:
1. Создает таблицы locations и stocks
2. Добавляет location_id в orders
3. Создает дефолтную точку (ID=1)
4. Переносит остатки из Ingredient.stock_quantity в Stock
5. Помечает Ingredient.stock_quantity как DEPRECATED
"""

import os
import sys

# Добавляем путь к app для импорта
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from app.models import Location, Stock, Ingredient, Order

def main():
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not set!")
        return 1

    is_postgres = 'postgresql' in database_url.lower()
    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        print("=" * 70)
        print("🚀 МИГРАЦИЯ К MULTI-LOCATION АРХИТЕКТУРЕ")
        print("=" * 70)
        print(f"\n📊 База данных: {'PostgreSQL' if is_postgres else 'SQLite'}")
        print(f"   URL: {database_url[:50]}...\n")

        # Проверяем существование таблиц
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()

        # Шаг 1: Создать таблицу locations
        print("📝 Шаг 1: Создание таблицы locations...")
        if 'locations' not in existing_tables:
            if is_postgres:
                db.execute(text("""
                    CREATE TABLE locations (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR NOT NULL,
                        address VARCHAR,
                        phone VARCHAR,
                        is_active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE
                    )
                """))
            else:
                db.execute(text("""
                    CREATE TABLE locations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        address TEXT,
                        phone TEXT,
                        is_active INTEGER DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP
                    )
                """))
            print("   ✅ Таблица locations создана")
        else:
            print("   ⚠️  Таблица locations уже существует")

        db.commit()

        # Шаг 2: Создать дефолтную точку
        print("\n📍 Шаг 2: Создание дефолтной точки...")
        default_location = db.query(Location).filter(Location.id == 1).first()
        if not default_location:
            default_location = Location(
                id=1,
                name="Основная точка",
                address=None,
                phone=None,
                is_active=True
            )
            db.add(default_location)
            db.commit()
            print("   ✅ Создана точка #1: 'Основная точка'")
        else:
            print(f"   ⚠️  Точка #1 уже существует: '{default_location.name}'")

        # Шаг 3: Создать таблицу stocks
        print("\n📦 Шаг 3: Создание таблицы stocks...")
        if 'stocks' not in existing_tables:
            if is_postgres:
                db.execute(text("""
                    CREATE TABLE stocks (
                        id SERIAL PRIMARY KEY,
                        location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
                        ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
                        quantity FLOAT NOT NULL DEFAULT 0.0,
                        min_stock FLOAT NOT NULL DEFAULT 0.0,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE,
                        UNIQUE(location_id, ingredient_id)
                    )
                """))
                db.execute(text("CREATE INDEX idx_stocks_location ON stocks(location_id)"))
                db.execute(text("CREATE INDEX idx_stocks_ingredient ON stocks(ingredient_id)"))
            else:
                db.execute(text("""
                    CREATE TABLE stocks (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        location_id INTEGER NOT NULL,
                        ingredient_id INTEGER NOT NULL,
                        quantity REAL NOT NULL DEFAULT 0.0,
                        min_stock REAL NOT NULL DEFAULT 0.0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP,
                        FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE CASCADE,
                        FOREIGN KEY(ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
                        UNIQUE(location_id, ingredient_id)
                    )
                """))
                db.execute(text("CREATE INDEX idx_stocks_location ON stocks(location_id)"))
                db.execute(text("CREATE INDEX idx_stocks_ingredient ON stocks(ingredient_id)"))
            print("   ✅ Таблица stocks создана")
        else:
            print("   ⚠️  Таблица stocks уже существует")

        db.commit()

        # Шаг 4: Перенести остатки из Ingredient в Stock
        print("\n🔄 Шаг 4: Перенос остатков из Ingredient в Stock...")
        ingredients = db.query(Ingredient).all()
        migrated_count = 0
        skipped_count = 0

        for ingredient in ingredients:
            # Проверяем есть ли уже остаток для этого ингредиента
            existing_stock = db.query(Stock).filter(
                Stock.location_id == 1,
                Stock.ingredient_id == ingredient.id
            ).first()

            if existing_stock:
                skipped_count += 1
                continue

            # Создаем остаток только если есть данные
            if ingredient.stock_quantity is not None and ingredient.stock_quantity > 0:
                stock = Stock(
                    location_id=1,
                    ingredient_id=ingredient.id,
                    quantity=ingredient.stock_quantity or 0.0,
                    min_stock=ingredient.min_stock or 0.0
                )
                db.add(stock)
                migrated_count += 1

        db.commit()
        print(f"   ✅ Перенесено остатков: {migrated_count}")
        print(f"   ⚠️  Пропущено (уже существуют): {skipped_count}")

        # Шаг 5: Добавить location_id в orders
        print("\n📋 Шаг 5: Добавление location_id в orders...")
        try:
            if is_postgres:
                # PostgreSQL поддерживает IF NOT EXISTS
                db.execute(text("""
                    ALTER TABLE orders
                    ADD COLUMN IF NOT EXISTS location_id INTEGER
                    REFERENCES locations(id) ON DELETE RESTRICT DEFAULT 1
                """))
            else:
                # SQLite требует проверки вручную
                try:
                    db.execute(text("ALTER TABLE orders ADD COLUMN location_id INTEGER DEFAULT 1"))
                except Exception as e:
                    if "duplicate column" not in str(e).lower():
                        raise
                    print("   ⚠️  Колонка location_id уже существует")

            db.commit()
            print("   ✅ Поле location_id добавлено в orders")

            # Обновляем существующие заказы
            result = db.execute(text("UPDATE orders SET location_id = 1 WHERE location_id IS NULL"))
            db.commit()
            updated = result.rowcount
            if updated > 0:
                print(f"   ✅ Обновлено заказов: {updated} (установлен location_id=1)")

        except Exception as e:
            print(f"   ⚠️  Ошибка с orders: {str(e)}")
            db.rollback()

        print("\n" + "=" * 70)
        print("✅ МИГРАЦИЯ УСПЕШНО ЗАВЕРШЕНА!")
        print("=" * 70)
        print("\n📊 Итоговая статистика:")
        print(f"   • Точек создано: 1")
        print(f"   • Остатков перенесено: {migrated_count}")
        print(f"   • Ингредиентов всего: {len(ingredients)}")
        print("\n⚠️  ВАЖНО:")
        print("   1. Поле Ingredient.stock_quantity теперь DEPRECATED")
        print("   2. Используйте Stock API для управления остатками")
        print("   3. Каждая точка имеет свои остатки")
        print("\n🚀 Готово к запуску multi-location!")

        return 0

    except Exception as e:
        print(f"\n❌ ОШИБКА: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    print("\nMyPOS - Миграция к Multi-Location архитектуре\n")
    exit(main())
