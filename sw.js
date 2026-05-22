// 🔴 KILLER SW - VERSIONE AGGRESSIVA
// Disinstalla completamente, cancella TUTTE le cache, forza reload
// Risolve problemi di cache stale che impediscono gli update

self.addEventListener('install', (event) => {
  console.log('[SW] Install - skipWaiting');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate - cancellando cache e disinstallando');
  event.waitUntil((async () => {
    try {
      // 1. Cancella tutte le cache
      const keys = await caches.keys();
      console.log(`[SW] Cache da cancellare: ${keys.join(', ')}`);
      await Promise.all(keys.map(k => {
        console.log(`[SW] Cancellando cache: ${k}`);
        return caches.delete(k);
      }));
      
      // 2. Cancella storage
      try {
        localStorage.clear();
        sessionStorage.clear();
        console.log('[SW] Storage pulito');
      } catch (e) { console.log('[SW] Storage clear error:', e.message); }
      
      // 3. Auto-disinstalla
      console.log('[SW] Disinstallando SW');
      await self.registration.unregister();
      
      // 4. Reload forzato di TUTTI i client
      const clients = await self.clients.matchAll({ type: 'window' });
      console.log(`[SW] Reloading ${clients.length} client(s)`);
      clients.forEach(c => {
        try {
          c.navigate(c.url);
          c.postMessage({ type: 'FORCE_RELOAD', timestamp: Date.now() });
        } catch(e) {
          console.log('[SW] Reload error:', e.message);
        }
      });
    } catch (err) {
      console.error('[SW] Activate error:', err);
    }
  })());
});

self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Ricevuto SKIP_WAITING');
    self.skipWaiting();
  }
});

// NIENTE fetch handler: tutte le richieste vanno direttamente alla rete
console.log('[SW] Loaded - uccidendo vecchio SW');
