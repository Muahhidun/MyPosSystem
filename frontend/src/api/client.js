// API клиент для взаимодействия с backend

// Автоматическое определение API URL
// В prod режиме: использует переменную окружения VITE_API_URL
// В dev режиме: если открыто с IP адреса, использует тот же IP для API
const getApiBaseUrl = () => {
  // Production: используем переменную окружения
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Development: localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000/api';
  }

  // Development: IP адрес (для доступа с телефона/планшета в локальной сети)
  return `http://${window.location.hostname}:8000/api`;
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'API request failed');
      }

      // Для DELETE запросов может быть пустой ответ
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Products
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/products${query ? `?${query}` : ''}`);
  }

  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  async createProduct(data) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id, data) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async getCategories() {
    return this.request('/products/categories/list');
  }

  async reorderProducts(orderData) {
    return this.request('/products/reorder', {
      method: 'PATCH',
      body: JSON.stringify(orderData),
    });
  }

  // Orders
  async createOrder(data) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/orders${query ? `?${query}` : ''}`);
  }

  async getTodayOrders() {
    return this.request('/orders/today');
  }

  async getTodayStats() {
    return this.request('/orders/stats/today');
  }

  async getOrder(id) {
    return this.request(`/orders/${id}`);
  }

  // Settings
  async getSettings() {
    return this.request('/settings');
  }

  async updateSettings(data) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Ingredients
  async getIngredients(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/ingredients${query ? `?${query}` : ''}`);
  }

  async getIngredient(id) {
    return this.request(`/ingredients/${id}`);
  }

  async createIngredient(data) {
    return this.request('/ingredients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateIngredient(id, data) {
    return this.request(`/ingredients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateIngredientStock(id, data) {
    return this.request(`/ingredients/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteIngredient(id) {
    return this.request(`/ingredients/${id}`, {
      method: 'DELETE',
    });
  }

  async getIngredientCategories() {
    return this.request('/ingredients/categories/list');
  }

  // Recipes
  async getRecipes(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/recipes${query ? `?${query}` : ''}`);
  }

  async getRecipe(id) {
    return this.request(`/recipes/${id}`);
  }

  async createRecipe(data) {
    return this.request('/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRecipe(id, data) {
    return this.request(`/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRecipe(id) {
    return this.request(`/recipes/${id}`, {
      method: 'DELETE',
    });
  }

  async getRecipeCategories() {
    return this.request('/recipes/categories/list');
  }

  async reorderRecipes(orderData) {
    return this.request('/recipes/reorder', {
      method: 'PATCH',
      body: JSON.stringify(orderData),
    });
  }

  // Semifinished (Полуфабрикаты)
  async getSemifinished(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/semifinished${query ? `?${query}` : ''}`);
  }

  async getSemifinishedItem(id) {
    return this.request(`/semifinished/${id}`);
  }

  async createSemifinished(data) {
    return this.request('/semifinished', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSemifinished(id, data) {
    return this.request(`/semifinished/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSemifinished(id) {
    return this.request(`/semifinished/${id}`, {
      method: 'DELETE',
    });
  }

  async getSemifinishedCategories() {
    return this.request('/semifinished/categories/list');
  }

  // Categories (unified system)
  async getAllCategories(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/categories${query ? `?${query}` : ''}`);
  }

  async getCategory(id) {
    return this.request(`/categories/${id}`);
  }

  async createCategory(data) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id, data) {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async reorderCategories(orderData) {
    return this.request('/categories/reorder', {
      method: 'PATCH',
      body: JSON.stringify(orderData),
    });
  }

  async deleteCategory(id) {
    return this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // POS (Касса - объединенный список товаров и техкарт)
  async getPOSItems() {
    return this.request('/pos/items');
  }

  async getPOSCategories() {
    return this.request('/pos/categories');
  }

  // Product Variants (Варианты товаров - размеры)
  async getProductVariants(productId) {
    return this.request(`/products/${productId}/variants`);
  }

  async createProductVariant(productId, data) {
    return this.request(`/products/${productId}/variants`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProductVariant(productId, variantId, data) {
    return this.request(`/products/${productId}/variants/${variantId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProductVariant(productId, variantId) {
    return this.request(`/products/${productId}/variants/${variantId}`, {
      method: 'DELETE',
    });
  }

  // Modifier Groups (Группы модификаций)
  async getModifierGroups(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/modifier-groups${query ? `?${query}` : ''}`);
  }

  async getModifierGroup(id) {
    return this.request(`/modifier-groups/${id}`);
  }

  async createModifierGroup(data) {
    return this.request('/modifier-groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateModifierGroup(id, data) {
    return this.request(`/modifier-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteModifierGroup(id) {
    return this.request(`/modifier-groups/${id}`, {
      method: 'DELETE',
    });
  }

  // Modifiers (Модификации в группе)
  async createModifier(groupId, data) {
    return this.request(`/modifier-groups/${groupId}/modifiers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateModifier(groupId, modifierId, data) {
    return this.request(`/modifier-groups/${groupId}/modifiers/${modifierId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteModifier(groupId, modifierId) {
    return this.request(`/modifier-groups/${groupId}/modifiers/${modifierId}`, {
      method: 'DELETE',
    });
  }

  // Product-Modifier Links (Привязка модификаторов к товарам)
  async getProductModifiers(productId) {
    return this.request(`/products/${productId}/modifiers`);
  }

  async linkModifierGroupToProduct(productId, data) {
    return this.request(`/products/${productId}/modifiers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async unlinkModifierGroupFromProduct(productId, groupId) {
    return this.request(`/products/${productId}/modifiers/${groupId}`, {
      method: 'DELETE',
    });
  }
}

export default new ApiClient();
