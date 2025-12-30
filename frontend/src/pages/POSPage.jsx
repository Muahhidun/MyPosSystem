import { useState, useEffect } from 'react';
import {
  ShoppingCart, Minus, Plus, X, Banknote, CreditCard,
  Package, Trash2
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../api/client';
import ReceiptPrinter from '../utils/receiptPrinter';
import LabelPrinter from '../utils/labelPrinter';

function POSPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);

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
      const data = await api.getCategories();
      setCategories(['all', ...data]);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success(`${product.name} добавлен`);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.id === productId ? { ...item, quantity } : item
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
          quantity: item.quantity
        })),
        payment_method: paymentMethod
      };

      const order = await api.createOrder(orderData);

      // Автоматическая печать чека и бегунка
      if (settings) {
        // Печать чека для клиента
        if (settings.receipt_printer_ip) {
          try {
            const receiptPrinter = new ReceiptPrinter(settings.receipt_printer_ip);
            await receiptPrinter.printReceipt(order, {
              businessName: settings.business_name,
              phone: settings.phone
            });
            console.log('Чек отправлен на печать');
          } catch (error) {
            console.error('Ошибка печати чека:', error);
          }
        }

        // Печать бегунка для кухни
        if (settings.label_printer_ip) {
          try {
            const labelPrinter = new LabelPrinter(settings.label_printer_ip);
            await labelPrinter.printKitchenLabel(order);
            console.log('Бегунок отправлен на печать');
          } catch (error) {
            console.error('Ошибка печати бегунка:', error);
          }
        }
      }

      toast.success(`Заказ #${order.order_number} создан! Сумма: ${order.total_amount}₸`);
      setCart([]);
    } catch (error) {
      console.error('Ошибка создания заказа:', error);
      toast.error('Не удалось создать заказ');
    }
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

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
          fontSize: '16px',
          padding: '16px',
        },
      }} />

      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShoppingCart size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Касса</h1>
        </div>
        <div className="flex items-center gap-6">
          {cart.length > 0 && (
            <>
              <div className="text-right">
                <div className="text-sm text-gray-600 font-medium">Текущий заказ</div>
                <div className="text-lg font-bold text-gray-900">
                  {getTotalItems()} {getTotalItems() === 1 ? 'товар' : 'товаров'} · {getTotalAmount().toFixed(0)}₸
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Products (left 60%) */}
        <div className="w-[60%] overflow-y-auto p-6">
          {/* Categories */}
          <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`h-12 px-6 rounded-lg whitespace-nowrap font-bold text-base transition-all active:scale-95 ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
                }`}
              >
                {cat === 'all' ? 'Все товары' : cat}
              </button>
            ))}
          </div>

          {/* Products grid */}
          <div className="grid grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-4 rounded-xl shadow-sm border-2 border-gray-200 hover:shadow-lg hover:border-blue-400 transition-all text-left active:scale-95 min-h-32"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package size={24} className="text-gray-600" />
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Plus size={24} className="text-blue-600" />
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-2 min-h-14">{product.name}</h3>
                <p className="text-2xl font-bold text-blue-600">{product.price}₸</p>
                {product.category && (
                  <span className="inline-block mt-2 text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-md">
                    {product.category}
                  </span>
                )}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <Package size={64} className="mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
              <p className="text-xl font-semibold">Нет товаров в этой категории</p>
              <p className="text-base text-gray-400 mt-2">Выберите другую категорию</p>
            </div>
          )}
        </div>

        {/* Order cart (right 40%) */}
        <div className="w-[40%] bg-white border-l border-gray-200 flex flex-col shadow-xl">
          {/* Cart header */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <ShoppingCart size={28} className="text-blue-600" />
              Текущий заказ
              {cart.length > 0 && (
                <span className="ml-auto text-base font-bold bg-blue-600 text-white px-4 py-2 rounded-full min-w-12 text-center">
                  {cart.length}
                </span>
              )}
            </h2>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 mt-20">
                <ShoppingCart size={64} className="mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
                <p className="text-xl font-semibold">Корзина пуста</p>
                <p className="text-base text-gray-400 mt-2">Добавьте товары из каталога</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50 hover:bg-white transition-colors min-h-16">
                    <div className="flex justify-between items-start mb-4">
                      <span className="font-bold text-lg text-gray-900 flex-1 pr-2">{item.name}</span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
                      >
                        <X size={24} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-12 h-12 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center"
                        >
                          <Minus size={20} className="text-gray-700" />
                        </button>
                        <span className="w-12 text-center font-bold text-xl text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-12 h-12 bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center"
                        >
                          <Plus size={20} className="text-white" />
                        </button>
                      </div>
                      <span className="font-bold text-xl text-blue-600">
                        {(item.price * item.quantity).toFixed(0)}₸
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart footer */}
          <div className="px-6 py-6 border-t-2 border-gray-200 bg-gray-50">
            {/* Total */}
            <div className="bg-white rounded-xl p-5 mb-6 border-2 border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-700">Итого:</span>
                <span className="text-3xl font-bold text-blue-600">
                  {getTotalAmount().toFixed(0)}₸
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={() => handleCheckout('cash')}
                disabled={cart.length === 0}
                className="w-full h-14 bg-green-600 text-white rounded-xl text-lg font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 active:scale-95"
              >
                <Banknote size={24} />
                Оплата наличными
              </button>
              <button
                onClick={() => handleCheckout('card')}
                disabled={cart.length === 0}
                className="w-full h-14 bg-blue-600 text-white rounded-xl text-lg font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 active:scale-95"
              >
                <CreditCard size={24} />
                Оплата картой
              </button>
              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className="w-full h-14 bg-red-600 text-white rounded-xl text-lg font-bold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 active:scale-95"
              >
                <Trash2 size={24} />
                Очистить корзину
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default POSPage;
