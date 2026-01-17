/**
 * PMTiles Cache using IndexedDB
 * Caches tile data persistently across browser sessions for faster loading
 */

const DB_NAME = 'mkedev-pmtiles-cache'
const STORE_NAME = 'tiles'
const DB_VERSION = 1
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface CacheEntry {
  key: string
  data: ArrayBuffer
  timestamp: number
}

let dbPromise: Promise<IDBDatabase> | null = null

/**
 * Open or create the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.warn('PMTiles cache: IndexedDB not available')
      reject(request.error)
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })

  return dbPromise
}

/**
 * Get cached tile data
 */
export async function getCachedTile(key: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openDatabase()
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)

      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined
        if (entry) {
          // Check if expired
          if (Date.now() - entry.timestamp > CACHE_EXPIRY_MS) {
            // Expired, delete and return null
            deleteCachedTile(key)
            resolve(null)
          } else {
            resolve(entry.data)
          }
        } else {
          resolve(null)
        }
      }

      request.onerror = () => {
        resolve(null)
      }
    })
  } catch {
    return null
  }
}

/**
 * Store tile data in cache
 */
export async function setCachedTile(key: string, data: ArrayBuffer): Promise<void> {
  try {
    const db = await openDatabase()
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const entry: CacheEntry = {
        key,
        data,
        timestamp: Date.now(),
      }

      const request = store.put(entry)
      request.onsuccess = () => resolve()
      request.onerror = () => resolve()
    })
  } catch {
    // Silently fail - caching is optional
  }
}

/**
 * Delete a cached tile
 */
async function deleteCachedTile(key: string): Promise<void> {
  try {
    const db = await openDatabase()
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      store.delete(key)
      resolve()
    })
  } catch {
    // Silently fail
  }
}

/**
 * Clear all cached tiles (useful for debugging or when PMTiles source changes)
 */
export async function clearTileCache(): Promise<void> {
  try {
    const db = await openDatabase()
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      store.clear()
      resolve()
    })
  } catch {
    // Silently fail
  }
}

/**
 * Clean up expired tiles (call periodically)
 */
export async function cleanExpiredTiles(): Promise<number> {
  try {
    const db = await openDatabase()
    const expiryTime = Date.now() - CACHE_EXPIRY_MS
    let deletedCount = 0

    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('timestamp')
      const range = IDBKeyRange.upperBound(expiryTime)
      const request = index.openCursor(range)

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          cursor.delete()
          deletedCount++
          cursor.continue()
        } else {
          resolve(deletedCount)
        }
      }

      request.onerror = () => {
        resolve(deletedCount)
      }
    })
  } catch {
    return 0
  }
}

/**
 * Create a cached fetch function for PMTiles
 * Wraps fetch to use IndexedDB cache
 */
export function createCachedFetch(): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

    // Only cache range requests (tile data)
    const rangeHeader = init?.headers instanceof Headers
      ? init.headers.get('Range')
      : (init?.headers as Record<string, string>)?.['Range']

    if (!rangeHeader) {
      // Not a range request, use normal fetch
      return fetch(input, init)
    }

    // Create cache key from URL + range
    const cacheKey = `${url}:${rangeHeader}`

    // Check cache first
    const cachedData = await getCachedTile(cacheKey)
    if (cachedData) {
      // Return cached response
      return new Response(cachedData, {
        status: 206,
        statusText: 'Partial Content',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': cachedData.byteLength.toString(),
        },
      })
    }

    // Fetch from network
    const response = await fetch(input, init)

    if (response.ok || response.status === 206) {
      // Clone response to read body for caching
      const clone = response.clone()
      const data = await clone.arrayBuffer()

      // Cache the data (don't await, let it happen in background)
      setCachedTile(cacheKey, data)
    }

    return response
  }
}
