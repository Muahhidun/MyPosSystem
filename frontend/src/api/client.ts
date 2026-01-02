// API клиент для взаимодействия с backend
import type {
  Product,
  Ingredient,
  Recipe,
  Semifinished,
  Category,
  Order,
  Settings,
  ProductVariant,
  ModifierGroup,
  Modifier,
  POSItem,
  Location,
  Stock,
  StockListItem,
  CreateOrderRequest,
  CreateStockRequest,
  StockAdjustmentRequest,
  ReorderCategoriesRequest,
  CategoryType,
} from '../types';

// Автоматическое определение API URL
// В prod режиме: использует переменную окружения VITE_API_URL
// В dev режиме: если открыто с IP адреса, использует тот же IP для API
const getApiBaseUrl = (): string => {
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

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

class ApiClient {
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
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
        return null as T;
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Products
  async getProducts(params: Record<string, string | number | boolean> = {}): Promise<Product[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/products${query ? `?${query}` : ''}`);
  }

  async getProduct(id: number): Promise<Product> {
    return this.request(`/products/${id}`);
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: number): Promise<void> {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async getCategories(): Promise<string[]> {
    return this.request('/products/categories/list');
  }

  async reorderProducts(orderData: ReorderCategoriesRequest[]): Promise<{ status: string }> {
    return this.request('/products/reorder', {
      method: 'PATCH',
      body: JSON.stringify(orderData),
    });
  }

  // Orders
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrders(params: Record<string, string | number | boolean> = {}): Promise<Order[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/orders${query ? `?${query}` : ''}`);
  }

  async getTodayOrders(): Promise<Order[]> {
    return this.request('/orders/today');
  }

  async getTodayStats(): Promise<{ total_orders: number; total_revenue: number }> {
    return this.request('/orders/stats/today');
  }

  async getOrder(id: number): Promise<Order> {
    return this.request(`/orders/${id}`);
  }

  // Settings
  async getSettings(): Promise<Settings[]> {
    return this.request('/settings');
  }

  async updateSettings(data: Record<string, string>): Promise<Settings[]> {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Ingredients
  async getIngredients(params: Record<string, string | number | boolean> = {}): Promise<Ingredient[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/ingredients${query ? `?${query}` : ''}`);
  }

  async getIngredient(id: number): Promise<Ingredient> {
    return this.request(`/ingredients/${id}`);
  }

  async createIngredient(data: Partial<Ingredient>): Promise<Ingredient> {
    return this.request('/ingredients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateIngredient(id: number, data: Partial<Ingredient>): Promise<Ingredient> {
    return this.request(`/ingredients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateIngredientStock(id: number, data: { stock_quantity: number }): Promise<Ingredient> {
    return this.request(`/ingredients/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteIngredient(id: number): Promise<void> {
    return this.request(`/ingredients/${id}`, {
      method: 'DELETE',
    });
  }

  async getIngredientCategories(): Promise<string[]> {
    return this.request('/ingredients/categories/list');
  }

  // Recipes
  async getRecipes(params: Record<string, string | number | boolean> = {}): Promise<Recipe[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/recipes${query ? `?${query}` : ''}`);
  }

  async getRecipe(id: number): Promise<Recipe> {
    return this.request(`/recipes/${id}`);
  }

  async createRecipe(data: Partial<Recipe>): Promise<Recipe> {
    return this.request('/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRecipe(id: number, data: Partial<Recipe>): Promise<Recipe> {
    return this.request(`/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRecipe(id: number): Promise<void> {
    return this.request(`/recipes/${id}`, {
      method: 'DELETE',
    });
  }

  async getRecipeCategories(): Promise<string[]> {
    return this.request('/recipes/categories/list');
  }

  async reorderRecipes(orderData: ReorderCategoriesRequest[]): Promise<{ status: string }> {
    return this.request('/recipes/reorder', {
      method: 'PATCH',
      body: JSON.stringify(orderData),
    });
  }

  // Semifinished (Полуфабрикаты)
  async getSemifinished(params: Record<string, string | number | boolean> = {}): Promise<Semifinished[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/semifinished${query ? `?${query}` : ''}`);
  }

  async getSemifinishedItem(id: number): Promise<Semifinished> {
    return this.request(`/semifinished/${id}`);
  }

  async createSemifinished(data: Partial<Semifinished>): Promise<Semifinished> {
    return this.request('/semifinished', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSemifinished(id: number, data: Partial<Semifinished>): Promise<Semifinished> {
    return this.request(`/semifinished/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSemifinished(id: number): Promise<void> {
    return this.request(`/semifinished/${id}`, {
      method: 'DELETE',
    });
  }

  async getSemifinishedCategories(): Promise<string[]> {
    return this.request('/semifinished/categories/list');
  }

  // Categories (unified system)
  async getAllCategories(params: { type?: CategoryType; active_only?: boolean } = {}): Promise<Category[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/categories${query ? `?${query}` : ''}`);
  }

  async getCategory(id: number): Promise<Category> {
    return this.request(`/categories/${id}`);
  }

  async createCategory(data: Partial<Category>): Promise<Category> {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: number, data: Partial<Category>): Promise<Category> {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async reorderCategories(orderData: ReorderCategoriesRequest[]): Promise<{ status: string }> {
    return this.request('/categories/reorder', {
      method: 'PATCH',
      body: JSON.stringify(orderData),
    });
  }

  async deleteCategory(id: number): Promise<void> {
    return this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // POS (Касса - объединенный список товаров и техкарт)
  async getPOSItems(): Promise<POSItem[]> {
    return this.request('/pos/items');
  }

  async getPOSCategories(): Promise<Category[]> {
    return this.request('/pos/categories');
  }

  // Product Variants (Варианты товаров - размеры)
  async getProductVariants(productId: number): Promise<ProductVariant[]> {
    return this.request(`/products/${productId}/variants`);
  }

  async createProductVariant(productId: number, data: Partial<ProductVariant>): Promise<ProductVariant> {
    return this.request(`/products/${productId}/variants`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProductVariant(productId: number, variantId: number, data: Partial<ProductVariant>): Promise<ProductVariant> {
    return this.request(`/products/${productId}/variants/${variantId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProductVariant(productId: number, variantId: number): Promise<void> {
    return this.request(`/products/${productId}/variants/${variantId}`, {
      method: 'DELETE',
    });
  }

  // Modifier Groups (Группы модификаций)
  async getModifierGroups(params: Record<string, string | number | boolean> = {}): Promise<ModifierGroup[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/modifier-groups${query ? `?${query}` : ''}`);
  }

  async getModifierGroup(id: number): Promise<ModifierGroup> {
    return this.request(`/modifier-groups/${id}`);
  }

  async createModifierGroup(data: Partial<ModifierGroup>): Promise<ModifierGroup> {
    return this.request('/modifier-groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateModifierGroup(id: number, data: Partial<ModifierGroup>): Promise<ModifierGroup> {
    return this.request(`/modifier-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteModifierGroup(id: number): Promise<void> {
    return this.request(`/modifier-groups/${id}`, {
      method: 'DELETE',
    });
  }

  // Modifiers (Модификации в группе)
  async createModifier(groupId: number, data: Partial<Modifier>): Promise<Modifier> {
    return this.request(`/modifier-groups/${groupId}/modifiers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateModifier(groupId: number, modifierId: number, data: Partial<Modifier>): Promise<Modifier> {
    return this.request(`/modifier-groups/${groupId}/modifiers/${modifierId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteModifier(groupId: number, modifierId: number): Promise<void> {
    return this.request(`/modifier-groups/${groupId}/modifiers/${modifierId}`, {
      method: 'DELETE',
    });
  }

  // Product-Modifier Links (Привязка модификаторов к товарам)
  async getProductModifiers(productId: number): Promise<ModifierGroup[]> {
    return this.request(`/products/${productId}/modifiers`);
  }

  async linkModifierGroupToProduct(productId: number, data: { modifier_group_id: number }): Promise<void> {
    return this.request(`/products/${productId}/modifiers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async unlinkModifierGroupFromProduct(productId: number, groupId: number): Promise<void> {
    return this.request(`/products/${productId}/modifiers/${groupId}`, {
      method: 'DELETE',
    });
  }

  // Locations (Multi-location support)
  async getLocations(activeOnly: boolean = true): Promise<Location[]> {
    return this.request(`/locations?active_only=${activeOnly}`);
  }

  async getLocation(id: number): Promise<Location> {
    return this.request(`/locations/${id}`);
  }

  async createLocation(data: Partial<Location>): Promise<Location> {
    return this.request('/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLocation(id: number, data: Partial<Location>): Promise<Location> {
    return this.request(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLocation(id: number): Promise<void> {
    return this.request(`/locations/${id}`, {
      method: 'DELETE',
    });
  }

  // Stock (Inventory management per location)
  async getStock(locationId: number = 1, lowStock?: boolean): Promise<StockListItem[]> {
    const params = new URLSearchParams({ location_id: locationId.toString() });
    if (lowStock !== undefined) {
      params.append('low_stock', lowStock.toString());
    }
    return this.request(`/stock?${params.toString()}`);
  }

  async getStockForIngredient(ingredientId: number, locationId: number = 1): Promise<Stock> {
    return this.request(`/stock/${ingredientId}?location_id=${locationId}`);
  }

  async createOrUpdateStock(data: CreateStockRequest): Promise<Stock> {
    return this.request('/stock', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adjustStock(ingredientId: number, adjustment: StockAdjustmentRequest, locationId: number = 1): Promise<Stock> {
    return this.request(`/stock/${ingredientId}/adjust?location_id=${locationId}`, {
      method: 'PATCH',
      body: JSON.stringify(adjustment),
    });
  }

  async deleteStock(ingredientId: number, locationId: number = 1): Promise<void> {
    return this.request(`/stock/${ingredientId}?location_id=${locationId}`, {
      method: 'DELETE',
    });
  }
}

export default new ApiClient();
