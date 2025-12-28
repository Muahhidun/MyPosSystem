import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Search, Plus, X, Edit2, Trash2, ShoppingBag, MoreHorizontal } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    is_available: true,
    show_in_pos: true
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
      toast.error('Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      // Извлекаем уникальные категории из товаров
      const data = await api.getProducts();
      const uniqueCategories = [...new Set(data.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  // Фильтрация товаров
  const filteredProducts = products.filter(product => {
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterCategory && product.category !== filterCategory) {
      return false;
    }
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      toast.error('Заполните название и цену');
      return;
    }

    try {
      const data = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category || null,
        is_available: formData.is_available,
        show_in_pos: formData.show_in_pos
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, data);
        toast.success('Товар обновлён');
      } else {
        await api.createProduct(data);
        toast.success('Товар создан');
      }

      setFormData({ name: '', price: '', category: '', is_available: true, show_in_pos: true });
      setEditingProduct(null);
      setShowForm(false);
      loadProducts();
      loadCategories();
    } catch (error) {
      console.error('Ошибка сохранения товара:', error);
      toast.error('Не удалось сохранить товар');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category || '',
      is_available: product.is_available,
      show_in_pos: product.show_in_pos !== undefined ? product.show_in_pos : true
    });
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Удалить товар "${name}"?`)) {
      return;
    }

    try {
      await api.deleteProduct(id);
      toast.success('Товар удалён');
      loadProducts();
      loadCategories();
    } catch (error) {
      console.error('Ошибка удаления товара:', error);
      toast.error('Не удалось удалить товар');
    }
  };

  const handleToggleAvailable = async (product) => {
    try {
      await api.updateProduct(product.id, {
        is_available: !product.is_available
      });
      toast.success(product.is_available ? 'Товар отключён' : 'Товар включён');
      loadProducts();
    } catch (error) {
      console.error('Ошибка обновления товара:', error);
      toast.error('Не удалось обновить товар');
    }
  };

  if (loading) {
    return (
      <AdminLayout breadcrumbs={['Меню', 'Товары']}>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  // Форма создания/редактирования
  if (showForm) {
    return (
      <AdminLayout breadcrumbs={['Меню', 'Товары', editingProduct ? 'Редактирование' : 'Создание']}>
        <Toaster position="top-right" />

        {/* Заголовок формы */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {editingProduct ? 'Редактировать товар' : 'Новый товар'}
            </h1>
            <p className="text-slate-500 mt-1">Управление меню и товарами</p>
          </div>
          <button
            onClick={() => {
              setShowForm(false);
              setEditingProduct(null);
              setFormData({ name: '', price: '', category: '', is_available: true, show_in_pos: true });
            }}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl hover:bg-slate-200 font-medium transition-all"
          >
            <X size={18} /> Отмена
          </button>
        </div>

        {/* Форма редактирования */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b">Основная информация</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Название товара *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                    placeholder="Латте"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Цена *</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-2.5 pr-8 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                      placeholder="450"
                      required
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">₸</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Категория</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                  placeholder="Напитки, Еда, Десерты..."
                  list="categories-list"
                />
                <datalist id="categories-list">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div className="flex gap-6 p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <label className="ml-2 text-sm font-medium text-slate-700">
                    Доступен для продажи
                  </label>
                </div>

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
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-all active:scale-[0.98]"
                >
                  {editingProduct ? 'Сохранить изменения' : 'Создать товар'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProduct(null);
                    setFormData({ name: '', price: '', category: '', is_available: true, show_in_pos: true });
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

  // Список товаров (table view)
  return (
    <AdminLayout breadcrumbs={['Меню', 'Товары']}>
      <Toaster position="top-right" />

      {/* Заголовок */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Товары</h1>
          <p className="text-slate-500 mt-1">Управление меню и товарами</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingProduct(null);
            setFormData({ name: '', price: '', category: '', is_available: true, show_in_pos: true });
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 font-medium shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus size={18} /> Добавить товар
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
              <ShoppingBag className="w-4 h-4" />
              <span>Найдено: <span className="font-semibold text-slate-900">{filteredProducts.length}</span> из {products.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Список товаров */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
        <div className="overflow-x-auto">
          <table className="min-w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
              <th className="px-6 py-3 text-left w-16">ID</th>
              <th className="px-6 py-3 text-left">Название</th>
              <th className="px-6 py-3 text-left">Категория</th>
              <th className="px-6 py-3 text-right">Цена</th>
              <th className="px-6 py-3 text-left">Статус</th>
              <th className="px-6 py-3 text-right w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.map(product => (
              <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-400">
                  #{product.id}
                </td>
                <td className="px-6 py-3">
                  <div className="font-semibold text-slate-900">{product.name}</div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  {product.category ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {product.category}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-right">
                  <div className="font-semibold text-slate-900">{product.price.toFixed(2)} ₸</div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleAvailable(product)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                      product.is_available
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {product.is_available ? 'Доступен' : 'Недоступен'}
                  </button>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-right relative">
                  <button
                    onClick={() => setShowActionsMenu(showActionsMenu === product.id ? null : product.id)}
                    className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {showActionsMenu === product.id && (
                    <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                      <button
                        onClick={() => {
                          handleEdit(product);
                          setShowActionsMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
                      >
                        <Edit2 size={14} /> Изменить
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(product.id, product.name);
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

        {filteredProducts.length === 0 && products.length > 0 && (
          <div className="text-center py-16 text-slate-500">
            <Search className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <p className="text-lg font-medium">Ничего не найдено</p>
            <p className="text-sm mt-2">Попробуйте изменить параметры поиска</p>
          </div>
        )}

        {products.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <p className="text-lg font-medium">Нет товаров</p>
            <p className="text-sm mt-2">Добавьте первый товар, нажав на кнопку выше</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default ProductsPage;
