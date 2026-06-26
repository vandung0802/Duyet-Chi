// Lưu badge count trong IndexedDB
async function getBadgeCount() {
  return new Promise(resolve => {
    const req = indexedDB.open('dc-badge', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('badge');
    req.onsuccess = e => {
      const tx = e.target.result.transaction('badge', 'readonly');
      const get = tx.objectStore('badge').get('count');
      get.onsuccess = () => resolve(get.result || 0);
      get.onerror = () => resolve(0);
    };
    req.onerror = () => resolve(0);
  });
}

async function setBadgeCount(count) {
  return new Promise(resolve => {
    const req = indexedDB.open('dc-badge', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('badge');
    req.onsuccess = e => {
      const tx = e.target.result.transaction('badge', 'readwrite');
      tx.objectStore('badge').put(count, 'count');
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    };
    req.onerror = resolve;
  });
}

self.addEventListener('push', function(event) {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e) {}
  const title = data.title || 'Duyệt Chi';
  const body = data.body || '';
  event.waitUntil((async () => {
    const count = await getBadgeCount() + 1;
    await setBadgeCount(count);
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
    await setBadgeCount(0);
    if (navigator.clearAppBadge) await navigator.clearAppBadge();
    await clients.openWindow('https://vandung0802.github.io/Duyet-Chi/app2.html');
  })());
});

self.addEventListener('message', function(event) {
  if (event.data === 'CLEAR_BADGE') {
    setBadgeCount(0);
    if (navigator.clearAppBadge) navigator.clearAppBadge();
  }
});
