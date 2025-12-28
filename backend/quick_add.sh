#!/bin/bash

curl -X POST http://localhost:8000/api/ingredients -H "Content-Type: application/json" -d '{"name":"Молоко","category":"Молочные продукты","unit":"л","packaging_info":"1л","purchase_price":500.0,"stock_quantity":10.0,"min_stock":5.0}'

curl -X POST http://localhost:8000/api/ingredients -H "Content-Type: application/json" -d '{"name":"Сахар","category":"Сыпучие","unit":"кг","packaging_info":"1кг","purchase_price":300.0,"stock_quantity":20.0,"min_stock":10.0}'

curl -X POST http://localhost:8000/api/ingredients -H "Content-Type: application/json" -d '{"name":"Мука","category":"Сыпучие","unit":"кг","packaging_info":"1кг","purchase_price":200.0,"stock_quantity":15.0,"min_stock":8.0}'

curl -X POST http://localhost:8000/api/ingredients -H "Content-Type: application/json" -d '{"name":"Яйца","category":"Молочные продукты","unit":"шт","packaging_info":"10шт","purchase_price":50.0,"stock_quantity":100.0,"min_stock":30.0}'

curl -X POST http://localhost:8000/api/ingredients -H "Content-Type: application/json" -d '{"name":"Ванильный сироп","category":"Сиропы","unit":"л","packaging_info":"1л","purchase_price":1200.0,"stock_quantity":5.0,"min_stock":2.0}'

echo "Done!"
