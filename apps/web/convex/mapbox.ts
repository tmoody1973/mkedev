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
// ESRI Zoning Query
// ============================================================================

const ESRI_BASE = 'https://gis.milwaukee.gov/arcgis/rest/services'

/**
 * Query zoning information at a coordinate point
 */
export const queryZoningAtPoint = action({
  args: {
    lng: v.number(),
    lat: v.number(),
  },
  handler: async (_ctx, { lng, lat }) => {
    try {
      // Query zoning layer (inSR=4326 for WGS84 coordinates)
      const zoningUrl = `${ESRI_BASE}/planning/zoning/MapServer/11/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=json`

      const response = await fetch(zoningUrl)
      if (!response.ok) {
        throw new Error(`ESRI query failed: ${response.status}`)
      }

      const data = await response.json()
      const zoning = data.features?.[0]?.attributes

      if (!zoning) {
        return {
          success: false,
          error: 'No zoning information found at this location',
        }
      }

      // Extract zoning details
      const zoningDistrict = zoning.ZONING || zoning.zoning || 'Unknown'
      const zoningDescription = zoning.ZONING_DES || zoning.zoning_des || zoning.DESCRIPTION || ''

      // Determine category from code prefix
      const prefix = zoningDistrict.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 2)
      const categoryMap: Record<string, string> = {
        'RS': 'Residential - Single Family',
        'RT': 'Residential - Two Family',
        'RM': 'Residential - Multi-Family',
        'RO': 'Residential - Office',
        'LB': 'Local Business',
        'NS': 'Neighborhood Shopping',
        'CS': 'Commercial Service',
        'RB': 'Regional Business',
        'IL': 'Industrial - Light',
        'IM': 'Industrial - Mixed',
        'IH': 'Industrial - Heavy',
        'IC': 'Industrial - Commercial',
        'PK': 'Parks',
        'IN': 'Institutional',
        'DT': 'Downtown',
        'PD': 'Planned Development',
        'C9': 'Central Business District',
        'DC': 'Downtown Core',
        'DX': 'Downtown Mixed',
        'MX': 'Mixed Use',
        'IO': 'Industrial - Office',
      }
      const zoningCategory = categoryMap[prefix] || 'Mixed Use / Special'

      return {
        success: true,
        zoningDistrict,
        zoningDescription,
        zoningCategory,
        coordinates: { lng, lat },
      }
    } catch (error) {
      console.error('[mapbox.queryZoningAtPoint] Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query zoning',
      }
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
