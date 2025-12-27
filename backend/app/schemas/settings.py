from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SettingsBase(BaseModel):
    """Базовая схема настроек"""
    business_name: str = Field(default="My POS System", min_length=1, max_length=200)
    phone: Optional[str] = None
    receipt_printer_ip: Optional[str] = None
    label_printer_ip: Optional[str] = None


class SettingsUpdate(BaseModel):
    """Обновление настроек (все поля опциональные)"""
    business_name: Optional[str] = Field(None, min_length=1, max_length=200)
    phone: Optional[str] = None
    receipt_printer_ip: Optional[str] = None
    label_printer_ip: Optional[str] = None


class SettingsResponse(SettingsBase):
    """Ответ с настройками"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
