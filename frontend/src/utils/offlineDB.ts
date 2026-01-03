/**
 * IndexedDB wrapper for offline order queue
 *
 * Stores orders when network is unavailable and syncs them when connection is restored.
 */

import type { OrderCreate } from '../types';

const DB_NAME = 'MyPOS_OfflineDB';
const DB_VERSION = 1;
const ORDERS_STORE = 'pending_orders';

export interface PendingOrder {
  id?: number;
  orderData: OrderCreate;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
  error?: string;
}

class OfflineDB {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB connection
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('📦 IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store for pending orders
        if (!db.objectStoreNames.contains(ORDERS_STORE)) {
          const store = db.createObjectStore(ORDERS_STORE, {
            keyPath: 'id',
            autoIncrement: true,
          });

          // Index by timestamp for sorting
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('status', 'status', { unique: false });

          console.log('📦 Created IndexedDB object store:', ORDERS_STORE);
        }
      };
    });
  }

  /**
   * Add order to offline queue
   */
  async addPendingOrder(orderData: OrderCreate): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ORDERS_STORE], 'readwrite');
      const store = transaction.objectStore(ORDERS_STORE);

      const pendingOrder: PendingOrder = {
        orderData,
        timestamp: Date.now(),
        status: 'pending',
        retryCount: 0,
      };

      const request = store.add(pendingOrder);

      request.onsuccess = () => {
        console.log('📥 Order saved to offline queue:', request.result);
        resolve(request.result as number);
      };

      request.onerror = () => {
        reject(new Error('Failed to save order to offline queue'));
      };
    });
  }

  /**
   * Get all pending orders
   */
  async getPendingOrders(): Promise<PendingOrder[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ORDERS_STORE], 'readonly');
      const store = transaction.objectStore(ORDERS_STORE);
      const index = store.index('timestamp');

      const request = index.getAll();

      request.onsuccess = () => {
        const orders = request.result.filter(
          (order: PendingOrder) => order.status === 'pending'
        );
        resolve(orders);
      };

      request.onerror = () => {
        reject(new Error('Failed to get pending orders'));
      };
    });
  }

  /**
   * Get count of pending orders
   */
  async getPendingCount(): Promise<number> {
    const orders = await this.getPendingOrders();
    return orders.length;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    id: number,
    status: 'pending' | 'syncing' | 'failed',
    error?: string
  ): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ORDERS_STORE], 'readwrite');
      const store = transaction.objectStore(ORDERS_STORE);

      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const order = getRequest.result as PendingOrder;
        if (!order) {
          reject(new Error('Order not found'));
          return;
        }

        order.status = status;
        if (error) order.error = error;
        if (status === 'syncing') order.retryCount++;

        const updateRequest = store.put(order);

        updateRequest.onsuccess = () => {
          resolve();
        };

        updateRequest.onerror = () => {
          reject(new Error('Failed to update order status'));
        };
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to get order'));
      };
    });
  }

  /**
   * Remove order from queue (after successful sync)
   */
  async removeOrder(id: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ORDERS_STORE], 'readwrite');
      const store = transaction.objectStore(ORDERS_STORE);

      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('🗑️ Order removed from offline queue:', id);
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to remove order'));
      };
    });
  }

  /**
   * Clear all orders (use with caution!)
   */
  async clearAll(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ORDERS_STORE], 'readwrite');
      const store = transaction.objectStore(ORDERS_STORE);

      const request = store.clear();

      request.onsuccess = () => {
        console.log('🗑️ All offline orders cleared');
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear orders'));
      };
    });
  }
}

// Singleton instance
const offlineDB = new OfflineDB();

export default offlineDB;
