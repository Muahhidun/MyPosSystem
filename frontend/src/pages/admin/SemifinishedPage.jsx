import { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import AdminLayout from '../../components/AdminLayout';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Search, Plus, X, MoreHorizontal, FlaskConical, Edit2, Trash2, ArrowLeft } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Компонент вынесен наружу чтобы не пересоздаваться при каждом рендере
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
    <div className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
      <div className="flex-1 relative" ref={dropdownRef}>
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
          className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          placeholder="Начните вводить..."
        />

        {showDropdown && filteredIngredients.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
            {filteredIngredients.map(ing => (
              <div
                key={ing.id}
                onClick={() => handleSelectIngredient(ing)}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
              >
                <div className="font-medium text-gray-900 text-sm">{ing.name}</div>
                <div className="text-xs text-gray-500">{ing.unit} • {ing.purchase_price} ₸/{ing.unit}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-28">
        <div className="relative">
          <input
            type="number"
            step="1"
            value={ingredient.weight}
            onChange={(e) => updateIngredient(index, 'weight', e.target.value)}
            className="w-full h-10 px-3 pr-8 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="60"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">гр</span>
        </div>
      </div>

      {selectedIngredient && ingredient.weight && (
        <div className="w-20 flex items-center">
          <div className="text-sm font-semibold text-gray-900">{calculateIngredientCost()} ₸</div>
        </div>
      )}

      <button
        type="button"
        onClick={() => removeIngredient(index)}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all h-10 flex items-center justify-center"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function SemifinishedPage() {
  const [semifinished, setSemifinished] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSemifinished, setEditingSemifinished] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: 'гр',
    ingredients: []
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
      const outputQty = calculateTotalWeight();

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

      setFormData({ name: '', category: '', unit: 'гр', ingredients: [] });
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
        ingredients: fullItem.ingredients.map((ing, idx) => ({
          id: Date.now() + idx,
          ingredient_id: ing.ingredient_id,
          weight: ing.weight
        }))
      });
      setShowForm(true);
      setShowActionsMenu(null);
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
      setShowActionsMenu(null);
    } catch (error) {
      console.error('Ошибка удаления полуфабриката:', error);
      toast.error('Не удалось удалить полуфабрикат');
    }
  };

  const handleBack = () => {
    setShowForm(false);
    setEditingSemifinished(null);
    setFormData({ name: '', category: '', unit: 'гр', ingredients: [] });
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
    const output = calculateTotalWeight();
    if (output === 0) return 0;
    return (total / output) * 1000;
  };

  const filteredSemifinished = semifinished.filter(item => {
    const matchesCategory = !filterCategory || item.category === filterCategory;
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <AdminLayout title="Полуфабрикаты">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Полуфабрикаты">
      <Toaster position="top-right" />

      {!showForm ? (
        <>
          {/* Заголовок */}
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-gray-500">Управление заготовками и промежуточными продуктами</p>
            </div>
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingSemifinished(null);
                setFormData({ name: '', category: '', unit: 'гр', ingredients: [] });
              }}
            >
              <Plus size={18} />
              Создать полуфабрикат
            </Button>
          </div>

          {/* Панель фильтров */}
          <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 grid grid-cols-12 gap-4">
            <div className="col-span-8 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию..."
                className="pl-10"
              />
            </div>
            <div className="col-span-4">
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Все категории</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Таблица */}
          <div className="bg-white border border-gray-200 rounded-b-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto" style={{ minHeight: '70vh' }}>
              <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  <th className="px-6 py-3 w-16">ID</th>
                  <th className="px-6 py-3">Название</th>
                  <th className="px-6 py-3">Категория</th>
                  <th className="px-6 py-3 text-right">Выход</th>
                  <th className="px-6 py-3 text-right">Себестоимость</th>
                  <th className="px-6 py-3 text-right">Цена/кг</th>
                  <th className="px-6 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSemifinished.map((item) => {
                  const costPerUnit = item.output_quantity > 0 ? (item.cost / item.output_quantity) * 1000 : 0;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-3 text-gray-400 text-sm">#{item.id}</td>
                      <td className="px-6 py-3">
                        <span className="font-medium text-gray-800 text-sm">{item.name}</span>
                      </td>
                      <td className="px-6 py-3">
                        {item.category ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.category}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-gray-600">
                        {item.output_quantity} {item.unit}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                        {item.cost?.toFixed(2) || '0.00'} ₸
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-green-600 font-medium">
                        {costPerUnit.toFixed(2)} ₸
                      </td>
                      <td className="px-6 py-3 text-right relative">
                        <button
                          onClick={() => setShowActionsMenu(showActionsMenu === item.id ? null : item.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {showActionsMenu === item.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                            <button
                              onClick={() => handleEdit(item)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                            >
                              <Edit2 size={14} />
                              Изменить
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 size={14} />
                              Удалить
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>

            {filteredSemifinished.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <FlaskConical className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Нет полуфабрикатов</p>
                <p className="text-sm mt-2">
                  {searchQuery || filterCategory
                    ? 'Попробуйте изменить фильтры поиска'
                    : 'Добавьте первый полуфабрикат, нажав на кнопку выше'}
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        // Форма создания/редактирования
        <div className="max-w-5xl pb-20">
          <button onClick={handleBack} className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors">
            <ArrowLeft size={18} className="mr-1" />
            Назад к списку
          </button>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-3 gap-6">
              {/* Левая колонка */}
              <div className="col-span-2 space-y-6">
                {/* Основная информация */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Общее</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Название <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Чайный раствор"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                        <input
                          type="text"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Напитки"
                          list="category-suggestions"
                        />
                        <datalist id="category-suggestions">
                          {categories.map(cat => (
                            <option key={cat} value={cat} />
                          ))}
                        </datalist>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Единица измерения</label>
                        <select
                          value={formData.unit}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="гр">граммы (гр)</option>
                          <option value="мл">миллилитры (мл)</option>
                          <option value="шт">штуки (шт)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Состав */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Состав</h3>
                    <button
                      type="button"
                      onClick={addIngredient}
                      className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium"
                    >
                      <Plus className="w-4 h-4" /> Добавить
                    </button>
                  </div>

                  {formData.ingredients.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50">
                      <FlaskConical className="w-12 h-12 text-blue-300 mb-3" />
                      <p className="text-gray-500 text-sm">Добавьте ингредиенты для расчёта себестоимости</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
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
              </div>

              {/* Правая колонка */}
              <div className="space-y-6">
                {/* Выход */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Выход</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Количество (авто)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={calculateTotalWeight()}
                          readOnly
                          className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed font-semibold"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                          {formData.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Расчёты */}
                {formData.ingredients.length > 0 && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-6">
                    <h3 className="text-sm font-semibold text-green-900 mb-4">Себестоимость</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-green-700 mb-1">Всего</div>
                        <div className="text-2xl font-bold text-green-900">
                          {calculateTotalCost().toFixed(2)} ₸
                        </div>
                      </div>
                      <div className="pt-3 border-t border-green-200">
                        <div className="text-xs text-green-700 mb-1">Цена за кг</div>
                        <div className="text-lg font-bold text-green-600">
                          {calculateCostPerUnit().toFixed(2)} ₸
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Действия */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4">Действия</h3>
                  <div className="space-y-3">
                    <Button type="submit" className="w-full">
                      {editingSemifinished ? 'Сохранить изменения' : 'Создать полуфабрикат'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleBack}
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
      )}
    </AdminLayout>
  );
}

export default SemifinishedPage;
