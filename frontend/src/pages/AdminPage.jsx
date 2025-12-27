import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import ProductsPage from './admin/ProductsPage';
import SettingsPage from './admin/SettingsPage';

function AdminPage() {
  const location = useLocation();

  const navigation = [
    { name: 'Товары', path: '/admin', icon: '📦' },
    { name: 'Ингредиенты', path: '/admin/ingredients', icon: '🥕', soon: true },
    { name: 'Техкарты', path: '/admin/recipes', icon: '📋', soon: true },
    { name: 'Категории', path: '/admin/categories', icon: '🏷️', soon: true },
    { name: 'Настройки', path: '/admin/settings', icon: '⚙️' },
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Верхняя панель */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Админ панель</h1>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full">
                Управляющий
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Дашборд
              </Link>
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                На главную
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Боковая навигация */}
        <aside className="w-64 bg-white min-h-screen shadow-sm border-r">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                } ${item.soon ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={(e) => item.soon && e.preventDefault()}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </div>
                {item.soon && (
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                    Скоро
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Информация о системе */}
          <div className="absolute bottom-0 left-0 right-0 w-64 p-4 border-t bg-gray-50">
            <div className="text-xs text-gray-500 space-y-1">
              <p className="font-semibold text-gray-700">My POS System</p>
              <p>Версия 1.0.0 MVP</p>
              <p className="text-green-600">● Система работает</p>
            </div>
          </div>
        </aside>

        {/* Основной контент */}
        <main className="flex-1 p-8">
          <Routes>
            <Route index element={<ProductsPage />} />
            <Route path="ingredients" element={<ComingSoon title="Ингредиенты" />} />
            <Route path="recipes" element={<ComingSoon title="Техкарты" />} />
            <Route path="categories" element={<ComingSoon title="Категории" />} />
            <Route path="settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// Компонент "Скоро будет"
function ComingSoon({ title }) {
  return (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">{title}</h2>
      <p className="text-gray-600 mb-8">Этот раздел будет добавлен в следующих версиях</p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
        <p className="text-sm text-blue-900 font-medium mb-2">Запланировано в Фазе 2:</p>
        <ul className="text-sm text-blue-700 space-y-1 text-left">
          <li>• Управление ингредиентами</li>
          <li>• Создание техкарт (рецептов)</li>
          <li>• Расчет себестоимости</li>
          <li>• Учет остатков</li>
        </ul>
      </div>
    </div>
  );
}

export default AdminPage;
