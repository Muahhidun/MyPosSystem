from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db import Base


class Semifinished(Base):
    """
    Модель полуфабриката

    Полуфабрикаты - это промежуточные продукты, которые:
    - Состоят из ингредиентов
    - Используются в техкартах готовых блюд
    - НЕ показываются на кассе (только для внутреннего использования)

    Примеры: Чайный раствор, Фруктовая вода, Соус и т.д.
    """
    __tablename__ = "semifinished"

    id = Column(Integer, primary_key=True, index=True)

    # Основная информация
    name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=True)  # Категория полуфабриката
    unit = Column(String, nullable=False, default="гр")  # Единица измерения (гр, мл, шт)
    output_quantity = Column(Float, nullable=False, default=100.0)  # Выход полуфабриката (в граммах/мл)

    # Связь с ингредиентами (состав)
    ingredients = relationship("SemifinishedIngredient", back_populates="semifinished", cascade="all, delete-orphan")

    # Метаданные
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Semifinished {self.name}>"

    @property
    def cost(self):
        """
        Себестоимость полуфабриката (сумма стоимостей всех ингредиентов)
        Рассчитывается автоматически из состава
        """
        return sum(ing.cost for ing in self.ingredients)


class SemifinishedIngredient(Base):
    """
    Модель ингредиента в составе полуфабриката

    Связывает Semifinished с Ingredient и хранит количество
    """
    __tablename__ = "semifinished_ingredients"

    id = Column(Integer, primary_key=True, index=True)

    # Связи
    semifinished_id = Column(Integer, ForeignKey("semifinished.id", ondelete="CASCADE"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id", ondelete="RESTRICT"), nullable=False)

    # Количество (вес в граммах)
    weight = Column(Float, nullable=False)  # Вес в граммах

    # Relationships
    semifinished = relationship("Semifinished", back_populates="ingredients")
    ingredient = relationship("Ingredient")

    def __repr__(self):
        return f"<SemifinishedIngredient semifinished_id={self.semifinished_id} ingredient_id={self.ingredient_id}>"

    @property
    def cost(self):
        """
        Стоимость этого ингредиента в полуфабрикате
        Рассчитывается: вес(граммы) * цена_за_единицу

        Логика такая же как в RecipeIngredient
        """
        if not self.ingredient:
            return 0

        weight_in_grams = self.weight

        # Конвертируем граммы в кг/л для расчёта стоимости
        quantity = weight_in_grams
        if self.ingredient.unit == 'кг' or self.ingredient.unit == 'л':
            quantity = weight_in_grams / 1000  # граммы → кг/л

        return round(quantity * self.ingredient.purchase_price, 2)


class RecipeSemifinished(Base):
    """
    Модель полуфабриката в составе техкарты

    Связывает Recipe с Semifinished и хранит количество
    """
    __tablename__ = "recipe_semifinished"

    id = Column(Integer, primary_key=True, index=True)

    # Связи
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    semifinished_id = Column(Integer, ForeignKey("semifinished.id", ondelete="RESTRICT"), nullable=False)

    # Количество (в единицах полуфабриката)
    quantity = Column(Float, nullable=False)  # Количество в граммах/мл

    # Relationships
    recipe = relationship("Recipe", back_populates="semifinished_items")
    semifinished = relationship("Semifinished")

    def __repr__(self):
        return f"<RecipeSemifinished recipe_id={self.recipe_id} semifinished_id={self.semifinished_id}>"

    @property
    def cost(self):
        """
        Стоимость этого полуфабриката в техкарте
        Рассчитывается: количество * (себестоимость_полуфабриката / выход)

        Например:
        - Полуфабрикат: Чайный раствор
          - Состав: 50г чая = 100₸
          - Выход: 500 гр раствора
          - Себестоимость: 100₸
          - Цена за грамм: 100₸ / 500гр = 0.2₸/гр
        - В техкарте используем: 200 гр
        - Стоимость: 200 * 0.2 = 40₸
        """
        if not self.semifinished:
            return 0

        # Количество используемого полуфабриката в граммах
        quantity_in_grams = self.quantity

        # Себестоимость полуфабриката (за весь выход)
        total_cost = self.semifinished.cost

        # Выход полуфабриката
        output_quantity = self.semifinished.output_quantity

        if output_quantity == 0:
            return 0

        # Цена за грамм
        cost_per_gram = total_cost / output_quantity

        # Итоговая стоимость
        return round(quantity_in_grams * cost_per_gram, 2)
