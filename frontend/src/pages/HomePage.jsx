import { Link } from 'react-router-dom';
import { ShoppingBag, Settings, LayoutDashboard, ArrowRight } from 'lucide-react';

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header/Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-4">
              <ShoppingBag className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">My POS System</h1>
          <p className="text-xl text-gray-600 mb-2">Выберите интерфейс</p>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            Профессиональная система управления продажами и складом
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Касса (POS) Card */}
          <Link
            to="/pos"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md hover:border-blue-200 transition-all group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                <ShoppingBag className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" strokeWidth={2} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Касса</h2>
              <p className="text-sm text-gray-500 mb-6">
                Интерфейс для кассира на планшете. Быстрое оформление заказов и приём платежей.
              </p>
              <div className="mt-auto flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                <span>Открыть</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Админка (Admin) Card */}
          <Link
            to="/admin"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md hover:border-blue-200 transition-all group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                <Settings className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" strokeWidth={2} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Админка</h2>
              <p className="text-sm text-gray-500 mb-6">
                Панель управления для настройки товаров, ингредиентов и цен с компьютера.
              </p>
              <div className="mt-auto flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                <span>Открыть</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Дашборд (Dashboard) Card */}
          <Link
            to="/dashboard"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md hover:border-blue-200 transition-all group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                <LayoutDashboard className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" strokeWidth={2} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Дашборд</h2>
              <p className="text-sm text-gray-500 mb-6">
                Аналитика и статистика продаж для смартфона управляющего.
              </p>
              <div className="mt-auto flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                <span>Открыть</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Info Footer */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Для продакшена:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-600 mb-1">Админка</p>
                  <code className="text-blue-600 font-mono text-xs">admin.mypos.kz</code>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-600 mb-1">Касса</p>
                  <code className="text-blue-600 font-mono text-xs">pos.mypos.kz</code>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-600 mb-1">Дашборд</p>
                  <code className="text-blue-600 font-mono text-xs">app.mypos.kz</code>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Эта страница используется только для разработки. В продакшене каждый интерфейс будет на своем домене.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
