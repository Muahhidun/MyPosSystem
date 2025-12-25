import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import POSPage from './pages/POSPage';
import AdminPage from './pages/AdminPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Навигация */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex space-x-8">
                <Link
                  to="/"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  Касса
                </Link>
                <Link
                  to="/admin"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  Админка
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  Дашборд
                </Link>
              </div>
              <div className="flex items-center">
                <span className="text-lg font-semibold text-gray-900">
                  My POS System
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* Основной контент */}
        <main>
          <Routes>
            <Route path="/" element={<POSPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
