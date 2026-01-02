from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.db import engine, Base, SessionLocal
from app.routes import (
    products_router,
    orders_router,
    settings_router,
    ingredients_router,
    recipes_router,
    semifinished_router,
    pos_router,
    categories_router,
    product_variants_router,
    modifiers_router
)

# Создаем таблицы в БД
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="My POS System API",
    description="API для системы учета общепита",
    version="1.0.1"  # Bug fixes: validation & frontend fixes
)

# CORS для доступа из frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(products_router, prefix="/api")
app.include_router(orders_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(ingredients_router, prefix="/api")
app.include_router(recipes_router, prefix="/api")
app.include_router(semifinished_router, prefix="/api")
app.include_router(pos_router, prefix="/api")
app.include_router(categories_router, prefix="/api")
app.include_router(product_variants_router, prefix="/api")
app.include_router(modifiers_router, prefix="/api")


@app.get("/")
def root():
    """Проверка работоспособности API"""
    return {
        "message": "My POS System API",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.post("/api/admin/migrate-ingredients")
def migrate_ingredients_table():
    """
    ВРЕМЕННЫЙ ENDPOINT для миграции таблицы ingredients
    Удаляет и пересоздает таблицу с правильной схемой
    """
    try:
        from app.models import Ingredient

        # Удаляем таблицу через metadata (работает для SQLite и PostgreSQL)
        Ingredient.__table__.drop(engine, checkfirst=True)

        # Пересоздаем таблицу с правильной схемой
        Ingredient.__table__.create(engine, checkfirst=True)

        return {
            "status": "success",
            "message": "Таблица ingredients успешно пересоздана"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


@app.post("/api/admin/migrate-categories")
def migrate_categories_table():
    """
    ВРЕМЕННЫЙ ENDPOINT для создания таблицы categories и добавления полей category_id/display_order
    """
    import os

    try:
        # Определяем тип БД
        database_url = os.getenv('DATABASE_URL', '')
        is_postgres = 'postgresql' in database_url.lower()

        messages = []

        with engine.connect() as conn:
            # 1. Создаем таблицу categories
            messages.append("📝 Создание таблицы categories...")

            if is_postgres:
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
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS categories (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        type TEXT NOT NULL,
                        display_order INTEGER NOT NULL DEFAULT 0,
                        color TEXT,
                        is_active INTEGER DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP
                    )
                """))

            messages.append("✅ Таблица categories создана")

            # 2. Добавляем поля в products
            messages.append("📝 Добавление category_id и display_order в products...")
            try:
                conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INTEGER"))
                conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0"))
                messages.append("✅ Поля добавлены в products")
            except Exception as e:
                messages.append(f"⚠️ products: {str(e)}")

            # 3. Добавляем поля в recipes
            messages.append("📝 Добавление category_id и display_order в recipes...")
            try:
                conn.execute(text("ALTER TABLE recipes ADD COLUMN IF NOT EXISTS category_id INTEGER"))
                conn.execute(text("ALTER TABLE recipes ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0"))
                messages.append("✅ Поля добавлены в recipes")
            except Exception as e:
                messages.append(f"⚠️ recipes: {str(e)}")

            # 4. Добавляем поля в ingredients
            messages.append("📝 Добавление category_id и display_order в ingredients...")
            try:
                conn.execute(text("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS category_id INTEGER"))
                conn.execute(text("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0"))
                messages.append("✅ Поля добавлены в ingredients")
            except Exception as e:
                messages.append(f"⚠️ ingredients: {str(e)}")

            # 5. Добавляем поля в semifinished
            messages.append("📝 Добавление category_id и display_order в semifinished...")
            try:
                conn.execute(text("ALTER TABLE semifinished ADD COLUMN IF NOT EXISTS category_id INTEGER"))
                conn.execute(text("ALTER TABLE semifinished ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0"))
                messages.append("✅ Поля добавлены в semifinished")
            except Exception as e:
                messages.append(f"⚠️ semifinished: {str(e)}")

            conn.commit()
            messages.append("✅ Миграция завершена успешно!")

        return {
            "status": "success",
            "messages": messages,
            "database_type": "PostgreSQL" if is_postgres else "SQLite"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


@app.post("/api/admin/migrate-modifiers")
def migrate_modifiers_tables():
    """
    ВРЕМЕННЫЙ ENDPOINT для создания таблиц модификаторов и обновления order_items
    """
    import os

    try:
        # Определяем тип БД
        database_url = os.getenv('DATABASE_URL', '')
        is_postgres = 'postgresql' in database_url.lower()

        messages = []

        with engine.connect() as conn:
            # 1. Добавляем поля в order_items
            messages.append("📝 Добавление variant_id и modifiers в order_items...")
            try:
                if is_postgres:
                    conn.execute(text("ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id INTEGER"))
                    conn.execute(text("ALTER TABLE order_items ADD COLUMN IF NOT EXISTS modifiers JSON"))
                else:
                    # SQLite не поддерживает IF NOT EXISTS для столбцов, проверяем наличие
                    try:
                        conn.execute(text("ALTER TABLE order_items ADD COLUMN variant_id INTEGER"))
                    except:
                        pass  # Столбец уже существует
                    try:
                        conn.execute(text("ALTER TABLE order_items ADD COLUMN modifiers TEXT"))  # SQLite использует TEXT для JSON
                    except:
                        pass  # Столбец уже существует

                messages.append("✅ Поля добавлены в order_items")
            except Exception as e:
                messages.append(f"⚠️ order_items: {str(e)}")

            conn.commit()
            messages.append("✅ Миграция завершена успешно!")
            messages.append("ℹ️  Таблицы product_variants, modifier_groups, modifiers, product_modifier_groups")
            messages.append("   создадутся автоматически при следующем перезапуске backend")

        return {
            "status": "success",
            "messages": messages,
            "database_type": "PostgreSQL" if is_postgres else "SQLite"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


@app.post("/api/admin/merge-pos-categories")
def merge_pos_categories():
    """
    ВРЕМЕННЫЙ ENDPOINT для объединения категорий товаров и техкарт в общий тип POS
    """
    import os
    import sys

    try:
        messages = []

        # Добавляем значение 'pos' в ENUM categorytype
        messages.append("🔧 Добавляем значение 'pos' в ENUM categorytype...")
        with engine.connect() as conn:
            try:
                conn.execute(text("ALTER TYPE categorytype ADD VALUE IF NOT EXISTS 'pos'"))
                conn.commit()
                messages.append("✅ Значение 'pos' добавлено в ENUM")
            except Exception as e:
                messages.append(f"⚠️  ENUM: {str(e)}")
                conn.rollback()

        # Запускаем миграцию через импорт
        messages.append("📝 Запуск миграции объединения категорий...")

        # Импортируем необходимые модели
        from sqlalchemy.orm import sessionmaker
        from app.models import Category, Product, Recipe, CategoryType

        Session = sessionmaker(bind=engine)
        db = Session()

        try:
            # Получаем категории product/recipe
            product_categories = db.query(Category).filter(Category.type == 'product').all()
            recipe_categories = db.query(Category).filter(Category.type == 'recipe').all()

            messages.append(f"📊 Найдено категорий товаров: {len(product_categories)}")
            messages.append(f"📊 Найдено категорий техкарт: {len(recipe_categories)}")

            # Объединяем категории с одинаковыми именами
            merged_categories = {}

            for cat in product_categories + recipe_categories:
                if cat.name not in merged_categories:
                    merged_categories[cat.name] = cat.id
                else:
                    # Категория с таким именем уже есть - перенаправляем все товары/техкарты
                    target_id = merged_categories[cat.name]

                    # Переназначаем товары
                    db.execute(text(f"UPDATE products SET category_id = {target_id} WHERE category_id = {cat.id}"))
                    # Переназначаем техкарты
                    db.execute(text(f"UPDATE recipes SET category_id = {target_id} WHERE category_id = {cat.id}"))

                    # Удаляем дубликат
                    db.delete(cat)

            # Обновляем тип всех категорий напрямую через SQL (без ORM)
            messages.append("🔄 Обновляем тип категорий на 'pos'...")
            for cat_id in merged_categories.values():
                db.execute(text(f"UPDATE categories SET type = 'pos' WHERE id = {cat_id}"))

            db.commit()
            messages.append(f"✅ Объединено категорий: {len(merged_categories)}")

            # Используем прямой SQL для подсчета (избегаем проблем с Enum)
            result = db.execute(text("SELECT COUNT(*) FROM categories WHERE type = 'pos'"))
            pos_count = result.scalar()
            messages.append(f"📊 Итого категорий POS: {pos_count}")

            return {
                "status": "success",
                "messages": messages
            }

        except Exception as e:
            db.rollback()
            messages.append(f"❌ Ошибка: {str(e)}")
            return {
                "status": "error",
                "messages": messages,
                "error": str(e)
            }
        finally:
            db.close()

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
