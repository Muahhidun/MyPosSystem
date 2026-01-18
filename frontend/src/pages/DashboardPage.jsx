import { useState, useEffect } from 'react';
import {
  RefreshCw, Printer, Tag, ShoppingCart,
  TrendingUp, Banknote, CreditCard, FileText
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../api/client';
import ReceiptPrinter from '../utils/receiptPrinter';
import LabelPrinter from '../utils/labelPrinter';
import AdminLayout from '../components/AdminLayout';
import { Button } from '../components/ui/Button';
import { useSortableData, SortableHeader } from '../components/SortableTable';

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

  // Применение сортировки к последним 20 заказам
  const recentOrders = orders.slice(0, 20);
  const { sortedData: sortedOrders, sortState, handleSort } = useSortableData(recentOrders);

  if (loading) {
    return (
      <AdminLayout title="Дашборд">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#1f6b7a' }}></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Дашборд">
      <Toaster position="top-right" />

      {/* Заголовок и кнопки */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <p className="text-gray-500">Статистика и заказы за сегодня</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
              style={{ accentColor: '#1f6b7a' }}
            />
            <span className="text-gray-600 font-medium">Автообновление</span>
          </label>
          <Button onClick={loadData} variant="secondary">
            <RefreshCw size={18} /> Обновить
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Статистика - карточки */}
        {stats && (
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e0f2f4' }}>
                  <ShoppingCart size={20} style={{ color: '#1f6b7a' }} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stats.total_orders}</p>
              <p className="text-sm text-gray-500">Заказов</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp size={20} className="text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {stats.total_revenue.toFixed(0)}₸
              </p>
              <p className="text-sm text-gray-500">Выручка</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Banknote size={20} className="text-emerald-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {stats.cash_revenue.toFixed(0)}₸
              </p>
              <p className="text-sm text-gray-500">Наличные</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <CreditCard size={20} className="text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {stats.card_revenue.toFixed(0)}₸
              </p>
              <p className="text-sm text-gray-500">Безнал</p>
            </div>
          </div>
        )}

        {/* Топ товаров */}
        {stats && stats.top_products.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <TrendingUp size={20} style={{ color: '#1f6b7a' }} />
              Топ товаров
            </h2>
            <div className="space-y-3">
              {stats.top_products.slice(0, 5).map((product, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{
                      backgroundColor: '#e0f2f4',
                      color: '#1f6b7a'
                    }}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        Продано: {product.quantity} шт
                      </p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-green-600">
                    {product.revenue.toFixed(0)}₸
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Последние заказы */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText size={20} style={{ color: '#1f6b7a' }} />
              Последние заказы
            </h2>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText size={48} className="mx-auto mb-3 text-gray-300" strokeWidth={1.5} />
              <p className="font-medium">Заказов пока нет</p>
              <p className="text-sm text-gray-400 mt-1">Они появятся здесь автоматически</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                    <SortableHeader column="order_number" label="Номер заказа" sortState={sortState} onSort={handleSort} className="px-6 py-3" />
                    <SortableHeader column="created_at" label="Время" sortState={sortState} onSort={handleSort} className="px-6 py-3" />
                    <th className="px-6 py-3">Товары</th>
                    <SortableHeader column="total_amount" label="Сумма" sortState={sortState} onSort={handleSort} className="px-6 py-3 text-right" />
                    <SortableHeader column="payment_method" label="Оплата" sortState={sortState} onSort={handleSort} className="px-6 py-3" />
                    <th className="px-6 py-3 text-center">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">#{order.order_number}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-xs">
                              {item.product_name} x{item.quantity}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-bold text-gray-900">
                          {order.total_amount.toFixed(0)}₸
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          order.payment_method === 'cash'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {order.payment_method === 'cash' ? (
                            <><Banknote size={12} /> Наличные</>
                          ) : (
                            <><CreditCard size={12} /> Карта</>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {settings && (settings.receipt_printer_ip || settings.label_printer_ip) && (
                          <div className="flex gap-2 justify-center">
                            {settings.receipt_printer_ip && (
                              <button
                                onClick={() => handleReprint(order, 'receipt')}
                                disabled={printing[`${order.id}-receipt`]}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                              >
                                <Printer size={14} />
                                {printing[`${order.id}-receipt`] ? 'Печать...' : 'Чек'}
                              </button>
                            )}
                            {settings.label_printer_ip && (
                              <button
                                onClick={() => handleReprint(order, 'label')}
                                disabled={printing[`${order.id}-label`]}
                                className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                              >
                                <Tag size={14} />
                                {printing[`${order.id}-label`] ? 'Печать...' : 'Бегунок'}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Индикатор живого обновления */}
      {autoRefresh && (
        <div className="fixed bottom-8 right-8 bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          Автообновление активно
        </div>
      )}
    </AdminLayout>
  );
}

export default DashboardPage;
