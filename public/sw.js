const CACHE_NAME = 'lafriends-v2';
const STATIC_CACHE = 'lafriends-static-v2';
const DYNAMIC_CACHE = 'lafriends-dynamic-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.svg',
  '/pwa-icon.svg',
];

const CACHE_STRATEGIES = {
  cacheFirst: ['image', 'font', 'style'],
  networkFirst: ['document', 'script'],
  staleWhileRevalidate: ['fetch'],
};

const NETWORK_TIMEOUT = 3000;

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).catch((err) => {
      console.error('[SW] Install failed:', err);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => {
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  if (url.pathname.includes('/functions/') ||
      url.hostname.includes('supabase') ||
      url.pathname.startsWith('/rest/') ||
      url.pathname.startsWith('/auth/')) {
    return;
  }

  const destination = request.destination;

  if (CACHE_STRATEGIES.cacheFirst.includes(destination)) {
    event.respondWith(cacheFirstWithTimeout(request));
  } else if (CACHE_STRATEGIES.networkFirst.includes(destination)) {
    event.respondWith(networkFirstWithTimeout(request));
  } else {
    event.respondWith(staleWhileRevalidateWithTimeout(request));
  }
});

async function cacheFirstWithTimeout(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (error) {
    const fallback = await caches.match('/offline.html');
    return fallback || new Response('Offline', { status: 503 });
  }
}

async function networkFirstWithTimeout(request) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const fallback = await caches.match('/offline.html');
    return fallback || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidateWithTimeout(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT);
      const response = await fetch(request, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch (err) {
      return cached || await caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }
  })();

  return cached || fetchPromise;
}

// Background sync for form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  } else if (event.tag === 'sync-contacts') {
    event.waitUntil(syncContacts());
  } else if (event.tag === 'sync-worker-applications') {
    event.waitUntil(syncWorkerApplications());
  }
});

async function syncBookings() {
  try {
    const db = await openDB();
    const pending = await db.getAll('pending-bookings');
    for (const item of pending) {
      try {
        const res = await fetch(item.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        });
        if (res.ok) {
          await db.delete('pending-bookings', item.id);
        }
      } catch (e) {
        console.error('[SW] Sync booking failed:', e);
      }
    }
  } catch (e) {
    console.error('[SW] Sync bookings error:', e);
  }
}

async function syncContacts() {
  try {
    const db = await openDB();
    const pending = await db.getAll('pending-contacts');
    for (const item of pending) {
      try {
        const res = await fetch(item.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        });
        if (res.ok) {
          await db.delete('pending-contacts', item.id);
        }
      } catch (e) {
        console.error('[SW] Sync contact failed:', e);
      }
    }
  } catch (e) {
    console.error('[SW] Sync contacts error:', e);
  }
}

async function syncWorkerApplications() {
  try {
    const db = await openDB();
    const pending = await db.getAll('pending-worker-apps');
    for (const item of pending) {
      try {
        const res = await fetch(item.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        });
        if (res.ok) {
          await db.delete('pending-worker-apps', item.id);
        }
      } catch (e) {
        console.error('[SW] Sync worker application failed:', e);
      }
    }
  } catch (e) {
    console.error('[SW] Sync worker applications error:', e);
  }
}

// Periodic background sync for data refresh
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-data') {
    event.waitUntil(refreshData());
  }
});

async function refreshData() {
  try {
    const urlsToRefresh = ['/', '/index.html'];
    const cache = await caches.open(DYNAMIC_CACHE);
    for (const url of urlsToRefresh) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          cache.put(url, res);
        }
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    console.error('[SW] Periodic refresh error:', e);
  }
}

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('lafriends-offline', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-bookings')) {
        db.createObjectStore('pending-bookings', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pending-contacts')) {
        db.createObjectStore('pending-contacts', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pending-worker-apps')) {
        db.createObjectStore('pending-worker-apps', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notification event handler
self.addEventListener('push', (event) => {
  let data = {
    title: 'LaFriend\'s Services',
    body: 'Vous avez une nouvelle notification',
    icon: '/pwa-icon.svg',
    badge: '/favicon.svg',
    tag: 'notification',
    data: { url: '/' }
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || data.tag,
        data: payload.data || data.data,
        actions: payload.actions || [],
        vibrate: payload.vibrate || [200, 100, 200],
        requireInteraction: payload.requireInteraction || false
      };
    }
  } catch (e) {
    console.log('[SW] Error parsing push data:', e);
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    actions: data.actions,
    vibrate: data.vibrate,
    requireInteraction: data.requireInteraction
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close handler
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
});
