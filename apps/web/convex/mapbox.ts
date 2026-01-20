/**
 * Mapbox API Actions
 *
 * Server-side actions for Mapbox API calls (geocoding, etc.)
 */

import { action } from './_generated/server'
import { v } from 'convex/values'

// Milwaukee bounding box for geocoding
const MILWAUKEE_BBOX = '-88.1,42.84,-87.82,43.21'

// ============================================================================
// Geocoding
// ============================================================================

/**
 * Geocode an address to coordinates using Mapbox Geocoding API
 */
export const geocode = action({
  args: {
    query: v.string(),
  },
  handler: async (_ctx, { query }) => {
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN
    if (!mapboxToken) {
      throw new Error('MAPBOX_ACCESS_TOKEN not configured')
    }

    // Append Milwaukee, WI if not already present
    let searchQuery = query
    if (!query.toLowerCase().includes('milwaukee') && !query.toLowerCase().includes('wi')) {
      searchQuery = `${query}, Milwaukee, WI`
    }

    const encodedQuery = encodeURIComponent(searchQuery)
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${mapboxToken}&bbox=${MILWAUKEE_BBOX}&limit=5&types=address,poi,neighborhood,locality`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`)
      }

      const data = await response.json()
      return data as GeocodingResponse
    } catch (error) {
      console.error('[mapbox.geocode] Error:', error)
      throw error
    }
  },
})

/**
 * Reverse geocode coordinates to an address
 */
export const reverseGeocode = action({
  args: {
    lng: v.number(),
    lat: v.number(),
  },
  handler: async (_ctx, { lng, lat }) => {
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN
    if (!mapboxToken) {
      throw new Error('MAPBOX_ACCESS_TOKEN not configured')
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=address,poi&limit=1`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status}`)
      }

      const data = await response.json()
      return data as GeocodingResponse
    } catch (error) {
      console.error('[mapbox.reverseGeocode] Error:', error)
      throw error
    }
  },
})

// ============================================================================
// Types
// ============================================================================

interface GeocodingFeature {
  id: string
  type: 'Feature'
  place_type: string[]
  relevance: number
  text: string
  place_name: string
  center: [number, number] // [lng, lat]
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  context?: Array<{
    id: string
    text: string
    short_code?: string
  }>
  properties?: Record<string, unknown>
}

interface GeocodingResponse {
  type: 'FeatureCollection'
  query: string[]
  features: GeocodingFeature[]
  attribution: string
}
