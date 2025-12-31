import { Routes, Route } from 'react-router-dom';
import CategoriesPage from './admin/CategoriesPage';
import ProductsPage from './admin/ProductsPage';
import IngredientsPage from './admin/IngredientsPage';
import RecipesPage from './admin/RecipesPage';
import SemifinishedPage from './admin/SemifinishedPage';
import ModifiersPage from './admin/ModifiersPage';
import SettingsPage from './admin/SettingsPage';

function AdminPage() {
  return (
    <Routes>
      <Route index element={<ProductsPage />} />
      <Route path="categories" element={<CategoriesPage />} />
      <Route path="ingredients" element={<IngredientsPage />} />
      <Route path="semifinished" element={<SemifinishedPage />} />
      <Route path="recipes" element={<RecipesPage />} />
      <Route path="modifiers" element={<ModifiersPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Routes>
  );
}

export default AdminPage;
