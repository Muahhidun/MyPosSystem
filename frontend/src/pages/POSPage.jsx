import { useState, useEffect } from 'react';
import {
  ShoppingCart, Minus, Plus, X, Banknote, CreditCard,
  Package, Grid3x3, Trash2
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

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
      <div className="flex justify-center items-center h-screen bg-slate-50 font-inter">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-slate-600">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-slate-50 font-inter">
      <Toaster position="top-center" />

      {/* Левая часть - товары */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <ShoppingCart size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Касса</h1>
        </div>

        {/* Категории */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-semibold text-sm transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat === 'all' ? '📦 Все' : cat}
            </button>
          ))}
        </div>

        {/* Сетка товаров */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-indigo-300 transition-all text-left group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-slate-100 group-hover:bg-indigo-100 rounded-lg flex items-center justify-center transition-colors">
                  <Package size={20} className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
                </div>
                <Plus size={20} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-base mb-2 text-slate-900 line-clamp-2">{product.name}</h3>
              <p className="text-2xl font-bold text-indigo-700">{product.price}₸</p>
              {product.category && (
                <span className="inline-block mt-2 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {product.category}
                </span>
              )}
            </button>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center text-slate-500 mt-12">
            <Package size={48} className="mx-auto mb-3 text-slate-300" strokeWidth={1.5} />
            <p className="font-medium">Нет товаров в этой категории</p>
            <p className="text-xs text-slate-400 mt-1">Выберите другую категорию</p>
          </div>
        )}
      </div>

      {/* Правая часть - корзина */}
      <div className="w-96 bg-white border-l border-slate-200 shadow-xl p-6 flex flex-col">
        <div className="mb-6 pb-4 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart size={24} className="text-indigo-600" />
            Заказ
            {cart.length > 0 && (
              <span className="ml-auto text-sm font-semibold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
                {cart.length}
              </span>
            )}
          </h2>
        </div>

        {/* Список товаров в корзине */}
        <div className="flex-1 overflow-auto mb-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-slate-400 mt-12">
              <ShoppingCart size={48} className="mx-auto mb-3 text-slate-300" strokeWidth={1.5} />
              <p className="font-medium">Корзина пуста</p>
              <p className="text-xs text-slate-400 mt-1">Добавьте товары из каталога</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-white transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-semibold text-slate-900">{item.name}</span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center"
                    >
                      <Minus size={16} className="text-slate-600" />
                    </button>
                    <span className="w-10 text-center font-bold text-slate-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                    >
                      <Plus size={16} className="text-white" />
                    </button>
                  </div>
                  <span className="font-bold text-lg text-indigo-700">
                    {(item.price * item.quantity).toFixed(0)}₸
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Итого */}
        <div className="border-t border-slate-200 pt-6 mb-6">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-slate-700">Итого:</span>
              <span className="text-3xl font-bold text-indigo-700">
                {getTotalAmount().toFixed(0)}₸
              </span>
            </div>
          </div>
        </div>

        {/* Кнопки оплаты */}
        <div className="space-y-3">
          <button
            onClick={() => handleCheckout('cash')}
            disabled={cart.length === 0}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-4 rounded-xl text-lg font-bold hover:from-emerald-700 hover:to-emerald-600 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Banknote size={22} />
            Оплата наличными
          </button>
          <button
            onClick={() => handleCheckout('card')}
            disabled={cart.length === 0}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white py-4 rounded-xl text-lg font-bold hover:from-indigo-700 hover:to-indigo-600 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <CreditCard size={22} />
            Оплата картой
          </button>
        </div>
      </div>
    </div>
  );
}

export default POSPage;
