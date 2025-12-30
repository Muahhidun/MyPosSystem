import { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import { Search, Plus, X, Edit2, Trash2, ChefHat, Calculator, ChevronDown, MoreHorizontal, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

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
        output_weight: Math.round(calculateOutputWeight()),
        price: parseFloat(formData.price),
        is_weight_based: formData.is_weight_based,
        exclude_from_discounts: formData.exclude_from_discounts,
        show_in_pos: formData.show_in_pos,
        ingredients: formData.ingredients
          .filter(ing => ing.ingredient_id && ing.weight)
          .map(ing => ({
            ingredient_id: ing.ingredient_id,
            gross_weight: parseFloat(ing.weight) || 0,  // В граммах
            net_weight: parseFloat(ing.weight) || 0,    // В граммах (брутто = нетто)
            cooking_method: (ing.cooking_method && ing.cooking_method.trim()) ? ing.cooking_method.trim() : null,
            is_cleaned: false
          })),
        semifinished: formData.semifinished
          .filter(sf => sf.semifinished_id && sf.quantity)
          .map(sf => ({
            semifinished_id: sf.semifinished_id,
            quantity: parseFloat(sf.quantity) || 0  // В граммах/мл
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

  const handleToggleShowInPos = async (recipe) => {
    const newShowInPos = !recipe.show_in_pos;
    const action = newShowInPos ? 'показывается' : 'скрыта';

    try {
      await api.updateRecipe(recipe.id, {
        ...recipe,
        show_in_pos: newShowInPos,
        // Преобразуем ingredients и semifinished в нужный формат
        ingredients: recipe.ingredients.map(ing => ({
          ingredient_id: ing.ingredient_id,
          gross_weight: ing.gross_weight,
          net_weight: ing.net_weight,
          cooking_method: ing.cooking_method,
          is_cleaned: ing.is_cleaned
        })),
        semifinished: recipe.semifinished_items?.map(sf => ({
          semifinished_id: sf.semifinished_id,
          quantity: sf.quantity
        })) || []
      });
      toast.success(`Техкарта "${recipe.name}" ${action} на кассе`);
      loadRecipes();
    } catch (error) {
      console.error('Ошибка обновления техкарты:', error);
      toast.error('Не удалось обновить техкарту');
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
      <AdminLayout title="Техкарты">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  // Переключение между списком и формой
  if (showForm) {
    return (
      <AdminLayout title={editingRecipe ? 'Редактирование техкарты' : 'Новая техкарта'}>
        <Toaster position="top-right" />

        <div className="max-w-7xl">
          <button
            onClick={() => {
              setShowForm(false);
              setEditingRecipe(null);
              setFormData({ name: '', category: '', price: '', is_weight_based: false, exclude_from_discounts: false, show_in_pos: true, ingredients: [], semifinished: [] });
            }}
            className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft size={18} className="mr-1" />
            Назад к списку
          </button>

        {/* Форма редактирования с card-based layout */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-6">
            {/* Левая колонка (2/3) - Основная информация и состав */}
            <div className="col-span-2 space-y-6">

              {/* Карточка: Основное */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-5">Основная информация</h3>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <Input
                      label="Название техкарты"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Черничный чай (холодный)"
                      required
                    />

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Категория
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Цена продажи (₸)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="650"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Выход (автоматически)
                      </label>
                      <input
                        type="number"
                        value={calculateOutputWeight()}
                        readOnly
                        className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600 cursor-not-allowed"
                        placeholder="0 гр"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Настройки
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.show_in_pos}
                          onChange={(e) => setFormData({ ...formData, show_in_pos: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Показывать на кассе</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.exclude_from_discounts}
                          onChange={(e) => setFormData({ ...formData, exclude_from_discounts: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Исключить из скидок</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Карточка: Ингредиенты */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Ингредиенты</h3>
                  <Button
                    type="button"
                    onClick={addIngredient}
                    variant="secondary"
                    className="h-8 px-3 text-xs"
                  >
                    <Plus size={14} /> Добавить
                  </Button>
                </div>

                {formData.ingredients.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <ChefHat className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-500 text-sm">Добавьте базовые ингредиенты</p>
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Полуфабрикаты</h3>
                  <Button
                    type="button"
                    onClick={addSemifinished}
                    variant="secondary"
                    className="h-8 px-3 text-xs"
                  >
                    <Plus size={14} /> Добавить
                  </Button>
                </div>

                {formData.semifinished.length === 0 ? (
                  <div className="text-center py-8 bg-green-50 rounded-lg border-2 border-dashed border-green-200">
                    <ChefHat className="w-10 h-10 mx-auto mb-2 text-green-300" />
                    <p className="text-green-600 text-sm">Полуфабрикаты опциональны</p>
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
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-6">
                <h3 className="text-sm font-semibold text-green-900 mb-4 flex items-center gap-2">
                  <Calculator size={16} />
                  Расчёт себестоимости
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-green-700 mb-1">Себестоимость</div>
                    <div className="text-3xl font-bold text-green-900">{calculateCost().toFixed(2)} ₸</div>
                  </div>
                  <div className="pt-3 border-t border-green-300">
                    <div className="text-xs text-green-700 mb-1">Цена продажи</div>
                    <div className="text-2xl font-bold text-gray-900">{(parseFloat(formData.price) || 0).toFixed(2)} ₸</div>
                  </div>
                  <div className="pt-3 border-t border-green-300">
                    <div className="text-xs text-green-700 mb-1">Наценка</div>
                    <div className="text-2xl font-bold text-green-600">{calculateMarkup()}%</div>
                  </div>
                  {calculateOutputWeight() > 0 && (
                    <div className="pt-3 border-t border-green-300">
                      <div className="text-xs text-green-700 mb-1">Выход</div>
                      <div className="text-lg font-semibold text-gray-700">{calculateOutputWeight()} гр</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Действия */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Действия</h3>
                <div className="space-y-3">
                  <Button type="submit" className="w-full">
                    {editingRecipe ? 'Сохранить изменения' : 'Создать техкарту'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowForm(false);
                      setEditingRecipe(null);
                      setFormData({ name: '', category: '', price: '', is_weight_based: false, exclude_from_discounts: false, show_in_pos: true, ingredients: [], semifinished: [] });
                    }}
                    className="w-full"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </form>
        </div>
      </AdminLayout>
    );
  }

  // Список техкарт (table view)
  return (
    <AdminLayout title="Техкарты">
      <Toaster position="top-right" />

      {/* Заголовок с кнопкой */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <p className="text-gray-500">Рецепты и себестоимость блюд</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingRecipe(null);
            setFormData({ name: '', category: '', price: '', is_weight_based: false, exclude_from_discounts: false, show_in_pos: true, ingredients: [], semifinished: [] });
          }}
        >
          <Plus size={18} /> Добавить техкарту
        </Button>
      </div>

      {/* Поиск и фильтры */}
      <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 grid grid-cols-12 gap-4 items-center">
        <div className="col-span-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Поиск по названию..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="col-span-4">
          <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Все категории</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Таблица техкарт */}
      <div className="bg-white border border-gray-200 rounded-b-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
              <th className="px-6 py-3 w-16">ID</th>
              <th className="px-6 py-3">Название</th>
              <th className="px-6 py-3">Категория</th>
              <th className="px-6 py-3 text-right">Выход</th>
              <th className="px-6 py-3 text-right">Себестоимость</th>
              <th className="px-6 py-3 text-right">Цена</th>
              <th className="px-6 py-3 text-right">Наценка</th>
              <th className="px-6 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRecipes.map(recipe => (
              <tr key={recipe.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-3 text-gray-400 text-sm">#{recipe.id}</td>
                <td className="px-6 py-3 font-medium text-gray-900">{recipe.name}</td>
                <td className="px-6 py-3">
                  {recipe.category ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {recipe.category}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-6 py-3 text-right text-sm text-gray-600">
                  {recipe.output_weight > 0 ? `${recipe.output_weight} г` : '-'}
                </td>
                <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">{recipe.cost.toFixed(2)} ₸</td>
                <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">{recipe.price.toFixed(2)} ₸</td>
                <td className="px-6 py-3 text-right">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                    recipe.markup_percentage > 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {recipe.markup_percentage.toFixed(0)}%
                  </span>
                </td>
                <td className="px-6 py-3 text-right relative">
                  <button
                    onClick={() => setShowActionsMenu(showActionsMenu === recipe.id ? null : recipe.id)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {showActionsMenu === recipe.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        onClick={() => {
                          handleEdit(recipe);
                          setShowActionsMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                      >
                        <Edit2 size={14} /> Изменить
                      </button>
                      <button
                        onClick={() => {
                          handleToggleShowInPos(recipe);
                          setShowActionsMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-2"
                      >
                        {recipe.show_in_pos ? (
                          <><EyeOff size={14} /> Скрыть с кассы</>
                        ) : (
                          <><Eye size={14} /> Показать на кассе</>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(recipe.id, recipe.name);
                          setShowActionsMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
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
          <div className="text-center py-16 text-gray-500">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">Ничего не найдено</p>
            <p className="text-sm mt-2">Попробуйте изменить параметры поиска</p>
          </div>
        )}

        {recipes.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <ChefHat className="w-16 h-16 mx-auto mb-4 text-gray-400" />
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
    <div className="flex gap-3 items-start bg-green-50 p-4 rounded-xl border border-green-200">
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
            className="w-full h-10 px-3 pr-8 border border-green-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
          />
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {showDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-green-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredSemifinished.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">Ничего не найдено</div>
            ) : (
              filteredSemifinished.map(sf => (
                <div
                  key={sf.id}
                  onClick={() => handleSelectSemifinished(sf)}
                  className="px-3 py-2 hover:bg-green-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                >
                  <div className="font-medium text-gray-900">{sf.name}</div>
                  <div className="text-xs text-gray-500">
                    Выход: {sf.output_quantity} {sf.unit} • Себестоимость: {sf.cost?.toFixed(2) || 0} ₸
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="w-32">
        <label className="text-xs text-green-700 mb-1 block">Количество</label>
        <div className="relative">
          <input
            type="number"
            step="1"
            value={item.quantity}
            onChange={(e) => updateSemifinished(index, 'quantity', e.target.value)}
            className="w-full h-10 px-2 pr-8 border border-green-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-white"
            placeholder="100"
            required
          />
          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-green-600 pointer-events-none">
            {selectedSemifinished?.unit || 'гр'}
          </span>
        </div>
      </div>

      {selectedSemifinished && item.quantity && (
        <div className="w-28 pt-6">
          <div className="text-sm font-semibold text-green-700">
            {calculateSemifinishedCost()} ₸
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => removeSemifinished(index)}
        className="mt-6 p-2 text-green-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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
    <div className="flex gap-3 items-start bg-gray-50 p-4 rounded-xl border border-gray-200">
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
            className="w-full h-10 px-3 pr-8 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Dropdown со списком ингредиентов */}
        {showDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredIngredients.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">Ничего не найдено</div>
            ) : (
              filteredIngredients.map(ing => (
                <div
                  key={ing.id}
                  onClick={() => handleSelectIngredient(ing)}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                >
                  <div className="font-medium text-gray-900">{ing.name}</div>
                  <div className="text-xs text-gray-500">{ing.unit} • {ing.purchase_price} ₸/{ing.unit}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Вес в граммах */}
      <div className="w-32">
        <label className="text-xs text-gray-500 mb-1 block">Вес</label>
        <div className="relative">
          <input
            type="number"
            step="1"
            value={ingredient.weight}
            onChange={(e) => updateIngredient(index, 'weight', e.target.value)}
            className="w-full h-10 px-2 pr-8 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="60"
            required
          />
          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
            гр
          </span>
        </div>
      </div>

      {/* Стоимость (расчётное) */}
      {selectedIngredient && ingredient.weight && (
        <div className="w-28 pt-6">
          <div className="text-sm font-semibold text-gray-900">
            {calculateIngredientCost()} ₸
          </div>
        </div>
      )}

      {/* Удалить */}
      <button
        type="button"
        onClick={() => removeIngredient(index)}
        className="mt-6 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default RecipesPage;
