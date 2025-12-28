from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# RecipeIngredient schemas
class RecipeIngredientBase(BaseModel):
    ingredient_id: int = Field(..., description="ID ингредиента")
    gross_weight: float = Field(..., gt=0, description="Брутто (вес до обработки)")
    net_weight: float = Field(..., gt=0, description="Нетто (вес в готовом блюде)")
    cooking_method: Optional[str] = Field(None, max_length=200, description="Метод приготовления")
    is_cleaned: bool = Field(False, description="Требуется очистка")


class RecipeIngredientCreate(RecipeIngredientBase):
    pass


class RecipeIngredientResponse(RecipeIngredientBase):
    id: int
    recipe_id: int
    ingredient_name: str  # Название ингредиента (из joined данных)
    ingredient_unit: str  # Единица измерения
    cost: float  # Стоимость этого ингредиента в рецепте

    class Config:
        from_attributes = True


# Recipe schemas
class RecipeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    category: Optional[str] = Field(None, max_length=100)
    output_weight: float = Field(..., ge=0, description="Выход готового блюда (г/мл)")
    price: float = Field(..., ge=0, description="Цена продажи")
    is_weight_based: bool = Field(False, description="Весовое блюдо")
    exclude_from_discounts: bool = Field(False, description="Не участвует в скидках")
    image_url: Optional[str] = Field(None, max_length=500)


class RecipeCreate(RecipeBase):
    ingredients: List[RecipeIngredientCreate] = Field(default_factory=list, description="Состав техкарты")


class RecipeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, max_length=100)
    output_weight: Optional[float] = Field(None, ge=0)
    price: Optional[float] = Field(None, ge=0)
    is_weight_based: Optional[bool] = None
    exclude_from_discounts: Optional[bool] = None
    image_url: Optional[str] = Field(None, max_length=500)
    ingredients: Optional[List[RecipeIngredientCreate]] = None


class RecipeResponse(RecipeBase):
    id: int
    ingredients: List[RecipeIngredientResponse] = []
    cost: float  # Себестоимость (сумма стоимостей ингредиентов)
    markup_percentage: float  # Наценка %
    profit: float  # Прибыль с порции
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class RecipeListItem(BaseModel):
    """Упрощённая схема для списка техкарт (без ингредиентов)"""
    id: int
    name: str
    category: Optional[str]
    output_weight: float
    price: float
    cost: float
    markup_percentage: float
    is_weight_based: bool
    exclude_from_discounts: bool
    image_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
