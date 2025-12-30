-- Миграция: добавление недостающих колонок в таблицу order_items
-- Дата: 2025-12-30

-- Добавляем колонку item_name (название товара/техкарты)
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS item_name VARCHAR NOT NULL DEFAULT '';

-- Добавляем колонку quantity (количество)
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

-- Добавляем колонку price (цена на момент продажи)
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS price DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Добавляем колонку subtotal (сумма = quantity * price)
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS subtotal DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Убираем временный DEFAULT для item_name (после добавления колонки)
ALTER TABLE order_items
ALTER COLUMN item_name DROP DEFAULT;

-- Проверяем результат
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;
