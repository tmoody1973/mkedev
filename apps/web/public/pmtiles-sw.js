/**
 * PMTiles Service Worker
 * Caches tile range requests for faster subsequent loads
 * Includes automatic retry logic for failed requests
 */

const CACHE_NAME = 'mkedev-pmtiles-v1'
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000 // Start with 1 second, then exponential backoff

/**
 * Fetch with automatic retry and exponential backoff
 */
async function fetchWithRetry(request, retries = MAX_RETRIES) {
  let lastError

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(request)
      return response
    } catch (error) {
      lastError = error
      console.log(`[PMTiles SW] Fetch attempt ${attempt + 1}/${retries} failed:`, error.message)

      if (attempt < retries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt)
        console.log(`[PMTiles SW] Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

// Install event - set up cache
self.addEventListener('install', (event) => {
  console.log('[PMTiles SW] Installing...')
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[PMTiles SW] Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('mkedev-pmtiles-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch event - intercept PMTiles requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Only cache PMTiles requests (check for .pmtiles extension or range requests to pmtiles)
  const isPMTilesRequest =
    url.pathname.endsWith('.pmtiles') ||
    (event.request.headers.get('Range') && url.href.includes('pmtiles'))

  if (!isPMTilesRequest) {
    return // Let browser handle non-PMTiles requests
  }

  // Create a unique cache key including the Range header
  const rangeHeader = event.request.headers.get('Range') || ''
  const cacheKey = `${event.request.url}|${rangeHeader}`

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME)

      // Check cache first
      const cachedResponse = await cache.match(cacheKey)
      if (cachedResponse) {
        // Check if expired via custom header
        const cachedTime = cachedResponse.headers.get('X-Cached-Time')
        if (cachedTime && Date.now() - parseInt(cachedTime) < CACHE_EXPIRY_MS) {
          console.log('[PMTiles SW] Cache hit:', cacheKey.substring(0, 80))
          return cachedResponse
        }
      }

      // Fetch from network with retry
      console.log('[PMTiles SW] Cache miss, fetching:', cacheKey.substring(0, 80))
      try {
        const networkResponse = await fetchWithRetry(event.request)

        // Only cache successful responses
        if (networkResponse.ok || networkResponse.status === 206) {
          // Clone response before reading
          const responseToCache = networkResponse.clone()

          // Add timestamp header for expiry checking
          const headers = new Headers(responseToCache.headers)
          headers.set('X-Cached-Time', Date.now().toString())

          const body = await responseToCache.arrayBuffer()
          const cachedResponseToStore = new Response(body, {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers,
          })

          // Store in cache (don't await)
          cache.put(cacheKey, cachedResponseToStore)
        }

        return networkResponse
      } catch (error) {
        console.error('[PMTiles SW] All retry attempts failed:', error.message)

        // Network failed after all retries, try to return stale cache
        if (cachedResponse) {
          console.log('[PMTiles SW] Using stale cache after network failure')
          return cachedResponse
        }

        // No cache available, return error response
        return new Response(
          JSON.stringify({
            error: 'PMTiles fetch failed',
            message: `Failed to load map tiles after ${MAX_RETRIES} attempts. Please check your connection and try again.`,
            url: event.request.url,
          }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    })()
  )
})
