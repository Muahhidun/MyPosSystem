from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import engine, Base
from app.routes import products_router, orders_router, settings_router

# Создаем таблицы в БД
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="My POS System API",
    description="API для системы учета общепита",
    version="1.0.0"
)

# CORS для доступа из frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(products_router, prefix="/api")
app.include_router(orders_router, prefix="/api")
app.include_router(settings_router, prefix="/api")


@app.get("/")
def root():
    """Проверка работоспособности API"""
    return {
        "message": "My POS System API",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
