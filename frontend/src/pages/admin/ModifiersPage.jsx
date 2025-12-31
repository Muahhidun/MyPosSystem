import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { Button } from '../../components/ui/Button';
import api from '../../api/client';
import toast from 'react-hot-toast';

function ModifiersPage() {
  const [groups, setGroups] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [showModifierForm, setShowModifierForm] = useState(null); // groupId для добавления модификатора
  const [editingModifier, setEditingModifier] = useState(null);
  const [ingredients, setIngredients] = useState([]);

  const [groupFormData, setGroupFormData] = useState({
    name: '',
    selection_type: 'multiple',
    min_selections: 0,
    max_selections: null,
    is_required: false,
    is_active: true,
    display_order: 0,
    modifiers: []
  });

  const [modifierFormData, setModifierFormData] = useState({
    name: '',
    price: 0,
    ingredient_id: null,
    quantity_per_use: 0,
    display_order: 0,
    is_available: true
  });

  useEffect(() => {
    loadGroups();
    loadIngredients();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await api.getModifierGroups({ active_only: false });
      setGroups(data);
    } catch (error) {
      toast.error('Ошибка загрузки групп модификаций');
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

  const toggleGroup = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await api.createModifierGroup(groupFormData);
      toast.success('Группа создана');
      setShowGroupForm(false);
      resetGroupForm();
      loadGroups();
    } catch (error) {
      toast.error(error.message || 'Ошибка создания группы');
    }
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    try {
      const { modifiers, ...updateData } = groupFormData;
      await api.updateModifierGroup(editingGroup.id, updateData);
      toast.success('Группа обновлена');
      setEditingGroup(null);
      resetGroupForm();
      loadGroups();
    } catch (error) {
      toast.error(error.message || 'Ошибка обновления группы');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Удалить группу модификаций? Все модификации в группе также будут удалены.')) return;

    try {
      await api.deleteModifierGroup(groupId);
      toast.success('Группа удалена');
      loadGroups();
    } catch (error) {
      toast.error(error.message || 'Ошибка удаления группы');
    }
  };

  const handleCreateModifier = async (e, groupId) => {
    e.preventDefault();
    try {
      await api.createModifier(groupId, modifierFormData);
      toast.success('Модификация добавлена');
      setShowModifierForm(null);
      resetModifierForm();
      loadGroups();
    } catch (error) {
      toast.error(error.message || 'Ошибка создания модификации');
    }
  };

  const handleUpdateModifier = async (e, groupId) => {
    e.preventDefault();
    try {
      await api.updateModifier(groupId, editingModifier.id, modifierFormData);
      toast.success('Модификация обновлена');
      setEditingModifier(null);
      resetModifierForm();
      loadGroups();
    } catch (error) {
      toast.error(error.message || 'Ошибка обновления модификации');
    }
  };

  const handleDeleteModifier = async (groupId, modifierId) => {
    if (!confirm('Удалить модификацию?')) return;

    try {
      await api.deleteModifier(groupId, modifierId);
      toast.success('Модификация удалена');
      loadGroups();
    } catch (error) {
      toast.error(error.message || 'Ошибка удаления модификации');
    }
  };

  const resetGroupForm = () => {
    setGroupFormData({
      name: '',
      selection_type: 'multiple',
      min_selections: 0,
      max_selections: null,
      is_required: false,
      is_active: true,
      display_order: 0,
      modifiers: []
    });
  };

  const resetModifierForm = () => {
    setModifierFormData({
      name: '',
      price: 0,
      ingredient_id: null,
      quantity_per_use: 0,
      display_order: 0,
      is_available: true
    });
  };

  const startEditGroup = (group) => {
    setEditingGroup(group);
    setGroupFormData({
      name: group.name,
      selection_type: group.selection_type,
      min_selections: group.min_selections,
      max_selections: group.max_selections,
      is_required: group.is_required,
      is_active: group.is_active,
      display_order: group.display_order,
      modifiers: []
    });
    setShowGroupForm(true);
  };

  const startEditModifier = (modifier, groupId) => {
    setEditingModifier({ ...modifier, groupId });
    setModifierFormData({
      name: modifier.name,
      price: modifier.price,
      ingredient_id: modifier.ingredient_id,
      quantity_per_use: modifier.quantity_per_use,
      display_order: modifier.display_order,
      is_available: modifier.is_available
    });
    setShowModifierForm(groupId);
  };

  return (
    <AdminLayout title="Модификации">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">
          Управление группами модификаций (добавки, топпинги, сиропы)
        </p>
        <Button onClick={() => { resetGroupForm(); setShowGroupForm(true); }}>
          <Plus size={20} /> Добавить группу
        </Button>
      </div>

      {/* Список групп */}
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.id} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            {/* Заголовок группы */}
            <div className="p-4 flex items-center justify-between">
              <button
                onClick={() => toggleGroup(group.id)}
                className="flex items-center gap-3 flex-1 text-left"
              >
                {expandedGroups.has(group.id) ? (
                  <ChevronUp className="text-gray-400" size={20} />
                ) : (
                  <ChevronDown className="text-gray-400" size={20} />
                )}
                <div>
                  <div className="font-bold text-lg text-gray-900">{group.name}</div>
                  <div className="text-sm text-gray-500">
                    {group.selection_type === 'single' ? 'Один выбор' : 'Множественный выбор'}
                    {group.is_required && ' • Обязательно'}
                    {group.min_selections > 0 && ` • Мин: ${group.min_selections}`}
                    {group.max_selections && ` • Макс: ${group.max_selections}`}
                    {' • '}
                    {group.modifiers?.length || 0} модификаций
                  </div>
                </div>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => startEditGroup(group)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Модификации */}
            {expandedGroups.has(group.id) && (
              <div className="border-t border-gray-200 bg-gray-50 p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-700">Модификации в группе:</h4>
                  <button
                    onClick={() => {
                      resetModifierForm();
                      setShowModifierForm(group.id);
                      setEditingModifier(null);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Добавить модификацию
                  </button>
                </div>

                {/* Форма модификации */}
                {showModifierForm === group.id && (
                  <form
                    onSubmit={(e) =>
                      editingModifier
                        ? handleUpdateModifier(e, group.id)
                        : handleCreateModifier(e, group.id)
                    }
                    className="bg-white p-4 rounded-lg mb-3 border border-blue-200"
                  >
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Название модификации"
                        value={modifierFormData.name}
                        onChange={(e) =>
                          setModifierFormData({ ...modifierFormData, name: e.target.value })
                        }
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Цена (+200₸)"
                        value={modifierFormData.price}
                        onChange={(e) =>
                          setModifierFormData({ ...modifierFormData, price: parseFloat(e.target.value) || 0 })
                        }
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        step="0.01"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <select
                        value={modifierFormData.ingredient_id || ''}
                        onChange={(e) =>
                          setModifierFormData({
                            ...modifierFormData,
                            ingredient_id: e.target.value ? parseInt(e.target.value) : null
                          })
                        }
                        className="border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="">Без ингредиента</option>
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        placeholder="Граммы на порцию"
                        value={modifierFormData.quantity_per_use}
                        onChange={(e) =>
                          setModifierFormData({
                            ...modifierFormData,
                            quantity_per_use: parseFloat(e.target.value) || 0
                          })
                        }
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        step="0.01"
                        disabled={!modifierFormData.ingredient_id}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" size="sm">
                        {editingModifier ? 'Сохранить' : 'Добавить'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setShowModifierForm(null);
                          setEditingModifier(null);
                          resetModifierForm();
                        }}
                      >
                        Отмена
                      </Button>
                    </div>
                  </form>
                )}

                {/* Список модификаций */}
                <div className="space-y-2">
                  {group.modifiers && group.modifiers.length > 0 ? (
                    group.modifiers.map((modifier) => (
                      <div
                        key={modifier.id}
                        className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{modifier.name}</div>
                          <div className="text-sm text-gray-500">
                            {modifier.price > 0 && `+${modifier.price}₸`}
                            {modifier.ingredient_name &&
                              ` • ${modifier.ingredient_name} (${modifier.quantity_per_use}г)`}
                            {!modifier.is_available && ' • Недоступно'}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEditModifier(modifier, group.id)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteModifier(group.id, modifier.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">
                      В этой группе пока нет модификаций
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {groups.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium mb-2">Групп модификаций пока нет</p>
            <p className="text-sm">Создайте первую группу для управления добавками и опциями</p>
          </div>
        )}
      </div>

      {/* Модальное окно создания/редактирования группы */}
      {showGroupForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {editingGroup ? 'Редактировать группу' : 'Новая группа модификаций'}
            </h3>

            <form onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название группы
                </label>
                <input
                  type="text"
                  placeholder="Топпинги, Сиропы, Лёд"
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Тип выбора
                </label>
                <select
                  value={groupFormData.selection_type}
                  onChange={(e) =>
                    setGroupFormData({ ...groupFormData, selection_type: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="multiple">Множественный выбор</option>
                  <option value="single">Один выбор</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Мин. выборов
                  </label>
                  <input
                    type="number"
                    value={groupFormData.min_selections}
                    onChange={(e) =>
                      setGroupFormData({ ...groupFormData, min_selections: parseInt(e.target.value) || 0 })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Макс. выборов
                  </label>
                  <input
                    type="number"
                    placeholder="Без ограничений"
                    value={groupFormData.max_selections || ''}
                    onChange={(e) =>
                      setGroupFormData({
                        ...groupFormData,
                        max_selections: e.target.value ? parseInt(e.target.value) : null
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={groupFormData.is_required}
                    onChange={(e) =>
                      setGroupFormData({ ...groupFormData, is_required: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Обязательно выбрать</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={groupFormData.is_active}
                    onChange={(e) =>
                      setGroupFormData({ ...groupFormData, is_active: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Активна</span>
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingGroup ? 'Сохранить' : 'Создать'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowGroupForm(false);
                    setEditingGroup(null);
                    resetGroupForm();
                  }}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default ModifiersPage;
