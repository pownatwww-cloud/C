/* ── Service Worker: Calc 40% ── */
const CACHE_NAME = 'calc40-v1.0.0';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon.png'
];

/* Install: pre-cache all assets */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

/* Activate: delete old caches (fixes stale cache bug) */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* Fetch: cache-first, fallback to network */
self.addEventListener('fetch', event => {
  /* Only handle GET requests */
  if (event.request.method !== 'GET') return;

  /* Only handle same-origin or explicitly listed assets */
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin &&
      !url.hostname.includes('fonts.googleapis.com') &&
      !url.hostname.includes('fonts.gstatic.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        /* Cache valid responses only */
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        /* Offline fallback */
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
