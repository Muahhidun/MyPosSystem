from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# Ингредиент в полуфабрикате
class SemifinishedIngredientCreate(BaseModel):
    ingredient_id: int
    weight: float = Field(..., gt=0, description="Вес в граммах")


class SemifinishedIngredientResponse(BaseModel):
    id: int
    semifinished_id: int
    ingredient_id: int
    ingredient_name: str  # Будет добавлено при обогащении
    ingredient_unit: str
    weight: float
    cost: float  # Расчётное поле

    class Config:
        from_attributes = True


# Полуфабрикат
class SemifinishedBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    category: Optional[str] = None
    unit: str = Field(default="гр", description="Единица измерения")
    output_quantity: float = Field(default=100.0, gt=0, description="Выход полуфабриката в граммах/мл")


class SemifinishedCreate(SemifinishedBase):
    ingredients: List[SemifinishedIngredientCreate] = Field(default_factory=list)


class SemifinishedUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = None
    unit: Optional[str] = None
    output_quantity: Optional[float] = Field(None, gt=0)
    ingredients: Optional[List[SemifinishedIngredientCreate]] = None


class SemifinishedListItem(SemifinishedBase):
    """Полуфабрикат в списке (без детализации ингредиентов)"""
    id: int
    cost: float  # Себестоимость (computed)
    created_at: datetime

    class Config:
        from_attributes = True


class SemifinishedResponse(SemifinishedBase):
    """Полная информация о полуфабрикате"""
    id: int
    ingredients: List[SemifinishedIngredientResponse]
    cost: float  # Себестоимость (computed)
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
