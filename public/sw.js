// Enhanced service worker for deployment optimization
const CACHE_VERSION = 'v1.2.0'
const STATIC_CACHE = `static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`
const MAGENTA_CACHE = `magenta-${CACHE_VERSION}`

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
  // Static assets - cache first, long TTL
  static: [
    '/',
    '/manifest.json',
    '/favicon.ico',
    '/oscillo-logo.png'
  ],
  
  // JS/CSS bundles - stale while revalidate
  bundles: /\.(js|css)$/,
  
  // Magenta.js models - cache first with fallback
  magenta: /googleapis\.com.*magenta/,
  
  // Images and fonts - cache first
  assets: /\.(png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot)$/,
  
  // API calls - network first
  api: /\/api\//
}

// Install event - cache static assets
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static assets')
        return cache.addAll(CACHE_STRATEGIES.static)
      })
      .then(() => {
        console.log('Static assets cached successfully')
        self.skipWaiting()
      })
      .catch(error => {
        console.error('Failed to cache static assets:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete old cache versions
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== MAGENTA_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Cache cleanup complete')
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', function(event) {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return
  }
  
  event.respondWith(handleFetch(request))
})

async function handleFetch(request) {
  const url = new URL(request.url)
  
  try {
    // Magenta.js models - Cache first with network fallback
    if (CACHE_STRATEGIES.magenta.test(url.href)) {
      return await cacheFirst(request, MAGENTA_CACHE)
    }
    
    // Static assets - Cache first
    if (CACHE_STRATEGIES.assets.test(url.pathname)) {
      return await cacheFirst(request, STATIC_CACHE)
    }
    
    // JS/CSS bundles - Stale while revalidate (important for deployments)
    if (CACHE_STRATEGIES.bundles.test(url.pathname)) {
      return await staleWhileRevalidate(request, DYNAMIC_CACHE)
    }
    
    // API calls - Network first
    if (CACHE_STRATEGIES.api.test(url.pathname)) {
      return await networkFirst(request, DYNAMIC_CACHE)
    }
    
    // Static pages - Stale while revalidate
    if (url.origin === self.location.origin) {
      return await staleWhileRevalidate(request, STATIC_CACHE)
    }
    
    // Default - Network with cache fallback
    return await networkWithCacheFallback(request)
    
  } catch (error) {
    console.error('Fetch handler error:', error)
    return await caches.match(request) || new Response('Network error', { status: 503 })
  }
}

// Cache first strategy - for static assets
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error('Cache first strategy failed:', error)
    throw error
  }
}

// Network first strategy - for API calls
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request.clone())
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.warn('Network first fallback to cache for:', request.url)
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

// Stale while revalidate - for JS/CSS bundles (critical for deployments)
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request)
  
  // Fetch in background to update cache
  const fetchPromise = fetch(request.clone())
    .then(networkResponse => {
      if (networkResponse.ok) {
        const cache = caches.open(cacheName)
        cache.then(c => c.put(request, networkResponse.clone()))
      }
      return networkResponse
    })
    .catch(error => {
      console.warn('Background fetch failed:', error)
    })
  
  // Return cached version immediately, or wait for network
  if (cachedResponse) {
    return cachedResponse
  }
  
  return await fetchPromise
}

// Network with cache fallback - default strategy
async function networkWithCacheFallback(request) {
  try {
    const networkResponse = await fetch(request)
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

// Handle chunk loading errors specifically
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'CHUNK_LOAD_ERROR') {
    // Clear dynamic cache when chunk loading fails
    caches.delete(DYNAMIC_CACHE)
      .then(() => {
        console.log('Dynamic cache cleared due to chunk load error')
        // Notify client to reload
        event.ports[0].postMessage({ success: true })
      })
  }
})

// Background sync for failed requests
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Retry failed network requests
  console.log('Background sync triggered')
}

// Push notifications (if needed)
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/oscillo-logo.png',
      badge: '/oscillo-logo.png',
      vibrate: [100, 50, 100],
      data: data
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  
  event.waitUntil(
    clients.openWindow('/') // Open the app
  )
})