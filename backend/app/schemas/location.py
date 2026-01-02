from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class LocationBase(BaseModel):
    """Базовая схема точки"""
    name: str = Field(..., min_length=1, max_length=200, description="Название точки")
    address: Optional[str] = Field(None, max_length=500, description="Адрес")
    phone: Optional[str] = Field(None, max_length=50, description="Телефон")


class LocationCreate(LocationBase):
    """Схема для создания точки"""
    is_active: bool = Field(True, description="Активна ли точка")


class LocationUpdate(BaseModel):
    """Схема для обновления точки"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    address: Optional[str] = Field(None, max_length=500)
    phone: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class LocationResponse(LocationBase):
    """Схема ответа с точкой"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
