/* ============================================================
   EmergenciaApp — Service Worker v1.3
   
   Estrategia diferenciada:
   - HTML, CSS, imágenes, íconos → Cache First (offline total)
   - Módulos JS (src/) → Network First con fallback a caché
   
   Los módulos ES son sensibles al MIME type y al status code,
   por eso se manejan con Network First para evitar errores
   de "message channel closed" en extensiones del navegador.
   ============================================================ */

const CACHE_NAME    = 'emergencia-v1.3';
const CACHE_STATIC  = 'emergencia-static-v1.3';

// Assets estáticos — Cache First
const STATIC_ASSETS = [
  './index.html',
  './favicon.ico',
  './manifest.json',
  './assets/styles.css',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

// Módulos JS — se cachean tras la primera carga (Network First)
const JS_MODULES = [
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
];

// ── Instalación ───────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_STATIC).then(c => c.addAll(STATIC_ASSETS)),
      caches.open(CACHE_NAME).then(c => c.addAll(JS_MODULES)),
    ]).then(() => self.skipWaiting())
  );
});

// ── Activación: limpiar cachés viejos ─────────────────────
self.addEventListener('activate', event => {
  const validCaches = [CACHE_NAME, CACHE_STATIC];
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => !validCaches.includes(k))
          .map(k  => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Ignorar requests de otros orígenes (extensiones, analytics, etc.)
  if (!url.startsWith(self.location.origin)) return;

  // Solo interceptar GETs
  if (event.request.method !== 'GET') return;

  const path = url.replace(self.location.origin, '');

  // Módulos JS → Network First
  // Intenta la red primero; si falla, usa el caché.
  // Nunca devuelve 503 para módulos JS (rompería el import)
  if (path.includes('/src/') || path.endsWith('.js') || path.endsWith('.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME)
              .then(c => c.put(event.request, clone))
              .catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(event.request))
        // Si tampoco está en caché, dejar que el error de red llegue
        // al navegador naturalmente (no devolver 503)
    );
    return;
  }

  // Assets estáticos → Cache First
  event.respondWith(
    caches.match(event.request, { cacheName: CACHE_STATIC })
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request)
          .then(response => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_STATIC)
                .then(c => c.put(event.request, clone))
                .catch(() => {});
            }
            return response;
          })
          .catch(() => {
            // Sin red: para documentos, servir index.html
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            // Para otros assets estáticos, dejar pasar el error
            // en lugar de devolver 503 (evita cerrar el canal)
          });
      })
  );
});

// ── Mensajes desde la app ─────────────────────────────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
  }
});
