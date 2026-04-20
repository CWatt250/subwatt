// SubWatt service worker
// Cache name — bump to force clients to pick up new assets
const CACHE_NAME = 'subwatt-v1';
const TILE_CACHE = 'subwatt-tiles-v1';
const MAX_TILES = 500;

// Assets precached on install (cache-first at runtime)
const PRECACHE_URLS = [
  'index.html',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap'
];

// --- install: precache all core assets ------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use { cache: 'reload' } so we don't pick up a stale HTTP cache entry
      return Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch((err) => {
            // Don't fail the whole install if one CDN asset is temporarily unreachable
            console.warn('[SW] precache failed for', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// --- activate: clean out old caches ---------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME && k !== TILE_CACHE).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// --- helpers --------------------------------------------------------------
function isOsmTile(url) {
  // matches https://a.tile.openstreetmap.org/..., https://tile.openstreetmap.org/...
  return /^https:\/\/([a-z0-9-]+\.)?tile\.openstreetmap\.org\//.test(url);
}

// LRU-ish trim: keep the cache bounded to MAX_TILES entries (oldest-first drop)
async function trimTileCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const excess = keys.length - maxEntries;
  for (let i = 0; i < excess; i++) {
    await cache.delete(keys[i]);
  }
}

// --- fetch: cache-first for precached, runtime-cache for OSM tiles --------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = req.url;

  // OSM tiles — runtime cache, bounded
  if (isOsmTile(url)) {
    event.respondWith(
      caches.open(TILE_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const resp = await fetch(req);
          if (resp && resp.ok) {
            // Note: tiles are served with CORS; cloning is fine
            cache.put(req, resp.clone()).then(() => trimTileCache(cache, MAX_TILES));
          }
          return resp;
        } catch (err) {
          // If offline and not cached, there's nothing we can return
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // Everything else — cache-first for anything in our precache cache,
  // fall back to network, and opportunistically cache same-origin GETs.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const resp = await fetch(req);
        // Cache successful same-origin responses so repeat visits work offline
        if (resp && resp.ok && new URL(url).origin === self.location.origin) {
          cache.put(req, resp.clone());
        }
        return resp;
      } catch (err) {
        // Offline fallback: if this is a navigation, serve index.html
        if (req.mode === 'navigate') {
          const shell = await cache.match('index.html');
          if (shell) return shell;
        }
        throw err;
      }
    })
  );
});
