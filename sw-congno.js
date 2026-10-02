// Service worker RIÊNG của app Công nợ ngân hàng PVA-379-279 (congno.html), phạm vi "congno" — không đụng sw.js của app Duyệt Chi, sw-hopdong.js của app Hợp đồng.
// Chỉ làm 2 việc: nhận thông báo đẩy (web push) từ kịch bản nhắc hạn 07:00 và mở app khi bấm vào thông báo.
// KHÔNG cache gì cả: app vẫn tải thẳng từ GitHub Pages, bản mới kiểm bằng version-congno.txt.
const VERSION = '20261002-1';
const URL_APP = 'https://vandung0802.github.io/Duyet-Chi/congno.html';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', function (event) {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) {}
  event.waitUntil(self.registration.showNotification(d.title || '🏦 Công nợ PVA-379-279', {
    body: d.body || '',
    tag: d.tag || undefined,            // cùng tag → thay thông báo cũ, không chồng
    icon: 'https://vandung0802.github.io/Duyet-Chi/icon-192.png',
    badge: 'https://vandung0802.github.io/Duyet-Chi/icon-192.png',
    data: { url: d.url || URL_APP }
  }));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || URL_APP;
  event.waitUntil((async () => {
    const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const c = all.find(x => x.url.includes('congno.html'));
    if (c) { try { await c.focus(); } catch (e) {} return; }
    await clients.openWindow(url);
  })());
});
