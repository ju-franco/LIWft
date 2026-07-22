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

// Intercepta as requisições (incluindo os GIFs e a API de anatomia)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Se for requisição externa (como a anatome.dev ou GIFs externos), usa estratégia Cache First com atualização em background
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Retorna do cache se estiver disponível offline
        return cachedResponse;
      }

      // Se não estiver no cache, busca na rede e salva uma cópia localmente
      return fetch(event.request).then((networkResponse) => {
        // Verifica se a resposta é válida antes de cachear
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && !requestUrl.origin.includes('anatome.dev') && !requestUrl.origin.includes('makeagif') && !requestUrl.origin.includes('image2url') && !requestUrl.origin.includes('fisiculturismo') && !requestUrl.origin.includes('karoldeliberato')) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback caso esteja offline e o recurso não esteja no cache
        return caches.match('./index.html');
      });
    })
  );
});