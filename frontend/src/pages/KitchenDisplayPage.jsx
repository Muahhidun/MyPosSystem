import { useEffect } from 'react';
import { useKitchenSocket } from '../hooks/useKitchenSocket';
import { Wifi, WifiOff, Bell, Trash2 } from 'lucide-react';

function KitchenDisplayPage() {
  const { orders, connected, error, clearOrders } = useKitchenSocket();

  // Автоматическая очистка старых заказов (опционально)
  useEffect(() => {
    // Очищаем заказы старше 4 часов каждые 30 минут
    const interval = setInterval(() => {
      const fourHoursAgo = new Date().getTime() - 4 * 60 * 60 * 1000;
      // TODO: можно добавить фильтрацию старых заказов
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Kitchen Display
              </h1>

              {/* Статус подключения */}
              <div className="flex items-center gap-2">
                {connected ? (
                  <>
                    <Wifi className="text-green-600" size={20} />
                    <span className="text-sm text-green-600 font-medium">
                      Подключено
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="text-red-600 animate-pulse" size={20} />
                    <span className="text-sm text-red-600 font-medium">
                      {error || 'Отключено'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Действия */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Bell size={18} />
                <span className="text-sm font-medium">
                  Заказов: {orders.length}
                </span>
              </div>

              <button
                onClick={clearOrders}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <Trash2 size={18} />
                Очистить
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Список заказов */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4">
              <Bell size={64} className="mx-auto opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Нет активных заказов
            </h3>
            <p className="text-gray-500">
              Новые заказы будут отображаться здесь автоматически
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order, index) => (
              <OrderCard key={order.id || index} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }) {
  const createdAt = new Date(order.created_at);
  const timeAgo = getTimeAgo(createdAt);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-blue-500 hover:shadow-xl transition">
      {/* Header */}
      <div className="bg-blue-600 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium opacity-90">Заказ</div>
            <div className="text-2xl font-bold">
              #{order.order_number?.split('-').pop() || order.id}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">{timeAgo}</div>
            <div className="text-lg font-semibold">
              {order.total_amount?.toFixed(0)}₸
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="p-6">
        <div className="space-y-3">
          {order.items?.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 border-b last:border-b-0"
            >
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  {item.item_name}
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600 ml-4">
                x{item.quantity}
              </div>
            </div>
          ))}
        </div>

        {/* Оплата */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Оплата:</span>
            <span className="font-medium text-gray-900">
              {getPaymentMethodLabel(order.payment_method)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Утилиты
function getTimeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // секунды

  if (diff < 60) return `${diff}с назад`;
  if (diff < 3600) return `${Math.floor(diff / 60)}мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}ч назад`;
  return date.toLocaleDateString('ru-RU');
}

function getPaymentMethodLabel(method) {
  const labels = {
    cash: 'Наличные',
    card: 'Карта',
    kaspi: 'Kaspi'
  };
  return labels[method] || method;
}

export default KitchenDisplayPage;
