import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import ReceiptPrinter from '../utils/receiptPrinter';
import LabelPrinter from '../utils/labelPrinter';

function DashboardPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [settings, setSettings] = useState(null);
  const [printing, setPrinting] = useState({});

  useEffect(() => {
    loadData();
    loadSettings();

    // Автообновление каждые 5 секунд
    const interval = autoRefresh ? setInterval(loadData, 5000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadData = async () => {
    try {
      const [ordersData, statsData] = await Promise.all([
        api.getTodayOrders(),
        api.getTodayStats()
      ]);
      setOrders(ordersData);
      setStats(statsData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReprint = async (order, type) => {
    if (!settings) {
      alert('Настройки не загружены');
      return;
    }

    const printKey = `${order.id}-${type}`;
    setPrinting(prev => ({ ...prev, [printKey]: true }));

    try {
      if (type === 'receipt') {
        if (!settings.receipt_printer_ip) {
          alert('IP адрес принтера чеков не настроен');
          return;
        }
        const printer = new ReceiptPrinter(settings.receipt_printer_ip);
        await printer.printReceipt(order, {
          businessName: settings.business_name,
          phone: settings.phone
        });
        alert('Чек отправлен на печать!');
      } else if (type === 'label') {
        if (!settings.label_printer_ip) {
          alert('IP адрес принтера бегунков не настроен');
          return;
        }
        const printer = new LabelPrinter(settings.label_printer_ip);
        await printer.printKitchenLabel(order);
        alert('Бегунок отправлен на печать!');
      }
    } catch (error) {
      console.error('Ошибка печати:', error);
      alert('Ошибка печати: ' + error.message);
    } finally {
      setPrinting(prev => ({ ...prev, [printKey]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Мобильная шапка */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Дашборд</h1>
              <p className="text-xs text-gray-600">Сегодня</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <Link
                to="/"
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <div className="p-4 space-y-4">
        {/* Статистика - карточки */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <p className="text-xs text-gray-600 mb-1">Заказов</p>
              <p className="text-3xl font-bold text-blue-600">{stats.total_orders}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <p className="text-xs text-gray-600 mb-1">Выручка</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.total_revenue.toFixed(0)}₸
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <p className="text-xs text-gray-600 mb-1">Наличные</p>
              <p className="text-xl font-bold text-gray-700">
                {stats.cash_revenue.toFixed(0)}₸
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <p className="text-xs text-gray-600 mb-1">Безнал</p>
              <p className="text-xl font-bold text-gray-700">
                {stats.card_revenue.toFixed(0)}₸
              </p>
            </div>
          </div>
        )}

        {/* Топ товаров */}
        {stats && stats.top_products.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900">Топ товаров</h2>
            </div>
            <div className="p-4 space-y-3">
              {stats.top_products.slice(0, 5).map((product, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      Продано: {product.quantity} шт
                    </p>
                  </div>
                  <p className="text-lg font-bold text-blue-600">
                    {product.revenue.toFixed(0)}₸
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Последние заказы */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Последние заказы</h2>
            <div className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-gray-600">Авто</span>
            </div>
          </div>
          <div className="divide-y">
            {orders.slice(0, 20).map((order) => (
              <div key={order.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-sm">#{order.order_number}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      {order.total_amount.toFixed(0)}₸
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.payment_method === 'cash'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.payment_method === 'cash' ? 'Наличные' : 'Карта'}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="text-xs">
                      • {item.product_name} x{item.quantity}
                    </div>
                  ))}
                </div>
                {/* Кнопки печати */}
                {settings && (settings.receipt_printer_ip || settings.label_printer_ip) && (
                  <div className="flex gap-2 mt-2">
                    {settings.receipt_printer_ip && (
                      <button
                        onClick={() => handleReprint(order, 'receipt')}
                        disabled={printing[`${order.id}-receipt`]}
                        className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        {printing[`${order.id}-receipt`] ? 'Печать...' : 'Чек'}
                      </button>
                    )}
                    {settings.label_printer_ip && (
                      <button
                        onClick={() => handleReprint(order, 'label')}
                        disabled={printing[`${order.id}-label`]}
                        className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {printing[`${order.id}-label`] ? 'Печать...' : 'Бегунок'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {orders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Заказов пока нет</p>
            </div>
          )}
        </div>

        {/* Индикатор живого обновления */}
        {autoRefresh && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            Автообновление
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
