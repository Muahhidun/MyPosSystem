import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Check } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { Button } from './ui/Button';

function VariantsModal({ product, onClose }) {
  const [variants, setVariants] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingVariant, setEditingVariant] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    size_code: '',
    recipe_id: null,
    price_adjustment: 0,
    is_default: false,
    is_active: true,
    display_order: 0
  });

  useEffect(() => {
    loadData();
  }, [product.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [variantsData, recipesData] = await Promise.all([
        api.getProductVariants(product.id),
        api.getRecipes()
      ]);
      setVariants(variantsData);
      setRecipes(recipesData);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.recipe_id) {
      toast.error('Заполните название и выберите техкарту');
      return;
    }

    try {
      if (editingVariant) {
        await api.updateProductVariant(product.id, editingVariant.id, formData);
        toast.success('Вариант обновлён');
      } else {
        await api.createProductVariant(product.id, formData);
        toast.success('Вариант создан');
      }

      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.message || 'Ошибка сохранения');
    }
  };

  const handleEdit = (variant) => {
    setEditingVariant(variant);
    setFormData({
      name: variant.name,
      size_code: variant.size_code || '',
      recipe_id: variant.recipe_id,
      price_adjustment: variant.price_adjustment,
      is_default: variant.is_default,
      is_active: variant.is_active,
      display_order: variant.display_order
    });
    setShowForm(true);
  };

  const handleDelete = async (variantId) => {
    if (!confirm('Удалить вариант?')) return;

    try {
      await api.deleteProductVariant(product.id, variantId);
      toast.success('Вариант удалён');
      loadData();
    } catch (error) {
      toast.error(error.message || 'Ошибка удаления');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      size_code: '',
      recipe_id: null,
      price_adjustment: 0,
      is_default: false,
      is_active: true,
      display_order: 0
    });
    setEditingVariant(null);
    setShowForm(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Размеры товара</h2>
            <p className="text-sm text-gray-500 mt-1">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                  💡 <strong>Как это работает:</strong> Создайте отдельные техкарты для каждого размера
                  (например, "Bubble Tea 500мл", "700мл", "1000мл" с разными граммами ингредиентов).
                  Затем привяжите их как варианты одного товара. На кассе клиент сможет выбрать размер.
                </p>
              </div>

              {/* Add button */}
              {!showForm && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="mb-4"
                >
                  <Plus size={18} /> Добавить размер
                </Button>
              )}

              {/* Form */}
              {showForm && (
                <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Название <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="500 мл (S)"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Код размера
                      </label>
                      <input
                        type="text"
                        placeholder="S, M, L"
                        value={formData.size_code}
                        onChange={(e) => setFormData({ ...formData, size_code: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        maxLength="10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Техкарта <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.recipe_id || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, recipe_id: parseInt(e.target.value) || null })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        required
                      >
                        <option value="">Выберите техкарту</option>
                        {recipes.map((recipe) => (
                          <option key={recipe.id} value={recipe.id}>
                            {recipe.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Доплата к цене (₸)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price_adjustment}
                        onChange={(e) =>
                          setFormData({ ...formData, price_adjustment: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_default}
                        onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">По умолчанию</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Активен</span>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      {editingVariant ? 'Сохранить' : 'Добавить'}
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={resetForm}>
                      Отмена
                    </Button>
                  </div>
                </form>
              )}

              {/* Variants List */}
              <div className="space-y-2">
                {variants.length > 0 ? (
                  variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{variant.name}</span>
                          {variant.size_code && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                              {variant.size_code}
                            </span>
                          )}
                          {variant.is_default && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1">
                              <Check size={12} /> По умолчанию
                            </span>
                          )}
                          {!variant.is_active && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                              Неактивен
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Техкарта: {variant.recipe_name}
                          {variant.price_adjustment > 0 && ` • +${variant.price_adjustment}₸`}
                          {variant.price_adjustment < 0 && ` • ${variant.price_adjustment}₸`}
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(variant)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(variant.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg font-medium mb-2">Вариантов пока нет</p>
                    <p className="text-sm">Добавьте первый размер для этого товара</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <Button onClick={onClose} variant="secondary" className="w-full">
            Закрыть
          </Button>
        </div>
      </div>
    </div>
  );
}

export default VariantsModal;
