from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from ..db import Base


class Ingredient(Base):
    """
    Модель ингредиента (сырья)

    Примеры:
    - Молоко 3.2% (единица: литр, цена: 300₸/л)
    - Кофе арабика (единица: кг, цена: 5000₸/кг)
    - Сахар белый (единица: кг, цена: 400₸/кг)
    """
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)

    # Основная информация
    name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=True)  # Категория: "Молочные", "Кофе", "Сиропы"

    # Единица измерения
    unit = Column(String, nullable=False)  # кг, л, шт, г, мл

    # Цены и остатки
    purchase_price = Column(Float, nullable=False, default=0.0)  # Закупочная цена за единицу
    stock_quantity = Column(Float, nullable=False, default=0.0)  # Текущий остаток
    min_stock = Column(Float, nullable=False, default=0.0)  # Минимальный остаток (для предупреждений)

    # Метаданные
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Ingredient {self.name} ({self.stock_quantity} {self.unit})>"

    @property
    def is_low_stock(self):
        """Проверка: остаток ниже минимального?"""
        return self.stock_quantity <= self.min_stock

    @property
    def stock_value(self):
        """Стоимость текущего остатка"""
        return self.stock_quantity * self.purchase_price
