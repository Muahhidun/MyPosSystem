import { useState, useEffect } from 'react';
import {
  ShoppingCart, Minus, Plus, X, Banknote, CreditCard,
  Package, Trash2, Settings, Wifi, WifiOff, Clock, RefreshCw
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../api/client';
import ReceiptPrinter from '../utils/receiptPrinter';
import LabelPrinter from '../utils/labelPrinter';
import POSModifiersModal from '../components/POSModifiersModal';
import { useOfflineQueue } from '../hooks/useOfflineQueue';

function POSPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [modifiersModalProduct, setModifiersModalProduct] = useState(null);

  // Offline queue management
  const { isOnline, pendingCount, createOrder: createOrderOffline, syncPendingOrders, isSyncing } = useOfflineQueue();

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      // Загружаем объединённый список: Products + Recipes (где show_in_pos=true)
      const data = await api.getPOSItems();
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
      const data = await api.getPOSCategories();
      setCategories([{ id: 'all', name: 'Все товары' }, ...data]);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  const addToCart = (product) => {
    // Если у товара есть варианты или модификации - открыть модальное окно
    if (product.has_variants || product.has_modifiers) {
      setModifiersModalProduct(product);
      return;
    }

    // Иначе добавить напрямую
    const existing = cart.find(item => item.id === product.id && !item.cartKey);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id && !item.cartKey
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success(`${product.name} добавлен`);
  };

  const handleModifiersConfirm = ({ product, variant, modifiers, totalPrice }) => {
    // Создать уникальный ключ для корзины (товар + вариант + модификации)
    const variantKey = variant ? `v${variant.id}` : '';
    const modifiersKey = modifiers.map(m => m.id).sort().join(',');
    const cartKey = `${product.id}_${variantKey}_${modifiersKey}`;

    // Проверить есть ли уже такой же товар с такими же опциями
    const existing = cart.find(item => item.cartKey === cartKey);

    if (existing) {
      setCart(cart.map(item =>
        item.cartKey === cartKey
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const cartItem = {
        ...product,
        cartKey,
        variant,
        modifiers,
        price: totalPrice,
        quantity: 1,
        displayName: variant ? `${product.name} (${variant.name})` : product.name,
        displayModifiers: modifiers.length > 0 ? modifiers.map(m => m.name).join(', ') : null
      };
      setCart([...cart, cartItem]);
    }

    toast.success(`${product.name} добавлен`);
  };

  const removeFromCart = (itemKey) => {
    setCart(cart.filter(item => (item.cartKey || item.id) !== itemKey));
  };

  const updateQuantity = (itemKey, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemKey);
      return;
    }
    setCart(cart.map(item =>
      (item.cartKey || item.id) === itemKey ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setCart([]);
    toast.success('Корзина очищена');
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = async (paymentMethod) => {
    if (cart.length === 0) {
      toast.error('Корзина пуста');
      return;
    }

    try {
      const orderData = {
        items: cart.map(item => ({
          item_type: item.type || 'product',  // 'product' или 'recipe'
          product_id: item.type === 'product' ? item.id : null,
          recipe_id: item.type === 'recipe' ? item.id : null,
          quantity: item.quantity,
          variant_id: item.variant ? item.variant.id : null,
          modifiers: item.modifiers ? item.modifiers.map(m => ({
            modifier_id: m.id,
            name: m.name,
            price: m.price
          })) : null
        })),
        payment_method: paymentMethod
      };

      // Use offline queue instead of direct API call
      // This will save to IndexedDB if offline, or send to server if online
      await createOrderOffline(orderData);

      // Note: Printing is now handled separately since we might not get order object back immediately
      // TODO: Implement printing after successful sync (listen to sync events from Service Worker)

      // Clear cart after order is queued/created
      setCart([]);
    } catch (error) {
      console.error('Ошибка создания заказа:', error);
      toast.error('Не удалось создать заказ');
    }
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category_id === selectedCategory);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-700">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toaster position="top-center" toastOptions={{
        style: {
          fontSize: '14px',
          padding: '12px',
        },
      }} />

      {/* Header - COMPACT */}
      <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShoppingCart size={20} className="text-white" />
          </div>
          <h1 className="text-base font-bold text-gray-900">Касса</h1>

          {/* Offline/Online Indicator */}
          <div className="flex items-center gap-1.5 ml-3">
            {isOnline ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-md">
                <Wifi size={14} className="text-green-600" />
                <span className="text-xs font-medium text-green-700">Онлайн</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-md animate-pulse">
                <WifiOff size={14} className="text-red-600" />
                <span className="text-xs font-medium text-red-700">Офлайн</span>
              </div>
            )}

            {/* Pending Orders Count */}
            {pendingCount > 0 && (
              <button
                onClick={syncPendingOrders}
                disabled={!isOnline || isSyncing}
                className="flex items-center gap-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-md hover:bg-yellow-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title={isOnline ? "Синхронизировать заказы" : "Ожидание подключения"}
              >
                {isSyncing ? (
                  <RefreshCw size={14} className="text-yellow-600 animate-spin" />
                ) : (
                  <Clock size={14} className="text-yellow-600" />
                )}
                <span className="text-xs font-medium text-yellow-700">
                  {pendingCount} в очереди
                </span>
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {cart.length > 0 && (
            <>
              <div className="text-right">
                <div className="text-xs text-gray-600 font-medium">Текущий заказ</div>
                <div className="text-sm font-bold text-gray-900">
                  {getTotalItems()} {getTotalItems() === 1 ? 'товар' : 'товаров'} · {getTotalAmount().toFixed(0)}₸
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Products (left 65%) */}
        <div className="w-[65%] overflow-y-auto p-4">
          {/* Categories - COMPACT */}
          <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`h-9 px-3 rounded-lg whitespace-nowrap font-bold text-sm transition-all active:scale-95 ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
                }`}
                style={cat.color && selectedCategory === cat.id ? { backgroundColor: cat.color } : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products grid - COMPACT: 4 columns */}
          <div className="grid grid-cols-4 gap-2">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-3 rounded-xl shadow-sm border-2 border-gray-200 hover:shadow-lg hover:border-blue-400 transition-all text-left active:scale-95 min-h-24"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package size={16} className="text-gray-600" />
                  </div>
                  <div className="flex items-center gap-1">
                    {(product.has_variants || product.has_modifiers) && (
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                        <Settings size={14} className="text-orange-600" />
                      </div>
                    )}
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Plus size={18} className="text-blue-600" />
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-sm mb-1 text-gray-900 line-clamp-2 min-h-8">{product.name}</h3>
                <p className="text-lg font-bold text-blue-600">{product.price}₸</p>
                {(product.category_name || product.category) && (
                  <span className="inline-block mt-1 text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                    {product.category_name || product.category}
                  </span>
                )}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <Package size={48} className="mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
              <p className="text-lg font-semibold">Нет товаров в этой категории</p>
              <p className="text-sm text-gray-400 mt-2">Выберите другую категорию</p>
            </div>
          )}
        </div>

        {/* Order cart (right 35%) - COMPACT */}
        <div className="w-[35%] bg-white border-l border-gray-200 flex flex-col shadow-xl">
          {/* Cart header - COMPACT */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart size={20} className="text-blue-600" />
              Текущий заказ
              {cart.length > 0 && (
                <span className="ml-auto text-xs font-bold bg-blue-600 text-white px-2.5 py-1 rounded-full min-w-8 text-center">
                  {cart.length}
                </span>
              )}
            </h2>
          </div>

          {/* Cart items - COMPACT */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 mt-20">
                <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
                <p className="text-base font-semibold">Корзина пуста</p>
                <p className="text-sm text-gray-400 mt-2">Добавьте товары из каталога</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => {
                  const itemKey = item.cartKey || item.id;
                  return (
                    <div key={itemKey} className="p-2 border-2 border-gray-200 rounded-xl bg-gray-50 hover:bg-white transition-colors min-h-12">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 pr-2">
                          <span className="font-bold text-sm text-gray-900">{item.displayName || item.name}</span>
                          {item.displayModifiers && (
                            <div className="text-xs text-gray-600 mt-1">
                              + {item.displayModifiers}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(itemKey)}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                            className="w-8 h-8 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center"
                          >
                            <Minus size={16} className="text-gray-700" />
                          </button>
                          <span className="w-8 text-center font-bold text-base text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                            className="w-8 h-8 bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center"
                          >
                            <Plus size={16} className="text-white" />
                          </button>
                        </div>
                        <span className="font-bold text-base text-blue-600">
                          {(item.price * item.quantity).toFixed(0)}₸
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart footer - COMPACT */}
          <div className="px-4 py-3 border-t-2 border-gray-200 bg-gray-50">
            {/* Total - COMPACT */}
            <div className="bg-white rounded-xl p-3 mb-3 border-2 border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-gray-700">Итого:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {getTotalAmount().toFixed(0)}₸
                </span>
              </div>
            </div>

            {/* Action buttons - COMPACT */}
            <div className="space-y-2">
              <button
                onClick={() => handleCheckout('cash')}
                disabled={cart.length === 0}
                className="w-full h-12 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-95"
              >
                <Banknote size={20} />
                Оплата наличными
              </button>
              <button
                onClick={() => handleCheckout('card')}
                disabled={cart.length === 0}
                className="w-full h-12 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-95"
              >
                <CreditCard size={20} />
                Оплата картой
              </button>
              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className="w-full h-12 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-95"
              >
                <Trash2 size={20} />
                Очистить корзину
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modifiers Modal */}
      {modifiersModalProduct && (
        <POSModifiersModal
          product={modifiersModalProduct}
          onClose={() => setModifiersModalProduct(null)}
          onConfirm={handleModifiersConfirm}
        />
      )}
    </div>
  );
}

export default POSPage;
