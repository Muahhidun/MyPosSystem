from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Settings
from ..schemas import SettingsUpdate, SettingsResponse

router = APIRouter(prefix="/settings", tags=["settings"])


def get_or_create_settings(db: Session) -> Settings:
    """Получить или создать настройки (singleton)"""
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("/", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    """Получить настройки системы"""
    return get_or_create_settings(db)


@router.put("/", response_model=SettingsResponse)
def update_settings(
    settings_update: SettingsUpdate,
    db: Session = Depends(get_db)
):
    """Обновить настройки системы"""
    settings = get_or_create_settings(db)

    # Обновляем только переданные поля
    update_data = settings_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)

    db.commit()
    db.refresh(settings)
    return settings
