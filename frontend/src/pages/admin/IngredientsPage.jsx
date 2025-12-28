import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Search, Plus, X, Edit2, Trash2, Package, MoreHorizontal } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';

// Фиксированный список единиц измерения
const UNITS = [
  { value: 'кг', label: 'кг (килограмм)' },
  { value: 'г', label: 'г (грамм)' },
  { value: 'л', label: 'л (литр)' },
  { value: 'мл', label: 'мл (миллилитр)' },
  { value: 'шт', label: 'шт (штука)' }
];

function IngredientsPage() {
  const [ingredients, setIngredients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: 'кг',
    purchase_price: '',
    packaging_info: ''
  });

  useEffect(() => {
    loadIngredients();
    loadCategories();
  }, []);

  const loadIngredients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getIngredients();
      setIngredients(data);
    } catch (error) {
      console.error('Ошибка загрузки ингредиентов:', error);
      setError('Не удалось загрузить ингредиенты. Попробуйте обновить страницу.');
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  };

  // Клиентская фильтрация и поиск
  const filteredIngredients = ingredients.filter(ingredient => {
    // Фильтр по поиску
    if (searchQuery && !ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Фильтр по категории
    if (filterCategory && ingredient.category !== filterCategory) {
      return false;
    }

    // Фильтр по единице измерения
    if (filterUnit && ingredient.unit !== filterUnit) {
      return false;
    }

    return true;
  });

  const loadCategories = async () => {
    try {
      const data = await api.getIngredientCategories();
      setCategories(data);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.unit || !formData.purchase_price) {
      toast.error('Заполните обязательные поля: название, единицу измерения и цену');
      return;
    }

    try {
      const data = {
        name: formData.name,
        category: formData.category || null,
        unit: formData.unit,
        purchase_price: parseFloat(formData.purchase_price),
        packaging_info: formData.packaging_info || null
      };

      if (editingIngredient) {
        await api.updateIngredient(editingIngredient.id, data);
        toast.success('Ингредиент обновлён');
      } else {
        await api.createIngredient(data);
        toast.success('Ингредиент создан');
      }

      setFormData({ name: '', category: '', unit: 'кг', purchase_price: '', packaging_info: '' });
      setEditingIngredient(null);
      setShowForm(false);
      loadIngredients();
      loadCategories();
    } catch (error) {
      console.error('Ошибка сохранения ингредиента:', error);
      toast.error('Не удалось сохранить ингредиент: ' + (error.message || 'Неизвестная ошибка'));
    }
  };

  const handleEdit = (ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      category: ingredient.category || '',
      unit: ingredient.unit,
      purchase_price: ingredient.purchase_price,
      packaging_info: ingredient.packaging_info || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Удалить ингредиент "${name}"?`)) {
      return;
    }

    try {
      await api.deleteIngredient(id);
      toast.success('Ингредиент удалён');
      loadIngredients();
      loadCategories();
    } catch (error) {
      console.error('Ошибка удаления ингредиента:', error);
      toast.error('Не удалось удалить ингредиент');
    }
  };

  if (loading) {
    return (
      <AdminLayout breadcrumbs={['Меню', 'Ингредиенты']}>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  // Форма создания/редактирования
  if (showForm) {
    return (
      <AdminLayout breadcrumbs={['Меню', 'Ингредиенты', editingIngredient ? 'Редактирование' : 'Создание']}>
        <Toaster position="top-right" />

        {/* Заголовок формы */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {editingIngredient ? 'Редактировать ингредиент' : 'Новый ингредиент'}
            </h1>
            <p className="text-slate-500 mt-1">Справочник ингредиентов и сырья</p>
          </div>
          <button
            onClick={() => {
              setShowForm(false);
              setEditingIngredient(null);
              setFormData({ name: '', category: '', unit: 'кг', purchase_price: '', packaging_info: '' });
            }}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl hover:bg-slate-200 font-medium transition-all"
          >
            <X size={18} /> Отмена
          </button>
        </div>

        {/* Ошибки */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <X size={18} className="text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Форма редактирования */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b">Основная информация</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Название *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                    placeholder="Манговое пюре Ponthier"
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
                    placeholder="Пюре"
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Единица измерения *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                    required
                  >
                    {UNITS.map(unit => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Цена закупки (за единицу) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                      className="w-full px-4 py-2.5 pr-8 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                      placeholder="2333"
                      required
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">₸</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Цена за 1 {formData.unit}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Информация об упаковке (опционально)</label>
                <textarea
                  value={formData.packaging_info}
                  onChange={(e) => setFormData({ ...formData, packaging_info: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                  placeholder="Коробка 12 банок по 1.2кг, цена коробки 33600₸"
                  rows="2"
                />
                <p className="text-xs text-slate-500 mt-1">Например: фасовка, количество в коробке, цена упаковки</p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-all active:scale-[0.98]"
                >
                  {editingIngredient ? 'Сохранить изменения' : 'Создать ингредиент'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingIngredient(null);
                    setFormData({ name: '', category: '', unit: 'кг', purchase_price: '', packaging_info: '' });
                  }}
                  className="bg-slate-100 text-slate-700 px-8 py-2.5 rounded-lg hover:bg-slate-200 font-medium transition-all"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </form>
      </AdminLayout>
    );
  }

  // Список ингредиентов (table view)
  return (
    <AdminLayout breadcrumbs={['Меню', 'Ингредиенты']}>
      <Toaster position="top-right" />

      {/* Заголовок */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ингредиенты</h1>
          <p className="text-slate-500 mt-1">Справочник ингредиентов и сырья</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingIngredient(null);
            setFormData({ name: '', category: '', unit: 'кг', purchase_price: '', packaging_info: '' });
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 font-medium shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus size={18} /> Добавить ингредиент
        </button>
      </div>

      {/* Ошибки */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <X size={18} className="text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Поиск и фильтры */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="grid grid-cols-3 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Единица измерения</label>
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
            >
              <option value="">Все единицы</option>
              {UNITS.map(unit => (
                <option key={unit.value} value={unit.value}>{unit.label}</option>
              ))}
            </select>
          </div>
        </div>

        {(searchQuery || filterCategory || filterUnit) && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Package className="w-4 h-4" />
              <span>Найдено: <span className="font-semibold text-slate-900">{filteredIngredients.length}</span> из {ingredients.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Список ингредиентов */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
        <div className="overflow-x-auto">
          <table className="min-w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
              <th className="px-6 py-3 text-left w-16">ID</th>
              <th className="px-6 py-3 text-left">Название</th>
              <th className="px-6 py-3 text-left">Категория</th>
              <th className="px-6 py-3 text-left">Единица</th>
              <th className="px-6 py-3 text-right">Цена закупки</th>
              <th className="px-6 py-3 text-left">Упаковка</th>
              <th className="px-6 py-3 text-right w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredIngredients.map(ingredient => (
              <tr key={ingredient.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-400">
                  #{ingredient.id}
                </td>
                <td className="px-6 py-3">
                  <div className="font-semibold text-slate-900">{ingredient.name}</div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  {ingredient.category ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {ingredient.category}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                    {ingredient.unit}
                  </span>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-right">
                  <div className="font-semibold text-slate-900">{ingredient.purchase_price.toFixed(2)} ₸</div>
                  <div className="text-xs text-slate-500">за {ingredient.unit}</div>
                </td>
                <td className="px-6 py-3 text-sm text-slate-600">
                  {ingredient.packaging_info ? (
                    <div className="max-w-xs">{ingredient.packaging_info}</div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-right relative">
                  <button
                    onClick={() => setShowActionsMenu(showActionsMenu === ingredient.id ? null : ingredient.id)}
                    className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {showActionsMenu === ingredient.id && (
                    <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                      <button
                        onClick={() => {
                          handleEdit(ingredient);
                          setShowActionsMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
                      >
                        <Edit2 size={14} /> Изменить
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(ingredient.id, ingredient.name);
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
        </div>

        {filteredIngredients.length === 0 && ingredients.length > 0 && (
          <div className="text-center py-16 text-slate-500">
            <Search className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <p className="text-lg font-medium">Ничего не найдено</p>
            <p className="text-sm mt-2">Попробуйте изменить параметры поиска</p>
          </div>
        )}

        {ingredients.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <p className="text-lg font-medium">Нет ингредиентов</p>
            <p className="text-sm mt-2">Добавьте первый ингредиент, нажав на кнопку выше</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default IngredientsPage;
