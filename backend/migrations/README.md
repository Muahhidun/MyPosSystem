# Database Migrations

This directory contains database migration scripts for the MyPOS system.

## How to Run Migrations

### Prerequisites

1. Set the `DATABASE_URL` environment variable:

```bash
# For PostgreSQL (production)
export DATABASE_URL="postgresql://user:password@host:port/database"

# For SQLite (local development)
export DATABASE_URL="sqlite:///./mypos.db"
```

2. Make sure you're in the backend directory:

```bash
cd /Users/Dom/MyPosSystem/backend
```

### Running Migrations

**Migration 001: Create categories table**

This migration creates the `categories` table and adds `category_id` and `display_order` columns to all entity tables (products, recipes, ingredients, semifinished).

```bash
python3 migrations/001_create_categories.py
```

**Migration 002: Migrate category data**

This migration migrates existing category string values into the new `categories` table and updates all `category_id` foreign keys.

```bash
python3 migrations/002_migrate_category_data.py
```

### Migration Order

⚠️ **IMPORTANT**: Migrations must be run in order:

1. `001_create_categories.py` - Creates schema
2. `002_migrate_category_data.py` - Migrates data

### What Each Migration Does

#### 001_create_categories.py

- Creates `categories` table with columns: id, name, type, display_order, color, is_active
- Adds `category_id` (integer, foreign key) to: products, recipes, ingredients, semifinished
- Adds `display_order` (integer) to: products, recipes, ingredients, semifinished
- Creates indexes for better query performance
- Adds foreign key constraints (PostgreSQL only)

#### 002_migrate_category_data.py

- Extracts DISTINCT category names from existing data
- Creates Category records for each unique category
- Updates `category_id` in all entity tables based on old `category` text field
- Preserves old `category` field (marked as DEPRECATED in models)

### After Migration

1. Test the API endpoints:
   - `GET /api/categories` - List all categories
   - `GET /api/categories?type=product` - Filter by type
   - `POST /api/categories` - Create new category

2. Verify data integrity:
   ```bash
   # Connect to your database and run:
   SELECT COUNT(*) FROM categories;
   SELECT COUNT(*) FROM products WHERE category_id IS NOT NULL;
   ```

3. Test the frontend when it's ready

### Rollback (if needed)

⚠️ **WARNING**: These operations are destructive!

To rollback migrations, you'll need to:

1. Drop foreign key constraints (PostgreSQL):
   ```sql
   ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_category;
   ALTER TABLE recipes DROP CONSTRAINT IF EXISTS fk_recipes_category;
   ALTER TABLE ingredients DROP CONSTRAINT IF EXISTS fk_ingredients_category;
   ALTER TABLE semifinished DROP CONSTRAINT IF EXISTS fk_semifinished_category;
   ```

2. Drop columns:
   ```sql
   ALTER TABLE products DROP COLUMN IF EXISTS category_id, DROP COLUMN IF EXISTS display_order;
   ALTER TABLE recipes DROP COLUMN IF EXISTS category_id, DROP COLUMN IF EXISTS display_order;
   ALTER TABLE ingredients DROP COLUMN IF EXISTS category_id, DROP COLUMN IF EXISTS display_order;
   ALTER TABLE semifinished DROP COLUMN IF EXISTS category_id, DROP COLUMN IF EXISTS display_order;
   ```

3. Drop categories table:
   ```sql
   DROP TABLE IF EXISTS categories;
   ```

### Backup Recommendation

Before running migrations on production:

```bash
# PostgreSQL backup
pg_dump -U username -h host database_name > backup_before_migration.sql

# SQLite backup
cp mypos.db mypos_backup_$(date +%Y%m%d).db
```

### Troubleshooting

**Error: "DATABASE_URL not set"**
- Make sure to export DATABASE_URL before running migrations

**Error: "Table already exists"**
- Migrations use `IF NOT EXISTS` and `IF NOT EXISTS` clauses, so they should be safe to re-run
- If you need to completely reset, use the rollback steps above

**Error: "Foreign key constraint violation"**
- This shouldn't happen as we use `ON DELETE SET NULL`
- Check if there are orphaned records in your database

### Future Migrations

When creating new migrations:
1. Name them sequentially: `003_xxx.py`, `004_xxx.py`
2. Make them executable: `chmod +x migrations/003_xxx.py`
3. Document what they do in this README
4. Always test on a backup first!
