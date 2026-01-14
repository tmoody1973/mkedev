/**
 * Mapbox Spatial Tools
 *
 * Location intelligence toolkit for MKE.dev agent and UI components.
 *
 * @example
 * import { forwardGeocode, searchPOI, getIsochrone } from '@/lib/mapbox'
 *
 * // Geocode an address
 * const results = await forwardGeocode("123 N Water St, Milwaukee")
 *
 * // Find nearby restaurants
 * const pois = await searchPOI(coordinates, { category: "restaurant" })
 *
 * // Calculate 15-minute driving area
 * const isochrone = await getIsochrone(coordinates, { minutes: 15 })
 */

// Geocoding
export {
  forwardGeocode,
  reverseGeocode,
  type GeocodingResult,
} from './mapbox-tools'

// POI Search
export {
  searchPOI,
  type POIResult,
} from './mapbox-tools'

// Isochrone / Accessibility
export {
  getIsochrone,
  type IsochroneResult,
} from './mapbox-tools'

// Directions / Routing
export {
  getDirections,
  getTravelTime,
  type DirectionsResult,
} from './mapbox-tools'

// Static Maps
export {
  getStaticMapUrl,
  getStaticMapImage,
  type StaticMapOptions,
} from './mapbox-tools'

// Offline Spatial Calculations
export {
  calculateDistance,
  calculateBearing,
  pointInPolygon,
  calculatePolygonArea,
  getPolygonCentroid,
  createBoundingBox,
} from './mapbox-tools'

// Types
export type { Coordinates } from './mapbox-tools'

// Milwaukee Constants
export {
  MILWAUKEE_CENTER,
  MILWAUKEE_BOUNDS,
  MILWAUKEE_DOWNTOWN,
  MILWAUKEE_LANDMARKS,
} from './mapbox-tools'
