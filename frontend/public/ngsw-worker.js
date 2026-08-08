/*
 * Kill-switch for the old Angular PWA service worker. Browsers re-fetch this
 * file from the network regardless of what the old worker has cached, so
 * clients stuck on the cached PWA pick this up, get their caches wiped, and
 * reload into the new SPA. Keep it deployed at the app root.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(client => client.navigate(client.url));
  })());
});
