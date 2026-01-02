from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db import Base


class Stock(Base):
    """
    Модель остатков ингредиента на конкретной точке

    Один ингредиент может иметь разные остатки на разных точках:
    - Молоко на Точке #1: 50 литров
    - Молоко на Точке #2: 30 литров
    """
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)

    # Связи
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False, index=True)

    # Остатки
    quantity = Column(Float, nullable=False, default=0.0)  # Текущий остаток
    min_stock = Column(Float, nullable=False, default=0.0)  # Минимальный остаток для уведомлений

    # Метаданные
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    location = relationship("Location", back_populates="stocks")
    ingredient = relationship("Ingredient")

    # Уникальность: один ингредиент может быть только один раз на одной точке
    __table_args__ = (
        UniqueConstraint('location_id', 'ingredient_id', name='uix_location_ingredient'),
    )

    def __repr__(self):
        return f"<Stock location={self.location_id} ingredient={self.ingredient_id} qty={self.quantity}>"

    @property
    def is_low_stock(self):
        """Проверка: остаток ниже минимального?"""
        return self.quantity <= self.min_stock

    @property
    def stock_value(self):
        """Стоимость текущего остатка"""
        if self.ingredient:
            return self.quantity * self.ingredient.purchase_price
        return 0.0
