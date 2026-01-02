import { useState, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Edit2, Trash2, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { Button } from '../../components/ui/Button';
import api from '../../api/client';
import toast from 'react-hot-toast';

// Sortable Row Component
function SortableCategoryRow({ category, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const getTypeLabel = (type) => {
    const labels = {
      pos: 'POS (Касса)',
      ingredient: 'Ингредиенты',
      semifinished: 'Полуфабрикаты',
      // Для обратной совместимости:
      product: 'Товары (устаревшее)',
      recipe: 'Техкарты (устаревшее)'
    };
    return labels[type] || type;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab hover:text-blue-600 active:cursor-grabbing touch-none"
      >
        <GripVertical size={20} />
      </button>

      <div className="flex-1">
        <div className="font-semibold text-gray-900">{category.name}</div>
        <div className="text-sm text-gray-500">{getTypeLabel(category.type)}</div>
      </div>

      {category.color && (
        <div
          className="w-8 h-8 rounded-full border-2 border-gray-300"
          style={{ backgroundColor: category.color }}
          title={`Цвет: ${category.color}`}
        />
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(category)}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Edit2 size={18} />
        </button>

        <button
          onClick={() => onDelete(category.id)}
          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

// Category Form Modal
function CategoryFormModal({ category, onClose, onSave, categoryType }) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    type: category?.type || categoryType || 'product',
    color: category?.color || '#3B82F6',
    is_active: category?.is_active ?? true,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    { value: 'pos', label: 'POS (Касса - товары и техкарты)' },
    { value: 'ingredient', label: 'Ингредиенты' },
    { value: 'semifinished', label: 'Полуфабрикаты' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {category ? 'Редактировать категорию' : 'Новая категория'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Например: Напитки"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!!category} // Нельзя менять тип у существующей категории
              required
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Цвет (опционально)
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-20 rounded-lg border border-gray-300"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="#3B82F6"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Активная (показывать в списках)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Component
function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedType, setSelectedType] = useState('pos');
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Требуется сдвиг на 8px для начала перетаскивания
      },
    })
  );

  useEffect(() => {
    loadCategories();
  }, [selectedType]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await api.getAllCategories({ type: selectedType, active_only: false });
      setCategories(data);
    } catch (error) {
      toast.error('Ошибка загрузки категорий');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex(c => c.id === active.id);
    const newIndex = categories.findIndex(c => c.id === over.id);

    const newCategories = arrayMove(categories, oldIndex, newIndex);
    setCategories(newCategories);

    try {
      const orderUpdate = newCategories.map((cat, index) => ({
        id: cat.id,
        display_order: index
      }));
      await api.reorderCategories(orderUpdate);
      toast.success('Порядок обновлён');
    } catch (error) {
      toast.error('Ошибка обновления порядка');
      loadCategories(); // Откатываем изменения
    }
  };

  const handleSave = async (formData) => {
    if (selectedCategory) {
      // Update
      await api.updateCategory(selectedCategory.id, formData);
      toast.success('Категория обновлена');
    } else {
      // Create
      await api.createCategory(formData);
      toast.success('Категория создана');
    }
    loadCategories();
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить категорию? Товары/техкарты не будут удалены, но потеряют связь с категорией.')) {
      return;
    }

    try {
      await api.deleteCategory(id);
      toast.success('Категория удалена');
      loadCategories();
    } catch (error) {
      toast.error(error.message || 'Ошибка удаления категории');
    }
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setShowForm(true);
  };

  const handleAdd = () => {
    setSelectedCategory(null);
    setShowForm(true);
  };

  const typeButtons = [
    { value: 'pos', label: 'POS (Касса)' },
    { value: 'ingredient', label: 'Ингредиенты' },
    { value: 'semifinished', label: 'Полуфабрикаты' }
  ];

  return (
    <AdminLayout title="Категории">
      <div className="space-y-6">
        {/* Type Filter */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 flex-wrap">
            {typeButtons.map(btn => (
              <button
                key={btn.value}
                onClick={() => setSelectedType(btn.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === btn.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <Button onClick={handleAdd}>
            <Plus size={20} /> Добавить
          </Button>
        </div>

        {/* Categories List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Загрузка...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-lg mb-2">Категорий пока нет</p>
            <p className="text-gray-400 text-sm">Нажмите "Добавить" чтобы создать первую категорию</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categories.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {categories.map(category => (
                  <SortableCategoryRow
                    key={category.id}
                    category={category}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Совет:</strong> Перетаскивайте категории за иконку ≡ чтобы изменить порядок.
            Этот порядок будет использоваться на кассе и в списках.
          </p>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <CategoryFormModal
          category={selectedCategory}
          categoryType={selectedType}
          onClose={() => {
            setShowForm(false);
            setSelectedCategory(null);
          }}
          onSave={handleSave}
        />
      )}
    </AdminLayout>
  );
}

export default CategoriesPage;
