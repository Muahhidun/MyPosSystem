import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Search, Plus, X, Edit2, Trash2, ShoppingBag, MoreHorizontal, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

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
    category: '', // DEPRECATED: для обратной совместимости
    category_id: null,
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
      const data = await api.getAllCategories({ type: 'product', active_only: true });
      setCategories(data);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  const filteredProducts = products.filter(product => {
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterCategory) {
      // Support both old category string and new category_id
      const matchesOld = product.category === filterCategory;
      const matchesNew = product.category_id && product.category_id.toString() === filterCategory;
      if (!matchesOld && !matchesNew) {
        return false;
      }
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
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
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

      setFormData({ name: '', price: '', category: '', category_id: null, is_available: true, show_in_pos: true });
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
      category: product.category || '', // DEPRECATED: for backward compatibility
      category_id: product.category_id || null,
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
      <AdminLayout title="Товары">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  // Форма создания/редактирования
  if (showForm) {
    return (
      <AdminLayout title={editingProduct ? 'Редактирование товара' : 'Новый товар'}>
        <Toaster position="top-right" />

        <div className="max-w-2xl">
          <button
            onClick={() => {
              setShowForm(false);
              setEditingProduct(null);
              setFormData({ name: '', price: '', category: '', category_id: null, is_available: true, show_in_pos: true });
            }}
            className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft size={18} className="mr-1" />
            Назад к списку
          </button>

          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-5">Основная информация</h3>

              <div className="space-y-5">
                <Input
                  label="Название товара"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Латте"
                  required
                />

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Цена (₸)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="450"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Категория
                    </label>
                    <select
                      value={formData.category_id || ''}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value || null })}
                      className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Без категории</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
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
                        checked={formData.is_available}
                        onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Доступен для продажи</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.show_in_pos}
                        onChange={(e) => setFormData({ ...formData, show_in_pos: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Показывать на кассе</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <Button type="submit" className="flex-1">
                    {editingProduct ? 'Сохранить изменения' : 'Создать товар'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowForm(false);
                      setEditingProduct(null);
                      setFormData({ name: '', price: '', category: '', category_id: null, is_available: true, show_in_pos: true });
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

  // Список товаров (table view)
  return (
    <AdminLayout title="Товары">
      <Toaster position="top-right" />

      {/* Заголовок и кнопка */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <p className="text-gray-500">Управление меню и товарами</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingProduct(null);
            setFormData({ name: '', price: '', category: '', category_id: null, is_available: true, show_in_pos: true });
          }}
        >
          <Plus size={18} /> Добавить товар
        </Button>
      </div>

      {/* Поиск и фильтры */}
      <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 grid grid-cols-12 gap-4 items-center">
        <div className="col-span-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input placeholder="Поиск по названию..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="col-span-4">
          <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Все категории</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Таблица товаров */}
      <div className="bg-white border border-gray-200 rounded-b-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
              <th className="px-6 py-3 w-16">ID</th>
              <th className="px-6 py-3">Название</th>
              <th className="px-6 py-3">Категория</th>
              <th className="px-6 py-3 text-right">Цена</th>
              <th className="px-6 py-3">Статус</th>
              <th className="px-6 py-3 text-center w-16">POS</th>
              <th className="px-6 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.map(product => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-3 text-gray-400 text-sm">#{product.id}</td>
                <td className="px-6 py-3 font-medium text-gray-900">{product.name}</td>
                <td className="px-6 py-3">
                  {product.category_name || product.category ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {product.category_name || product.category}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">{product.price.toFixed(2)} ₸</td>
                <td className="px-6 py-3">
                  <button
                    onClick={() => handleToggleAvailable(product)}
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      product.is_available
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {product.is_available ? 'Доступен' : 'Недоступен'}
                  </button>
                </td>
                <td className="px-6 py-3 text-center">
                  {product.show_in_pos ? (
                    <Eye size={16} className="inline text-green-600" />
                  ) : (
                    <EyeOff size={16} className="inline text-gray-400" />
                  )}
                </td>
                <td className="px-6 py-3 text-right relative">
                  <button
                    onClick={() => setShowActionsMenu(showActionsMenu === product.id ? null : product.id)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {showActionsMenu === product.id && (
                    <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        onClick={() => {
                          handleEdit(product);
                          setShowActionsMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                      >
                        <Edit2 size={14} /> Изменить
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(product.id, product.name);
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
        </div>

        {filteredProducts.length === 0 && products.length > 0 && (
          <div className="text-center py-16 text-gray-500">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">Ничего не найдено</p>
            <p className="text-sm mt-2">Попробуйте изменить параметры поиска</p>
          </div>
        )}

        {products.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">Нет товаров</p>
            <p className="text-sm mt-2">Добавьте первый товар, нажав на кнопку выше</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default ProductsPage;
