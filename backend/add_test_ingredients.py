import requests

API_URL = "http://localhost:8000/api/ingredients"

ingredients = [
    {"name": "Молоко", "category": "Молочные продукты", "unit": "л", "packaging_info": "1л", "purchase_price": 500.0, "stock_quantity": 10.0, "min_stock": 5.0},
    {"name": "Сахар", "category": "Сыпучие", "unit": "кг", "packaging_info": "1кг", "purchase_price": 300.0, "stock_quantity": 20.0, "min_stock": 10.0},
    {"name": "Мука", "category": "Сыпучие", "unit": "кг", "packaging_info": "1кг", "purchase_price": 200.0, "stock_quantity": 15.0, "min_stock": 8.0},
    {"name": "Яйца", "category": "Молочные продукты", "unit": "шт", "packaging_info": "10шт", "purchase_price": 50.0, "stock_quantity": 100.0, "min_stock": 30.0},
    {"name": "Ванильный сироп", "category": "Сиропы", "unit": "л", "packaging_info": "1л", "purchase_price": 1200.0, "stock_quantity": 5.0, "min_stock": 2.0},
    {"name": "Кофейные зерна", "category": "Напитки", "unit": "кг", "packaging_info": "1кг", "purchase_price": 3000.0, "stock_quantity": 8.0, "min_stock": 3.0},
    {"name": "Сливки", "category": "Молочные продукты", "unit": "л", "packaging_info": "1л", "purchase_price": 800.0, "stock_quantity": 6.0, "min_stock": 3.0},
]

print(f"🚀 Добавляю {len(ingredients)} тестовых ингредиентов...\n")

success_count = 0
error_count = 0

for ing in ingredients:
    try:
        response = requests.post(API_URL, json=ing)
        if response.status_code == 201:
            print(f"✅ {ing['name']} - добавлен")
            success_count += 1
        else:
            print(f"❌ {ing['name']} - Ошибка {response.status_code}: {response.text}")
            error_count += 1
    except Exception as e:
        print(f"❌ {ing['name']} - Исключение: {str(e)}")
        error_count += 1

print(f"\n✅ Успешно: {success_count}")
print(f"❌ Ошибок: {error_count}")
