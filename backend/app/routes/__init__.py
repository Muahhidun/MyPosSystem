from .products import router as products_router
from .orders import router as orders_router
from .settings import router as settings_router
from .ingredients import router as ingredients_router

__all__ = ["products_router", "orders_router", "settings_router", "ingredients_router"]
