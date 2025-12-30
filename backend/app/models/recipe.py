from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db import Base


class Recipe(Base):
    """
    Модель техкарты (рецепта)

    Техкарта описывает из каких ингредиентов состоит блюдо/напиток
    и как рассчитывается его себестоимость
    """
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)

    # Основная информация
    name = Column(String, nullable=False, index=True)

    # DEPRECATED: будет удалено после миграции
    category = Column(String, nullable=True)  # Старое текстовое поле

    # НОВОЕ: связь с таблицей categories
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    display_order = Column(Integer, nullable=False, default=0)  # Порядок отображения

    # Выход и цена
    output_weight = Column(Float, nullable=False, default=0.0)  # Выход готового блюда (в граммах/мл)
    price = Column(Float, nullable=False, default=0.0)  # Цена продажи

    # Опции
    is_weight_based = Column(Boolean, default=False)  # Весовое блюдо
    exclude_from_discounts = Column(Boolean, default=False)  # Не участвует в скидках
    show_in_pos = Column(Boolean, default=True)  # Показывать на кассе

    # Картинка (опционально)
    image_url = Column(String, nullable=True)

    # Связь с ингредиентами (состав)
    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")
    # Связь с полуфабрикатами (будет добавлена)
    semifinished_items = relationship("RecipeSemifinished", back_populates="recipe", cascade="all, delete-orphan")
    # Связь с категорией
    category_rel = relationship("Category", back_populates="recipes")

    # Метаданные
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Recipe {self.name}>"

    @property
    def cost(self):
        """
        Себестоимость техкарты
        = сумма стоимостей всех ингредиентов + сумма стоимостей всех полуфабрикатов
        """
        ingredients_cost = sum(ing.cost for ing in self.ingredients)
        semifinished_cost = sum(sf.cost for sf in self.semifinished_items)
        return ingredients_cost + semifinished_cost

    @property
    def markup_percentage(self):
        """Наценка в процентах: (цена - себестоимость) / себестоимость * 100"""
        if self.cost == 0:
            return 0
        return round(((self.price - self.cost) / self.cost) * 100, 2)

    @property
    def profit(self):
        """Прибыль с одной порции"""
        return self.price - self.cost


class RecipeIngredient(Base):
    """
    Модель ингредиента в составе техкарты

    Связывает Recipe с Ingredient и хранит информацию о количестве
    """
    __tablename__ = "recipe_ingredients"

    id = Column(Integer, primary_key=True, index=True)

    # Связи
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id", ondelete="RESTRICT"), nullable=False)

    # Количество (вес/объем/штуки)
    gross_weight = Column(Float, nullable=False)  # Брутто (до обработки)
    net_weight = Column(Float, nullable=False)    # Нетто (после обработки/в готовом блюде)

    # Дополнительно
    cooking_method = Column(String, nullable=True)  # Метод приготовления (опционально)
    is_cleaned = Column(Boolean, default=False)     # Требуется очистка

    # Relationships
    recipe = relationship("Recipe", back_populates="ingredients")
    ingredient = relationship("Ingredient")

    def __repr__(self):
        return f"<RecipeIngredient recipe_id={self.recipe_id} ingredient_id={self.ingredient_id}>"

    @property
    def cost(self):
        """
        Стоимость этого ингредиента в техкарте
        Рассчитывается: вес(граммы) * цена_за_единицу_ингредиента

        Вес ВСЕГДА хранится в граммах (net_weight).
        Конвертируем в кг/л для расчёта стоимости.

        Например:
        - Ингредиент: Кетчуп, цена 100₸/кг
        - В техкарте: 25 граммов
        - Конвертируем: 25 / 1000 = 0.025 кг
        - Стоимость: 0.025 * 100 = 2.5₸
        """
        if not self.ingredient:
            return 0

        # Вес всегда в граммах
        weight_in_grams = self.net_weight

        # Конвертируем граммы в кг/л для расчёта стоимости
        quantity = weight_in_grams
        if self.ingredient.unit == 'кг' or self.ingredient.unit == 'л':
            quantity = weight_in_grams / 1000  # граммы → кг/л
        # Для 'шт' - используем как есть (граммы = штуки в этом контексте)

        return round(quantity * self.ingredient.purchase_price, 2)
