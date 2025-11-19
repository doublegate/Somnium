/**
 * Service Worker for Somnium PWA
 *
 * Features:
 * - Offline functionality with cache-first strategy
 * - Background sync for cloud saves
 * - Push notifications for multiplayer events
 * - Asset caching for fast loading
 * - Version management and cache updates
 */

const CACHE_VERSION = 'somnium-v2.0.0';
const RUNTIME_CACHE = 'somnium-runtime';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/css/mobile.css',
  '/css/multiplayer.css',
  '/css/voice-commands.css',
  '/css/spectator-mode.css',

  // JavaScript modules
  '/js/GameManager.js',
  '/js/GameState.js',
  '/js/Parser.js',
  '/js/CommandExecutor.js',
  '/js/AIManager.js',
  '/js/SceneRenderer.js',
  '/js/ViewManager.js',
  '/js/SoundManager.js',
  '/js/EventManager.js',
  '/js/Inventory.js',
  '/js/SaveGameManager.js',
  '/js/WorldGenerator.js',
  '/js/DynamicInteractionHandler.js',
  '/js/CombatSystem.js',
  '/js/MagicSystem.js',
  '/js/CharacterProgression.js',
  '/js/NPCSystem.js',
  '/js/PuzzleSystem.js',
  '/js/MovementSystem.js',
  '/js/GameProgression.js',
  '/js/InteractionSystem.js',
  '/js/VoiceCommandManager.js',
  '/js/SpectatorManager.js',
  '/js/TournamentManager.js',
  '/js/LeaderboardManager.js',
  '/js/logger.js',
  '/js/constants.js',

  // Demo files
  '/demos/demo-graphics.html',
  '/demos/sprite-demo.html',
  '/demos/sound-demo.html',
  '/demos/music-demo.html',
  '/demos/parser-demo.html',
  '/demos/game-world-demo.html',
  '/demos/demo-adventure.html',

  // Multiplayer
  '/multiplayer.html',
  '/js/multiplayer-lobby.js',

  // Manifest and icons
  '/manifest.json',
  '/assets/icons/icon-192.svg',
  '/assets/icons/icon-512.svg',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.error('[Service Worker] Cache addAll error:', error);
        // Continue even if some assets fail to cache
        return Promise.resolve();
      });
    })
  );

  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              cacheName !== CACHE_VERSION && cacheName !== RUNTIME_CACHE
            );
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );

  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets - cache first, network fallback
  event.respondWith(cacheFirst(request));
});

/**
 * Cache first strategy - check cache, fall back to network
 * @param {Request} request - Fetch request
 * @returns {Promise<Response>} Response
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);

  if (cached) {
    console.log('[Service Worker] Serving from cache:', request.url);
    return cached;
  }

  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.status === 200) {
      const runtimeCache = await caches.open(RUNTIME_CACHE);
      runtimeCache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);

    // Try runtime cache as last resort
    const runtimeCache = await caches.open(RUNTIME_CACHE);
    const runtimeCached = await runtimeCache.match(request);

    if (runtimeCached) {
      return runtimeCached;
    }

    // Return offline page if available
    if (request.mode === 'navigate') {
      const offlinePage = await cache.match('/index.html');
      if (offlinePage) {
        return offlinePage;
      }
    }

    throw error;
  }
}

/**
 * Network first strategy - try network, fall back to cache
 * @param {Request} request - Fetch request
 * @returns {Promise<Response>} Response
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);

    // Cache successful API responses
    if (response.status === 200) {
      const runtimeCache = await caches.open(RUNTIME_CACHE);
      runtimeCache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[Service Worker] Network request failed:', error);

    // Fall back to cache
    const runtimeCache = await caches.open(RUNTIME_CACHE);
    const cached = await runtimeCache.match(request);

    if (cached) {
      console.log('[Service Worker] Serving API from cache:', request.url);
      return cached;
    }

    throw error;
  }
}

// Background sync event - sync cloud saves when online
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-saves') {
    event.waitUntil(syncCloudSaves());
  }
});

/**
 * Sync local saves to cloud
 * @returns {Promise} Sync promise
 */
async function syncCloudSaves() {
  try {
    // Get pending saves from IndexedDB
    const db = await openDatabase();
    const pendingSaves = await getPendingSaves(db);

    // Upload each save
    for (const save of pendingSaves) {
      const response = await fetch('/api/saves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(save),
      });

      if (response.ok) {
        // Mark save as synced
        await markSaveSynced(db, save.id);
      }
    }

    console.log('[Service Worker] Cloud saves synced');
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
    throw error;
  }
}

// Push notification event - handle multiplayer notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'Somnium';
  const options = {
    body: data.body || 'New notification',
    icon: '/assets/icons/icon-192.svg',
    badge: '/assets/icons/icon-72.svg',
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event - handle notification actions
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;
  const action = event.action;

  if (action === 'join-session') {
    // Open multiplayer page
    event.waitUntil(
      clients.openWindow(`/multiplayer.html?session=${data.sessionId}`)
    );
  } else if (action === 'view-profile') {
    // Open player profile
    event.waitUntil(
      clients.openWindow(`/profile.html?player=${data.playerId}`)
    );
  } else {
    // Default action - focus or open main page
    event.waitUntil(
      clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Focus existing window if available
          for (const client of clientList) {
            if (client.url === '/' && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});

// Message event - handle messages from app
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'skipWaiting':
      self.skipWaiting();
      break;

    case 'clearCache':
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
        })
      );
      break;

    case 'cacheSave':
      event.waitUntil(cacheSaveData(data));
      break;

    default:
      console.log('[Service Worker] Unknown message type:', type);
  }
});

/**
 * Cache save data for offline access
 * @param {Object} saveData - Save game data
 * @returns {Promise} Cache promise
 */
async function cacheSaveData(saveData) {
  const cache = await caches.open(RUNTIME_CACHE);
  const response = new Response(JSON.stringify(saveData), {
    headers: { 'Content-Type': 'application/json' },
  });
  await cache.put('/offline-save', response);
}

/**
 * Open IndexedDB for offline storage
 * @returns {Promise<IDBDatabase>} Database connection
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SomniumDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('saves')) {
        db.createObjectStore('saves', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('pendingSyncs')) {
        db.createObjectStore('pendingSyncs', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Get pending saves from database
 * @param {IDBDatabase} db - Database connection
 * @returns {Promise<Array>} Pending saves
 */
function getPendingSaves(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingSyncs'], 'readonly');
    const store = transaction.objectStore('pendingSyncs');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Mark save as synced
 * @param {IDBDatabase} db - Database connection
 * @param {string} saveId - Save ID
 * @returns {Promise} Delete promise
 */
function markSaveSynced(db, saveId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingSyncs'], 'readwrite');
    const store = transaction.objectStore('pendingSyncs');
    const request = store.delete(saveId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

console.log('[Service Worker] Loaded');
