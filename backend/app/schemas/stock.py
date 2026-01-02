from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class StockBase(BaseModel):
    """Базовая схема остатков"""
    ingredient_id: int = Field(..., description="ID ингредиента")
    quantity: float = Field(..., ge=0, description="Количество на складе")
    min_stock: float = Field(0, ge=0, description="Минимальный остаток")


class StockCreate(StockBase):
    """Схема для создания/обновления остатков"""
    location_id: int = Field(1, description="ID точки (по умолчанию 1)")


class StockUpdate(BaseModel):
    """Схема для обновления остатков"""
    quantity: Optional[float] = Field(None, ge=0)
    min_stock: Optional[float] = Field(None, ge=0)


class StockAdjust(BaseModel):
    """Схема для корректировки остатков (добавить/вычесть)"""
    adjustment: float = Field(..., description="Изменение количества (+100 или -50)")
    reason: Optional[str] = Field(None, max_length=500, description="Причина корректировки")


class StockResponse(StockBase):
    """Схема ответа с остатками"""
    id: int
    location_id: int
    location_name: Optional[str] = None  # Название точки
    ingredient_name: Optional[str] = None  # Название ингредиента
    ingredient_unit: Optional[str] = None  # Единица измерения
    is_low_stock: bool = False  # Ниже минимального?
    stock_value: float = 0.0  # Стоимость остатка
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StockListItem(BaseModel):
    """Схема для списка остатков (облегченная)"""
    ingredient_id: int
    ingredient_name: str
    unit: str
    quantity: float
    min_stock: float
    is_low_stock: bool
    purchase_price: float
    stock_value: float

    class Config:
        from_attributes = True
