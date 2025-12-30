#!/usr/bin/env python3
"""
Миграция 001: Создание таблицы categories и добавление полей category_id, display_order

Что делает:
1. Создает таблицу categories
2. Добавляет category_id и display_order в products
3. Добавляет category_id и display_order в recipes
4. Добавляет category_id и display_order в ingredients
5. Добавляет category_id и display_order в semifinished
"""

import os
import sys
from sqlalchemy import create_engine, text

def main():
    """Основная функция миграции"""
    # Получаем DATABASE_URL из переменных окружения
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not set!")
        print("💡 Set it with: export DATABASE_URL='postgresql://...' or 'sqlite:///./mypos.db'")
        return 1

    print(f"📝 Connecting to database...")
    engine = create_engine(database_url)

    try:
        with engine.connect() as conn:
            print("\n=== Миграция 001: Создание categories ===\n")

            # 1. Создание таблицы categories
            print("📝 Шаг 1: Создание таблицы categories...")

            # Определяем тип БД
            is_postgres = 'postgresql' in database_url.lower()

            if is_postgres:
                # PostgreSQL синтаксис
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS categories (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR NOT NULL,
                        type VARCHAR NOT NULL,
                        display_order INTEGER NOT NULL DEFAULT 0,
                        color VARCHAR,
                        is_active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE
                    )
                """))
            else:
                # SQLite синтаксис
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS categories (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        type TEXT NOT NULL,
                        display_order INTEGER NOT NULL DEFAULT 0,
                        color TEXT,
                        is_active INTEGER DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME
                    )
                """))

            conn.commit()
            print("✅ Таблица categories создана")

            # 2. Добавление индексов на categories
            print("\n📝 Шаг 2: Создание индексов...")
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type)
            """))
            conn.commit()
            print("✅ Индексы созданы")

            # 3. Добавление полей в products
            print("\n📝 Шаг 3: Обновление таблицы products...")
            try:
                if is_postgres:
                    conn.execute(text("""
                        ALTER TABLE products
                        ADD COLUMN IF NOT EXISTS category_id INTEGER,
                        ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0
                    """))
                else:
                    # SQLite: проверяем существование колонок
                    result = conn.execute(text("PRAGMA table_info(products)"))
                    columns = [row[1] for row in result]

                    if 'category_id' not in columns:
                        conn.execute(text("ALTER TABLE products ADD COLUMN category_id INTEGER"))
                    if 'display_order' not in columns:
                        conn.execute(text("ALTER TABLE products ADD COLUMN display_order INTEGER DEFAULT 0"))

                conn.commit()
                print("✅ Поля добавлены в products")
            except Exception as e:
                print(f"⚠️  Возможно поля уже существуют в products: {e}")

            # 4. Добавление полей в recipes
            print("\n📝 Шаг 4: Обновление таблицы recipes...")
            try:
                if is_postgres:
                    conn.execute(text("""
                        ALTER TABLE recipes
                        ADD COLUMN IF NOT EXISTS category_id INTEGER,
                        ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0
                    """))
                else:
                    result = conn.execute(text("PRAGMA table_info(recipes)"))
                    columns = [row[1] for row in result]
                    if 'category_id' not in columns:
                        conn.execute(text("ALTER TABLE recipes ADD COLUMN category_id INTEGER"))
                    if 'display_order' not in columns:
                        conn.execute(text("ALTER TABLE recipes ADD COLUMN display_order INTEGER DEFAULT 0"))
                conn.commit()
                print("✅ Поля добавлены в recipes")
            except Exception as e:
                print(f"⚠️  Возможно поля уже существуют в recipes: {e}")

            # 5. Добавление полей в ingredients
            print("\n📝 Шаг 5: Обновление таблицы ingredients...")
            try:
                if is_postgres:
                    conn.execute(text("""
                        ALTER TABLE ingredients
                        ADD COLUMN IF NOT EXISTS category_id INTEGER,
                        ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0
                    """))
                else:
                    result = conn.execute(text("PRAGMA table_info(ingredients)"))
                    columns = [row[1] for row in result]
                    if 'category_id' not in columns:
                        conn.execute(text("ALTER TABLE ingredients ADD COLUMN category_id INTEGER"))
                    if 'display_order' not in columns:
                        conn.execute(text("ALTER TABLE ingredients ADD COLUMN display_order INTEGER DEFAULT 0"))
                conn.commit()
                print("✅ Поля добавлены в ingredients")
            except Exception as e:
                print(f"⚠️  Возможно поля уже существуют в ingredients: {e}")

            # 6. Добавление полей в semifinished
            print("\n📝 Шаг 6: Обновление таблицы semifinished...")
            try:
                if is_postgres:
                    conn.execute(text("""
                        ALTER TABLE semifinished
                        ADD COLUMN IF NOT EXISTS category_id INTEGER,
                        ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0
                    """))
                else:
                    result = conn.execute(text("PRAGMA table_info(semifinished)"))
                    columns = [row[1] for row in result]
                    if 'category_id' not in columns:
                        conn.execute(text("ALTER TABLE semifinished ADD COLUMN category_id INTEGER"))
                    if 'display_order' not in columns:
                        conn.execute(text("ALTER TABLE semifinished ADD COLUMN display_order INTEGER DEFAULT 0"))
                conn.commit()
                print("✅ Поля добавлены в semifinished")
            except Exception as e:
                print(f"⚠️  Возможно поля уже существуют в semifinished: {e}")

            # 7. Добавление Foreign Key constraints (опционально, работает только для PostgreSQL)
            print("\n📝 Шаг 7: Добавление Foreign Key constraints...")

            # Проверяем тип БД
            if 'postgresql' in database_url.lower():
                try:
                    conn.execute(text("""
                        ALTER TABLE products
                        ADD CONSTRAINT fk_products_category
                        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
                    """))
                    conn.execute(text("""
                        ALTER TABLE recipes
                        ADD CONSTRAINT fk_recipes_category
                        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
                    """))
                    conn.execute(text("""
                        ALTER TABLE ingredients
                        ADD CONSTRAINT fk_ingredients_category
                        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
                    """))
                    conn.execute(text("""
                        ALTER TABLE semifinished
                        ADD CONSTRAINT fk_semifinished_category
                        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
                    """))
                    conn.commit()
                    print("✅ Foreign Key constraints добавлены")
                except Exception as e:
                    print(f"⚠️  Возможно constraints уже существуют: {e}")
            else:
                print("⏭️  SQLite обнаружена - Foreign Keys будут работать автоматически")

            # 8. Создание индексов на category_id
            print("\n📝 Шаг 8: Создание индексов на category_id...")
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_recipes_category_id ON recipes(category_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_ingredients_category_id ON ingredients(category_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_semifinished_category_id ON semifinished(category_id)"))
            conn.commit()
            print("✅ Индексы созданы")

            print("\n✅ Миграция 001 завершена успешно!\n")
            print("📌 Следующий шаг: Запустите 002_migrate_category_data.py для миграции данных")

    except Exception as e:
        print(f"\n❌ ОШИБКА миграции: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        engine.dispose()

    return 0


if __name__ == "__main__":
    sys.exit(main())
