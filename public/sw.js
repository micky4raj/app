// Label Jigyasa PWA Service Worker
const CACHE_NAME = 'label-jigyasa-v1'
const RUNTIME_CACHE = 'label-jigyasa-runtime-v1'

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/logo-icon.png',
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME && k !== RUNTIME_CACHE).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignore non-GET
  if (request.method !== 'GET') return
  // Ignore API calls, admin, and different origins for caching (network-only)
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/admin')) return
  if (url.origin !== self.location.origin && !url.hostname.includes('unsplash.com') && !url.hostname.includes('pexels.com')) return

  // For product images (unsplash/pexels): stale-while-revalidate
  if (url.hostname.includes('unsplash.com') || url.hostname.includes('pexels.com')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request)
            .then((response) => {
              if (response && response.status === 200) cache.put(request, response.clone())
              return response
            })
            .catch(() => cached)
          return cached || fetchPromise
        })
      )
    )
    return
  }

  // For same-origin navigations and assets: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone))
        }
        return response
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
  )
})
