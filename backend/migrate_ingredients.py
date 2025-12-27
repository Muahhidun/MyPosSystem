"""
Скрипт для миграции таблицы ingredients
Изменяет тип колонки unit с enum на varchar
"""
import os
from sqlalchemy import create_engine, text

# Получаем DATABASE_URL из переменных окружения
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment variables")
    exit(1)

# Для Railway PostgreSQL нужно заменить postgres:// на postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

print(f"Connecting to database...")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Dropping ingredients table...")
    conn.execute(text("DROP TABLE IF EXISTS ingredients CASCADE"))
    conn.commit()
    print("Table dropped successfully!")

print("\nMigration complete!")
print("The table will be recreated automatically when the app starts.")
