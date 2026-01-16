'use client'

/**
 * PMTiles Cache Provider
 * Registers a service worker to cache PMTiles range requests
 * This significantly improves load times for repeat visits
 */

import { useEffect } from 'react'

export function PMTilesCacheProvider() {
  useEffect(() => {
    // Only register if PMTiles is configured and service workers are supported
    if (!process.env.NEXT_PUBLIC_PMTILES_URL) return
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/pmtiles-sw.js', {
          scope: '/',
        })

        console.log('[PMTiles Cache] Service worker registered:', registration.scope)

        // Check for updates periodically
        registration.update()
      } catch (error) {
        console.warn('[PMTiles Cache] Service worker registration failed:', error)
      }
    }

    registerServiceWorker()

    return () => {
      // Cleanup not needed - service worker persists
    }
  }, [])

  // This component renders nothing
  return null
}
