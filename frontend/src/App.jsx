import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import POSPage from './pages/POSPage';
import AdminPage from './pages/AdminPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Главная страница - выбор интерфейса (только для разработки) */}
        <Route path="/" element={<HomePage />} />

        {/* Касса - для планшета кассира */}
        <Route path="/pos" element={<POSPage />} />

        {/* Админка - для управляющего с компьютера */}
        <Route path="/admin/*" element={<AdminPage />} />

        {/* Дашборд - для управляющего с телефона */}
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;
