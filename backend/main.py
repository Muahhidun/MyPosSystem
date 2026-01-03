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
    modifiers_router,
    locations_router,
    stock_router,
    websocket_router
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
app.include_router(websocket_router, prefix="/api")  # WebSocket для Kitchen Display
app.include_router(locations_router, prefix="/api")  # Multi-location support
app.include_router(stock_router, prefix="/api")  # Stock management (multi-location)
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


@app.post("/api/admin/migrate-multi-location")
def migrate_multi_location():
    """
    ВРЕМЕННЫЙ ENDPOINT для миграции к multi-location архитектуре
    Создает таблицы locations и stocks, переносит данные
    """
    import os
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import inspect
    from app.models import Location, Stock, Ingredient, Order

    database_url = os.getenv('DATABASE_URL', '')
    if not database_url:
        return {"status": "error", "message": "DATABASE_URL not set"}

    is_postgres = 'postgresql' in database_url.lower()
    messages = []

    try:
        messages.append(f"📊 База данных: {'PostgreSQL' if is_postgres else 'SQLite'}")

        # Проверяем существование таблиц
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()

        # Шаг 1: Создать таблицу locations
        messages.append("📝 Шаг 1: Создание таблицы locations...")
        if 'locations' not in existing_tables:
            with engine.connect() as conn:
                if is_postgres:
                    conn.execute(text("""
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
                    conn.execute(text("""
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
                conn.commit()
            messages.append("   ✅ Таблица locations создана")
        else:
            messages.append("   ⚠️  Таблица locations уже существует")

        # Шаг 2: Создать дефолтную точку
        Session = sessionmaker(bind=engine)
        db = Session()

        try:
            messages.append("📍 Шаг 2: Создание дефолтной точки...")
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
                messages.append("   ✅ Создана точка #1: 'Основная точка'")
            else:
                messages.append(f"   ⚠️  Точка #1 уже существует: '{default_location.name}'")

            # Шаг 3: Создать таблицу stocks
            messages.append("📦 Шаг 3: Создание таблицы stocks...")
            if 'stocks' not in existing_tables:
                with engine.connect() as conn:
                    if is_postgres:
                        conn.execute(text("""
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
                        conn.execute(text("CREATE INDEX idx_stocks_location ON stocks(location_id)"))
                        conn.execute(text("CREATE INDEX idx_stocks_ingredient ON stocks(ingredient_id)"))
                    else:
                        conn.execute(text("""
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
                        conn.execute(text("CREATE INDEX idx_stocks_location ON stocks(location_id)"))
                        conn.execute(text("CREATE INDEX idx_stocks_ingredient ON stocks(ingredient_id)"))
                    conn.commit()
                messages.append("   ✅ Таблица stocks создана")
            else:
                messages.append("   ⚠️  Таблица stocks уже существует")

            # Шаг 4: Перенести остатки из Ingredient в Stock
            messages.append("🔄 Шаг 4: Перенос остатков из Ingredient в Stock...")
            ingredients = db.query(Ingredient).all()
            migrated_count = 0
            skipped_count = 0

            for ingredient in ingredients:
                existing_stock = db.query(Stock).filter(
                    Stock.location_id == 1,
                    Stock.ingredient_id == ingredient.id
                ).first()

                if existing_stock:
                    skipped_count += 1
                    continue

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
            messages.append(f"   ✅ Перенесено остатков: {migrated_count}")
            messages.append(f"   ⚠️  Пропущено (уже существуют): {skipped_count}")

            # Шаг 5: Добавить location_id в orders
            messages.append("📋 Шаг 5: Добавление location_id в orders...")
            try:
                with engine.connect() as conn:
                    if is_postgres:
                        conn.execute(text("""
                            ALTER TABLE orders
                            ADD COLUMN IF NOT EXISTS location_id INTEGER
                            REFERENCES locations(id) ON DELETE RESTRICT DEFAULT 1
                        """))
                    else:
                        try:
                            conn.execute(text("ALTER TABLE orders ADD COLUMN location_id INTEGER DEFAULT 1"))
                        except Exception as e:
                            if "duplicate column" not in str(e).lower():
                                raise

                    conn.commit()
                messages.append("   ✅ Поле location_id добавлено в orders")

                # Обновляем существующие заказы
                with engine.connect() as conn:
                    result = conn.execute(text("UPDATE orders SET location_id = 1 WHERE location_id IS NULL"))
                    conn.commit()
                    updated = result.rowcount
                    if updated > 0:
                        messages.append(f"   ✅ Обновлено заказов: {updated}")

            except Exception as e:
                messages.append(f"   ⚠️  Ошибка с orders: {str(e)}")

            messages.append("✅ МИГРАЦИЯ УСПЕШНО ЗАВЕРШЕНА!")
            messages.append(f"📊 Итого: {len(ingredients)} ингредиентов, {migrated_count} остатков перенесено")

            return {
                "status": "success",
                "messages": messages
            }

        finally:
            db.close()

    except Exception as e:
        messages.append(f"❌ ОШИБКА: {str(e)}")
        import traceback
        messages.append(traceback.format_exc())
        return {
            "status": "error",
            "messages": messages,
            "error": str(e)
        }


@app.post("/api/admin/fix-categorytype-enum")
def fix_categorytype_enum():
    """
    FIX: Добавить 'product' и 'recipe' в ENUM categorytype

    Issue: invalid input value for enum categorytype: "product"
    Error occurs in get_pos_categories when filtering by ['pos', 'product', 'recipe']
    """
    import os

    try:
        messages = []
        database_url = os.getenv('DATABASE_URL', '')
        is_postgres = 'postgresql' in database_url.lower()

        if not is_postgres:
            return {
                "status": "skipped",
                "message": "This fix is only needed for PostgreSQL (SQLite doesn't have strict ENUMs)"
            }

        with engine.connect() as conn:
            # Check current enum values
            messages.append("📋 Checking current categorytype enum values...")
            result = conn.execute(text("""
                SELECT unnest(enum_range(NULL::categorytype)) AS value
            """))
            current_values = [row[0] for row in result]
            messages.append(f"Current values: {', '.join(current_values)}")

            # Add 'product' if missing
            if 'product' not in current_values:
                messages.append("🔧 Adding 'product' to categorytype enum...")
                try:
                    conn.execute(text("ALTER TYPE categorytype ADD VALUE 'product'"))
                    conn.commit()
                    messages.append("✅ Added 'product'")
                except Exception as e:
                    messages.append(f"⚠️ Error adding 'product': {str(e)}")
                    conn.rollback()
            else:
                messages.append("⏭️ 'product' already exists")

            # Add 'recipe' if missing
            if 'recipe' not in current_values:
                messages.append("🔧 Adding 'recipe' to categorytype enum...")
                try:
                    conn.execute(text("ALTER TYPE categorytype ADD VALUE 'recipe'"))
                    conn.commit()
                    messages.append("✅ Added 'recipe'")
                except Exception as e:
                    messages.append(f"⚠️ Error adding 'recipe': {str(e)}")
                    conn.rollback()
            else:
                messages.append("⏭️ 'recipe' already exists")

            # Verify final state
            messages.append("\n✅ Final categorytype enum values:")
            result = conn.execute(text("""
                SELECT unnest(enum_range(NULL::categorytype)) AS value
            """))
            final_values = [row[0] for row in result]
            messages.append(f"Final values: {', '.join(final_values)}")

        return {
            "status": "success",
            "messages": messages
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "messages": messages if 'messages' in locals() else []
        }


@app.post("/api/admin/import-wedrink-menu")
def import_wedrink_menu():
    """
    Импорт меню WeДrink из файла wedrink_menu_data.py

    Создаёт:
    1. Категории (если не существуют)
    2. Все рецепты с размерами в названиях (пустые, без ингредиентов)
    3. Товары с вариантами для выбора размера на кассе
    """
    import re
    from sqlalchemy.orm import sessionmaker
    from app.models import Category, Recipe, Product, ProductVariant, CategoryType

    # Импортируем данные меню
    import sys
    sys.path.append('/Users/Dom/MyPosSystem/backend')
    from scripts.wedrink_menu_data import WEDRINK_MENU

    Session = sessionmaker(bind=engine)
    db = Session()

    stats = {
        "categories_created": 0,
        "recipes_created": 0,
        "products_created": 0,
        "variants_created": 0,
        "errors": []
    }

    try:
        # Шаг 1: Создать категории
        print("📁 Создание категорий...")
        category_map = {}  # {название: category_id}

        unique_categories = list(set(item["category"] for item in WEDRINK_MENU))

        for cat_name in unique_categories:
            existing = db.query(Category).filter(
                Category.name == cat_name,
                Category.type == CategoryType.POS
            ).first()

            if existing:
                category_map[cat_name] = existing.id
            else:
                new_cat = Category(
                    name=cat_name,
                    type=CategoryType.POS,
                    display_order=len(category_map)
                )
                db.add(new_cat)
                db.flush()
                category_map[cat_name] = new_cat.id
                stats["categories_created"] += 1

        db.commit()
        print(f"✅ Категории: создано {stats['categories_created']}, всего {len(category_map)}")

        # Шаг 2: Создать все рецепты
        print("📝 Создание рецептов...")
        recipe_map = {}  # {название: recipe_id}

        for item in WEDRINK_MENU:
            # Проверить существование
            existing = db.query(Recipe).filter(Recipe.name == item["name"]).first()
            if existing:
                recipe_map[item["name"]] = existing.id
                continue

            new_recipe = Recipe(
                name=item["name"],
                price=item["price"],
                category_id=category_map[item["category"]],
                output_weight=500.0,  # Дефолтное значение
                show_in_pos=True
            )
            db.add(new_recipe)
            db.flush()
            recipe_map[item["name"]] = new_recipe.id
            stats["recipes_created"] += 1

        db.commit()
        print(f"✅ Рецепты: создано {stats['recipes_created']}")

        # Шаг 3: Группировка рецептов по базовому названию для создания товаров с вариантами
        print("🔄 Группировка рецептов по размерам...")

        # Паттерн для определения размеров: "название 0.5", "название 0.7", "название (Классический)" и т.д.
        size_pattern = r'(.*?)\s+(0\.\d+|горячий|холодный)$'

        # Группы: {base_name: [(full_name, price, size), ...]}
        recipe_groups = {}
        standalone_recipes = []  # Рецепты без размеров

        for item in WEDRINK_MENU:
            name = item["name"]
            price = item["price"]

            # Попробовать извлечь размер
            match = re.match(size_pattern, name)

            if match:
                base_name = match.group(1).strip()
                size = match.group(2)

                if base_name not in recipe_groups:
                    recipe_groups[base_name] = []

                recipe_groups[base_name].append({
                    "full_name": name,
                    "price": price,
                    "size": size
                })
            else:
                # Рецепт без размера - создаём товар 1:1
                standalone_recipes.append(item)

        print(f"📊 Найдено групп с размерами: {len(recipe_groups)}")
        print(f"📊 Рецептов без размеров: {len(standalone_recipes)}")

        # Шаг 4: Создать товары с вариантами
        print("🛍️ Создание товаров и вариантов...")

        # 4.1 Товары с вариантами (несколько размеров)
        for base_name, variants_data in recipe_groups.items():
            # Проверить существование товара
            existing_product = db.query(Product).filter(Product.name == base_name).first()
            if existing_product:
                print(f"⏭️  Товар '{base_name}' уже существует, пропускаем")
                continue

            # Определить категорию (берём из первого варианта)
            first_variant = variants_data[0]
            first_recipe_name = first_variant["full_name"]
            first_recipe = db.query(Recipe).filter(Recipe.name == first_recipe_name).first()

            if not first_recipe:
                stats["errors"].append(f"Не найден рецепт для {first_recipe_name}")
                continue

            # Определить базовую цену (минимальная среди вариантов)
            base_price = min(v["price"] for v in variants_data)

            # Создать товар
            new_product = Product(
                name=base_name,
                price=base_price,
                category_id=first_recipe.category_id,
                show_in_pos=True,
                is_available=True
            )
            db.add(new_product)
            db.flush()
            stats["products_created"] += 1

            # Создать варианты
            for idx, variant_data in enumerate(sorted(variants_data, key=lambda x: x["price"])):
                recipe = db.query(Recipe).filter(Recipe.name == variant_data["full_name"]).first()

                if not recipe:
                    stats["errors"].append(f"Рецепт не найден: {variant_data['full_name']}")
                    continue

                # Форматировать название размера
                size_display = variant_data["size"]
                if size_display.startswith("0."):
                    size_display = f"{size_display}L"

                variant = ProductVariant(
                    base_product_id=new_product.id,
                    recipe_id=recipe.id,
                    name=size_display,
                    price_adjustment=variant_data["price"] - base_price,
                    display_order=idx,
                    is_default=(idx == 0)  # Первый вариант = дефолтный
                )
                db.add(variant)
                stats["variants_created"] += 1

        # 4.2 Товары без вариантов (1:1 с рецептом)
        for item in standalone_recipes:
            existing_product = db.query(Product).filter(Product.name == item["name"]).first()
            if existing_product:
                continue

            recipe = db.query(Recipe).filter(Recipe.name == item["name"]).first()
            if not recipe:
                stats["errors"].append(f"Рецепт не найден: {item['name']}")
                continue

            new_product = Product(
                name=item["name"],
                price=item["price"],
                category_id=recipe.category_id,
                show_in_pos=True,
                is_available=True
            )
            db.add(new_product)
            stats["products_created"] += 1

        db.commit()

        print(f"✅ Товары: создано {stats['products_created']}")
        print(f"✅ Варианты: создано {stats['variants_created']}")

        return {
            "status": "success",
            "stats": stats,
            "message": f"Импорт завершён: {stats['recipes_created']} рецептов, {stats['products_created']} товаров, {stats['variants_created']} вариантов"
        }

    except Exception as e:
        db.rollback()
        return {
            "status": "error",
            "message": str(e),
            "stats": stats
        }
    finally:
        db.close()


@app.post("/api/admin/fix-all-product-categories")
def fix_all_product_categories():
    """
    Обновить category_id для ВСЕХ товаров (упрощённая версия)
    """
    from sqlalchemy.orm import sessionmaker
    from app.models import Product, ProductVariant, Recipe

    Session = sessionmaker(bind=engine)
    db = Session()

    stats = {
        "total_products": 0,
        "updated_from_variant": 0,
        "updated_from_recipe": 0,
        "skipped_no_recipe": 0,
        "skipped_has_category": 0
    }

    try:
        all_products = db.query(Product).all()
        stats["total_products"] = len(all_products)

        for product in all_products:
            # Пропустить если уже есть категория
            if product.category_id:
                stats["skipped_has_category"] += 1
                continue

            # Попробовать из варианта
            variant = db.query(ProductVariant).filter(
                ProductVariant.base_product_id == product.id
            ).first()

            if variant:
                recipe = db.query(Recipe).filter(Recipe.id == variant.recipe_id).first()
                if recipe and recipe.category_id:
                    product.category_id = recipe.category_id
                    stats["updated_from_variant"] += 1
                    continue

            # Попробовать из рецепта с таким же именем
            recipe = db.query(Recipe).filter(Recipe.name == product.name).first()
            if recipe and recipe.category_id:
                product.category_id = recipe.category_id
                stats["updated_from_recipe"] += 1
            else:
                stats["skipped_no_recipe"] += 1

        db.commit()

        return {
            "status": "success",
            "stats": stats
        }

    except Exception as e:
        db.rollback()
        return {
            "status": "error",
            "message": str(e),
            "stats": stats
        }
    finally:
        db.close()


@app.post("/api/admin/fix-product-categories")
def fix_product_categories():
    """
    Исправить category_id для товаров, созданных при импорте WeДrink

    Логика:
    1. Для товаров с вариантами: берём category_id из рецепта первого варианта
    2. Для товаров без вариантов: ищем рецепт с таким же именем
    """
    from sqlalchemy.orm import sessionmaker
    from app.models import Product, ProductVariant, Recipe

    Session = sessionmaker(bind=engine)
    db = Session()

    stats = {
        "products_updated": 0,
        "products_skipped": 0,
        "errors": []
    }

    try:
        # Получить ВСЕ товары (упрощённая версия для отладки)
        all_products = db.query(Product).filter(Product.show_in_pos == True).all()

        # Фильтр товаров без категории в Python (не в SQL)
        products_without_category = [p for p in all_products if p.category_id is None]

        stats["total_found"] = len(products_without_category)
        stats["total_products"] = len(all_products)
        print(f"📊 Всего товаров: {len(all_products)}, без категории: {len(products_without_category)}")

        for product in products_without_category:
            try:
                category_id = None
                debug_info = {"name": product.name, "id": product.id, "current_category_id": product.category_id}

                # Проверить наличие вариантов
                variants = db.query(ProductVariant).filter(
                    ProductVariant.base_product_id == product.id
                ).all()

                debug_info["variants_count"] = len(variants)

                if variants:
                    # Есть варианты - берём category_id из рецепта первого варианта
                    first_variant = variants[0]
                    recipe = db.query(Recipe).filter(Recipe.id == first_variant.recipe_id).first()
                    if recipe and recipe.category_id:
                        category_id = recipe.category_id
                        debug_info["source"] = "variant"
                        debug_info["recipe_id"] = recipe.id
                        print(f"✅ {product.name}: category_id={category_id} (из варианта {recipe.name})")
                else:
                    # Нет вариантов - ищем рецепт с таким же именем
                    recipe = db.query(Recipe).filter(Recipe.name == product.name).first()
                    if recipe:
                        debug_info["recipe_found"] = True
                        debug_info["recipe_category_id"] = recipe.category_id
                        if recipe.category_id:
                            category_id = recipe.category_id
                            debug_info["source"] = "recipe"
                            print(f"✅ {product.name}: category_id={category_id} (из рецепта)")
                        else:
                            print(f"⚠️  {product.name}: рецепт найден, но category_id=None")
                    else:
                        debug_info["recipe_found"] = False
                        print(f"⚠️  {product.name}: рецепт не найден")

                if category_id:
                    product.category_id = category_id
                    stats["products_updated"] += 1
                else:
                    print(f"⚠️  {product.name}: не найдена категория")
                    stats["products_skipped"] += 1

            except Exception as e:
                error_msg = f"Ошибка для товара {product.name}: {str(e)}"
                print(f"❌ {error_msg}")
                stats["errors"].append(error_msg)

        db.commit()

        return {
            "status": "success",
            "stats": stats,
            "message": f"Обновлено {stats['products_updated']} товаров, пропущено {stats['products_skipped']}"
        }

    except Exception as e:
        db.rollback()
        return {
            "status": "error",
            "message": str(e),
            "stats": stats
        }
    finally:
        db.close()


@app.post("/api/admin/hide-products-without-variants")
def hide_products_without_variants():
    """
    Скрыть с кассы все товары (Products) которые не имеют вариантов (ProductVariants)

    Цель: убрать дубли на кассе. Товары должны существовать только если у них есть варианты размеров.
    Техкарты без вариантов должны показываться напрямую на кассе.

    Не удаляем товары из БД (могут быть в заказах), а просто скрываем с кассы (show_in_pos = False).
    """
    from sqlalchemy.orm import sessionmaker
    from app.models import Product, ProductVariant

    Session = sessionmaker(bind=engine)
    db = Session()

    stats = {
        "total_products": 0,
        "products_without_variants": 0,
        "hidden": 0,
        "already_hidden": 0,
        "errors": []
    }

    try:
        # Получить все товары
        all_products = db.query(Product).all()
        stats["total_products"] = len(all_products)

        products_to_hide = []

        for product in all_products:
            # Проверить есть ли у товара варианты
            variants_count = db.query(ProductVariant).filter(
                ProductVariant.base_product_id == product.id
            ).count()

            if variants_count == 0:
                products_to_hide.append(product)
                stats["products_without_variants"] += 1

        print(f"📊 Найдено товаров без вариантов: {len(products_to_hide)}")

        # Скрываем товары без вариантов с кассы
        for product in products_to_hide:
            try:
                if product.show_in_pos:
                    print(f"🙈 Скрываем товар с кассы: {product.name} (id={product.id})")
                    product.show_in_pos = False
                    stats["hidden"] += 1
                else:
                    print(f"✓  Товар уже скрыт: {product.name} (id={product.id})")
                    stats["already_hidden"] += 1
            except Exception as e:
                error_msg = f"Ошибка при скрытии товара {product.name}: {str(e)}"
                print(f"❌ {error_msg}")
                stats["errors"].append(error_msg)

        db.commit()

        return {
            "status": "success",
            "stats": stats,
            "message": f"Скрыто с кассы {stats['hidden']} товаров без вариантов из {stats['total_products']} всего"
        }

    except Exception as e:
        db.rollback()
        return {
            "status": "error",
            "message": str(e),
            "stats": stats
        }
    finally:
        db.close()


@app.post("/api/admin/hide-all-products")
def hide_all_products():
    """
    Скрыть ВСЕ товары с кассы (даже те, у которых есть варианты)

    Причина: Варианты созданы неполными, это создаёт дубли с техкартами.
    Лучше пока показывать только техкарты напрямую.
    """
    from sqlalchemy.orm import sessionmaker
    from app.models import Product

    Session = sessionmaker(bind=engine)
    db = Session()

    stats = {
        "total_products": 0,
        "hidden": 0,
        "already_hidden": 0
    }

    try:
        all_products = db.query(Product).all()
        stats["total_products"] = len(all_products)

        for product in all_products:
            if product.show_in_pos:
                product.show_in_pos = False
                stats["hidden"] += 1
            else:
                stats["already_hidden"] += 1

        db.commit()

        return {
            "status": "success",
            "stats": stats,
            "message": f"Скрыто {stats['hidden']} товаров. На кассе останутся только техкарты."
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e), "stats": stats}
    finally:
        db.close()


@app.get("/api/admin/check-variants")
def check_variants():
    """Проверить сколько вариантов существует в БД и к каким товарам они привязаны"""
    from sqlalchemy.orm import sessionmaker
    from app.models import Product, ProductVariant

    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        all_variants = db.query(ProductVariant).all()

        variants_data = []
        for variant in all_variants:
            product = db.query(Product).filter(Product.id == variant.base_product_id).first()
            variants_data.append({
                "variant_id": variant.id,
                "variant_name": variant.name,
                "product_id": variant.base_product_id,
                "product_name": product.name if product else "NOT FOUND",
                "recipe_id": variant.recipe_id,
                "price_adjustment": variant.price_adjustment,
                "is_default": variant.is_default
            })

        return {
            "total_variants": len(all_variants),
            "variants": variants_data
        }
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
