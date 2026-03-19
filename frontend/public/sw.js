self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  // Can handle push if we add actual server push, but for now it's requested from client via reg.showNotification()
});
