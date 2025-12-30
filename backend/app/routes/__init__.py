from .products import router as products_router
from .orders import router as orders_router
from .settings import router as settings_router
from .ingredients import router as ingredients_router
from .recipes import router as recipes_router
from .semifinished import router as semifinished_router
from .pos import router as pos_router
from .categories import router as categories_router

__all__ = [
    "products_router",
    "orders_router",
    "settings_router",
    "ingredients_router",
    "recipes_router",
    "semifinished_router",
    "pos_router",
    "categories_router"
]
