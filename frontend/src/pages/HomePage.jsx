import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">My POS System</h1>
          <p className="text-xl text-gray-600">Выберите интерфейс</p>
          <p className="text-sm text-gray-500 mt-2">
            (Эта страница только для разработки. В продакшене каждый интерфейс будет на своем домене)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Касса */}
          <Link
            to="/pos"
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Касса</h2>
              <p className="text-gray-600 mb-4">Для кассира на планшете</p>
              <div className="space-y-1 text-sm text-gray-500">
                <p>• Отбивать заказы</p>
                <p>• Выбор товаров</p>
                <p>• Оплата наличными/картой</p>
              </div>
              <div className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">
                Открыть кассу →
              </div>
            </div>
          </Link>

          {/* Админка */}
          <Link
            to="/admin"
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Админка</h2>
              <p className="text-gray-600 mb-4">Для управляющего с компьютера</p>
              <div className="space-y-1 text-sm text-gray-500">
                <p>• Управление товарами</p>
                <p>• Ингредиенты и техкарты</p>
                <p>• Настройка цен</p>
              </div>
              <div className="mt-6 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold">
                Открыть админку →
              </div>
            </div>
          </Link>

          {/* Дашборд */}
          <Link
            to="/dashboard"
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Дашборд</h2>
              <p className="text-gray-600 mb-4">Для смартфона управляющего</p>
              <div className="space-y-1 text-sm text-gray-500">
                <p>• Статистика продаж</p>
                <p>• Аналитика за день/неделю</p>
                <p>• Просмотр заказов</p>
              </div>
              <div className="mt-6 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold">
                Открыть дашборд →
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
            <h3 className="font-semibold text-gray-900 mb-2">Для продакшена:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>🖥️ Админка: <code className="bg-gray-100 px-2 py-1 rounded">admin.mypos.kz</code></p>
              <p>💳 Касса: <code className="bg-gray-100 px-2 py-1 rounded">pos.mypos.kz</code></p>
              <p>📱 Дашборд: <code className="bg-gray-100 px-2 py-1 rounded">app.mypos.kz</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
