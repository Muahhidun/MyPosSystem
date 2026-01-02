-- Добавить значение 'pos' в ENUM categorytype
-- PostgreSQL требует явного добавления новых значений в ENUM

-- Добавляем новое значение 'pos' в начало списка
ALTER TYPE categorytype ADD VALUE IF NOT EXISTS 'pos' BEFORE 'product';

-- Если вышеук команда не сработала (старая версия PostgreSQL), используем альтернативный метод:
-- ALTER TYPE categorytype ADD VALUE 'pos';
