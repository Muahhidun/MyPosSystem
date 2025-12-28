import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw, Home, Printer, Tag, ShoppingCart,
  TrendingUp, Banknote, CreditCard, FileText
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
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
      toast.error('Настройки не загружены');
      return;
    }

    const printKey = `${order.id}-${type}`;
    setPrinting(prev => ({ ...prev, [printKey]: true }));

    try {
      if (type === 'receipt') {
        if (!settings.receipt_printer_ip) {
          toast.error('IP адрес принтера чеков не настроен');
          return;
        }
        const printer = new ReceiptPrinter(settings.receipt_printer_ip);
        await printer.printReceipt(order, {
          businessName: settings.business_name,
          phone: settings.phone
        });
        toast.success('Чек отправлен на печать!');
      } else if (type === 'label') {
        if (!settings.label_printer_ip) {
          toast.error('IP адрес принтера бегунков не настроен');
          return;
        }
        const printer = new LabelPrinter(settings.label_printer_ip);
        await printer.printKitchenLabel(order);
        toast.success('Бегунок отправлен на печать!');
      }
    } catch (error) {
      console.error('Ошибка печати:', error);
      toast.error('Ошибка печати: ' + error.message);
    } finally {
      setPrinting(prev => ({ ...prev, [printKey]: false }));
    }
  };

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
    <div className="min-h-screen bg-slate-50 pb-20 font-inter">
      <Toaster position="top-center" />

      {/* Мобильная шапка */}
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-slate-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Дашборд</h1>
              <p className="text-xs text-slate-500">Сегодня</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <RefreshCw size={20} />
              </button>
              <Link
                to="/"
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Home size={20} />
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
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl shadow-sm border border-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-indigo-900 uppercase tracking-wide">Заказов</p>
                <ShoppingCart size={16} className="text-indigo-600" />
              </div>
              <p className="text-3xl font-bold text-indigo-700">{stats.total_orders}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl shadow-sm border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-emerald-900 uppercase tracking-wide">Выручка</p>
                <TrendingUp size={16} className="text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-700">
                {stats.total_revenue.toFixed(0)}₸
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Наличные</p>
                <Banknote size={16} className="text-slate-500" />
              </div>
              <p className="text-xl font-bold text-slate-700">
                {stats.cash_revenue.toFixed(0)}₸
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Безнал</p>
                <CreditCard size={16} className="text-slate-500" />
              </div>
              <p className="text-xl font-bold text-slate-700">
                {stats.card_revenue.toFixed(0)}₸
              </p>
            </div>
          </div>
        )}

        {/* Топ товаров */}
        {stats && stats.top_products.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-600" />
                Топ товаров
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {stats.top_products.slice(0, 5).map((product, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500">
                        Продано: {product.quantity} шт
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-emerald-600">
                    {product.revenue.toFixed(0)}₸
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Последние заказы */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" />
              Последние заказы
            </h2>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-slate-600 font-medium">Авто</span>
            </label>
          </div>
          <div className="divide-y divide-slate-100">
            {orders.slice(0, 20).map((order) => (
              <div key={order.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-sm text-slate-900">#{order.order_number}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-700">
                      {order.total_amount.toFixed(0)}₸
                    </p>
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      order.payment_method === 'cash'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {order.payment_method === 'cash' ? (
                        <><Banknote size={12} /> Наличные</>
                      ) : (
                        <><CreditCard size={12} /> Карта</>
                      )}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-slate-600 mb-3 space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="text-xs text-slate-600">
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
                        className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Printer size={14} />
                        {printing[`${order.id}-receipt`] ? 'Печать...' : 'Чек'}
                      </button>
                    )}
                    {settings.label_printer_ip && (
                      <button
                        onClick={() => handleReprint(order, 'label')}
                        disabled={printing[`${order.id}-label`]}
                        className="flex-1 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Tag size={14} />
                        {printing[`${order.id}-label`] ? 'Печать...' : 'Бегунок'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {orders.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <FileText size={48} className="mx-auto mb-3 text-slate-300" strokeWidth={1.5} />
              <p className="font-medium">Заказов пока нет</p>
              <p className="text-xs text-slate-400 mt-1">Они появятся здесь автоматически</p>
            </div>
          )}
        </div>

        {/* Индикатор живого обновления */}
        {autoRefresh && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            Автообновление
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
