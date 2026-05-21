// Service Worker Kouverte - cache control + update automatici
const VERSION = 'kv-' + Date.now(); // cambia ad ogni deploy
const STATIC_CACHE = 'kouverte-static-' + VERSION;

// Install: pre-cache asset essenziali (icone, manifest)
self.addEventListener('install', (event) => {
  self.skipWaiting(); // attiva subito il nuovo SW
});

// Activate: pulizia vecchie cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== STATIC_CACHE && k.startsWith('kouverte-'))
            .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - HTML/JS/CSS principali → NETWORK FIRST (così update appaiono subito)
// - Asset statici (icone, font) → CACHE FIRST
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Skip socket.io, telegram, API live
  if (url.pathname.startsWith('/socket.io') ||
      url.pathname.startsWith('/api/') ||
      url.hostname.includes('telegram.org')) {
    return;
  }

  // HTML / JS / CSS / app: SEMPRE network, MAI cache (evita problemi di update)
  if (req.destination === 'document' ||
      req.destination === 'script' ||
      req.destination === 'style' ||
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).catch(() => caches.match(req))
    );
    return;
  }

  // Tutto il resto: CACHE FIRST (icone, immagini, font)
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
      return res;
    }))
  );
});
