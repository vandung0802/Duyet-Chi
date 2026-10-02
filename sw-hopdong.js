// Service worker RIÊNG của app Hợp đồng PVA-379-279 (hopdong.html), phạm vi "hopdong" — không đụng sw.js của app Duyệt Chi.
// Chỉ làm 2 việc: nhận thông báo đẩy (web push) từ kịch bản nhắc hạn 07:00 và mở app khi bấm vào thông báo.
// KHÔNG cache gì cả: app vẫn tải thẳng từ GitHub Pages, bản mới kiểm bằng version-hopdong.txt như trước.
const VERSION = '20261002-1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', function (event) {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) {}
  const title = d.title || '📑 Hợp đồng PVA-379-279';
  event.waitUntil(self.registration.showNotification(title, {
    body: d.body || '',
    tag: d.tag || undefined,            // cùng tag → thay thông báo cũ, không chồng
    icon: 'https://vandung0802.github.io/Duyet-Chi/icon-192.png',
    badge: 'https://vandung0802.github.io/Duyet-Chi/icon-192.png',
    data: { url: d.url || 'https://vandung0802.github.io/Duyet-Chi/hopdong.html' }
  }));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || 'https://vandung0802.github.io/Duyet-Chi/hopdong.html';
  event.waitUntil((async () => {
    const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const c = all.find(x => x.url.includes('hopdong.html'));
    if (c) { try { await c.focus(); if (c.navigate) await c.navigate(url); } catch (e) {} return; }
    await clients.openWindow(url);
  })());
});
