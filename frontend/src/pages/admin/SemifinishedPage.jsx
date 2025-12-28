import { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import { Search, Plus, X, Pencil, Trash2, FlaskConical, ChevronDown } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

function SemifinishedPage() {
  const [semifinished, setSemifinished] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSemifinished, setEditingSemifinished] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: 'гр',
    output_quantity: '',
    ingredients: []  // [{ ingredient_id, weight }]
  });

  useEffect(() => {
    loadSemifinished();
    loadIngredients();
    loadCategories();
  }, []);

  const loadSemifinished = async () => {
    try {
      setLoading(true);
      const data = await api.getSemifinished();
      setSemifinished(data);
    } catch (error) {
      console.error('Ошибка загрузки полуфабрикатов:', error);
      toast.error('Не удалось загрузить полуфабрикаты');
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
      const data = await api.getSemifinishedCategories();
      setCategories(data);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  const calculateTotalWeight = () => {
    return formData.ingredients.reduce((sum, ing) => {
      return sum + (parseFloat(ing.weight) || 0);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || formData.ingredients.length === 0) {
      toast.error('Заполните название и добавьте хотя бы один ингредиент');
      return;
    }

    try {
      // Если выход не указан, используем сумму весов ингредиентов
      const outputQty = formData.output_quantity
        ? parseFloat(formData.output_quantity)
        : calculateTotalWeight();

      const data = {
        name: formData.name,
        category: formData.category || null,
        unit: formData.unit,
        output_quantity: outputQty,
        ingredients: formData.ingredients.map(ing => ({
          ingredient_id: ing.ingredient_id,
          weight: parseFloat(ing.weight)
        }))
      };

      if (editingSemifinished) {
        await api.updateSemifinished(editingSemifinished.id, data);
        toast.success('Полуфабрикат обновлен');
      } else {
        await api.createSemifinished(data);
        toast.success('Полуфабрикат создан');
      }

      setFormData({ name: '', category: '', unit: 'гр', output_quantity: '', ingredients: [] });
      setEditingSemifinished(null);
      setShowForm(false);
      loadSemifinished();
      loadCategories();
    } catch (error) {
      console.error('Ошибка сохранения полуфабриката:', error);
      toast.error('Не удалось сохранить полуфабрикат: ' + (error.message || 'Неизвестная ошибка'));
    }
  };

  const handleEdit = async (item) => {
    try {
      const fullItem = await api.getSemifinishedItem(item.id);
      setEditingSemifinished(fullItem);
      setFormData({
        name: fullItem.name,
        category: fullItem.category || '',
        unit: fullItem.unit || 'гр',
        output_quantity: fullItem.output_quantity,
        ingredients: fullItem.ingredients.map((ing, idx) => ({
          id: Date.now() + idx,
          ingredient_id: ing.ingredient_id,
          weight: ing.weight
        }))
      });
      setShowForm(true);
    } catch (error) {
      toast.error('Не удалось загрузить полуфабрикат');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Удалить полуфабрикат "${name}"?`)) {
      return;
    }

    try {
      await api.deleteSemifinished(id);
      toast.success('Полуфабрикат удален');
      loadSemifinished();
    } catch (error) {
      console.error('Ошибка удаления полуфабриката:', error);
      toast.error('Не удалось удалить полуфабрикат');
    }
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [
        ...formData.ingredients,
        { id: Date.now(), ingredient_id: null, weight: '' }
      ]
    });
  };

  const updateIngredient = (index, field, value) => {
    const updated = [...formData.ingredients];
    updated[index][field] = value;
    setFormData({ ...formData, ingredients: updated });
  };

  const removeIngredient = (index) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index)
    });
  };

  const calculateTotalCost = () => {
    return formData.ingredients.reduce((sum, ing) => {
      const ingredient = ingredients.find(i => i.id === ing.ingredient_id);
      if (!ingredient || !ing.weight) return sum;

      const weight = parseFloat(ing.weight);
      let quantity = weight;
      if (ingredient.unit === 'кг' || ingredient.unit === 'л') {
        quantity = weight / 1000;
      }
      return sum + (quantity * ingredient.purchase_price);
    }, 0);
  };

  const calculateCostPerUnit = () => {
    const total = calculateTotalCost();
    const output = parseFloat(formData.output_quantity) || 0;
    if (output === 0) return 0;
    return total / output;
  };

  const filteredSemifinished = semifinished.filter(item => {
    const matchesCategory = !filterCategory || item.category === filterCategory;
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Ingredient Row Component
  function IngredientRow({ index, ingredient, ingredients, updateIngredient, removeIngredient }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const selectedIngredient = ingredients.find(i => i.id === ingredient.ingredient_id);

    const filteredIngredients = ingredients.filter(ing =>
      ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectIngredient = (ing) => {
      updateIngredient(index, 'ingredient_id', ing.id);
      setSearchTerm('');
      setShowDropdown(false);
    };

    const calculateIngredientCost = () => {
      if (!selectedIngredient || !ingredient.weight) return 0;

      const weight = parseFloat(ingredient.weight);
      let quantity = weight;
      if (selectedIngredient.unit === 'кг' || selectedIngredient.unit === 'л') {
        quantity = weight / 1000;
      }
      return (quantity * selectedIngredient.purchase_price).toFixed(2);
    };

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowDropdown(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="flex gap-3 items-start bg-slate-50 p-4 rounded-xl">
        <div className="flex-1 relative" ref={dropdownRef}>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Ингредиент</label>
          <input
            type="text"
            value={selectedIngredient ? selectedIngredient.name : searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
              if (!e.target.value) {
                updateIngredient(index, 'ingredient_id', null);
              }
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
            placeholder="Начните вводить название..."
          />

          {showDropdown && filteredIngredients.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-auto">
              {filteredIngredients.map(ing => (
                <div
                  key={ing.id}
                  onClick={() => handleSelectIngredient(ing)}
                  className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                >
                  <div className="font-medium text-slate-900">{ing.name}</div>
                  <div className="text-xs text-slate-500">{ing.unit} • {ing.purchase_price} ₸/{ing.unit}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-32">
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Вес</label>
          <div className="relative">
            <input
              type="number"
              step="1"
              value={ingredient.weight}
              onChange={(e) => updateIngredient(index, 'weight', e.target.value)}
              className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
              placeholder="60"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">гр</span>
          </div>
        </div>

        {selectedIngredient && ingredient.weight && (
          <div className="w-24 pt-6">
            <div className="text-right">
              <div className="text-sm font-bold text-slate-900">{calculateIngredientCost()} ₸</div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => removeIngredient(index)}
          className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-2xl text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />

      {/* Заголовок */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Полуфабрикаты</h1>
          <p className="text-slate-500 mt-1">Промежуточные продукты для техкарт</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingSemifinished(null);
            setFormData({ name: '', category: '', unit: 'гр', output_quantity: '', ingredients: [] });
          }}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 font-semibold shadow-lg shadow-slate-300 transition-all active:scale-95"
        >
          {showForm ? <><X className="w-5 h-5" /> Отмена</> : <><Plus className="w-5 h-5" /> Добавить полуфабрикат</>}
        </button>
      </div>

      {/* Поиск и фильтры */}
      {!showForm && (
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск полуфабрикатов..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all bg-white"
          >
            <option value="">Все категории</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      )}

      {/* Форма создания/редактирования */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <h2 className="text-xl font-semibold mb-6 text-slate-900">
            {editingSemifinished ? 'Редактировать полуфабрикат' : 'Новый полуфабрикат'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Основная информация */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Название *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                  placeholder="Чайный раствор"
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
                  placeholder="Напитки"
                  list="category-suggestions"
                />
                <datalist id="category-suggestions">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Выход (количество)
                  <span className="text-xs text-slate-500 ml-2">опционально</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.output_quantity}
                    onChange={(e) => setFormData({ ...formData, output_quantity: e.target.value })}
                    className="w-full px-4 py-2.5 pr-16 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                    placeholder={`${calculateTotalWeight()} (сумма весов)`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{formData.unit}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Единица измерения</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all bg-white"
                >
                  <option value="гр">граммы (гр)</option>
                  <option value="мл">миллилитры (мл)</option>
                  <option value="шт">штуки (шт)</option>
                </select>
              </div>
            </div>

            {/* Состав */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Состав (только ингредиенты)</h3>
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
                  <FlaskConical className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">Добавьте ингредиенты для расчёта себестоимости</p>
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

            {/* Итого */}
            {formData.ingredients.length > 0 && (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-500">Себестоимость (всего)</div>
                    <div className="text-2xl font-bold text-slate-900">{calculateTotalCost().toFixed(2)} ₸</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Цена за {formData.unit}</div>
                    <div className="text-2xl font-bold text-emerald-600">{calculateCostPerUnit().toFixed(4)} ₸</div>
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
                {editingSemifinished ? 'Сохранить изменения' : 'Создать полуфабрикат'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingSemifinished(null);
                  setFormData({ name: '', category: '', unit: 'гр', output_quantity: '', ingredients: [] });
                }}
                className="bg-slate-100 text-slate-700 px-8 py-3 rounded-xl hover:bg-slate-200 font-semibold transition-all"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список полуфабрикатов */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Название</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Категория</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Выход</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Себестоимость</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Цена/{formData.unit || 'ед'}</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSemifinished.map(item => {
              const costPerUnit = item.output_quantity > 0 ? (item.cost / item.output_quantity) : 0;
              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    #{item.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {item.category || <span className="text-slate-400">-</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {item.output_quantity} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-base font-bold text-slate-900">
                      {item.cost?.toFixed(2) || '0.00'} ₸
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-emerald-600">
                      {costPerUnit.toFixed(4)} ₸
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900 font-medium inline-flex items-center gap-1"
                    >
                      <Pencil className="w-4 h-4" /> Изменить
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="text-red-600 hover:text-red-900 font-medium inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> Удалить
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredSemifinished.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <FlaskConical className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium">Нет полуфабрикатов</p>
            <p className="text-sm mt-2">
              {searchQuery || filterCategory
                ? 'Попробуйте изменить фильтры поиска'
                : 'Добавьте первый полуфабрикат, нажав на кнопку выше'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SemifinishedPage;
