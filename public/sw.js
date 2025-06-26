self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('assets-v1').then(cache => cache.addAll([
      '/',
      '/manifest.json',
    ]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
