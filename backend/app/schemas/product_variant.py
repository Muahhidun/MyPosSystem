from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProductVariantBase(BaseModel):
    """Базовая схема варианта товара"""
    name: str = Field(..., min_length=1, max_length=100, description="Название варианта (500мл, 700мл)")
    size_code: Optional[str] = Field(None, max_length=10, description="Код размера (S, M, L)")
    recipe_id: int = Field(..., description="ID техкарты для этого размера")
    price_adjustment: float = Field(default=0.0, description="Доплата к базовой цене (+200₸)")
    is_default: bool = Field(default=False, description="Вариант по умолчанию")
    is_active: bool = Field(default=True, description="Активен")
    display_order: int = Field(default=0, description="Порядок отображения")


class ProductVariantCreate(ProductVariantBase):
    """Создание варианта товара"""
    pass


class ProductVariantUpdate(BaseModel):
    """Обновление варианта товара"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    size_code: Optional[str] = Field(None, max_length=10)
    recipe_id: Optional[int] = None
    price_adjustment: Optional[float] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class ProductVariantResponse(ProductVariantBase):
    """Ответ с данными варианта"""
    id: int
    base_product_id: int
    recipe_name: Optional[str] = Field(None, description="Название техкарты")
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
