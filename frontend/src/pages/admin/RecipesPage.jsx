import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Search, Plus, X, Pencil, Trash2, ChefHat, Calculator } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    output_weight: '',
    price: '',
    is_weight_based: false,
    exclude_from_discounts: false,
    ingredients: []  // [{ ingredient_id, gross_weight, net_weight, cooking_method, is_cleaned }]
  });

  useEffect(() => {
    loadRecipes();
    loadIngredients();
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

    if (!formData.name || !formData.price || formData.ingredients.length === 0) {
      toast.error('Заполните название, цену и добавьте хотя бы один ингредиент');
      return;
    }

    try {
      const data = {
        name: formData.name,
        category: formData.category || null,
        output_weight: parseFloat(formData.output_weight) || 0,
        price: parseFloat(formData.price),
        is_weight_based: formData.is_weight_based,
        exclude_from_discounts: formData.exclude_from_discounts,
        ingredients: formData.ingredients.map(ing => ({
          ingredient_id: ing.ingredient_id,
          gross_weight: parseFloat(ing.gross_weight),
          net_weight: parseFloat(ing.net_weight),
          cooking_method: ing.cooking_method || null,
          is_cleaned: ing.is_cleaned
        }))
      };

      if (editingRecipe) {
        await api.updateRecipe(editingRecipe.id, data);
        toast.success('Техкарта обновлена');
      } else {
        await api.createRecipe(data);
        toast.success('Техкарта создана');
      }

      setFormData({ name: '', category: '', output_weight: '', price: '', is_weight_based: false, exclude_from_discounts: false, ingredients: [] });
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
      // Загружаем полную информацию о техкарте
      const fullRecipe = await api.getRecipe(recipe.id);
      setEditingRecipe(fullRecipe);
      setFormData({
        name: fullRecipe.name,
        category: fullRecipe.category || '',
        output_weight: fullRecipe.output_weight,
        price: fullRecipe.price,
        is_weight_based: fullRecipe.is_weight_based,
        exclude_from_discounts: fullRecipe.exclude_from_discounts,
        ingredients: fullRecipe.ingredients.map(ing => ({
          ingredient_id: ing.ingredient_id,
          gross_weight: ing.gross_weight,
          net_weight: ing.net_weight,
          cooking_method: ing.cooking_method || '',
          is_cleaned: ing.is_cleaned
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
        ingredient_id: '',
        gross_weight: '',
        net_weight: '',
        cooking_method: '',
        is_cleaned: false
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

  // Расчёт себестоимости
  const calculateCost = () => {
    return formData.ingredients.reduce((sum, ing) => {
      const ingredient = ingredients.find(i => i.id === parseInt(ing.ingredient_id));
      if (!ingredient || !ing.net_weight) return sum;

      let quantity = parseFloat(ing.net_weight);
      // Конвертация единиц
      if (ingredient.unit === 'кг' && quantity < 10) quantity = quantity / 1000;
      if (ingredient.unit === 'л' && quantity < 10) quantity = quantity / 1000;

      return sum + (quantity * ingredient.purchase_price);
    }, 0);
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
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Техкарты</h1>
          <p className="text-slate-500 mt-1">Рецепты и себестоимость блюд</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingRecipe(null);
            setFormData({ name: '', category: '', output_weight: '', price: '', is_weight_based: false, exclude_from_discounts: false, ingredients: [] });
          }}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 font-semibold shadow-lg shadow-slate-300 transition-all active:scale-95"
        >
          {showForm ? <><X className="w-5 h-5" /> Отмена</> : <><Plus className="w-5 h-5" /> Добавить техкарту</>}
        </button>
      </div>

      {/* Поиск и фильтры */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6">
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
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Категория</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
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

      {/* Форма создания/редактирования */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <ChefHat className="w-6 h-6" />
            {editingRecipe ? 'Редактировать техкарту' : 'Новая техкарта'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Основные поля */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Название *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                  placeholder="4 Сезона"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Категория</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                  placeholder="Пиццы"
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
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                  placeholder="2950"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Выход (г/мл)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.output_weight}
                  onChange={(e) => setFormData({ ...formData, output_weight: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                  placeholder="637"
                />
              </div>
            </div>

            {/* Состав техкарты */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Состав</h3>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="flex items-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-all"
                >
                  <Plus className="w-4 h-4" /> Добавить ингредиент
                </button>
              </div>

              {formData.ingredients.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <ChefHat className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">Добавьте ингредиенты для расчёта себестоимости</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.ingredients.map((ing, index) => {
                    const selectedIngredient = ingredients.find(i => i.id === parseInt(ing.ingredient_id));
                    return (
                      <div key={index} className="flex gap-3 items-start bg-slate-50 p-4 rounded-xl border border-slate-200">
                        {/* Выбор ингредиента */}
                        <div className="flex-1">
                          <select
                            value={ing.ingredient_id}
                            onChange={(e) => updateIngredient(index, 'ingredient_id', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                            required
                          >
                            <option value="">Выберите ингредиент</option>
                            {ingredients.map(ingredient => (
                              <option key={ingredient.id} value={ingredient.id}>
                                {ingredient.name} ({ingredient.unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Брутто */}
                        <div className="w-24">
                          <label className="text-xs text-slate-500 mb-1 block">Брутто</label>
                          <input
                            type="number"
                            step="0.01"
                            value={ing.gross_weight}
                            onChange={(e) => updateIngredient(index, 'gross_weight', e.target.value)}
                            className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900"
                            placeholder="100"
                            required
                          />
                        </div>

                        {/* Нетто */}
                        <div className="w-24">
                          <label className="text-xs text-slate-500 mb-1 block">Нетто</label>
                          <input
                            type="number"
                            step="0.01"
                            value={ing.net_weight}
                            onChange={(e) => updateIngredient(index, 'net_weight', e.target.value)}
                            className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900"
                            placeholder="75"
                            required
                          />
                        </div>

                        {/* Стоимость (расчётное) */}
                        {selectedIngredient && ing.net_weight && (
                          <div className="w-28 pt-6">
                            <div className="text-sm font-semibold text-slate-900">
                              {(() => {
                                let qty = parseFloat(ing.net_weight);
                                if (selectedIngredient.unit === 'кг' && qty < 10) qty /= 1000;
                                if (selectedIngredient.unit === 'л' && qty < 10) qty /= 1000;
                                return (qty * selectedIngredient.purchase_price).toFixed(2);
                              })()} ₸
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
                  })}
                </div>
              )}
            </div>

            {/* Расчёты */}
            {formData.ingredients.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-5 h-5 text-slate-600" />
                  <h3 className="font-semibold text-slate-900">Расчёт</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-slate-500">Себестоимость</div>
                    <div className="text-2xl font-bold text-slate-900">{calculateCost().toFixed(2)} ₸</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Цена продажи</div>
                    <div className="text-2xl font-bold text-slate-900">{(parseFloat(formData.price) || 0).toFixed(2)} ₸</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Наценка</div>
                    <div className="text-2xl font-bold text-emerald-600">{calculateMarkup()}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* Кнопки */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="bg-slate-900 text-white px-8 py-3 rounded-xl hover:bg-slate-800 font-semibold shadow-lg shadow-slate-300 transition-all active:scale-95"
              >
                {editingRecipe ? 'Сохранить изменения' : 'Создать техкарту'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingRecipe(null);
                  setFormData({ name: '', category: '', output_weight: '', price: '', is_weight_based: false, exclude_from_discounts: false, ingredients: [] });
                }}
                className="bg-slate-100 text-slate-700 px-8 py-3 rounded-xl hover:bg-slate-200 font-semibold transition-all"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список техкарт */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Название</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Категория</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Выход</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Себестоимость</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Цена</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Наценка</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecipes.map(recipe => (
              <tr key={recipe.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-400">#{recipe.id}</td>
                <td className="px-6 py-4"><div className="font-semibold text-slate-900">{recipe.name}</div></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{recipe.category || <span className="text-slate-400">-</span>}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{recipe.output_weight > 0 ? `${recipe.output_weight} г` : '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-semibold text-slate-900">{recipe.cost.toFixed(2)} ₸</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-semibold text-slate-900">{recipe.price.toFixed(2)} ₸</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-sm font-semibold ${
                    recipe.markup_percentage > 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {recipe.markup_percentage.toFixed(0)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(recipe)}
                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                      title="Редактировать"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(recipe.id, recipe.name)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
    </div>
  );
}

export default RecipesPage;
