/* PiSecOps cache: city tiles + 3D models are downloaded once, then served from disk.
   Bump CACHE_VERSION if you replace any .glb or want to force a fresh download. */
const CACHE_VERSION = 'v1';
const TILES = 'mumbai-tiles-' + CACHE_VERSION;
const MODELS = 'mumbai-models-' + CACHE_VERSION;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) {
      if ((k.startsWith('mumbai-tiles-') && k !== TILES) || (k.startsWith('mumbai-models-') && k !== MODELS)) await caches.delete(k);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const isTile = url.pathname.startsWith('/mumbai-data/');
  const isModel = url.pathname.startsWith('/assets/') && /\.(glb|png|jpg|webp)$/i.test(url.pathname);
  if (!isTile && !isModel) return;
  e.respondWith((async () => {
    const cache = await caches.open(isTile ? TILES : MODELS);
    const hit = await cache.match(req);
    if (hit) return hit;
    const res = await fetch(req);
    if (res && res.status === 200) cache.put(req, res.clone()).catch(() => {});
    return res;
  })());
});
