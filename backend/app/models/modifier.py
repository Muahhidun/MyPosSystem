from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..db import Base


class ModifierSelectionType(str, enum.Enum):
    """Тип выбора модификаторов"""
    SINGLE = "single"      # Один выбор (например, размер льда)
    MULTIPLE = "multiple"  # Несколько выборов (например, топпинги)


class ModifierGroup(Base):
    """
    Группа модификаций

    Пример:
    - Название: "Топпинги"
    - Тип: множественный выбор
    - Мин: 0, Макс: 3
    - Содержит: Тапиока черная, Желе личи, и т.д.
    """
    __tablename__ = "modifier_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # "Топпинги", "Сиропы", "Лёд"
    selection_type = Column(Enum(ModifierSelectionType), default=ModifierSelectionType.MULTIPLE)
    min_selections = Column(Integer, default=0)  # Минимум выборов
    max_selections = Column(Integer, nullable=True)  # Максимум выборов (None = без ограничений)
    is_required = Column(Boolean, default=False)  # Обязательно выбрать
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    modifiers = relationship("Modifier", back_populates="group", cascade="all, delete-orphan")
    product_links = relationship("ProductModifierGroup", back_populates="modifier_group", cascade="all, delete-orphan")


class Modifier(Base):
    """
    Модификация (добавка)

    Пример:
    - Название: "Тапиока черная"
    - Цена: +200₸
    - Ингредиент: ID 45 (для списания со склада)
    - Количество: 50г на порцию
    """
    __tablename__ = "modifiers"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("modifier_groups.id", ondelete="CASCADE"), nullable=False)

    name = Column(String, nullable=False)  # "Тапиока черная"
    price = Column(Float, default=0.0)  # +200₸
    ingredient_id = Column(Integer, ForeignKey("ingredients.id", ondelete="SET NULL"), nullable=True)
    quantity_per_use = Column(Float, default=0.0)  # Граммы для списания со склада
    display_order = Column(Integer, default=0)
    is_available = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    group = relationship("ModifierGroup", back_populates="modifiers")
    ingredient = relationship("Ingredient")


class ProductModifierGroup(Base):
    """
    Связь: какие группы модификаций доступны для товара

    Пример:
    - Товар: Bubble Tea
    - Доступные группы: Топпинги, Сиропы, Лёд
    """
    __tablename__ = "product_modifier_groups"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    modifier_group_id = Column(Integer, ForeignKey("modifier_groups.id", ondelete="CASCADE"), nullable=False)
    display_order = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    product = relationship("Product", back_populates="modifier_groups")
    modifier_group = relationship("ModifierGroup", back_populates="product_links")
