from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from ..db import Base


class Ingredient(Base):
    """
    Модель ингредиента (сырья)

    Примеры:
    - Молоко 3.2% (единица: л, цена: 300₸/л)
    - Кофе арабика (единица: кг, цена: 5000₸/кг)
    - Стакан 500мл (единица: шт, цена: 50₸/шт)
    """
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)

    # Основная информация
    name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=True)  # Категория: "Молочные", "Кофе", "Сиропы"

    # Единица измерения (валидация через Pydantic: кг, г, л, мл, шт)
    unit = Column(String, nullable=False)

    # Информация об упаковке (опционально)
    # Например: "Коробка 12 банок по 1.2кг, цена коробки 33600₸"
    packaging_info = Column(Text, nullable=True)

    # Цены и остатки
    purchase_price = Column(Float, nullable=False, default=0.0)  # Закупочная цена за единицу
    stock_quantity = Column(Float, nullable=False, default=0.0)  # Текущий остаток
    min_stock = Column(Float, nullable=False, default=0.0)  # Минимальный остаток (используется в модуле закупок)

    # Метаданные
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Ingredient {self.name} ({self.stock_quantity} {self.unit})>"

    @property
    def is_piece_unit(self):
        """Проверка: штучный ли товар?"""
        return self.unit == "шт"

    @property
    def is_low_stock(self):
        """Проверка: остаток ниже минимального?"""
        return self.stock_quantity <= self.min_stock

    @property
    def stock_value(self):
        """Стоимость текущего остатка"""
        return self.stock_quantity * self.purchase_price
