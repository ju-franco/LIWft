const CACHE_NAME = 'liwft-cache-v2';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './db.js',
  './default-exercises.js',
  './manifest.json',
  './assets/logo-LIWft.png',
  './assets/peitoral.png',
  './assets/costas.png',
  './assets/pernas.png',
  './assets/gluteos.png',
  './assets/full-body.png',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

const NETWORK_FIRST_FILES = ['app.js', 'db.js', 'style.css', 'index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : undefined)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  const fileName = requestUrl.pathname.split('/').pop() || '';
  const useNetworkFirst = NETWORK_FIRST_FILES.includes(fileName);

  if (useNetworkFirst) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
