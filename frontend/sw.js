const CACHE_NAME = 'h2eaux-gestion-v2.0.0';
const API_CACHE_NAME = 'h2eaux-api-cache-v2.0.0';

// Files to cache for offline use
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/css/modules.css',
  '/js/app.js',
  '/js/modules/clients.js',
  '/js/modules/chantiers.js',
  '/js/modules/calculs-pac.js',
  '/js/modules/settings.js',
  '/js/modules/pdf-export.js',
  '/assets/logo.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png'
];

// API endpoints to cache
const apiEndpoints = [
  '/api/clients',
  '/api/chantiers',
  '/api/calculs-pac',
  '/api/auth/login',
  '/api/health'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('SW: Installing service worker v2.0.0');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('SW: Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('SW: Cache installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('SW: Activating service worker v2.0.0');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('SW: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Handle API requests with network-first strategy
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(cache => {
        return fetch(event.request)
          .then(response => {
            // Only cache successful GET requests
            if (event.request.method === 'GET' && response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Return cached version if network fails
            console.log('SW: Network failed, serving from cache');
            return cache.match(event.request);
          });
      })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // Fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Add to cache
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
      .catch(() => {
        // Fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', event => {
  console.log('SW: Background sync triggered');
  if (event.tag === 'background-sync') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    console.log('SW: Syncing offline data...');
    
    // Here you would implement sync logic for:
    // - Pending client updates
    // - Offline calculations
    // - Document uploads
    
    return Promise.resolve();
  } catch (error) {
    console.error('SW: Sync failed:', error);
    return Promise.reject(error);
  }
}

// Update notification
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification H2EAUX GESTION',
    icon: '/assets/icon-192.png',
    badge: '/assets/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ouvrir l\'application',
        icon: '/assets/icon-192.png'
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: '/assets/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('H2EAUX GESTION', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});