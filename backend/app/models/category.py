from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..db import Base


class CategoryType(str, enum.Enum):
    """Типы категорий для разных сущностей"""
    PRODUCT = "product"
    RECIPE = "recipe"
    INGREDIENT = "ingredient"
    SEMIFINISHED = "semifinished"


class Category(Base):
    """
    Категория для товаров/техкарт/ингредиентов/полуфабрикатов

    Примеры:
    - Категория товаров: "Напитки", "Закуски"
    - Категория техкарт: "Пиццы", "Бургеры"
    - Категория ингредиентов: "Молочные", "Кофе"
    """
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    type = Column(Enum(CategoryType), nullable=False)
    display_order = Column(Integer, nullable=False, default=0)  # Для сортировки на кассе
    color = Column(String, nullable=True)  # HEX цвет для UI (опционально)
    is_active = Column(Boolean, default=True)  # Показывать категорию

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    products = relationship("Product", back_populates="category_rel")
    recipes = relationship("Recipe", back_populates="category_rel")
    ingredients = relationship("Ingredient", back_populates="category_rel")
    semifinished_items = relationship("Semifinished", back_populates="category_rel")

    def __repr__(self):
        return f"<Category {self.name} ({self.type})>"
