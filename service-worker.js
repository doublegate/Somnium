/**
 * Somnium Service Worker
 * Provides offline caching, background sync, and PWA functionality
 */

const CACHE_VERSION = 'somnium-v2.0.0';
const RUNTIME_CACHE = 'somnium-runtime';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/main.js',
  '/js/GameManager.js',
  '/js/AIManager.js',
  '/js/GameState.js',
  '/js/SceneRenderer.js',
  '/js/ViewManager.js',
  '/js/SoundManager.js',
  '/js/Parser.js',
  '/js/EventManager.js',
  '/js/UIManager.js',
  '/js/CommandExecutor.js',
  '/js/Inventory.js',
  '/js/InteractionSystem.js',
  '/js/MovementSystem.js',
  '/js/PuzzleSystem.js',
  '/js/NPCSystem.js',
  '/js/GameProgression.js',
  '/js/SaveGameManager.js',
  '/js/EnhancedParser.js',
  '/js/SaidPattern.js',
  '/js/PriorityRenderer.js',
  '/js/StateAnimator.js',
  '/js/PrioritySoundManager.js',
  '/js/SynchronizedSound.js',
  '/js/AmbientSoundscape.js',
  '/js/WorldGenerator.js',
  '/js/DynamicInteractionHandler.js',
];

// Install event - precache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[ServiceWorker] Precaching app shell');
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION && cacheName !== RUNTIME_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle API requests differently (network-first)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Handle save file uploads
  if (url.pathname === '/share' && request.method === 'POST') {
    event.respondWith(handleShareTarget(request));
    return;
  }

  // Default: cache-first strategy
  event.respondWith(cacheFirst(request));
});

// Cache-first strategy
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    // Cache successful GET requests
    if (request.method === 'GET' && response.status === 200) {
      const runtimeCache = await caches.open(RUNTIME_CACHE);
      runtimeCache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[ServiceWorker] Fetch failed:', error);

    // Return offline page if available
    const offlinePage = await cache.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }

    throw error;
  }
}

// Network-first strategy (for API calls)
async function networkFirst(request) {
  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[ServiceWorker] Network request failed, trying cache:', error);

    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    throw error;
  }
}

// Handle shared save files
async function handleShareTarget(request) {
  const formData = await request.formData();
  const saveFile = formData.get('save_file');

  if (saveFile) {
    // Store the save file in IndexedDB for the app to retrieve
    const db = await openDatabase();
    await db.put('shared-saves', {
      id: Date.now(),
      file: saveFile,
      timestamp: new Date().toISOString(),
    });

    // Redirect to main app
    return Response.redirect('/?action=load-shared', 303);
  }

  return Response.redirect('/', 303);
}

// Background sync for save games
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-save-games') {
    event.waitUntil(syncSaveGames());
  }
});

async function syncSaveGames() {
  try {
    const db = await openDatabase();
    const pendingSaves = await db.getAll('pending-saves');

    for (const save of pendingSaves) {
      try {
        const response = await fetch('/api/saves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(save.data),
        });

        if (response.ok) {
          await db.delete('pending-saves', save.id);
          console.log('[ServiceWorker] Synced save:', save.id);
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync save:', save.id, error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
  }
}

// Periodic background sync for cloud saves
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-cloud-saves') {
    event.waitUntil(syncCloudSaves());
  }
});

async function syncCloudSaves() {
  try {
    console.log('[ServiceWorker] Periodic sync: checking for cloud save updates');

    const response = await fetch('/api/saves/check-updates', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const updates = await response.json();

      if (updates.hasUpdates) {
        // Notify the app about available updates
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
          client.postMessage({
            type: 'CLOUD_SAVES_UPDATED',
            count: updates.count,
          });
        });
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Periodic sync failed:', error);
  }
}

// Push notifications for multiplayer events
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.message || 'You have a new notification',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    tag: data.tag || 'somnium-notification',
    data: data,
    actions: [
      { action: 'open', title: 'Open Game' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Somnium', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// IndexedDB helper
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SomniumDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('shared-saves')) {
        db.createObjectStore('shared-saves', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('pending-saves')) {
        db.createObjectStore('pending-saves', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('cloud-saves')) {
        db.createObjectStore('cloud-saves', { keyPath: 'id' });
      }
    };
  });
}

// Message handler for client-to-service-worker communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_WORLD') {
    event.waitUntil(cacheWorld(event.data.world));
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  }
});

async function cacheWorld(worldData) {
  const cache = await caches.open(RUNTIME_CACHE);
  const response = new Response(JSON.stringify(worldData), {
    headers: { 'Content-Type': 'application/json' },
  });
  await cache.put(`/worlds/${worldData.id}`, response);
  console.log('[ServiceWorker] Cached world:', worldData.id);
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log('[ServiceWorker] All caches cleared');
}

console.log('[ServiceWorker] Loaded');
