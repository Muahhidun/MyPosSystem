from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..db import get_db
from ..models import Product
from ..schemas import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=List[ProductResponse])
def get_products(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    available_only: bool = False,
    db: Session = Depends(get_db)
):
    """Получить список всех товаров"""
    query = db.query(Product)

    if category:
        query = query.filter(Product.category == category)

    if available_only:
        query = query.filter(Product.is_available == True)

    # Сортируем по категории, порядку отображения и названию
    products = query.order_by(
        Product.category_id,
        Product.display_order,
        Product.name
    ).offset(skip).limit(limit).all()
    return products


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Получить товар по ID"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """Создать новый товар"""
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db)
):
    """Обновить товар"""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )

    # Обновляем только переданные поля
    update_data = product_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)

    db.commit()
    db.refresh(db_product)
    return db_product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Удалить товар"""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )

    db.delete(db_product)
    db.commit()
    return None


@router.patch("/reorder")
def reorder_products(order: List[dict], db: Session = Depends(get_db)):
    """
    Обновить порядок отображения товаров
    Body: [{"id": 1, "display_order": 0}, {"id": 3, "display_order": 1}, ...]
    """
    for item in order:
        product = db.query(Product).filter(Product.id == item["id"]).first()
        if product:
            product.display_order = item["display_order"]
    db.commit()
    return {"status": "ok", "updated": len(order)}


@router.get("/categories/list", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    """Получить список всех категорий"""
    categories = db.query(Product.category).distinct().all()
    return [cat[0] for cat in categories if cat[0]]
