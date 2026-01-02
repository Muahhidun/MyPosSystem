from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..db import get_db
from ..models import Location
from ..schemas import LocationCreate, LocationUpdate, LocationResponse

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("", response_model=List[LocationResponse])
def get_locations(active_only: bool = True, db: Session = Depends(get_db)):
    """
    Получить список всех точек продаж

    Параметры:
    - active_only: показывать только активные точки
    """
    query = db.query(Location).order_by(Location.id)

    if active_only:
        query = query.filter(Location.is_active == True)

    return query.all()


@router.get("/{location_id}", response_model=LocationResponse)
def get_location(location_id: int, db: Session = Depends(get_db)):
    """Получить точку по ID"""
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location with id {location_id} not found"
        )
    return location


@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(location: LocationCreate, db: Session = Depends(get_db)):
    """
    Создать новую точку продаж

    Проверяет уникальность названия
    """
    # Проверка уникальности названия
    existing = db.query(Location).filter(Location.name == location.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Location '{location.name}' already exists"
        )

    db_location = Location(**location.model_dump())
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location


@router.put("/{location_id}", response_model=LocationResponse)
def update_location(
    location_id: int,
    location_update: LocationUpdate,
    db: Session = Depends(get_db)
):
    """Обновить точку"""
    db_location = db.query(Location).filter(Location.id == location_id).first()
    if not db_location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location with id {location_id} not found"
        )

    # Проверка уникальности при изменении названия
    if location_update.name and location_update.name != db_location.name:
        existing = db.query(Location).filter(
            Location.name == location_update.name,
            Location.id != location_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Location '{location_update.name}' already exists"
            )

    # Обновляем только переданные поля
    update_data = location_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_location, field, value)

    db.commit()
    db.refresh(db_location)
    return db_location


@router.delete("/{location_id}", status_code=status.HTTP_200_OK)
def delete_location(location_id: int, db: Session = Depends(get_db)):
    """
    Удалить точку

    ВНИМАНИЕ: Удаление точки удалит все связанные остатки (Stock).
    Заказы сохранятся, но будет ошибка если точка используется.
    """
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location with id {location_id} not found"
        )

    # Проверить что есть ли заказы для этой точки
    if location.orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete location. {len(location.orders)} orders are linked to it. "
                   f"Deactivate it instead."
        )

    db.delete(location)
    db.commit()
    return {"status": "deleted", "id": location_id}
