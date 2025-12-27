import { useState, useEffect } from 'react';
import api from '../../api/client';

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
      setError('Заполните обязательные поля: название, единицу измерения и цену');
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
      } else {
        await api.createIngredient(data);
      }

      setFormData({ name: '', category: '', unit: 'кг', purchase_price: '', packaging_info: '' });
      setEditingIngredient(null);
      setShowForm(false);
      loadIngredients();
      loadCategories();
    } catch (error) {
      console.error('Ошибка сохранения ингредиента:', error);
      setError('Не удалось сохранить ингредиент: ' + (error.message || 'Неизвестная ошибка'));
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

    setError(null);
    try {
      await api.deleteIngredient(id);
      loadIngredients();
      loadCategories();
    } catch (error) {
      console.error('Ошибка удаления ингредиента:', error);
      setError('Не удалось удалить ингредиент');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-2xl text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ингредиенты</h1>
          <p className="text-gray-600 mt-1">Справочник ингредиентов и сырья</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingIngredient(null);
            setFormData({ name: '', category: '', unit: 'кг', purchase_price: '', packaging_info: '' });
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold shadow-lg"
        >
          {showForm ? 'Отмена' : '+ Добавить ингредиент'}
        </button>
      </div>

      {/* Отображение ошибок */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Закрыть</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Поиск и фильтры */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-3 gap-4">
          {/* Быстрый поиск */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Быстрый поиск
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Фильтр по категории */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Все категории</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Фильтр по единице измерения */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Единица измерения
            </label>
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Все единицы</option>
              {UNITS.map(unit => (
                <option key={unit.value} value={unit.value}>{unit.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Показать количество найденных */}
        {(searchQuery || filterCategory || filterUnit) && (
          <div className="mt-3 text-sm text-gray-600">
            Найдено: {filteredIngredients.length} из {ingredients.length}
          </div>
        )}
      </div>

      {/* Форма создания/редактирования */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border-2 border-blue-100">
          <h2 className="text-xl font-semibold mb-4">
            {editingIngredient ? 'Редактировать ингредиент' : 'Новый ингредиент'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Манговое пюре Ponthier"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Категория
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Единица измерения *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {UNITS.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Цена закупки (за единицу) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="2333"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Цена за 1 {formData.unit}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Информация об упаковке (опционально)
              </label>
              <textarea
                value={formData.packaging_info}
                onChange={(e) => setFormData({ ...formData, packaging_info: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Коробка 12 банок по 1.2кг, цена коробки 33600₸"
                rows="2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Например: фасовка, количество в коробке, цена упаковки
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold"
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
                className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список ингредиентов */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b-2">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Название
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Категория
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Единица
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Цена закупки
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Упаковка
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredIngredients.map(ingredient => (
              <tr key={ingredient.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{ingredient.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-semibold text-gray-900">{ingredient.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {ingredient.category || <span className="text-gray-400">-</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded">
                    {ingredient.unit}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-semibold text-gray-900">
                    {ingredient.purchase_price.toFixed(2)} тг/{ingredient.unit}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {ingredient.packaging_info ? (
                    <div className="max-w-xs">{ingredient.packaging_info}</div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                  <button
                    onClick={() => handleEdit(ingredient)}
                    className="text-blue-600 hover:text-blue-900 font-medium"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => handleDelete(ingredient.id, ingredient.name)}
                    className="text-red-600 hover:text-red-900 font-medium"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredIngredients.length === 0 && ingredients.length > 0 && (
          <div className="text-center py-16 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-lg font-medium">Ничего не найдено</p>
            <p className="text-sm mt-2">Попробуйте изменить параметры поиска</p>
          </div>
        )}

        {ingredients.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-lg font-medium">Нет ингредиентов</p>
            <p className="text-sm mt-2">Добавьте первый ингредиент, нажав на кнопку выше</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default IngredientsPage;
