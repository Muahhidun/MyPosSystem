import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Search, Plus, X, Edit2, Trash2, Package, MoreHorizontal, ArrowLeft, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

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

  const filteredIngredients = ingredients.filter(ingredient => {
    if (searchQuery && !ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterCategory && ingredient.category !== filterCategory) {
      return false;
    }
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
      toast.error('Заполните обязательные поля');
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
      toast.error('Не удалось сохранить ингредиент');
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
      <AdminLayout title="Ингредиенты">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  // Форма создания/редактирования
  if (showForm) {
    return (
      <AdminLayout title={editingIngredient ? 'Редактирование ингредиента' : 'Новый ингредиент'}>
        <Toaster position="top-right" />

        <div className="max-w-2xl">
          <button
            onClick={() => {
              setShowForm(false);
              setEditingIngredient(null);
              setFormData({ name: '', category: '', unit: 'кг', purchase_price: '', packaging_info: '' });
            }}
            className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft size={18} className="mr-1" />
            Назад к списку
          </button>

          {error && (
            <div className="mb-6 p-4 rounded-lg border bg-red-50 border-red-200 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <X size={18} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-5">Основная информация</h3>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <Input
                    label="Название"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Манговое пюре Ponthier"
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

                <div className="grid grid-cols-2 gap-5">
                  <Select
                    label="Единица измерения"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required
                  >
                    {UNITS.map(unit => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                  </Select>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Цена закупки (за единицу)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                      className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="2333"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1.5">Цена за 1 {formData.unit}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Информация об упаковке
                  </label>
                  <textarea
                    value={formData.packaging_info}
                    onChange={(e) => setFormData({ ...formData, packaging_info: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Коробка 12 банок по 1.2кг, цена коробки 33600₸"
                    rows="2"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Фасовка, количество в коробке, цена упаковки</p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <Button type="submit" className="flex-1">
                    {editingIngredient ? 'Сохранить изменения' : 'Создать ингредиент'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowForm(false);
                      setEditingIngredient(null);
                      setFormData({ name: '', category: '', unit: 'кг', purchase_price: '', packaging_info: '' });
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </AdminLayout>
    );
  }

  // Список ингредиентов (table view)
  return (
    <AdminLayout title="Ингредиенты">
      <Toaster position="top-right" />

      <div className="flex justify-between items-end mb-6">
        <div>
          <p className="text-gray-500">Справочник ингредиентов и сырья</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingIngredient(null);
            setFormData({ name: '', category: '', unit: 'кг', purchase_price: '', packaging_info: '' });
          }}
        >
          <Plus size={18} /> Добавить ингредиент
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg border bg-red-50 border-red-200 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-auto">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Поиск и фильтры */}
      <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 grid grid-cols-12 gap-4 items-center">
        <div className="col-span-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input placeholder="Поиск по названию..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="col-span-3">
          <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Все категории</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </Select>
        </div>
        <div className="col-span-3">
          <Select value={filterUnit} onChange={(e) => setFilterUnit(e.target.value)}>
            <option value="">Все единицы</option>
            {UNITS.map(unit => (
              <option key={unit.value} value={unit.value}>{unit.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Таблица ингредиентов */}
      <div className="bg-white border border-gray-200 rounded-b-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
              <th className="px-6 py-3 w-16">ID</th>
              <th className="px-6 py-3">Название</th>
              <th className="px-6 py-3">Категория</th>
              <th className="px-6 py-3">Единица</th>
              <th className="px-6 py-3 text-right">Цена закупки</th>
              <th className="px-6 py-3">Упаковка</th>
              <th className="px-6 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredIngredients.map(ingredient => (
              <tr key={ingredient.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-3 text-gray-400 text-sm">#{ingredient.id}</td>
                <td className="px-6 py-3 font-medium text-gray-900">{ingredient.name}</td>
                <td className="px-6 py-3">
                  {ingredient.category ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {ingredient.category}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-6 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                    {ingredient.unit}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="text-sm font-medium text-gray-900">{ingredient.purchase_price.toFixed(2)} ₸</div>
                  <div className="text-xs text-gray-500">за {ingredient.unit}</div>
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">
                  {ingredient.packaging_info ? (
                    <div className="max-w-xs truncate">{ingredient.packaging_info}</div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-3 text-right relative">
                  <button
                    onClick={() => setShowActionsMenu(showActionsMenu === ingredient.id ? null : ingredient.id)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {showActionsMenu === ingredient.id && (
                    <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        onClick={() => {
                          handleEdit(ingredient);
                          setShowActionsMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                      >
                        <Edit2 size={14} /> Изменить
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(ingredient.id, ingredient.name);
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

        {filteredIngredients.length === 0 && ingredients.length > 0 && (
          <div className="text-center py-16 text-gray-500">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">Ничего не найдено</p>
            <p className="text-sm mt-2">Попробуйте изменить параметры поиска</p>
          </div>
        )}

        {ingredients.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">Нет ингредиентов</p>
            <p className="text-sm mt-2">Добавьте первый ингредиент, нажав на кнопку выше</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default IngredientsPage;
