// KILLER SW - si auto-disinstalla, cancella tutte le cache, forza reload dei client.
// Necessario per ripulire i Service Worker installati nelle versioni precedenti che
// servivano HTML/JS vecchi dalla cache impedendo gli update.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 1. Cancella tutte le cache
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    // 2. Auto-disinstalla
    await self.registration.unregister();
    // 3. Reload forzato di tutti i client controllati (così caricano fresco da network)
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(c => { try { c.navigate(c.url); } catch(e) {} });
  })());
});

// NIENTE fetch handler: tutte le richieste vanno direttamente alla rete.
