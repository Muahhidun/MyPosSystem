import { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import { Search, Plus, X, Edit2, Trash2, ChefHat, Calculator, ChevronDown, MoreHorizontal } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';

function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [semifinished, setSemifinished] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    is_weight_based: false,
    exclude_from_discounts: false,
    show_in_pos: true,
    ingredients: [],  // [{ id, ingredient_id, weight, cooking_method }]
    semifinished: []  // [{ id, semifinished_id, quantity }]
  });

  useEffect(() => {
    loadRecipes();
    loadIngredients();
    loadSemifinished();
    loadCategories();
  }, []);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const data = await api.getRecipes();
      setRecipes(data);
    } catch (error) {
      console.error('Ошибка загрузки техкарт:', error);
      toast.error('Не удалось загрузить техкарты');
    } finally {
      setLoading(false);
    }
  };

  const loadIngredients = async () => {
    try {
      const data = await api.getIngredients();
      setIngredients(data);
    } catch (error) {
      console.error('Ошибка загрузки ингредиентов:', error);
    }
  };

  const loadSemifinished = async () => {
    try {
      const data = await api.getSemifinished();
      setSemifinished(data);
    } catch (error) {
      console.error('Ошибка загрузки полуфабрикатов:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api.getRecipeCategories();
      setCategories(data);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price || (formData.ingredients.length === 0 && formData.semifinished.length === 0)) {
      toast.error('Заполните название, цену и добавьте хотя бы один ингредиент или полуфабрикат');
      return;
    }

    try {
      const data = {
        name: formData.name,
        category: formData.category || null,
        output_weight: calculateOutputWeight(),
        price: parseFloat(formData.price),
        is_weight_based: formData.is_weight_based,
        exclude_from_discounts: formData.exclude_from_discounts,
        show_in_pos: formData.show_in_pos,
        ingredients: formData.ingredients.map(ing => ({
          ingredient_id: ing.ingredient_id,
          gross_weight: parseFloat(ing.weight),  // В граммах
          net_weight: parseFloat(ing.weight),    // В граммах (брутто = нетто)
          cooking_method: ing.cooking_method || null,
          is_cleaned: false
        })),
        semifinished: formData.semifinished.map(sf => ({
          semifinished_id: sf.semifinished_id,
          quantity: parseFloat(sf.quantity)  // В граммах/мл
        }))
      };

      if (editingRecipe) {
        await api.updateRecipe(editingRecipe.id, data);
        toast.success('Техкарта обновлена');
      } else {
        await api.createRecipe(data);
        toast.success('Техкарта создана');
      }

      setFormData({ name: '', category: '', price: '', is_weight_based: false, exclude_from_discounts: false, show_in_pos: true, ingredients: [], semifinished: [] });
      setEditingRecipe(null);
      setShowForm(false);
      loadRecipes();
      loadCategories();
    } catch (error) {
      console.error('Ошибка сохранения техкарты:', error);
      toast.error('Не удалось сохранить техкарту: ' + (error.message || 'Неизвестная ошибка'));
    }
  };

  const handleEdit = async (recipe) => {
    try {
      const fullRecipe = await api.getRecipe(recipe.id);
      setEditingRecipe(fullRecipe);
      setFormData({
        name: fullRecipe.name,
        category: fullRecipe.category || '',
        price: fullRecipe.price,
        is_weight_based: fullRecipe.is_weight_based,
        exclude_from_discounts: fullRecipe.exclude_from_discounts,
        show_in_pos: fullRecipe.show_in_pos !== undefined ? fullRecipe.show_in_pos : true,
        ingredients: fullRecipe.ingredients.map((ing, idx) => ({
          id: Date.now() + idx,
          ingredient_id: ing.ingredient_id,
          weight: ing.net_weight,  // Получаем в граммах
          cooking_method: ing.cooking_method || ''
        })),
        semifinished: (fullRecipe.semifinished || []).map((sf, idx) => ({
          id: Date.now() + 1000 + idx,
          semifinished_id: sf.semifinished_id,
          quantity: sf.quantity
        }))
      });
      setShowForm(true);
    } catch (error) {
      toast.error('Не удалось загрузить техкарту');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Удалить техкарту "${name}"?`)) {
      return;
    }

    try {
      await api.deleteRecipe(id);
      toast.success('Техкарта удалена');
      loadRecipes();
      loadCategories();
    } catch (error) {
      console.error('Ошибка удаления техкарты:', error);
      toast.error('Не удалось удалить техкарту');
    }
  };

  // Управление ингредиентами в форме
  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, {
        id: Date.now(),
        ingredient_id: '',
        weight: '',
        cooking_method: ''
      }]
    });
  };

  const removeIngredient = (index) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index)
    });
  };

  const updateIngredient = (index, field, value) => {
    const updated = [...formData.ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, ingredients: updated });
  };

  // Управление полуфабрикатами в форме
  const addSemifinished = () => {
    setFormData({
      ...formData,
      semifinished: [...formData.semifinished, {
        id: Date.now(),
        semifinished_id: '',
        quantity: ''
      }]
    });
  };

  const removeSemifinished = (index) => {
    setFormData({
      ...formData,
      semifinished: formData.semifinished.filter((_, i) => i !== index)
    });
  };

  const updateSemifinished = (index, field, value) => {
    const updated = [...formData.semifinished];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, semifinished: updated });
  };

  // Расчёт выхода (сумма весов всех ингредиентов + полуфабрикатов)
  const calculateOutputWeight = () => {
    const ingredientsWeight = formData.ingredients.reduce((sum, ing) => {
      return sum + (parseFloat(ing.weight) || 0);
    }, 0);

    const semifinishedWeight = formData.semifinished.reduce((sum, sf) => {
      return sum + (parseFloat(sf.quantity) || 0);
    }, 0);

    return ingredientsWeight + semifinishedWeight;
  };

  // Расчёт себестоимости (ингредиенты + полуфабрикаты)
  const calculateCost = () => {
    // Стоимость ингредиентов
    const ingredientsCost = formData.ingredients.reduce((sum, ing) => {
      const ingredient = ingredients.find(i => i.id === parseInt(ing.ingredient_id));
      if (!ingredient || !ing.weight) return sum;

      const weightInGrams = parseFloat(ing.weight);

      // Конвертация граммов в кг/л для расчета стоимости
      let quantity = weightInGrams;
      if (ingredient.unit === 'кг' || ingredient.unit === 'л') {
        quantity = weightInGrams / 1000;  // граммы → кг/л
      }
      // Для шт - используем как есть

      return sum + (quantity * ingredient.purchase_price);
    }, 0);

    // Стоимость полуфабрикатов
    const semifinishedCost = formData.semifinished.reduce((sum, sf) => {
      const sfItem = semifinished.find(s => s.id === parseInt(sf.semifinished_id));
      if (!sfItem || !sf.quantity) return sum;

      const quantityInGrams = parseFloat(sf.quantity);

      // Цена за грамм = себестоимость / выход
      const costPerGram = sfItem.output_quantity > 0 ? sfItem.cost / sfItem.output_quantity : 0;

      return sum + (quantityInGrams * costPerGram);
    }, 0);

    return ingredientsCost + semifinishedCost;
  };

  const calculateMarkup = () => {
    const cost = calculateCost();
    const price = parseFloat(formData.price) || 0;
    if (cost === 0) return 0;
    return Math.round(((price - cost) / cost) * 100);
  };

  // Фильтрация
  const filteredRecipes = recipes.filter(recipe => {
    if (searchQuery && !recipe.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterCategory && recipe.category !== filterCategory) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <AdminLayout breadcrumbs={['Меню', 'Техкарты']}>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  // Переключение между списком и формой
  if (showForm) {
    return (
      <AdminLayout breadcrumbs={['Меню', 'Техкарты', editingRecipe ? 'Редактирование' : 'Создание']}>
        <Toaster position="top-right" />

        {/* Заголовок формы */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {editingRecipe ? 'Редактировать техкарту' : 'Новая техкарта'}
            </h1>
            <p className="text-slate-500 mt-1">Состав блюда и расчёт себестоимости</p>
          </div>
          <button
            onClick={() => {
              setShowForm(false);
              setEditingRecipe(null);
              setFormData({ name: '', category: '', price: '', is_weight_based: false, exclude_from_discounts: false, show_in_pos: true, ingredients: [], semifinished: [] });
            }}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl hover:bg-slate-200 font-medium transition-all"
          >
            <X size={18} /> Отмена
          </button>
        </div>

        {/* Форма редактирования с card-based layout */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-6">
            {/* Левая колонка (2/3) - Основная информация и состав */}
            <div className="col-span-2 space-y-6">

              {/* Карточка: Основное */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b">Основное</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Название *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                        placeholder="Черничный чай (холодный)"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Категория</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                        placeholder="Чаи"
                        list="categories-list"
                      />
                      <datalist id="categories-list">
                        {categories.map(cat => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Цена продажи *</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full px-4 py-2.5 pr-8 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                          placeholder="650"
                          required
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">₸</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Выход (автоматически)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={calculateOutputWeight()}
                          readOnly
                          className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">гр</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-6 p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.show_in_pos}
                        onChange={(e) => setFormData({ ...formData, show_in_pos: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <label className="ml-2 text-sm font-medium text-slate-700">
                        Показывать на кассе
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.exclude_from_discounts}
                        onChange={(e) => setFormData({ ...formData, exclude_from_discounts: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <label className="ml-2 text-sm font-medium text-slate-700">
                        Исключить из скидок
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Карточка: Ингредиенты */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <h3 className="text-lg font-semibold text-slate-800">Ингредиенты</h3>
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="flex items-center gap-2 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg transition-all font-medium"
                  >
                    <Plus size={16} /> Добавить
                  </button>
                </div>

                {formData.ingredients.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                    <ChefHat className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-slate-500 text-sm">Добавьте базовые ингредиенты</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.ingredients.map((ing, index) => (
                      <IngredientRow
                        key={ing.id || index}
                        index={index}
                        ingredient={ing}
                        ingredients={ingredients}
                        updateIngredient={updateIngredient}
                        removeIngredient={removeIngredient}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Карточка: Полуфабрикаты */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <h3 className="text-lg font-semibold text-slate-800">Полуфабрикаты</h3>
                  <button
                    type="button"
                    onClick={addSemifinished}
                    className="flex items-center gap-2 text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg transition-all font-medium"
                  >
                    <Plus size={16} /> Добавить
                  </button>
                </div>

                {formData.semifinished.length === 0 ? (
                  <div className="text-center py-8 bg-emerald-50 rounded-lg border-2 border-dashed border-emerald-200">
                    <ChefHat className="w-10 h-10 mx-auto mb-2 text-emerald-300" />
                    <p className="text-emerald-600 text-sm">Полуфабрикаты опциональны</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.semifinished.map((sf, index) => (
                      <SemifinishedRow
                        key={sf.id || index}
                        index={index}
                        item={sf}
                        semifinished={semifinished}
                        updateSemifinished={updateSemifinished}
                        removeSemifinished={removeSemifinished}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Правая колонка (1/3) - Расчёты и действия */}
            <div className="space-y-6">
              {/* Расчёты */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-sm border border-emerald-200 p-6 sticky top-6">
                <h3 className="text-sm font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                  <Calculator size={16} />
                  Себестоимость
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-emerald-700 mb-1">Себестоимость</div>
                    <div className="text-3xl font-bold text-emerald-900">{calculateCost().toFixed(2)} ₸</div>
                  </div>
                  <div className="pt-3 border-t border-emerald-300">
                    <div className="text-xs text-emerald-700 mb-1">Цена продажи</div>
                    <div className="text-2xl font-bold text-slate-900">{(parseFloat(formData.price) || 0).toFixed(2)} ₸</div>
                  </div>
                  <div className="pt-3 border-t border-emerald-300">
                    <div className="text-xs text-emerald-700 mb-1">Наценка</div>
                    <div className="text-2xl font-bold text-emerald-600">{calculateMarkup()}%</div>
                  </div>
                  {calculateOutputWeight() > 0 && (
                    <div className="pt-3 border-t border-emerald-300">
                      <div className="text-xs text-emerald-700 mb-1">Выход</div>
                      <div className="text-lg font-semibold text-slate-700">{calculateOutputWeight()} гр</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Действия */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Действия</h3>
                <div className="space-y-2">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-all active:scale-[0.98]"
                  >
                    {editingRecipe ? 'Сохранить изменения' : 'Создать техкарту'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingRecipe(null);
                      setFormData({ name: '', category: '', price: '', is_weight_based: false, exclude_from_discounts: false, show_in_pos: true, ingredients: [], semifinished: [] });
                    }}
                    className="w-full bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg hover:bg-slate-200 font-medium transition-all"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>

          </div>
        </form>
      </AdminLayout>
    );
  }

  // Список техкарт (table view)
  return (
    <AdminLayout breadcrumbs={['Меню', 'Техкарты']}>
      <Toaster position="top-right" />

      {/* Заголовок с кнопкой */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Техкарты</h1>
          <p className="text-slate-500 mt-1">Рецепты и себестоимость блюд</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingRecipe(null);
            setFormData({ name: '', category: '', price: '', is_weight_based: false, exclude_from_discounts: false, show_in_pos: true, ingredients: [], semifinished: [] });
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 font-medium shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus size={18} /> Добавить техкарту
        </button>
      </div>

      {/* Поиск и фильтры */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Быстрый поиск</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Категория</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
            >
              <option value="">Все категории</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {(searchQuery || filterCategory) && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <ChefHat className="w-4 h-4" />
              <span>Найдено: <span className="font-semibold text-slate-900">{filteredRecipes.length}</span> из {recipes.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Список техкарт */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
              <th className="px-6 py-3 text-left w-16">ID</th>
              <th className="px-6 py-3 text-left">Название</th>
              <th className="px-6 py-3 text-left">Категория</th>
              <th className="px-6 py-3 text-right">Выход</th>
              <th className="px-6 py-3 text-right">Себестоимость</th>
              <th className="px-6 py-3 text-right">Цена</th>
              <th className="px-6 py-3 text-right">Наценка</th>
              <th className="px-6 py-3 text-right w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecipes.map(recipe => (
              <tr key={recipe.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-400">#{recipe.id}</td>
                <td className="px-6 py-3">
                  <div className="font-semibold text-slate-900">{recipe.name}</div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  {recipe.category ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {recipe.category}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600 text-right">
                  {recipe.output_weight > 0 ? `${recipe.output_weight} г` : '-'}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-right">
                  <div className="font-semibold text-slate-900">{recipe.cost.toFixed(2)} ₸</div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-right">
                  <div className="font-semibold text-slate-900">{recipe.price.toFixed(2)} ₸</div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-right">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    recipe.markup_percentage > 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {recipe.markup_percentage.toFixed(0)}%
                  </span>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-right relative">
                  <button
                    onClick={() => setShowActionsMenu(showActionsMenu === recipe.id ? null : recipe.id)}
                    className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {showActionsMenu === recipe.id && (
                    <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                      <button
                        onClick={() => {
                          handleEdit(recipe);
                          setShowActionsMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
                      >
                        <Edit2 size={14} /> Изменить
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(recipe.id, recipe.name);
                          setShowActionsMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
                      >
                        <Trash2 size={14} /> Удалить
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRecipes.length === 0 && recipes.length > 0 && (
          <div className="text-center py-16 text-slate-500">
            <Search className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <p className="text-lg font-medium">Ничего не найдено</p>
            <p className="text-sm mt-2">Попробуйте изменить параметры поиска</p>
          </div>
        )}

        {recipes.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <ChefHat className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <p className="text-lg font-medium">Нет техкарт</p>
            <p className="text-sm mt-2">Добавьте первую техкарту, нажав на кнопку выше</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Компонент строки полуфабриката
function SemifinishedRow({ index, item, semifinished, updateSemifinished, removeSemifinished }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const selectedSemifinished = semifinished.find(s => s.id === parseInt(item.semifinished_id));

  const filteredSemifinished = semifinished.filter(sf =>
    sf.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSemifinished = (sf) => {
    updateSemifinished(index, 'semifinished_id', sf.id);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const calculateSemifinishedCost = () => {
    if (!selectedSemifinished || !item.quantity) return 0;

    const quantityInGrams = parseFloat(item.quantity);
    const costPerGram = selectedSemifinished.output_quantity > 0
      ? selectedSemifinished.cost / selectedSemifinished.output_quantity
      : 0;

    return (quantityInGrams * costPerGram).toFixed(2);
  };

  return (
    <div className="flex gap-3 items-start bg-emerald-50 p-4 rounded-xl border border-emerald-200">
      <div className="flex-1 relative" ref={dropdownRef}>
        <div className="relative">
          <input
            type="text"
            value={selectedSemifinished ? selectedSemifinished.name : searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Начните вводить название..."
            className="w-full px-3 py-2 pr-8 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {showDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-emerald-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredSemifinished.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500">Ничего не найдено</div>
            ) : (
              filteredSemifinished.map(sf => (
                <div
                  key={sf.id}
                  onClick={() => handleSelectSemifinished(sf)}
                  className="px-3 py-2 hover:bg-emerald-50 cursor-pointer text-sm border-b border-slate-100 last:border-0"
                >
                  <div className="font-medium text-slate-900">{sf.name}</div>
                  <div className="text-xs text-slate-500">
                    Выход: {sf.output_quantity} {sf.unit} • Себестоимость: {sf.cost?.toFixed(2) || 0} ₸
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="w-32">
        <label className="text-xs text-emerald-700 mb-1 block">Количество</label>
        <div className="relative">
          <input
            type="number"
            step="1"
            value={item.quantity}
            onChange={(e) => updateSemifinished(index, 'quantity', e.target.value)}
            className="w-full px-2 py-2 pr-8 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            placeholder="100"
            required
          />
          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-emerald-600 pointer-events-none">
            {selectedSemifinished?.unit || 'гр'}
          </span>
        </div>
      </div>

      {selectedSemifinished && item.quantity && (
        <div className="w-28 pt-6">
          <div className="text-sm font-semibold text-emerald-700">
            {calculateSemifinishedCost()} ₸
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => removeSemifinished(index)}
        className="mt-6 p-2 text-emerald-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Компонент строки ингредиента с searchable select
function IngredientRow({ index, ingredient, ingredients, updateIngredient, removeIngredient }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const selectedIngredient = ingredients.find(i => i.id === parseInt(ingredient.ingredient_id));

  // Фильтрация ингредиентов по поисковому запросу
  const filteredIngredients = ingredients.filter(ing =>
    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Закрытие dropdown при клике вне элемента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectIngredient = (ing) => {
    updateIngredient(index, 'ingredient_id', ing.id);
    setSearchTerm('');
    setShowDropdown(false);
  };

  // Расчёт стоимости для этого ингредиента
  const calculateIngredientCost = () => {
    if (!selectedIngredient || !ingredient.weight) return 0;

    const weightInGrams = parseFloat(ingredient.weight);
    let quantity = weightInGrams;

    if (selectedIngredient.unit === 'кг' || selectedIngredient.unit === 'л') {
      quantity = weightInGrams / 1000;
    }

    return (quantity * selectedIngredient.purchase_price).toFixed(2);
  };

  return (
    <div className="flex gap-3 items-start bg-slate-50 p-4 rounded-xl border border-slate-200">
      {/* Выбор ингредиента с поиском */}
      <div className="flex-1 relative" ref={dropdownRef}>
        <div className="relative">
          <input
            type="text"
            value={selectedIngredient ? selectedIngredient.name : searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Начните вводить название..."
            className="w-full px-3 py-2 pr-8 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Dropdown со списком ингредиентов */}
        {showDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredIngredients.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500">Ничего не найдено</div>
            ) : (
              filteredIngredients.map(ing => (
                <div
                  key={ing.id}
                  onClick={() => handleSelectIngredient(ing)}
                  className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-100 last:border-0"
                >
                  <div className="font-medium text-slate-900">{ing.name}</div>
                  <div className="text-xs text-slate-500">{ing.unit} • {ing.purchase_price} ₸/{ing.unit}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Вес в граммах */}
      <div className="w-32">
        <label className="text-xs text-slate-500 mb-1 block">Вес</label>
        <div className="relative">
          <input
            type="number"
            step="1"
            value={ingredient.weight}
            onChange={(e) => updateIngredient(index, 'weight', e.target.value)}
            className="w-full px-2 py-2 pr-8 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            placeholder="60"
            required
          />
          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
            гр
          </span>
        </div>
      </div>

      {/* Стоимость (расчётное) */}
      {selectedIngredient && ingredient.weight && (
        <div className="w-28 pt-6">
          <div className="text-sm font-semibold text-slate-900">
            {calculateIngredientCost()} ₸
          </div>
        </div>
      )}

      {/* Удалить */}
      <button
        type="button"
        onClick={() => removeIngredient(index)}
        className="mt-6 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default RecipesPage;
