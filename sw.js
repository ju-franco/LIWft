const CACHE_NAME = 'liwft-cache-v1';

// Arquivos locais essenciais do app
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

// Instalação do Service Worker e cache dos assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercepta as requisições (incluindo GIFs externos e APIs)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Se a resposta não for válida, apenas retorna sem quebrar
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // Clona e salva em cache dinamicamente qualquer imagem ou requisição bem-sucedida
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        return caches.match('./index.html');
      });
    })
  );
});