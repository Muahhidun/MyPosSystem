from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
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

    # DEPRECATED: будет удалено после миграции
    category = Column(String, nullable=True)  # Старое текстовое поле

    # НОВОЕ: связь с таблицей categories
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    display_order = Column(Integer, nullable=False, default=0)  # Порядок отображения

    # Единица измерения (валидация через Pydantic: кг, г, л, мл, шт)
    unit = Column(String, nullable=False)

    # Информация об упаковке (опционально)
    # Например: "Коробка 12 банок по 1.2кг, цена коробки 33600₸"
    packaging_info = Column(Text, nullable=True)

    # Цены
    purchase_price = Column(Float, nullable=False, default=0.0)  # Закупочная цена за единицу

    # DEPRECATED: Остатки перенесены в таблицу Stock (multi-location support)
    # Эти поля оставлены для обратной совместимости, но не используются
    # Используйте Stock.quantity вместо Ingredient.stock_quantity
    stock_quantity = Column(Float, nullable=True, default=0.0)  # DEPRECATED
    min_stock = Column(Float, nullable=True, default=0.0)  # DEPRECATED

    # Метаданные
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    category_rel = relationship("Category", back_populates="ingredients")

    def __repr__(self):
        return f"<Ingredient {self.name} ({self.unit})>"

    @property
    def is_piece_unit(self):
        """Проверка: штучный ли товар?"""
        return self.unit == "шт"

    # DEPRECATED properties - используйте Stock вместо этого
    @property
    def is_low_stock(self):
        """
        DEPRECATED: Проверка остатка.
        Используйте Stock.is_low_stock вместо этого метода.
        """
        return self.stock_quantity <= self.min_stock if self.stock_quantity and self.min_stock else False

    @property
    def stock_value(self):
        """
        DEPRECATED: Стоимость остатка.
        Используйте Stock.stock_value вместо этого метода.
        """
        return self.stock_quantity * self.purchase_price if self.stock_quantity else 0.0
