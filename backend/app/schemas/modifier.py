from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from ..models.modifier import ModifierSelectionType


# ============= Modifier =============

class ModifierBase(BaseModel):
    """Базовая схема модификации"""
    name: str = Field(..., min_length=1, max_length=100, description="Название (Тапиока черная)")
    price: float = Field(default=0.0, description="Цена (+200₸)")
    ingredient_id: Optional[int] = Field(None, description="ID ингредиента для списания")
    quantity_per_use: float = Field(default=0.0, description="Граммы на порцию")
    display_order: int = Field(default=0)
    is_available: bool = Field(default=True)


class ModifierCreate(ModifierBase):
    """Создание модификации"""
    pass


class ModifierUpdate(BaseModel):
    """Обновление модификации"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[float] = None
    ingredient_id: Optional[int] = None
    quantity_per_use: Optional[float] = None
    display_order: Optional[int] = None
    is_available: Optional[bool] = None


class ModifierResponse(ModifierBase):
    """Ответ с данными модификации"""
    id: int
    group_id: int
    ingredient_name: Optional[str] = Field(None, description="Название ингредиента")
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============= ModifierGroup =============

class ModifierGroupBase(BaseModel):
    """Базовая схема группы модификаций"""
    name: str = Field(..., min_length=1, max_length=100, description="Название группы (Топпинги)")
    selection_type: ModifierSelectionType = Field(default=ModifierSelectionType.MULTIPLE)
    min_selections: int = Field(default=0, ge=0, description="Минимум выборов")
    max_selections: Optional[int] = Field(None, ge=1, description="Максимум выборов (None = без ограничений)")
    is_required: bool = Field(default=False, description="Обязательно выбрать")
    display_order: int = Field(default=0)
    is_active: bool = Field(default=True)


class ModifierGroupCreate(ModifierGroupBase):
    """Создание группы модификаций"""
    modifiers: List[ModifierCreate] = Field(default=[], description="Модификации в группе")


class ModifierGroupUpdate(BaseModel):
    """Обновление группы модификаций"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    selection_type: Optional[ModifierSelectionType] = None
    min_selections: Optional[int] = Field(None, ge=0)
    max_selections: Optional[int] = Field(None, ge=1)
    is_required: Optional[bool] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class ModifierGroupResponse(ModifierGroupBase):
    """Ответ с данными группы"""
    id: int
    modifiers: List[ModifierResponse] = Field(default=[], description="Модификации в группе")
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============= ProductModifierGroup =============

class ProductModifierGroupCreate(BaseModel):
    """Привязка группы модификаций к товару"""
    modifier_group_id: int
    display_order: int = Field(default=0)


class ProductModifierGroupResponse(BaseModel):
    """Группа модификаций привязанная к товару"""
    id: int
    product_id: int
    modifier_group_id: int
    modifier_group: ModifierGroupResponse
    display_order: int

    class Config:
        from_attributes = True
