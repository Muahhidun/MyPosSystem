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
}

export default new ApiClient();
