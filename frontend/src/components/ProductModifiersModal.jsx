import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { Button } from './ui/Button';

function ProductModifiersModal({ product, onClose }) {
  const [linkedGroups, setLinkedGroups] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');

  useEffect(() => {
    loadData();
  }, [product.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [linkedData, allGroups] = await Promise.all([
        api.getProductModifiers(product.id),
        api.getModifierGroups({ active_only: true })
      ]);

      setLinkedGroups(linkedData);

      // Filter out already linked groups
      const linkedIds = linkedData.map(g => g.id);
      const available = allGroups.filter(g => !linkedIds.includes(g.id));
      setAvailableGroups(available);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();

    if (!selectedGroupId) {
      toast.error('Выберите группу модификаций');
      return;
    }

    try {
      await api.linkModifierGroupToProduct(product.id, {
        modifier_group_id: parseInt(selectedGroupId),
        display_order: linkedGroups.length
      });

      toast.success('Группа добавлена');
      setShowAddForm(false);
      setSelectedGroupId('');
      loadData();
    } catch (error) {
      toast.error(error.message || 'Ошибка добавления');
    }
  };

  const handleRemoveGroup = async (groupId) => {
    if (!confirm('Отвязать группу модификаций от товара?')) return;

    try {
      await api.unlinkModifierGroupFromProduct(product.id, groupId);
      toast.success('Группа отвязана');
      loadData();
    } catch (error) {
      toast.error(error.message || 'Ошибка удаления');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Модификации товара</h2>
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
                  💡 <strong>Как это работает:</strong> Сначала создайте группы модификаций на странице
                  "Модификации". Затем привяжите нужные группы к товару. На кассе клиент сможет выбрать
                  добавки из привязанных групп (тапиока, сиропы, лёд и т.д.).
                </p>
              </div>

              {/* Add button */}
              {availableGroups.length > 0 && !showAddForm && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="mb-4"
                >
                  <Plus size={18} /> Добавить группу
                </Button>
              )}

              {availableGroups.length === 0 && linkedGroups.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-900">
                    ⚠️ Сначала создайте группы модификаций на странице "Модификации"
                  </p>
                </div>
              )}

              {/* Add Form */}
              {showAddForm && (
                <form onSubmit={handleAddGroup} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Выберите группу модификаций
                    </label>
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    >
                      <option value="">-- Выберите --</option>
                      {availableGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name} ({group.modifiers?.length || 0} модификаций)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      Добавить
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowAddForm(false);
                        setSelectedGroupId('');
                      }}
                    >
                      Отмена
                    </Button>
                  </div>
                </form>
              )}

              {/* Linked Groups List */}
              <div className="space-y-3">
                {linkedGroups.length > 0 ? (
                  linkedGroups.map((group) => (
                    <div
                      key={group.id}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">{group.name}</h3>
                            {group.is_required && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                Обязательно
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {group.selection_type === 'single' ? 'Один выбор' : 'Множественный выбор'}
                            {group.min_selections > 0 && ` • Мин: ${group.min_selections}`}
                            {group.max_selections && ` • Макс: ${group.max_selections}`}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveGroup(group.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Modifiers in this group */}
                      {group.modifiers && group.modifiers.length > 0 && (
                        <div className="border-t border-gray-100 pt-3 mt-3">
                          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            Модификации в группе:
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {group.modifiers.map((modifier) => (
                              <div
                                key={modifier.id}
                                className="text-sm bg-gray-50 rounded px-3 py-2 flex items-center justify-between"
                              >
                                <span className="text-gray-700">{modifier.name}</span>
                                {modifier.price > 0 && (
                                  <span className="text-blue-600 font-medium">
                                    +{modifier.price}₸
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg font-medium mb-2">Нет привязанных модификаций</p>
                    <p className="text-sm">
                      Добавьте группы модификаций, чтобы клиенты могли выбирать добавки
                    </p>
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

export default ProductModifiersModal;
