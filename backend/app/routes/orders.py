from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List
from datetime import datetime, date
from ..db import get_db
from ..models import Order, OrderItem, Product, Recipe, OrderStatus, ItemType
from ..schemas import OrderCreate, OrderResponse, OrderStats
import uuid
import asyncio

router = APIRouter(prefix="/orders", tags=["orders"])


def generate_order_number() -> str:
    """Генерация уникального номера заказа"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    random_part = str(uuid.uuid4())[:4].upper()
    return f"ORD-{timestamp}-{random_part}"


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    """Создать новый заказ"""
    # Проверяем наличие товаров/техкарт и считаем сумму
    order_items_data = []
    total_amount = 0.0

    for item in order_data.items:
        item_name = ""
        item_price = 0.0
        product_id = None
        recipe_id = None

        if item.item_type == ItemType.PRODUCT:
            # Обработка товара
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with id {item.product_id} not found"
                )

            if not product.is_available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product '{product.name}' is not available"
                )

            item_name = product.name
            item_price = product.price
            product_id = product.id

        elif item.item_type == ItemType.RECIPE:
            # Обработка техкарты
            recipe = db.query(Recipe).filter(Recipe.id == item.recipe_id).first()
            if not recipe:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Recipe with id {item.recipe_id} not found"
                )

            item_name = recipe.name
            item_price = recipe.price
            recipe_id = recipe.id

        subtotal = item_price * item.quantity
        total_amount += subtotal

        order_items_data.append({
            "item_type": item.item_type,
            "product_id": product_id,
            "recipe_id": recipe_id,
            "item_name": item_name,
            "quantity": item.quantity,
            "price": item_price,
            "subtotal": subtotal
        })

    # Создаем заказ
    db_order = Order(
        order_number=generate_order_number(),
        total_amount=total_amount,
        payment_method=order_data.payment_method,
        status=OrderStatus.PAID,
        items=order_items_data
    )
    db.add(db_order)
    db.flush()  # Чтобы получить ID заказа

    # Создаем записи OrderItem
    for item_data in order_items_data:
        order_item = OrderItem(
            order_id=db_order.id,
            **item_data
        )
        db.add(order_item)

    db.commit()
    db.refresh(db_order)

    # Broadcast новый заказ на кухню через WebSocket
    from .websocket import manager
    await manager.broadcast({
        "type": "new_order",
        "order": {
            "id": db_order.id,
            "order_number": db_order.order_number,
            "total_amount": db_order.total_amount,
            "payment_method": db_order.payment_method.value,
            "status": db_order.status.value,
            "items": [
                {
                    "item_name": item["item_name"],
                    "quantity": item["quantity"],
                    "price": item["price"]
                }
                for item in order_items_data
            ],
            "created_at": db_order.created_at.isoformat()
        }
    })

    return db_order


@router.get("", response_model=List[OrderResponse])
def get_orders(
    skip: int = 0,
    limit: int = 100,
    status_filter: OrderStatus = None,
    db: Session = Depends(get_db)
):
    """Получить список заказов"""
    query = db.query(Order).order_by(desc(Order.created_at))

    if status_filter:
        query = query.filter(Order.status == status_filter)

    orders = query.offset(skip).limit(limit).all()
    return orders


@router.get("/today", response_model=List[OrderResponse])
def get_today_orders(db: Session = Depends(get_db)):
    """Получить заказы за сегодня"""
    today = date.today()
    orders = db.query(Order).filter(
        func.date(Order.created_at) == today
    ).order_by(desc(Order.created_at)).all()
    return orders


@router.get("/stats/today", response_model=OrderStats)
def get_today_stats(db: Session = Depends(get_db)):
    """Статистика за сегодня"""
    today = date.today()

    # Заказы за сегодня
    today_orders = db.query(Order).filter(
        func.date(Order.created_at) == today,
        Order.status == OrderStatus.PAID
    ).all()

    total_orders = len(today_orders)
    total_revenue = sum(order.total_amount for order in today_orders)
    cash_revenue = sum(
        order.total_amount for order in today_orders
        if order.payment_method.value == "cash"
    )
    card_revenue = sum(
        order.total_amount for order in today_orders
        if order.payment_method.value == "card"
    )

    # Топ товаров/техкарт
    product_sales = {}
    for order in today_orders:
        for item in order.items:
            # Поддержка старых заказов (product_name) и новых (item_name)
            item_name = item.get("item_name") or item.get("product_name", "Unknown")
            if item_name not in product_sales:
                product_sales[item_name] = {
                    "name": item_name,
                    "quantity": 0,
                    "revenue": 0.0
                }
            product_sales[item_name]["quantity"] += item["quantity"]
            product_sales[item_name]["revenue"] += item["subtotal"]

    top_products = sorted(
        product_sales.values(),
        key=lambda x: x["revenue"],
        reverse=True
    )[:10]

    return OrderStats(
        total_orders=total_orders,
        total_revenue=total_revenue,
        cash_revenue=cash_revenue,
        card_revenue=card_revenue,
        top_products=top_products
    )


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Получить заказ по ID"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found"
        )
    return order
