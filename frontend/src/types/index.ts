// ============================================
// Enums
// ============================================

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  KASPI = 'kaspi'
}

export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ItemType {
  PRODUCT = 'product',
  RECIPE = 'recipe'
}

export enum CategoryType {
  PRODUCT = 'product',
  RECIPE = 'recipe',
  INGREDIENT = 'ingredient',
  SEMIFINISHED = 'semifinished',
  POS = 'pos'
}

export enum ModifierSelectionType {
  SINGLE = 'single',
  MULTIPLE = 'multiple'
}

// ============================================
// Core Entities
// ============================================

export interface Product {
  id: number;
  name: string;
  price: number;
  category_id?: number;
  category?: string;
  display_order: number;
  show_in_pos: boolean;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  purchase_price: number;
  supplier?: string;
  category_id?: number;
  category?: string;
  display_order: number;
  gross_weight?: number;
  net_weight?: number;
  stock_quantity?: number; // DEPRECATED - use Stock API
  min_stock?: number; // DEPRECATED - use Stock API
  is_low_stock?: boolean; // DEPRECATED - use Stock API
  created_at: string;
  updated_at?: string;
}

export interface Recipe {
  id: number;
  name: string;
  price: number;
  category_id?: number;
  category?: string;
  display_order: number;
  show_in_pos: boolean;
  is_active: boolean;
  image_url?: string;
  ingredients: RecipeIngredient[];
  created_at: string;
  updated_at?: string;
}

export interface RecipeIngredient {
  ingredient_id: number;
  ingredient_name?: string;
  gross_weight: number;
  net_weight: number;
  unit?: string;
}

export interface Semifinished {
  id: number;
  name: string;
  unit: string;
  category_id?: number;
  category?: string;
  display_order: number;
  ingredients: SemifinishedIngredient[];
  created_at: string;
  updated_at?: string;
}

export interface SemifinishedIngredient {
  ingredient_id: number;
  ingredient_name?: string;
  gross_weight: number;
  net_weight: number;
  unit?: string;
}

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
  display_order: number;
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// ============================================
// Orders
// ============================================

export interface Order {
  id: number;
  order_number: string;
  location_id: number;
  total: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  items: OrderItem[];
  created_at: string;
  updated_at?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  item_type: ItemType;
  product_id?: number;
  recipe_id?: number;
  variant_id?: number;
  quantity: number;
  price: number;
  item_name: string;
  modifiers?: OrderItemModifier[];
}

export interface OrderItemModifier {
  modifier_id: number;
  name: string;
  price: number;
}

// ============================================
// Product Variants & Modifiers
// ============================================

export interface ProductVariant {
  id: number;
  base_product_id: number;
  recipe_id: number;
  name: string;
  size_code?: string;
  price_adjustment: number;
  display_order: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ModifierGroup {
  id: number;
  name: string;
  selection_type: ModifierSelectionType;
  min_selections: number;
  max_selections?: number;
  is_required: boolean;
  display_order: number;
  modifiers: Modifier[];
}

export interface Modifier {
  id: number;
  group_id: number;
  name: string;
  price: number;
  ingredient_id?: number;
  quantity_per_use: number;
  display_order: number;
  is_available: boolean;
}

export interface ProductModifierGroup {
  id: number;
  product_id: number;
  modifier_group_id: number;
  display_order: number;
}

// ============================================
// Multi-Location Support
// ============================================

export interface Location {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Stock {
  id: number;
  location_id: number;
  location_name?: string;
  ingredient_id: number;
  ingredient_name?: string;
  ingredient_unit?: string;
  quantity: number;
  min_stock: number;
  is_low_stock: boolean;
  stock_value?: number;
  created_at: string;
  updated_at?: string;
}

export interface StockListItem {
  ingredient_id: number;
  ingredient_name: string;
  unit: string;
  quantity: number;
  min_stock: number;
  is_low_stock: boolean;
  purchase_price?: number;
  stock_value?: number;
}

// ============================================
// Settings
// ============================================

export interface Settings {
  id: number;
  key: string;
  value: string;
  description?: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateOrderRequest {
  location_id?: number;
  items: {
    item_type: ItemType;
    product_id?: number;
    recipe_id?: number;
    variant_id?: number;
    quantity: number;
    price: number;
    modifiers?: OrderItemModifier[];
  }[];
  payment_method: PaymentMethod;
  total: number;
}

export interface StockAdjustmentRequest {
  adjustment: number;
  reason?: string;
}

export interface CreateStockRequest {
  location_id: number;
  ingredient_id: number;
  quantity: number;
  min_stock: number;
}

export interface ReorderCategoriesRequest {
  id: number;
  display_order: number;
}

// ============================================
// POS Types
// ============================================

export interface POSItem {
  id: number;
  type: 'product' | 'recipe';
  name: string;
  price: number;
  category_id?: number;
  category_name?: string;
  image_url?: string;
  has_variants?: boolean;
  has_modifiers?: boolean;
}

export interface CartItem extends POSItem {
  cartKey: string;
  quantity: number;
  variant?: ProductVariant;
  modifiers?: Modifier[];
  displayName: string;
  displayModifiers?: string;
}

// ============================================
// Utility Types
// ============================================

export interface ApiError {
  detail: string;
  status_code?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
