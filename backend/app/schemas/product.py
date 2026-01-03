from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProductBase(BaseModel):
    """Базовая схема товара"""
    name: str = Field(..., min_length=1, max_length=200)
    price: float = Field(..., gt=0)
    category: Optional[str] = None  # DEPRECATED
    category_id: Optional[int] = None  # НОВОЕ
    is_available: bool = True
    show_in_pos: bool = True  # Показывать на кассе
    image_url: Optional[str] = None


class ProductCreate(ProductBase):
    """Создание товара"""
    pass


class ProductUpdate(BaseModel):
    """Обновление товара (все поля опциональные)"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    price: Optional[float] = Field(None, gt=0)
    category: Optional[str] = None
    is_available: Optional[bool] = None
    show_in_pos: Optional[bool] = None
    image_url: Optional[str] = None


class ProductResponse(ProductBase):
    """Ответ с товаром"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
