from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from ..db import Base


class Product(Base):
    """Товар/Блюдо для продажи (покупные товары без готовки)"""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    price = Column(Float, nullable=False)
    category = Column(String, nullable=True)  # Категория товара
    is_available = Column(Boolean, default=True)  # Доступен для продажи (есть в наличии)
    show_in_pos = Column(Boolean, default=True)  # Показывать на кассе
    image_url = Column(String, nullable=True)  # Фото товара
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Product {self.name}>"
