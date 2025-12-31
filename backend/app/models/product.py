from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db import Base


class Product(Base):
    """Товар/Блюдо для продажи (покупные товары без готовки)"""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    price = Column(Float, nullable=False)

    # DEPRECATED: будет удалено после миграции
    category = Column(String, nullable=True)  # Старое текстовое поле

    # НОВОЕ: связь с таблицей categories
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    display_order = Column(Integer, nullable=False, default=0)  # Порядок отображения

    is_available = Column(Boolean, default=True)  # Доступен для продажи (есть в наличии)
    show_in_pos = Column(Boolean, default=True)  # Показывать на кассе
    image_url = Column(String, nullable=True)  # Фото товара
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    category_rel = relationship("Category", back_populates="products")
    variants = relationship("ProductVariant", back_populates="base_product", cascade="all, delete-orphan")
    modifier_groups = relationship("ProductModifierGroup", back_populates="product", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Product {self.name}>"
