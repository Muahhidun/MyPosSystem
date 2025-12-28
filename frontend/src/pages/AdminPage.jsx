import { Routes, Route } from 'react-router-dom';
import ProductsPage from './admin/ProductsPage';
import IngredientsPage from './admin/IngredientsPage';
import RecipesPage from './admin/RecipesPage';
import SemifinishedPage from './admin/SemifinishedPage';
import SettingsPage from './admin/SettingsPage';

function AdminPage() {
  return (
    <Routes>
      <Route index element={<ProductsPage />} />
      <Route path="ingredients" element={<IngredientsPage />} />
      <Route path="semifinished" element={<SemifinishedPage />} />
      <Route path="recipes" element={<RecipesPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Routes>
  );
}

export default AdminPage;
