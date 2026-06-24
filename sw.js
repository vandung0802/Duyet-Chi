// Service Worker v3 — xóa cache cũ, luôn lấy code mới từ server
const CACHE_NAME = 'duyetchi-v3';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Xóa toàn bộ cache cũ
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Không cache gì cả — luôn lấy từ network
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  if(!e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-store' })
  );
});
