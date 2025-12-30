from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from ..models.category import CategoryType


class CategoryBase(BaseModel):
    """Базовая схема категории"""
    name: str = Field(..., min_length=1, max_length=100, description="Название категории")
    type: CategoryType = Field(..., description="Тип категории (product/recipe/ingredient/semifinished)")
    color: Optional[str] = Field(None, max_length=7, description="HEX цвет (#FFFFFF)")


class CategoryCreate(CategoryBase):
    """Схема для создания категории"""
    display_order: int = Field(0, ge=0, description="Порядок отображения")
    is_active: bool = Field(True, description="Активна ли категория")


class CategoryUpdate(BaseModel):
    """Схема для обновления категории"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    display_order: Optional[int] = Field(None, ge=0)
    color: Optional[str] = Field(None, max_length=7)
    is_active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    """Схема ответа с категорией"""
    id: int
    display_order: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
