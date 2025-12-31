from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db import Base
import enum


class PaymentMethod(str, enum.Enum):
    """Методы оплаты"""
    CASH = "cash"  # Наличные
    CARD = "card"  # Безнал


class OrderStatus(str, enum.Enum):
    """Статусы заказа"""
    PENDING = "pending"    # Создан, но не оплачен
    PAID = "paid"         # Оплачен
    CANCELLED = "cancelled"  # Отменен


class Order(Base):
    """Заказ (чек)"""
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True)  # Номер чека
    total_amount = Column(Float, nullable=False)  # Общая сумма
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    items = Column(JSON, nullable=False)  # Список товаров в заказе
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Order #{self.order_number}>"


class ItemType(str, enum.Enum):
    """Тип позиции в заказе"""
    PRODUCT = "product"  # Товар (покупной)
    RECIPE = "recipe"    # Техкарта (готовится)


class OrderItem(Base):
    """Позиция в заказе"""
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    item_type = Column(Enum(ItemType), nullable=False, default=ItemType.PRODUCT)

    # Один из этих двух полей должен быть заполнен (в зависимости от item_type)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=True)

    # Варианты и модификаторы
    variant_id = Column(Integer, ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True)
    modifiers = Column(JSON, nullable=True)  # [{"modifier_id": 1, "name": "Тапиока", "price": 200}, ...]

    item_name = Column(String, nullable=False)  # Фиксируем название
    quantity = Column(Integer, nullable=False, default=1)
    price = Column(Float, nullable=False)  # Цена на момент продажи (с учетом variant + modifiers)
    subtotal = Column(Float, nullable=False)  # quantity * price

    # Relationships
    order = relationship("Order", backref="order_items")
    product = relationship("Product")
    recipe = relationship("Recipe")
    variant = relationship("ProductVariant")

    def __repr__(self):
        return f"<OrderItem {self.item_name} x{self.quantity}>"
