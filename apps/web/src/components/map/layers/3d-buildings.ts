/**
 * 3D Buildings Layer for Mapbox
 * Adds realistic 3D building extrusions using Mapbox's building data
 *
 * Style inspired by: https://docs.mapbox.com/mapbox-gl-js/example/3d-buildings/
 */

import type { Map as MapboxMap } from 'mapbox-gl'

// =============================================================================
// Configuration
// =============================================================================

/** 3D buildings layer ID */
export const BUILDINGS_3D_LAYER_ID = '3d-buildings'

/** Light gray color for buildings (from Mapbox example) */
export const BUILDINGS_3D_COLOR = '#aaa'

/** Building opacity for translucent effect */
export const BUILDINGS_3D_OPACITY = 0.6

/** Minimum zoom level for 3D buildings to appear */
export const BUILDINGS_3D_MIN_ZOOM = 14

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Find the first label layer in the style to insert buildings before it
 * This ensures buildings appear under labels for proper visual hierarchy
 */
function findLabelLayerId(map: MapboxMap): string | undefined {
  const layers = map.getStyle()?.layers
  if (!layers) return undefined

  for (const layer of layers) {
    // Look for symbol layers that are likely labels
    if (layer.type === 'symbol' && (layer as { layout?: { 'text-field'?: unknown } }).layout?.['text-field']) {
      return layer.id
    }
  }
  return undefined
}

/**
 * Check if 3D buildings layer already exists
 */
export function has3DBuildings(map: MapboxMap): boolean {
  // Guard against invalid/destroyed map instances
  if (!map || typeof map.getLayer !== 'function') {
    return false
  }
  try {
    return !!map.getLayer(BUILDINGS_3D_LAYER_ID)
  } catch {
    return false
  }
}

/**
 * Add 3D buildings layer to the map
 * Uses Mapbox's composite source 'building' layer
 *
 * @param map - Mapbox GL map instance
 * @returns true if layer was added, false if it already existed or failed
 */
export function add3DBuildings(map: MapboxMap): boolean {
  // Guard against invalid map
  if (!map || typeof map.getLayer !== 'function') {
    return false
  }

  // Don't add if already exists
  if (has3DBuildings(map)) {
    return false
  }

  // Check if the composite source has building data
  const source = map.getSource('composite')
  if (!source) {
    console.warn('3D buildings: composite source not found')
    return false
  }

  // Find the label layer to insert before
  const labelLayerId = findLabelLayerId(map)

  try {
    map.addLayer(
      {
        id: BUILDINGS_3D_LAYER_ID,
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: BUILDINGS_3D_MIN_ZOOM,
        paint: {
          // Light gray color for clean architectural look
          'fill-extrusion-color': BUILDINGS_3D_COLOR,

          // Smooth height interpolation at zoom 15
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'height'],
          ],

          // Base height for multi-story buildings
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'min_height'],
          ],

          // Semi-transparent for nice depth effect
          'fill-extrusion-opacity': BUILDINGS_3D_OPACITY,
        },
      },
      labelLayerId // Insert before labels
    )

    console.log('3D buildings layer added')
    return true
  } catch (error) {
    console.error('Failed to add 3D buildings layer:', error)
    return false
  }
}

/**
 * Remove 3D buildings layer from the map
 *
 * @param map - Mapbox GL map instance
 */
export function remove3DBuildings(map: MapboxMap): void {
  // Guard against invalid map
  if (!map || typeof map.removeLayer !== 'function') {
    return
  }

  if (has3DBuildings(map)) {
    try {
      map.removeLayer(BUILDINGS_3D_LAYER_ID)
      console.log('3D buildings layer removed')
    } catch (error) {
      console.error('Failed to remove 3D buildings layer:', error)
    }
  }
}

/**
 * Toggle 3D buildings visibility
 *
 * @param map - Mapbox GL map instance
 * @param visible - Whether buildings should be visible
 */
export function set3DBuildingsVisibility(map: MapboxMap, visible: boolean): void {
  if (!has3DBuildings(map)) return

  map.setLayoutProperty(
    BUILDINGS_3D_LAYER_ID,
    'visibility',
    visible ? 'visible' : 'none'
  )
}

/**
 * Set 3D buildings opacity
 *
 * @param map - Mapbox GL map instance
 * @param opacity - Opacity value (0-1)
 */
export function set3DBuildingsOpacity(map: MapboxMap, opacity: number): void {
  if (!has3DBuildings(map)) return

  map.setPaintProperty(
    BUILDINGS_3D_LAYER_ID,
    'fill-extrusion-opacity',
    opacity
  )
}
