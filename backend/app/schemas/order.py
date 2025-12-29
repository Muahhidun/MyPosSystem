from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List, Optional
from datetime import datetime
from ..models.order import PaymentMethod, OrderStatus, ItemType


class OrderItemBase(BaseModel):
    """Позиция в заказе"""
    item_type: ItemType = ItemType.PRODUCT
    product_id: Optional[int] = None
    recipe_id: Optional[int] = None
    quantity: int = Field(..., gt=0)

    @model_validator(mode='after')
    def validate_item_reference(self):
        """Проверка что указан либо product_id либо recipe_id"""
        if self.item_type == ItemType.PRODUCT and not self.product_id:
            raise ValueError('product_id is required for product items')
        if self.item_type == ItemType.RECIPE and not self.recipe_id:
            raise ValueError('recipe_id is required for recipe items')

        return self


class OrderItemResponse(BaseModel):
    """Позиция в заказе (ответ)"""
    id: int
    item_type: ItemType
    product_id: Optional[int] = None
    recipe_id: Optional[int] = None
    item_name: str
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
