from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from ..db import Base


class Settings(Base):
    """Настройки системы (одна запись)"""
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)

    # Информация о бизнесе
    business_name = Column(String, default="My POS System")
    phone = Column(String, nullable=True)

    # IP адреса принтеров
    receipt_printer_ip = Column(String, nullable=True)  # XP-T80Q (чеки)
    label_printer_ip = Column(String, nullable=True)    # XP-365B (бегунки)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Settings {self.business_name}>"
