self.addEventListener('push', function(event) {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e) {}
  const title = data.title || 'Duyệt Chi';
  const body = data.body || '';
  event.waitUntil((async () => {
    const notifications = await self.registration.getNotifications();
    const count = notifications.length + 1;
    if (navigator.setAppBadge) await navigator.setAppBadge(count);
    await self.registration.showNotification(title, {
      body: body,
      icon: 'https://vandung0802.github.io/Duyet-Chi/icon-192.png',
      badge: 'https://vandung0802.github.io/Duyet-Chi/icon-192.png',
      data: { url: 'https://vandung0802.github.io/Duyet-Chi/app2.html' }
    });
  })());
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil((async () => {
    const remaining = await self.registration.getNotifications();
    const count = Math.max(0, remaining.length - 1);
    if (count === 0) { if (navigator.clearAppBadge) await navigator.clearAppBadge(); }
    else { if (navigator.setAppBadge) await navigator.setAppBadge(count); }
    await clients.openWindow('https://vandung0802.github.io/Duyet-Chi/app2.html');
  })());
});

self.addEventListener('message', function(event) {
  if (event.data === 'CLEAR_BADGE') {
    if (navigator.clearAppBadge) navigator.clearAppBadge();
  }
});
