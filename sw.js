// Offline-first service worker: precache the whole app, serve from cache, refresh in the background (revalidating with the server).
const CACHE = 'italiano1500-v7';
const ASSETS = ['./', 'index.html', 'style.css', 'app.js', 'manifest.webmanifest',
  'core/srs.js', 'core/drillpick.js', 'core/drillsession.js', 'core/store.js', 'core/packs.js', 'core/ui.js',
  'lang/it/morph.js', 'lang/it/drills.js', 'lang/it/lessons.js',
  'data/packs/index.json', 'data/packs/core/manifest.json', 'data/packs/core/words.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-512-maskable.png', 'icons/apple-touch-icon.png'];
// cache: 'reload' bypasses the browser's HTTP cache (GitHub Pages sends max-age=600), so a new version never precaches old files
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => {
    const net = fetch(e.request, { cache: 'no-cache' }).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
