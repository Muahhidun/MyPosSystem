from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db import Base


class ProductVariant(Base):
    """
    Вариант товара (размеры с разными техкартами)

    Пример: Bubble Tea имеет 3 варианта:
    - 500мл (S) → связан с техкартой "Bubble Tea 500мл"
    - 700мл (M) → связан с техкартой "Bubble Tea 700мл"
    - 1000мл (L) → связан с техкартой "Bubble Tea 1000мл"
    """
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    base_product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="RESTRICT"), nullable=False)

    name = Column(String, nullable=False)  # "500мл (S)", "700мл (M)"
    size_code = Column(String, nullable=True)  # "S", "M", "L"
    price_adjustment = Column(Float, default=0.0)  # +0₸, +200₸, +400₸
    display_order = Column(Integer, default=0)
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    base_product = relationship("Product", back_populates="variants")
    recipe = relationship("Recipe")
