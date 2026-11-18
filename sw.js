// Maas'awo service worker (spec 0006, AC-17). Written into dist/sw.js at build time by the plugin
// in vite.config.ts, which fills in the build id and the list of files to keep for offline play.
const CACHE = 'maasawo-16507311f417'
const FILES = ["./","./assets/index-B5IYXamc.css","./assets/index-LOnOWrQ4.js","./icons/apple-touch-icon.png","./icons/favicon-32.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon.svg","./index.html","./manifest.webmanifest"]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('maasawo-') && k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  // The daily race (spec 0008, AC-11): always the network, never a kept copy.
  if (new URL(req.url).pathname.includes('/api/')) return
  if (req.mode === 'navigate') {
    // The page: fresh when online, the kept copy when not.
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put('./', copy))
          return res
        })
        .catch(() => caches.match('./').then((r) => r || caches.match('./index.html'))),
    )
    return
  }
  // Built files never change (hashed names): the kept copy first.
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put(req, copy))
          }
          return res
        }),
    ),
  )
})
