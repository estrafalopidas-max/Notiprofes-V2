// Service Worker Institucional NotiProfes Digital — I.E. Villa Flora
// Garantiza disponibilidad offline del boletín actual, HTML público y recursos esenciales (Estrategia Network-First con respaldo en Caché).

const CACHE_VERSION = 'notiprofes-vf-cache-v1';
const RECURSOS_BASE = [
  '/',
  '/index.html',
  '/b',
  '/public/schedule?id=actual',
  '/api/public/boletin/actual',
  '/api/public/boletines',
  '/favicon.png',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return Promise.allSettled(
        RECURSOS_BASE.map((url) =>
          fetch(url, { credentials: 'same-origin' }).then((resp) => {
            if (resp && resp.status === 200) {
              return cache.put(url, resp);
            }
          })
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('notiprofes-vf-cache-') && k !== CACHE_VERSION)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin && !url.hostname.includes('fonts.g')) {
    return;
  }

  // No interceptar endpoints privados o de autenticación
  if (
    url.pathname.startsWith('/api/auth') ||
    url.pathname.startsWith('/api/notificaciones') ||
    url.pathname.startsWith('/api/drive') ||
    url.pathname.startsWith('/api/calendario')
  ) {
    return;
  }

  // Estrategia Network-First para el boletín público (API JSON, vista HTML /b, /public/schedule y navegación principal)
  const esBoletinONavegacion =
    req.mode === 'navigate' ||
    url.pathname.startsWith('/api/public/boletin') ||
    url.pathname.startsWith('/public/schedule') ||
    url.pathname.startsWith('/b') ||
    url.pathname.startsWith('/public/pdf/');

  if (esBoletinONavegacion) {
    event.respondWith(
      fetch(req)
        .then((networkResp) => {
          if (networkResp && networkResp.status === 200) {
            const copia = networkResp.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(req, copia);
              if (url.pathname.startsWith('/api/public/boletin/')) {
                cache.put('/api/public/boletin/actual', networkResp.clone());
              }
            });
          }
          return networkResp;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_VERSION);
          const enCache = await cache.match(req);
          if (enCache) return enCache;

          if (url.pathname.startsWith('/api/public/boletin/')) {
            const actualCache = await cache.match('/api/public/boletin/actual');
            if (actualCache) return actualCache;
          }

          if (req.mode === 'navigate') {
            const fallbackHtml =
              (await cache.match('/public/schedule?id=actual')) ||
              (await cache.match('/b')) ||
              (await cache.match('/index.html')) ||
              (await cache.match('/'));
            if (fallbackHtml) return fallbackHtml;
          }

          return new Response(
            JSON.stringify({
              offline: true,
              error: 'Sin conexión a la red y sin copia previa en caché local.',
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json; charset=utf-8' },
            }
          );
        })
    );
    return;
  }

  // Estrategia Stale-While-Revalidate para activos estáticos (JS, CSS, fuentes, íconos, escudos)
  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const enCache = await cache.match(req);
      const promesaRed = fetch(req)
        .then((respRed) => {
          if (respRed && respRed.status === 200) {
            cache.put(req, respRed.clone());
          }
          return respRed;
        })
        .catch(() => enCache);

      return enCache || promesaRed;
    })
  );
});
