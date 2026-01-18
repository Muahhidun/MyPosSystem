// Service Worker для PWA
// Поддержка offline режима с IndexedDB и Background Sync

const CACHE_NAME = 'mypos-v3'; // Updated to force refresh after CP866 print fix
const urlsToCache = [
  '/',
  '/pos',
  '/admin',
  '/dashboard',
  '/index.html',
  '/src/main.jsx',
  '/src/index.css'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Install - v3 with CP866 print fix');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('[SW] Cache failed:', err);
      })
  );

  // Activate immediately
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Take control immediately
  return self.clients.claim();
});

// Fetch - стратегия Network First (сначала сеть, потом кэш)
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Если запрос успешен, кэшируем ответ (только GET)
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Если сеть недоступна, берем из кэша
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Если в кэше тоже нет, показываем офлайн страницу
            return caches.match('/');
          });
      })
  );
});

// Background Sync для синхронизации заказов
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-orders') {
    event.waitUntil(syncPendingOrders());
  }
});

/**
 * Sync pending orders from IndexedDB to server
 */
async function syncPendingOrders() {
  try {
    console.log('[SW] Syncing pending orders...');

    // Open IndexedDB
    const db = await openDatabase();
    const orders = await getPendingOrders(db);

    if (orders.length === 0) {
      console.log('[SW] No pending orders to sync');
      return;
    }

    console.log(`[SW] Found ${orders.length} pending orders`);

    // Notify clients about sync start
    await notifyClients({ type: 'sync-start', count: orders.length });

    let successCount = 0;
    let failCount = 0;

    for (const order of orders) {
      try {
        // Try to send order to server
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(order.orderData),
        });

        if (response.ok) {
          // Success - remove from IndexedDB
          await removeOrder(db, order.id);
          successCount++;
          console.log('[SW] Order synced successfully:', order.id);
        } else {
          failCount++;
          console.error('[SW] Failed to sync order:', order.id, response.status);
        }
      } catch (error) {
        failCount++;
        console.error('[SW] Error syncing order:', order.id, error);
      }
    }

    // Notify clients about sync completion
    await notifyClients({
      type: 'sync-complete',
      success: successCount,
      failed: failCount,
    });

    console.log(`[SW] Sync complete: ${successCount} success, ${failCount} failed`);
  } catch (error) {
    console.error('[SW] Sync error:', error);
  }
}

/**
 * Open IndexedDB
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MyPOS_OfflineDB', 1);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get pending orders from IndexedDB
 */
function getPendingOrders(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending_orders'], 'readonly');
    const store = transaction.objectStore('pending_orders');
    const request = store.getAll();

    request.onsuccess = () => {
      const orders = request.result.filter(o => o.status === 'pending');
      resolve(orders);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove order from IndexedDB
 */
function removeOrder(db, orderId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending_orders'], 'readwrite');
    const store = transaction.objectStore('pending_orders');
    const request = store.delete(orderId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Notify all clients about sync status
 */
async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(message);
  });
}
