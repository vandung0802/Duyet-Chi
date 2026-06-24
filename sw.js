// Service Worker — luôn lấy code mới từ server, không dùng cache cũ
const VERSION = 'v' + Date.now(); // thay đổi mỗi lần deploy

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  // Chỉ xử lý request tới cùng origin (index.html, sw.js...)
  if(e.request.url.startsWith(self.location.origin)){
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).catch(() => caches.match(e.request))
    );
  }
});
