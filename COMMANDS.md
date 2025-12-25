# Шпаргалка команд - My POS System

## Запуск системы

### Вариант 1: Используя скрипт (рекомендуется)

**Terminal 1 - Backend:**
```bash
cd /Users/Dom/MyPosSystem/backend
./start.sh
```

**Terminal 2 - Frontend:**
```bash
cd /Users/Dom/MyPosSystem/frontend
npm run dev
```

### Вариант 2: Вручную

**Terminal 1 - Backend:**
```bash
cd /Users/Dom/MyPosSystem/backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd /Users/Dom/MyPosSystem/frontend
npm run dev
```

---

## Полезные команды

### Git

```bash
# Статус изменений
git status

# Добавить все изменения
git add .

# Создать коммит
git commit -m "Описание изменений"

# Посмотреть историю
git log --oneline

# Создать ветку
git checkout -b feature/название-фичи

# Переключиться на main
git checkout main
```

### Backend

```bash
# Установить зависимости
pip install -r requirements.txt

# Добавить новую зависимость
pip install название_пакета
pip freeze > requirements.txt

# Проверить API
curl http://localhost:8000/api/health

# Посмотреть все товары
curl http://localhost:8000/api/products

# Создать товар
curl -X POST http://localhost:8000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Тестовый товар","price":100}'

# Очистить базу данных
rm backend/mypos.db
# (Перезапустите backend - создастся новая БД)
```

### Frontend

```bash
# Установить зависимости
npm install

# Запустить dev сервер
npm run dev

# Собрать для продакшн
npm run build

# Превью продакшн сборки
npm run preview

# Добавить новую зависимость
npm install название-пакета
```

---

## Открыть в браузере

```bash
# Касса (для кассира)
open http://localhost:5173

# Админка (управление товарами)
open http://localhost:5173/admin

# Дашборд (статистика)
open http://localhost:5173/dashboard

# API документация
open http://localhost:8000/docs
```

---

## Тестирование API через curl

### Товары

```bash
# Получить все товары
curl http://localhost:8000/api/products

# Получить товар по ID
curl http://localhost:8000/api/products/1

# Создать товар
curl -X POST http://localhost:8000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Капучино",
    "price": 400,
    "category": "Напитки",
    "is_available": true
  }'

# Обновить цену товара
curl -X PUT http://localhost:8000/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{"price": 500}'

# Удалить товар
curl -X DELETE http://localhost:8000/api/products/1
```

### Заказы

```bash
# Создать заказ
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"product_id": 1, "quantity": 2},
      {"product_id": 2, "quantity": 1}
    ],
    "payment_method": "cash"
  }'

# Получить заказы за сегодня
curl http://localhost:8000/api/orders/today

# Получить статистику за сегодня
curl http://localhost:8000/api/orders/stats/today
```

---

## Устранение проблем

### Backend

```bash
# Проверить, запущен ли backend
curl http://localhost:8000/api/health

# Если не запускается - переустановить зависимости
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Проверить логи
# (Смотрите в терминале, где запущен backend)
```

### Frontend

```bash
# Проверить, запущен ли frontend
curl http://localhost:5173

# Переустановить зависимости
cd frontend
rm -rf node_modules package-lock.json
npm install

# Очистить кэш
rm -rf node_modules/.vite
```

### База данных

```bash
# Пересоздать базу данных
cd backend
rm mypos.db
# Перезапустите backend
```

---

## Работа с GitHub (когда настроите)

```bash
# Создать репозиторий на GitHub, затем:
git remote add origin https://github.com/ваш-username/my-pos-system.git

# Отправить код
git push -u origin main

# Обновить код с GitHub
git pull origin main

# Клонировать на другой машине
git clone https://github.com/ваш-username/my-pos-system.git
cd my-pos-system
cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && cd ..
cd frontend && npm install && cd ..
```

---

## Production деплой (пример для Railway)

```bash
# Backend на Railway
railway login
railway init
railway up

# Frontend на Vercel
npm install -g vercel
cd frontend
vercel

# Или можно задеплоить весь проект на Railway
```

---

## VS Code - Открыть проект

```bash
# Открыть проект в VS Code
cd /Users/Dom/MyPosSystem
code .
```

Рекомендуемые расширения для VS Code:
- Python
- ESLint
- Prettier
- Tailwind CSS IntelliSense

---

## Мониторинг в реальном времени

```bash
# Следить за логами backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --log-level debug

# Следить за логами frontend
cd frontend
npm run dev -- --debug
```

---

## Бэкап базы данных

```bash
# Создать копию БД
cp backend/mypos.db backend/mypos_backup_$(date +%Y%m%d_%H%M%S).db

# Восстановить из копии
cp backend/mypos_backup_YYYYMMDD_HHMMSS.db backend/mypos.db
```

---

## Быстрый рестарт всего

```bash
# Остановить все (Ctrl+C в обоих терминалах)
# Затем:

# Terminal 1
cd /Users/Dom/MyPosSystem/backend && ./start.sh

# Terminal 2
cd /Users/Dom/MyPosSystem/frontend && npm run dev
```
