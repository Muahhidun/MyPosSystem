from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class IngredientBase(BaseModel):
    """Базовые поля ингредиента"""
    name: str = Field(..., min_length=1, max_length=200, description="Название ингредиента")
    category: Optional[str] = Field(None, max_length=100, description="Категория (Молочные, Кофе и т.д.)")
    unit: Literal["кг", "г", "л", "мл", "шт"] = Field(..., description="Единица измерения")
    purchase_price: float = Field(..., ge=0, description="Закупочная цена за единицу")
    packaging_info: Optional[str] = Field(None, description="Информация об упаковке (например: 'Коробка 12шт по 1.2кг')")


class IngredientCreate(IngredientBase):
    """Схема для создания ингредиента (только справочные данные)"""
    pass


class IngredientUpdate(BaseModel):
    """Схема для обновления ингредиента (все поля опциональные)"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, max_length=100)
    unit: Optional[Literal["кг", "г", "л", "мл", "шт"]] = None
    purchase_price: Optional[float] = Field(None, ge=0)
    packaging_info: Optional[str] = None


class IngredientResponse(BaseModel):
    """Схема ответа с ингредиентом"""
    id: int
    name: str
    category: Optional[str]
    unit: str
    purchase_price: float
    packaging_info: Optional[str]
    stock_quantity: float
    min_stock: float
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
