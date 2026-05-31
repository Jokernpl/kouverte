// ============================================================
// Kouverte Service Worker — Production PWA
// Versione: 3.0.0
// Strategia: Network-first per API+HTML, Cache-first per immagini
// ============================================================

const CACHE_NAME = 'kouverte-v3';
const STATIC_CACHE = 'kouverte-static-v3';

// Assets da cachare al primo avvio
const PRECACHE_ASSETS = [
  '/',
  '/app.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/og-image.png'
];

// ---- INSTALL: precache assets ----
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v2...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('[SW] Some precache assets failed:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ---- ACTIVATE: pulisci vecchie cache ----
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v2...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map(k => {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ---- FETCH: Network-first per API e socket, Cache-first per assets ----
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET e requests esterne
  if (event.request.method !== 'GET') return;
  if (!url.origin.includes('kouverte.com') && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') return;

  // Skip Socket.io e API (sempre network)
  if (url.pathname.startsWith('/socket.io') || url.pathname.startsWith('/api/')) return;

  // Cache-first per assets statici (immagini, icone, manifest)
  if (
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico|woff2|woff|ttf)$/) ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then(c => c.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first per HTML (app.html, index.html) — force-fresh (bypassa HTTP cache)
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request, { cache: 'reload' }).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback
        return caches.match(event.request).then(cached => {
          return cached || caches.match('/app.html');
        });
      })
    );
    return;
  }
});

// ---- PUSH NOTIFICATIONS ----
self.addEventListener('push', (event) => {
  console.log('[SW] Push ricevuta');

  let data = { title: 'Kouverte', body: 'Hai un nuovo messaggio!', icon: '/icon-192.png' };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    console.warn('[SW] Push data parse error:', e);
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: '/favicon-32.png',
    tag: data.tag || 'kouverte-msg',
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/app.html',
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: 'Apri Chat' },
      { action: 'dismiss', title: 'Ignora' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ---- NOTIFICATION CLICK ----
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/app.html';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Cerca una finestra già aperta
      for (const client of clients) {
        if (client.url.includes('kouverte') && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'PUSH_CLICK', url: targetUrl });
          return;
        }
      }
      // Apri nuova finestra
      return self.clients.openWindow(targetUrl);
    })
  );
});

// ---- MESSAGE (da app.html) ----
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Kouverte Service Worker v2 loaded');
