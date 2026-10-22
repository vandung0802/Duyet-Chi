const VERSION = '20261023-183';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim().then(() => {
    return self.clients.matchAll({ type: 'window' }).then(all => {
      all.forEach(c => c.postMessage('SW_RELOAD'));
    });
  }));
});

self.addEventListener('push', function(event) {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e) {}
  const title = data.title || 'Duyá»‡t Chi';
  const body = data.body || '';
  event.waitUntil((async () => {
    const notifications = await self.registration.getNotifications();
    const count = notifications.length + 1;
    if (navigator.setAppBadge) await navigator.setAppBadge(count);
    await self.registration.showNotification(title, {
      body: body,
      icon: 'https://vandung0802.github.io/Duyet-Chi/icon-192.png',
      badge: 'https://vandung0802.github.io/Duyet-Chi/icon-192.png',
      data: { url: 'https://vandung0802.github.io/Duyet-Chi/app3.html' }
    });
  })());
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url)
    || 'https://vandung0802.github.io/Duyet-Chi/app3.html';
  event.waitUntil((async () => {
    const remaining = await self.registration.getNotifications();
    const count = Math.max(0, remaining.length - 1);
    if (count === 0) { if (navigator.clearAppBadge) await navigator.clearAppBadge(); }
    else { if (navigator.setAppBadge) await navigator.setAppBadge(count); }
    // Thá»­ focus window Ä‘ang má»Ÿ, náº¿u khÃ´ng cÃ³ thÃ¬ má»Ÿ má»›i
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const dcClient = allClients.find(c => c.url.includes('/Duyet-Chi/'));
    if (dcClient) { await dcClient.focus(); }
    else { await clients.openWindow(targetUrl); }
  })());
});

self.addEventListener('message', function(event) {
  if (event.data === 'CLEAR_BADGE') {
    if (navigator.clearAppBadge) navigator.clearAppBadge();
    // ÄÃ³ng háº¿t notification Ä‘ang hiá»‡n
    self.registration.getNotifications().then(notifs => notifs.forEach(n => n.close()));
  }
  if (event.data === 'SW_RELOAD') return; // handled in app
  if (event.data && event.data.type === 'SET_BADGE') {
    const n = event.data.count || 0;
    if (n > 0) { if (navigator.setAppBadge) navigator.setAppBadge(n); }
    else { if (navigator.clearAppBadge) navigator.clearAppBadge(); }
  }
});
