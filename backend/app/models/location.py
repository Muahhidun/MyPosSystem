from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db import Base


class Location(Base):
    """
    Модель точки продаж / заведения

    Примеры:
    - Кофейня на Абая, 150
    - Кофейня в ТРЦ Mega
    - Кофейня Dostyk Plaza
    """
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)

    # Основная информация
    name = Column(String, nullable=False)  # "Кофейня на Абая"
    address = Column(String, nullable=True)  # "ул. Абая, 150, Алматы"
    phone = Column(String, nullable=True)  # "+7 777 123 4567"

    # Статус
    is_active = Column(Boolean, default=True)  # Активна ли точка

    # Метаданные
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    orders = relationship("Order", back_populates="location")
    stocks = relationship("Stock", back_populates="location", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Location {self.name}>"
