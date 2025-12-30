#!/usr/bin/env python3
"""
Миграция: добавление колонки show_in_pos в таблицу recipes
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

            # Выполняем миграцию
            print("\n📝 Добавление колонки show_in_pos...")
            conn.execute(text("""
                ALTER TABLE recipes
                ADD COLUMN IF NOT EXISTS show_in_pos BOOLEAN DEFAULT TRUE
            """))
            conn.commit()
            print("✅ Колонка show_in_pos добавлена")

            # Проверяем результат
            print("\n🔍 Проверка колонок таблицы recipes:")
            result = conn.execute(text("""
                SELECT column_name, data_type, column_default
                FROM information_schema.columns
                WHERE table_name = 'recipes'
                ORDER BY ordinal_position
            """))

            for row in result:
                print(f"  - {row[0]}: {row[1]} (default: {row[2]})")

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
