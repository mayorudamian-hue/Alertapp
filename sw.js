/* ============================================================
   EmergenciaApp — Service Worker
   Estrategia: Cache First para todos los assets estáticos.
   La app funciona 100% offline una vez instalada.
   ============================================================ */

const CACHE_NAME = 'emergencia-v1.2';

// Todos los archivos que se cachean al instalar
const PRECACHE = [
  './index.html',
  './favicon.ico',
  './manifest.json',
  './assets/styles.css',
  './src/core/constants.js',
  './src/core/utils.js',
  './src/core/validators.js',
  './src/data/storage.js',
  './src/data/inventory.json',
  './src/screens/Dashboard.js',
  './src/screens/Backpack.js',
  './src/screens/Contacts.js',
  './src/screens/Guides.js',
  './src/screens/Supplies.js',
  './src/services/Notifications.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

// ── Instalación: pre-cachear todo ─────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activación: limpiar caches viejos ─────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key  => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: Cache First, fallback a red ────────────────────
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Ignorar requests que no son del mismo origen
  // (evita conflictos con extensiones del navegador)
  if (!url.startsWith(self.location.origin)) return;

  // Solo interceptar GETs
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // No está en caché → intentar red
      return fetch(event.request)
        .then(response => {
          // Solo cachear respuestas válidas del mismo origen
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          // Guardar en caché para próximas visitas offline
          const toCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, toCache))
            .catch(() => {}); // ignorar errores secundarios de caché
          return response;
        })
        .catch(() => {
          // Sin red y sin caché
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
          // Devolver respuesta vacía (no undefined) para no cerrar
          // el canal de mensaje abruptamente
          return new Response('', {
            status:     503,
            statusText: 'Service Unavailable',
          });
        });
    })
  );
});

// ── Mensajes desde la app ─────────────────────────────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    // waitUntil evita que el canal se cierre antes de resolver
    event.waitUntil(self.skipWaiting());
  }
});
