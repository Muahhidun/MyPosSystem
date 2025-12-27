import { useState, useEffect } from 'react';
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
      const data = await api.getProducts({ available_only: true });
      setProducts(data);
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
      alert('Не удалось загрузить товары');
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
      alert('Корзина пуста');
      return;
    }

    try {
      const orderData = {
        items: cart.map(item => ({
          product_id: item.id,
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

      alert(`Заказ #${order.order_number} создан! Сумма: ${order.total_amount}₸`);
      setCart([]);
    } catch (error) {
      console.error('Ошибка создания заказа:', error);
      alert('Не удалось создать заказ');
    }
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-2xl text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Левая часть - товары */}
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-3xl font-bold mb-6">Касса</h1>

        {/* Категории */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {cat === 'all' ? 'Все' : cat}
            </button>
          ))}
        </div>

        {/* Сетка товаров */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-left"
            >
              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
              <p className="text-2xl font-bold text-blue-600">{product.price}₸</p>
              {product.category && (
                <span className="text-xs text-gray-500 mt-1">{product.category}</span>
              )}
            </button>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            Нет товаров в этой категории
          </div>
        )}
      </div>

      {/* Правая часть - корзина */}
      <div className="w-96 bg-white border-l shadow-lg p-4 flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Заказ</h2>

        {/* Список товаров в корзине */}
        <div className="flex-1 overflow-auto mb-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-8">
              Корзина пуста
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="mb-3 p-3 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold">{item.name}</span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-bold text-lg">
                    {(item.price * item.quantity).toFixed(0)}₸
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Итого */}
        <div className="border-t pt-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-semibold">Итого:</span>
            <span className="text-3xl font-bold text-blue-600">
              {getTotalAmount().toFixed(0)}₸
            </span>
          </div>
        </div>

        {/* Кнопки оплаты */}
        <div className="space-y-2">
          <button
            onClick={() => handleCheckout('cash')}
            disabled={cart.length === 0}
            className="w-full bg-green-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Оплата наличными
          </button>
          <button
            onClick={() => handleCheckout('card')}
            disabled={cart.length === 0}
            className="w-full bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Оплата картой
          </button>
        </div>
      </div>
    </div>
  );
}

export default POSPage;
