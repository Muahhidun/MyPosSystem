-- Миграция: добавление колонки show_in_pos в таблицу products
-- Дата: 2025-12-29
-- Причина: колонка есть в модели SQLAlchemy, но отсутствует в production БД

ALTER TABLE products
ADD COLUMN IF NOT EXISTS show_in_pos BOOLEAN DEFAULT TRUE;

-- Проверка
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
