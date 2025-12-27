from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class IngredientBase(BaseModel):
    """Базовые поля ингредиента"""
    name: str = Field(..., min_length=1, max_length=200, description="Название ингредиента")
    category: Optional[str] = Field(None, max_length=100, description="Категория (Молочные, Кофе и т.д.)")
    unit: str = Field(..., description="Единица измерения (кг, л, шт, г, мл)")
    purchase_price: float = Field(..., ge=0, description="Закупочная цена за единицу")
    stock_quantity: float = Field(default=0.0, ge=0, description="Текущий остаток")
    min_stock: float = Field(default=0.0, ge=0, description="Минимальный остаток для предупреждения")


class IngredientCreate(IngredientBase):
    """Схема для создания ингредиента"""
    pass


class IngredientUpdate(BaseModel):
    """Схема для обновления ингредиента (все поля опциональные)"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, max_length=100)
    unit: Optional[str] = None
    purchase_price: Optional[float] = Field(None, ge=0)
    stock_quantity: Optional[float] = Field(None, ge=0)
    min_stock: Optional[float] = Field(None, ge=0)


class IngredientResponse(IngredientBase):
    """Схема ответа с ингредиентом"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_low_stock: bool = Field(description="Остаток ниже минимального?")
    stock_value: float = Field(description="Стоимость текущего остатка")

    class Config:
        from_attributes = True


class IngredientStockUpdate(BaseModel):
    """Схема для обновления остатка (приход/расход)"""
    quantity: float = Field(..., description="Количество (положительное для прихода, отрицательное для расхода)")
    reason: Optional[str] = Field(None, description="Причина изменения (закупка, списание, инвентаризация)")
