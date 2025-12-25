# API Руководство - My POS System

## Базовый URL
```
http://localhost:8000
```

## Документация API
FastAPI автоматически генерирует интерактивную документацию:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Товары (Products)

### Получить список товаров
```http
GET /api/products
```

Параметры запроса:
- `skip` - пропустить N товаров (для пагинации)
- `limit` - максимум товаров в ответе (по умолчанию 100)
- `category` - фильтр по категории
- `available_only` - только доступные товары (true/false)

Пример:
```bash
curl http://localhost:8000/api/products?available_only=true
```

### Получить товар по ID
```http
GET /api/products/{product_id}
```

### Создать товар
```http
POST /api/products
Content-Type: application/json

{
  "name": "Латте",
  "price": 450.0,
  "category": "Напитки",
  "is_available": true
}
```

Пример:
```bash
curl -X POST http://localhost:8000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Латте","price":450.0,"category":"Напитки"}'
```

### Обновить товар
```http
PUT /api/products/{product_id}
Content-Type: application/json

{
  "price": 500.0
}
```

### Удалить товар
```http
DELETE /api/products/{product_id}
```

### Получить список категорий
```http
GET /api/products/categories/list
```

---

## Заказы (Orders)

### Создать заказ
```http
POST /api/orders
Content-Type: application/json

{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 3,
      "quantity": 1
    }
  ],
  "payment_method": "cash"
}
```

`payment_method` может быть: `cash` (наличные) или `card` (безнал)

Пример:
```bash
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"product_id": 1, "quantity": 2}],
    "payment_method": "cash"
  }'
```

### Получить список заказов
```http
GET /api/orders
```

Параметры:
- `skip` - пропустить N заказов
- `limit` - максимум заказов в ответе
- `status_filter` - фильтр по статусу (pending/paid/cancelled)

### Получить заказы за сегодня
```http
GET /api/orders/today
```

### Получить статистику за сегодня
```http
GET /api/orders/stats/today
```

Возвращает:
- Количество заказов
- Общая выручка
- Выручка наличными
- Выручка безналом
- Топ товаров по продажам

### Получить заказ по ID
```http
GET /api/orders/{order_id}
```

---

## Health Check

### Проверить работу API
```http
GET /api/health
```

---

## Примеры использования

### 1. Добавить товары в меню
```bash
# Добавить Латте
curl -X POST http://localhost:8000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Латте","price":450,"category":"Напитки"}'

# Добавить Круассан
curl -X POST http://localhost:8000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Круассан","price":300,"category":"Выпечка"}'
```

### 2. Создать заказ
```bash
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"product_id": 1, "quantity": 1},
      {"product_id": 2, "quantity": 2}
    ],
    "payment_method": "card"
  }'
```

### 3. Посмотреть статистику
```bash
curl http://localhost:8000/api/orders/stats/today
```

---

## Коды ответов

- `200 OK` - запрос выполнен успешно
- `201 Created` - ресурс создан
- `204 No Content` - ресурс удален
- `400 Bad Request` - ошибка в запросе
- `404 Not Found` - ресурс не найден
- `422 Unprocessable Entity` - ошибка валидации данных
- `500 Internal Server Error` - ошибка сервера
