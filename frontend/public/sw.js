// Service Worker для PWA
// Базовое кэширование для офлайн режима

const CACHE_NAME = 'mypos-v1';
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
  console.log('[SW] Install');
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
});

// Fetch - стратегия Network First (сначала сеть, потом кэш)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Если запрос успешен, кэшируем ответ
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
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
