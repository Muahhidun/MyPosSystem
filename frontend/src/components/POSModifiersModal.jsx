import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { Button } from './ui/Button';

function POSModifiersModal({ product, onClose, onConfirm }) {
  const [variants, setVariants] = useState([]);
  const [modifierGroups, setModifierGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedModifiers, setSelectedModifiers] = useState({});

  useEffect(() => {
    loadOptions();
  }, [product.id]);

  const loadOptions = async () => {
    setLoading(true);
    try {
      const [variantsData, modifiersData] = await Promise.all([
        api.getProductVariants(product.id),
        api.getProductModifiers(product.id)
      ]);

      // Filter active variants
      const activeVariants = variantsData.filter(v => v.is_active);
      setVariants(activeVariants);

      // Set default variant
      const defaultVariant = activeVariants.find(v => v.is_default) || activeVariants[0];
      setSelectedVariant(defaultVariant);

      setModifierGroups(modifiersData);

      // Initialize selected modifiers state
      const initialModifiers = {};
      modifiersData.forEach(group => {
        initialModifiers[group.id] = [];
      });
      setSelectedModifiers(initialModifiers);
    } catch (error) {
      toast.error('Ошибка загрузки опций');
    } finally {
      setLoading(false);
    }
  };

  const handleModifierToggle = (groupId, modifier, selectionType) => {
    setSelectedModifiers(prev => {
      const groupSelections = prev[groupId] || [];

      if (selectionType === 'single') {
        // Single selection - replace
        return {
          ...prev,
          [groupId]: [modifier]
        };
      } else {
        // Multiple selection - toggle
        const exists = groupSelections.find(m => m.id === modifier.id);
        if (exists) {
          return {
            ...prev,
            [groupId]: groupSelections.filter(m => m.id !== modifier.id)
          };
        } else {
          const group = modifierGroups.find(g => g.id === groupId);
          if (group.max_selections && groupSelections.length >= group.max_selections) {
            toast.error(`Максимум ${group.max_selections} модификаций`);
            return prev;
          }
          return {
            ...prev,
            [groupId]: [...groupSelections, modifier]
          };
        }
      }
    });
  };

  const isModifierSelected = (groupId, modifierId) => {
    return (selectedModifiers[groupId] || []).some(m => m.id === modifierId);
  };

  const validateSelections = () => {
    for (const group of modifierGroups) {
      const selections = selectedModifiers[group.id] || [];

      if (group.is_required && selections.length === 0) {
        toast.error(`Выберите опции для "${group.name}"`);
        return false;
      }

      if (group.min_selections && selections.length < group.min_selections) {
        toast.error(`Выберите минимум ${group.min_selections} для "${group.name}"`);
        return false;
      }

      if (group.max_selections && selections.length > group.max_selections) {
        toast.error(`Выберите максимум ${group.max_selections} для "${group.name}"`);
        return false;
      }
    }

    return true;
  };

  const getTotalPrice = () => {
    let total = product.price;

    // Add variant price adjustment
    if (selectedVariant) {
      total += selectedVariant.price_adjustment;
    }

    // Add modifiers prices
    Object.values(selectedModifiers).forEach(groupMods => {
      groupMods.forEach(mod => {
        total += mod.price;
      });
    });

    return total;
  };

  const getAllSelectedModifiers = () => {
    const allModifiers = [];
    Object.values(selectedModifiers).forEach(groupMods => {
      allModifiers.push(...groupMods);
    });
    return allModifiers;
  };

  const handleConfirm = () => {
    if (!validateSelections()) {
      return;
    }

    const allModifiers = getAllSelectedModifiers();

    onConfirm({
      product,
      variant: selectedVariant,
      modifiers: allModifiers,
      totalPrice: getTotalPrice()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
            <p className="text-sm text-gray-500 mt-1">Базовая цена: {product.price}₸</p>
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
            <div className="space-y-6">
              {/* Variants (Sizes) */}
              {variants.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">
                    Выберите размер <span className="text-red-500">*</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {variants.map(variant => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedVariant?.id === variant.id
                            ? 'border-blue-600 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-blue-300 bg-white'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">{variant.name}</div>
                        {variant.size_code && (
                          <div className="text-xs text-gray-500 mt-1">{variant.size_code}</div>
                        )}
                        {variant.price_adjustment !== 0 && (
                          <div className="text-sm text-blue-600 font-bold mt-2">
                            {variant.price_adjustment > 0 ? '+' : ''}{variant.price_adjustment}₸
                          </div>
                        )}
                        {selectedVariant?.id === variant.id && (
                          <div className="mt-2 flex justify-center">
                            <Check size={20} className="text-blue-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Modifier Groups */}
              {modifierGroups.map(group => (
                <div key={group.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-bold text-gray-900">{group.name}</h3>
                    {group.is_required && <span className="text-red-500">*</span>}
                    {group.selection_type === 'single' && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        Один выбор
                      </span>
                    )}
                    {group.min_selections > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        Мин: {group.min_selections}
                      </span>
                    )}
                    {group.max_selections && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        Макс: {group.max_selections}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {group.modifiers && group.modifiers.map(modifier => (
                      <button
                        key={modifier.id}
                        onClick={() => handleModifierToggle(group.id, modifier, group.selection_type)}
                        disabled={!modifier.is_available}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          isModifierSelected(group.id, modifier.id)
                            ? 'border-blue-600 bg-blue-50 shadow-sm'
                            : modifier.is_available
                            ? 'border-gray-200 hover:border-blue-300 bg-white'
                            : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{modifier.name}</div>
                            {!modifier.is_available && (
                              <div className="text-xs text-red-600 mt-1">Недоступно</div>
                            )}
                          </div>
                          {modifier.price > 0 && (
                            <div className="text-sm font-bold text-blue-600">
                              +{modifier.price}₸
                            </div>
                          )}
                        </div>
                        {isModifierSelected(group.id, modifier.id) && (
                          <div className="mt-2 flex justify-end">
                            <Check size={18} className="text-blue-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {variants.length === 0 && modifierGroups.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>Нет доступных опций</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex-shrink-0">
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1"
              disabled={loading || (variants.length > 0 && !selectedVariant)}
            >
              Добавить · {getTotalPrice().toFixed(0)}₸
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default POSModifiersModal;
