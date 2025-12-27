import { useState, useEffect } from 'react';
import api from '../../api/client';

function IngredientsPage() {
  const [ingredients, setIngredients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [stockIngredient, setStockIngredient] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '',
    purchase_price: '',
    stock_quantity: '',
    min_stock: ''
  });

  const [stockFormData, setStockFormData] = useState({
    quantity: '',
    reason: ''
  });

  useEffect(() => {
    loadIngredients();
    loadCategories();
  }, [filterCategory, filterLowStock]);

  const loadIngredients = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterCategory) params.category = filterCategory;
      if (filterLowStock) params.low_stock = true;

      const data = await api.getIngredients(params);
      setIngredients(data);
    } catch (error) {
      console.error('Ошибка загрузки ингредиентов:', error);
      alert('Не удалось загрузить ингредиенты');
    } finally {
      setLoading(false);
    }
  };

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

    if (!formData.name || !formData.unit || !formData.purchase_price) {
      alert('Заполните обязательные поля: название, единицу измерения и цену');
      return;
    }

    try {
      const data = {
        name: formData.name,
        category: formData.category || null,
        unit: formData.unit,
        purchase_price: parseFloat(formData.purchase_price),
        stock_quantity: parseFloat(formData.stock_quantity) || 0,
        min_stock: parseFloat(formData.min_stock) || 0
      };

      if (editingIngredient) {
        await api.updateIngredient(editingIngredient.id, data);
        alert('Ингредиент обновлен');
      } else {
        await api.createIngredient(data);
        alert('Ингредиент создан');
      }

      setFormData({ name: '', category: '', unit: '', purchase_price: '', stock_quantity: '', min_stock: '' });
      setEditingIngredient(null);
      setShowForm(false);
      loadIngredients();
      loadCategories();
    } catch (error) {
      console.error('Ошибка сохранения ингредиента:', error);
      alert('Не удалось сохранить ингредиент: ' + (error.message || ''));
    }
  };

  const handleEdit = (ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      category: ingredient.category || '',
      unit: ingredient.unit,
      purchase_price: ingredient.purchase_price,
      stock_quantity: ingredient.stock_quantity,
      min_stock: ingredient.min_stock
    });
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Удалить ингредиент "${name}"?`)) {
      return;
    }

    try {
      await api.deleteIngredient(id);
      alert('Ингредиент удален');
      loadIngredients();
      loadCategories();
    } catch (error) {
      console.error('Ошибка удаления ингредиента:', error);
      alert('Не удалось удалить ингредиент');
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();

    if (!stockFormData.quantity) {
      alert('Укажите количество');
      return;
    }

    try {
      await api.updateIngredientStock(stockIngredient.id, {
        quantity: parseFloat(stockFormData.quantity),
        reason: stockFormData.reason
      });
      alert('Остаток обновлен');
      setShowStockModal(false);
      setStockIngredient(null);
      setStockFormData({ quantity: '', reason: '' });
      loadIngredients();
    } catch (error) {
      console.error('Ошибка обновления остатка:', error);
      alert('Не удалось обновить остаток: ' + (error.message || ''));
    }
  };

  const openStockModal = (ingredient) => {
    setStockIngredient(ingredient);
    setStockFormData({ quantity: '', reason: '' });
    setShowStockModal(true);
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
          <p className="text-gray-600 mt-1">Управление складом и остатками</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingIngredient(null);
            setFormData({ name: '', category: '', unit: '', purchase_price: '', stock_quantity: '', min_stock: '' });
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold shadow-lg"
        >
          {showForm ? 'Отмена' : '+ Добавить ингредиент'}
        </button>
      </div>

      {/* Фильтры */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex gap-4 items-center">
        <div className="flex-1">
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

        <div className="flex items-center pt-6">
          <input
            type="checkbox"
            checked={filterLowStock}
            onChange={(e) => setFilterLowStock(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded"
          />
          <label className="ml-3 text-sm font-medium text-gray-700">
            Только с низким остатком
          </label>
        </div>
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
                  placeholder="Молоко 3.2%"
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
                  placeholder="Молочные продукты"
                  list="categories-list"
                />
                <datalist id="categories-list">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Единица измерения *
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="кг, л, шт"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Цена закупки (за ед.) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="450"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Мин. остаток
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="5"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Начальный остаток
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
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
                  setFormData({ name: '', category: '', unit: '', purchase_price: '', stock_quantity: '', min_stock: '' });
                }}
                className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Модальное окно корректировки остатка */}
      {showStockModal && stockIngredient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">
              Корректировка остатка: {stockIngredient.name}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Текущий остаток: <span className="font-bold">{stockIngredient.stock_quantity} {stockIngredient.unit}</span>
            </p>

            <form onSubmit={handleStockUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Изменение количества *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={stockFormData.quantity}
                  onChange={(e) => setStockFormData({ ...stockFormData, quantity: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+10 (приход) или -5 (расход)"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Положительное число для прихода, отрицательное для расхода
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Причина (опционально)
                </label>
                <input
                  type="text"
                  value={stockFormData.reason}
                  onChange={(e) => setStockFormData({ ...stockFormData, reason: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Поставка от поставщика, списание и т.д."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold flex-1"
                >
                  Обновить остаток
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowStockModal(false);
                    setStockIngredient(null);
                    setStockFormData({ quantity: '', reason: '' });
                  }}
                  className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 font-semibold flex-1"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
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
                Остаток
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Цена закупки
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Стоимость остатка
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ingredients.map(ingredient => {
              const stockValue = ingredient.stock_quantity * ingredient.purchase_price;
              const isLowStock = ingredient.stock_quantity <= ingredient.min_stock;

              return (
                <tr key={ingredient.id} className={isLowStock ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}>
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
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {ingredient.stock_quantity} {ingredient.unit}
                      </span>
                      {isLowStock && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                          Низкий!
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Мин: {ingredient.min_stock} {ingredient.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">
                      {ingredient.purchase_price.toFixed(2)} тг/{ingredient.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-bold text-green-600">
                      {stockValue.toFixed(2)} тг
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                    <button
                      onClick={() => openStockModal(ingredient)}
                      className="text-green-600 hover:text-green-900 font-medium"
                    >
                      Остаток
                    </button>
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
              );
            })}
          </tbody>
        </table>

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
