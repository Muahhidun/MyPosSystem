from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from ..models.order import PaymentMethod, OrderStatus


class OrderItemBase(BaseModel):
    """Позиция в заказе"""
    product_id: int
    quantity: int = Field(..., gt=0)


class OrderItemResponse(BaseModel):
    """Позиция в заказе (ответ)"""
    id: int
    product_id: int
    product_name: str
    quantity: int
    price: float
    subtotal: float

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    """Создание заказа"""
    items: List[OrderItemBase] = Field(..., min_length=1)
    payment_method: PaymentMethod


class OrderResponse(BaseModel):
    """Ответ с заказом"""
    id: int
    order_number: str
    total_amount: float
    payment_method: PaymentMethod
    status: OrderStatus
    items: List[dict]  # JSON с товарами
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderStats(BaseModel):
    """Статистика за период"""
    total_orders: int
    total_revenue: float
    cash_revenue: float
    card_revenue: float
    top_products: List[dict]
