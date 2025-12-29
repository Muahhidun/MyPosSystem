#!/usr/bin/env python3
"""
Миграция: добавление недостающих колонок в таблицу order_items
Дата: 2025-12-29
"""

import os
from sqlalchemy import create_engine, text

def main():
    # Получаем DATABASE_URL из переменных окружения
    database_url = os.getenv('DATABASE_URL')

    if not database_url:
        print("❌ ERROR: DATABASE_URL not set!")
        print("Установите переменную окружения DATABASE_URL")
        print("Например: export DATABASE_URL='postgresql://user:pass@host:port/dbname'")
        return 1

    print(f"🔗 Подключение к БД...")
    engine = create_engine(database_url)

    try:
        with engine.connect() as conn:
            print("✅ Подключено к БД")

            # Сначала проверяем текущую структуру таблицы
            print("\n🔍 Текущие колонки таблицы order_items:")
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'order_items'
                ORDER BY ordinal_position
            """))

            existing_columns = []
            for row in result:
                existing_columns.append(row[0])
                print(f"  - {row[0]}: {row[1]} (nullable: {row[2]}, default: {row[3]})")

            # Список колонок для добавления
            columns_to_add = []

            if 'item_name' not in existing_columns:
                columns_to_add.append({
                    'name': 'item_name',
                    'sql': 'ALTER TABLE order_items ADD COLUMN item_name VARCHAR NOT NULL DEFAULT \'\''
                })

            if 'quantity' not in existing_columns:
                columns_to_add.append({
                    'name': 'quantity',
                    'sql': 'ALTER TABLE order_items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1'
                })

            if 'price' not in existing_columns:
                columns_to_add.append({
                    'name': 'price',
                    'sql': 'ALTER TABLE order_items ADD COLUMN price DOUBLE PRECISION NOT NULL DEFAULT 0'
                })

            if 'subtotal' not in existing_columns:
                columns_to_add.append({
                    'name': 'subtotal',
                    'sql': 'ALTER TABLE order_items ADD COLUMN subtotal DOUBLE PRECISION NOT NULL DEFAULT 0'
                })

            if not columns_to_add:
                print("\n✅ Все необходимые колонки уже существуют!")
                return 0

            # Добавляем недостающие колонки
            print(f"\n📝 Добавление {len(columns_to_add)} колонок...")
            for col in columns_to_add:
                print(f"  ➕ Добавление {col['name']}...")
                conn.execute(text(col['sql']))
                conn.commit()
                print(f"  ✅ {col['name']} добавлена")

            # Убираем временные DEFAULT значения для строковых полей
            if 'item_name' in [c['name'] for c in columns_to_add]:
                print("\n🔧 Убираем временный DEFAULT для item_name...")
                conn.execute(text("ALTER TABLE order_items ALTER COLUMN item_name DROP DEFAULT"))
                conn.commit()
                print("  ✅ DEFAULT удален")

            # Проверяем результат
            print("\n🔍 Итоговая структура таблицы order_items:")
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'order_items'
                ORDER BY ordinal_position
            """))

            for row in result:
                print(f"  - {row[0]}: {row[1]} (nullable: {row[2]}, default: {row[3]})")

            print("\n✅ Миграция выполнена успешно!")
            return 0

    except Exception as e:
        print(f"\n❌ Ошибка при выполнении миграции:")
        print(f"   {e}")
        return 1
    finally:
        engine.dispose()

if __name__ == "__main__":
    exit(main())
