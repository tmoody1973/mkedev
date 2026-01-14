/**
 * Mapbox Spatial Tools for MKE.dev Agent
 *
 * High-value tools for spatial reasoning and location intelligence.
 * These can be used by:
 * - Google ADK agent as custom tools
 * - Convex actions for server-side execution
 * - Direct client-side calls for UI features
 */

// =============================================================================
// Types
// =============================================================================

export interface Coordinates {
  lng: number
  lat: number
}

export interface GeocodingResult {
  placeName: string
  coordinates: Coordinates
  relevance: number
  placeType: string[]
  context?: {
    neighborhood?: string
    postcode?: string
    place?: string
    region?: string
    country?: string
  }
}

export interface POIResult {
  name: string
  coordinates: Coordinates
  category: string
  address: string
  distance?: number // meters
}

export interface IsochroneResult {
  coordinates: Coordinates
  profile: 'driving' | 'walking' | 'cycling'
  minutes: number
  polygon: GeoJSON.Polygon
  area?: number // square meters
}

export interface DirectionsResult {
  origin: Coordinates
  destination: Coordinates
  profile: 'driving' | 'walking' | 'cycling'
  distance: number // meters
  duration: number // seconds
  geometry: GeoJSON.LineString
}

export interface StaticMapOptions {
  center: Coordinates
  zoom: number
  width?: number
  height?: number
  markers?: Array<{
    coordinates: Coordinates
    color?: string
    label?: string
  }>
  overlays?: Array<{
    type: 'polygon' | 'line'
    coordinates: Coordinates[]
    strokeColor?: string
    fillColor?: string
  }>
}

// =============================================================================
// Configuration
// =============================================================================

const MAPBOX_API_BASE = 'https://api.mapbox.com'

function getMapboxToken(): string {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) {
    throw new Error('NEXT_PUBLIC_MAPBOX_TOKEN is not set')
  }
  return token
}

// =============================================================================
// Geocoding Tools
// =============================================================================

/**
 * Forward Geocode: Convert an address or place name to coordinates
 *
 * @example
 * const result = await forwardGeocode("123 N Water St, Milwaukee, WI")
 * // Returns: { placeName: "123 N Water St", coordinates: { lng: -87.91, lat: 43.04 }, ... }
 */
export async function forwardGeocode(
  query: string,
  options?: {
    proximity?: Coordinates // Bias results near this location
    bbox?: [number, number, number, number] // Bounding box [minLng, minLat, maxLng, maxLat]
    limit?: number
  }
): Promise<GeocodingResult[]> {
  const token = getMapboxToken()
  const params = new URLSearchParams({
    access_token: token,
    limit: String(options?.limit ?? 5),
  })

  // Bias towards Milwaukee area by default
  const proximity = options?.proximity ?? { lng: -87.9065, lat: 43.0389 }
  params.append('proximity', `${proximity.lng},${proximity.lat}`)

  if (options?.bbox) {
    params.append('bbox', options.bbox.join(','))
  }

  const url = `${MAPBOX_API_BASE}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.statusText}`)
  }

  const data = await response.json()

  return data.features.map((feature: any) => ({
    placeName: feature.place_name,
    coordinates: {
      lng: feature.center[0],
      lat: feature.center[1],
    },
    relevance: feature.relevance,
    placeType: feature.place_type,
    context: parseContext(feature.context),
  }))
}

/**
 * Reverse Geocode: Convert coordinates to an address
 *
 * @example
 * const result = await reverseGeocode({ lng: -87.91, lat: 43.04 })
 * // Returns: { placeName: "123 N Water St, Milwaukee, WI", ... }
 */
export async function reverseGeocode(
  coordinates: Coordinates
): Promise<GeocodingResult | null> {
  const token = getMapboxToken()
  const url = `${MAPBOX_API_BASE}/geocoding/v5/mapbox.places/${coordinates.lng},${coordinates.lat}.json?access_token=${token}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed: ${response.statusText}`)
  }

  const data = await response.json()

  if (data.features.length === 0) {
    return null
  }

  const feature = data.features[0]
  return {
    placeName: feature.place_name,
    coordinates: {
      lng: feature.center[0],
      lat: feature.center[1],
    },
    relevance: feature.relevance,
    placeType: feature.place_type,
    context: parseContext(feature.context),
  }
}

function parseContext(context: any[] | undefined): GeocodingResult['context'] {
  if (!context) return undefined

  const result: GeocodingResult['context'] = {}

  for (const item of context) {
    if (item.id.startsWith('neighborhood')) {
      result.neighborhood = item.text
    } else if (item.id.startsWith('postcode')) {
      result.postcode = item.text
    } else if (item.id.startsWith('place')) {
      result.place = item.text
    } else if (item.id.startsWith('region')) {
      result.region = item.text
    } else if (item.id.startsWith('country')) {
      result.country = item.text
    }
  }

  return result
}

// =============================================================================
// POI Search Tools
// =============================================================================

/**
 * Search for Points of Interest near a location
 *
 * @example
 * const restaurants = await searchPOI(
 *   { lng: -87.91, lat: 43.04 },
 *   { category: "restaurant", limit: 10 }
 * )
 */
export async function searchPOI(
  near: Coordinates,
  options?: {
    query?: string // Free-text search query
    category?: string // Category filter (restaurant, cafe, bar, hotel, etc.)
    radius?: number // Search radius in meters (default: 1000)
    limit?: number
  }
): Promise<POIResult[]> {
  const token = getMapboxToken()
  const params = new URLSearchParams({
    access_token: token,
    proximity: `${near.lng},${near.lat}`,
    limit: String(options?.limit ?? 10),
  })

  // Use Search Box API for POI search
  const query = options?.query || options?.category || 'business'

  const url = `${MAPBOX_API_BASE}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}&types=poi`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`POI search failed: ${response.statusText}`)
  }

  const data = await response.json()

  return data.features.map((feature: any) => ({
    name: feature.text,
    coordinates: {
      lng: feature.center[0],
      lat: feature.center[1],
    },
    category: feature.properties?.category || 'unknown',
    address: feature.place_name,
    distance: calculateDistance(near, {
      lng: feature.center[0],
      lat: feature.center[1],
    }),
  }))
}

// =============================================================================
// Isochrone Tools (Accessibility Analysis)
// =============================================================================

/**
 * Calculate areas reachable within a specific travel time
 *
 * @example
 * const area = await getIsochrone(
 *   { lng: -87.91, lat: 43.04 },
 *   { minutes: 15, profile: "driving" }
 * )
 * // Returns polygon of all areas reachable in 15 minutes by car
 */
export async function getIsochrone(
  from: Coordinates,
  options: {
    minutes: number // Travel time in minutes (1-60)
    profile?: 'driving' | 'walking' | 'cycling'
  }
): Promise<IsochroneResult> {
  const token = getMapboxToken()
  const profile = options.profile ?? 'driving'
  const contourMinutes = Math.min(60, Math.max(1, options.minutes))

  const url = `${MAPBOX_API_BASE}/isochrone/v1/mapbox/${profile}/${from.lng},${from.lat}?contours_minutes=${contourMinutes}&polygons=true&access_token=${token}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Isochrone calculation failed: ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.features || data.features.length === 0) {
    throw new Error('No isochrone polygon returned')
  }

  const polygon = data.features[0].geometry as GeoJSON.Polygon

  return {
    coordinates: from,
    profile,
    minutes: contourMinutes,
    polygon,
    area: calculatePolygonArea(polygon),
  }
}

// =============================================================================
// Directions / Routing Tools
// =============================================================================

/**
 * Calculate directions between two points
 *
 * @example
 * const route = await getDirections(
 *   { lng: -87.91, lat: 43.04 },
 *   { lng: -87.92, lat: 43.05 },
 *   { profile: "driving" }
 * )
 * // Returns: { distance: 1500, duration: 300, geometry: {...} }
 */
export async function getDirections(
  origin: Coordinates,
  destination: Coordinates,
  options?: {
    profile?: 'driving' | 'walking' | 'cycling'
  }
): Promise<DirectionsResult> {
  const token = getMapboxToken()
  const profile = options?.profile ?? 'driving'

  const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`
  const url = `${MAPBOX_API_BASE}/directions/v5/mapbox/${profile}/${coordinates}?geometries=geojson&access_token=${token}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Directions request failed: ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.routes || data.routes.length === 0) {
    throw new Error('No route found')
  }

  const route = data.routes[0]

  return {
    origin,
    destination,
    profile,
    distance: route.distance, // meters
    duration: route.duration, // seconds
    geometry: route.geometry as GeoJSON.LineString,
  }
}

/**
 * Get travel time between two points (simplified)
 *
 * @example
 * const time = await getTravelTime(parcelCoords, downtownCoords)
 * // Returns: { minutes: 12, distance: 5.2 } // 12 minutes, 5.2 km
 */
export async function getTravelTime(
  origin: Coordinates,
  destination: Coordinates,
  profile: 'driving' | 'walking' | 'cycling' = 'driving'
): Promise<{ minutes: number; distanceKm: number }> {
  const directions = await getDirections(origin, destination, { profile })

  return {
    minutes: Math.round(directions.duration / 60),
    distanceKm: Math.round(directions.distance / 100) / 10, // Round to 1 decimal
  }
}

// =============================================================================
// Static Map Tools
// =============================================================================

/**
 * Generate a static map image URL
 *
 * @example
 * const url = getStaticMapUrl({
 *   center: { lng: -87.91, lat: 43.04 },
 *   zoom: 14,
 *   markers: [{ coordinates: { lng: -87.91, lat: 43.04 }, color: "red", label: "A" }]
 * })
 */
export function getStaticMapUrl(options: StaticMapOptions): string {
  const token = getMapboxToken()
  const { center, zoom, width = 600, height = 400, markers = [], overlays = [] } = options

  // Build overlay string
  const overlayParts: string[] = []

  // Add markers
  for (const marker of markers) {
    const color = marker.color ?? 'red'
    const label = marker.label ?? ''
    overlayParts.push(
      `pin-s-${label}+${color.replace('#', '')}(${marker.coordinates.lng},${marker.coordinates.lat})`
    )
  }

  // Add polygon/line overlays
  for (const overlay of overlays) {
    const strokeColor = overlay.strokeColor?.replace('#', '') ?? '000'
    const fillColor = overlay.fillColor?.replace('#', '') ?? '3388ff'

    if (overlay.type === 'polygon') {
      const coords = overlay.coordinates
        .map((c) => `[${c.lng},${c.lat}]`)
        .join(',')
      overlayParts.push(`path-5+${strokeColor}-0.5+${fillColor}-0.3(${encodeURIComponent(`[${coords}]`)})`)
    }
  }

  const overlayStr = overlayParts.length > 0 ? `${overlayParts.join(',')}/` : ''

  return `${MAPBOX_API_BASE}/styles/v1/mapbox/streets-v12/static/${overlayStr}${center.lng},${center.lat},${zoom}/${width}x${height}?access_token=${token}`
}

/**
 * Generate a static map image as a data URL (fetches and converts to base64)
 */
export async function getStaticMapImage(
  options: StaticMapOptions
): Promise<string> {
  const url = getStaticMapUrl(options)
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Static map generation failed: ${response.statusText}`)
  }

  const blob = await response.blob()
  const buffer = await blob.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  return `data:image/png;base64,${base64}`
}

// =============================================================================
// Offline Spatial Tools (using Turf.js-like calculations)
// =============================================================================

/**
 * Calculate distance between two points (Haversine formula)
 * Returns distance in meters
 */
export function calculateDistance(
  from: Coordinates,
  to: Coordinates
): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = toRad(to.lat - from.lat)
  const dLon = toRad(to.lng - from.lng)
  const lat1 = toRad(from.lat)
  const lat2 = toRad(to.lat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Calculate bearing from one point to another
 * Returns bearing in degrees (0-360)
 */
export function calculateBearing(
  from: Coordinates,
  to: Coordinates
): number {
  const dLon = toRad(to.lng - from.lng)
  const lat1 = toRad(from.lat)
  const lat2 = toRad(to.lat)

  const y = Math.sin(dLon) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)

  const bearing = toDeg(Math.atan2(y, x))
  return (bearing + 360) % 360
}

/**
 * Check if a point is inside a polygon
 */
export function pointInPolygon(
  point: Coordinates,
  polygon: Coordinates[]
): boolean {
  let inside = false
  const x = point.lng
  const y = point.lat

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng
    const yi = polygon[i].lat
    const xj = polygon[j].lng
    const yj = polygon[j].lat

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

    if (intersect) inside = !inside
  }

  return inside
}

/**
 * Calculate approximate area of a polygon (in square meters)
 */
export function calculatePolygonArea(polygon: GeoJSON.Polygon): number {
  const coords = polygon.coordinates[0]
  let area = 0

  for (let i = 0; i < coords.length - 1; i++) {
    const j = (i + 1) % coords.length
    area += coords[i][0] * coords[j][1]
    area -= coords[j][0] * coords[i][1]
  }

  area = Math.abs(area) / 2

  // Convert from degrees to approximate square meters at Milwaukee's latitude
  const latMid = 43.0389
  const metersPerDegreeLat = 111320
  const metersPerDegreeLng = 111320 * Math.cos(toRad(latMid))

  return area * metersPerDegreeLat * metersPerDegreeLng
}

/**
 * Get the centroid of a polygon
 */
export function getPolygonCentroid(polygon: Coordinates[]): Coordinates {
  let sumLng = 0
  let sumLat = 0

  for (const coord of polygon) {
    sumLng += coord.lng
    sumLat += coord.lat
  }

  return {
    lng: sumLng / polygon.length,
    lat: sumLat / polygon.length,
  }
}

/**
 * Create a bounding box around a point with a given radius
 */
export function createBoundingBox(
  center: Coordinates,
  radiusMeters: number
): [number, number, number, number] {
  const latOffset = radiusMeters / 111320
  const lngOffset = radiusMeters / (111320 * Math.cos(toRad(center.lat)))

  return [
    center.lng - lngOffset, // minLng
    center.lat - latOffset, // minLat
    center.lng + lngOffset, // maxLng
    center.lat + latOffset, // maxLat
  ]
}

// =============================================================================
// Helper Functions
// =============================================================================

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

// =============================================================================
// Milwaukee-Specific Constants
// =============================================================================

export const MILWAUKEE_CENTER: Coordinates = {
  lng: -87.9065,
  lat: 43.0389,
}

export const MILWAUKEE_BOUNDS: [number, number, number, number] = [
  -88.07, // minLng (west)
  42.92, // minLat (south)
  -87.82, // maxLng (east)
  43.19, // maxLat (north)
]

export const MILWAUKEE_DOWNTOWN: Coordinates = {
  lng: -87.9065,
  lat: 43.0389,
}

export const MILWAUKEE_LANDMARKS: Record<string, Coordinates> = {
  artMuseum: { lng: -87.897, lat: 43.04 },
  fiservForum: { lng: -87.917, lat: 43.043 },
  cityHall: { lng: -87.909, lat: 43.039 },
  lakefront: { lng: -87.898, lat: 43.04 },
  thirdWard: { lng: -87.905, lat: 43.032 },
  walkerPoint: { lng: -87.918, lat: 43.026 },
  bayView: { lng: -87.899, lat: 42.999 },
  riverwest: { lng: -87.897, lat: 43.066 },
  eastSide: { lng: -87.884, lat: 43.055 },
}
