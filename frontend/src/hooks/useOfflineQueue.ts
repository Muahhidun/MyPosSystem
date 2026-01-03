/**
 * React hook for managing offline order queue
 *
 * Features:
 * - Detects online/offline status
 * - Queues orders when offline
 * - Auto-syncs when connection restored
 * - Shows pending orders count
 */

import { useState, useEffect, useCallback } from 'react';
import offlineDB, { type PendingOrder } from '../utils/offlineDB';
import api from '../api/client';
import type { OrderCreate } from '../types';
import toast from 'react-hot-toast';

interface UseOfflineQueueReturn {
  isOnline: boolean;
  pendingCount: number;
  createOrder: (orderData: OrderCreate) => Promise<void>;
  syncPendingOrders: () => Promise<void>;
  isSyncing: boolean;
}

export function useOfflineQueue(): UseOfflineQueueReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  /**
   * Update pending orders count
   */
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await offlineDB.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  }, []);

  /**
   * Handle online/offline status changes
   */
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Connection restored');
      setIsOnline(true);
      toast.success('Соединение восстановлено', { duration: 2000 });

      // Auto-sync pending orders
      syncPendingOrders();
    };

    const handleOffline = () => {
      console.log('📡 Connection lost');
      setIsOnline(false);
      toast.error('Нет соединения. Заказы будут сохранены локально', {
        duration: 3000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial pending count
    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updatePendingCount]);

  /**
   * Create order (online or offline)
   */
  const createOrder = useCallback(
    async (orderData: OrderCreate): Promise<void> => {
      if (isOnline) {
        // Try to create order online
        try {
          await api.createOrder(orderData);
          toast.success('Заказ создан');
        } catch (error) {
          console.error('Failed to create order online:', error);

          // If network error, save to offline queue
          if (
            error instanceof Error &&
            (error.message.includes('Failed to fetch') ||
              error.message.includes('NetworkError'))
          ) {
            console.log('📥 Saving to offline queue due to network error');
            await offlineDB.addPendingOrder(orderData);
            await updatePendingCount();
            toast.error(
              'Ошибка сети. Заказ сохранен локально и отправится автоматически'
            );
          } else {
            // Other errors (validation, etc.)
            throw error;
          }
        }
      } else {
        // Offline - save to queue
        console.log('📥 Saving to offline queue (offline mode)');
        await offlineDB.addPendingOrder(orderData);
        await updatePendingCount();
        toast.success(
          `Заказ сохранен локально. Отправится когда появится интернет (${pendingCount + 1} в очереди)`
        );
      }
    },
    [isOnline, pendingCount, updatePendingCount]
  );

  /**
   * Sync pending orders to server
   */
  const syncPendingOrders = useCallback(async (): Promise<void> => {
    if (!isOnline || isSyncing) return;

    try {
      setIsSyncing(true);
      const pending = await offlineDB.getPendingOrders();

      if (pending.length === 0) {
        console.log('✅ No pending orders to sync');
        return;
      }

      console.log(`🔄 Syncing ${pending.length} pending orders...`);
      toast.loading(`Отправка ${pending.length} заказов...`, {
        id: 'sync-toast',
      });

      let successCount = 0;
      let failCount = 0;

      for (const order of pending) {
        try {
          await offlineDB.updateOrderStatus(order.id!, 'syncing');

          // Try to create order on server
          await api.createOrder(order.orderData);

          // Success - remove from queue
          await offlineDB.removeOrder(order.id!);
          successCount++;
        } catch (error) {
          console.error('Failed to sync order:', order.id, error);

          // Mark as failed
          await offlineDB.updateOrderStatus(
            order.id!,
            'failed',
            error instanceof Error ? error.message : 'Unknown error'
          );
          failCount++;
        }
      }

      await updatePendingCount();

      // Show result
      if (failCount === 0) {
        toast.success(`✅ ${successCount} заказов отправлено`, {
          id: 'sync-toast',
        });
      } else {
        toast.error(
          `⚠️ ${successCount} отправлено, ${failCount} с ошибкой`,
          { id: 'sync-toast' }
        );
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Ошибка синхронизации', { id: 'sync-toast' });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, updatePendingCount]);

  /**
   * Auto-sync when coming online
   */
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      // Delay sync by 2 seconds to ensure stable connection
      const timer = setTimeout(() => {
        syncPendingOrders();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingCount, isSyncing, syncPendingOrders]);

  return {
    isOnline,
    pendingCount,
    createOrder,
    syncPendingOrders,
    isSyncing,
  };
}
