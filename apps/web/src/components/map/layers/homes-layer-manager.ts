// =============================================================================
// Homes Layer Manager for Mapbox GL
// Manages homes for sale markers from Convex data within Mapbox GL maps
// =============================================================================

import type { Map as MapboxMap } from 'mapbox-gl'

// =============================================================================
// Types
// =============================================================================

/**
 * Home data structure from Convex homesForSale table
 */
export interface HomeForSale {
  _id: string
  address: string
  neighborhood: string
  coordinates: [number, number] // [lng, lat] WGS84
  bedrooms: number
  fullBaths: number
  halfBaths: number
  buildingSqFt: number
  yearBuilt: number
  status: 'for_sale' | 'sold' | 'unknown'
  narrative?: string
  listingUrl?: string
  developerName?: string
}

/**
 * Event emitted when a home marker is clicked
 */
export interface HomeClickEvent {
  homeId: string
  coordinates: [number, number]
  properties: HomeForSale
}

/**
 * Options for HomesLayerManager constructor
 */
export interface HomesLayerManagerOptions {
  /** Mapbox map instance */
  map: MapboxMap
  /** Callback when a home marker is clicked */
  onHomeClick?: (event: HomeClickEvent) => void
}

// =============================================================================
// Constants
// =============================================================================

const SOURCE_ID = 'homes-for-sale-source'
const CIRCLE_LAYER_ID = 'homes-for-sale-circles'

// Colors matching spec requirements
const CIRCLE_COLOR_DEFAULT = '#0ea5e9' // sky-500
const CIRCLE_COLOR_HIGHLIGHTED = '#f59e0b' // amber-500
const CIRCLE_STROKE_COLOR = '#ffffff'

// =============================================================================
// Homes Layer Manager Class
// =============================================================================

/**
 * Manages homes for sale markers within a Mapbox GL map
 * Uses GeoJSON source from Convex data with circle markers
 * Supports highlighting homes by ID using feature-state
 */
export class HomesLayerManager {
  private map: MapboxMap
  private onHomeClick?: (event: HomeClickEvent) => void
  private homesData: Map<string, HomeForSale> = new Map()
  private highlightedHomeIds: Set<string> = new Set()
  private initialized = false

  constructor(options: HomesLayerManagerOptions) {
    this.map = options.map
    this.onHomeClick = options.onHomeClick
  }

  /**
   * Add the homes layer to the map
   * Creates GeoJSON source and circle layer with styling
   */
  addLayer(): void {
    if (this.initialized) {
      return
    }

    // Skip if source already exists (prevents duplicate source errors on re-mount)
    if (this.map.getSource(SOURCE_ID)) {
      console.log(`Source ${SOURCE_ID} already exists, skipping layer creation`)
      this.initialized = true
      return
    }

    // Create empty GeoJSON source
    this.map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
      promoteId: 'homeId', // Use homeId for feature-state
    })

    // Add circle layer with highlight support via feature-state
    this.map.addLayer({
      id: CIRCLE_LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        // Circle radius: larger when highlighted
        'circle-radius': [
          'case',
          ['boolean', ['feature-state', 'highlighted'], false],
          12,
          8,
        ],
        // Circle color: amber when highlighted, sky-500 default
        'circle-color': [
          'case',
          ['boolean', ['feature-state', 'highlighted'], false],
          CIRCLE_COLOR_HIGHLIGHTED,
          CIRCLE_COLOR_DEFAULT,
        ],
        // White stroke
        'circle-stroke-width': 2,
        'circle-stroke-color': CIRCLE_STROKE_COLOR,
      },
    })

    // Setup event handlers
    this.setupEventHandlers()
    this.initialized = true
  }

  /**
   * Set layer visibility
   */
  setLayerVisibility(visible: boolean): void {
    if (!this.map.getLayer(CIRCLE_LAYER_ID)) {
      return
    }

    this.map.setLayoutProperty(
      CIRCLE_LAYER_ID,
      'visibility',
      visible ? 'visible' : 'none'
    )
  }

  /**
   * Update the homes data displayed on the map
   * Converts homes array to GeoJSON and updates the source
   */
  updateData(homes: HomeForSale[]): void {
    // Debug: Log coordinates
    if (homes.length > 0) {
      console.log('[HomesLayerManager] Updating with', homes.length, 'homes')
      console.log('[HomesLayerManager] Sample coordinates:', homes[0].address, homes[0].coordinates)
    }

    // Store homes data for click handler lookup
    this.homesData.clear()
    homes.forEach((home) => {
      this.homesData.set(home._id, home)
    })

    // Convert to GeoJSON
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: homes.map((home) => ({
        type: 'Feature' as const,
        id: home._id, // Used for feature-state
        properties: {
          homeId: home._id,
          address: home.address,
          neighborhood: home.neighborhood,
          bedrooms: home.bedrooms,
          fullBaths: home.fullBaths,
          halfBaths: home.halfBaths,
          buildingSqFt: home.buildingSqFt,
          yearBuilt: home.yearBuilt,
          status: home.status,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: home.coordinates,
        },
      })),
    }

    // Update source data
    const source = this.map.getSource(SOURCE_ID)
    if (source && 'setData' in source) {
      source.setData(geojson)
    }

    // Re-apply highlights after data update
    this.applyHighlights()
  }

  /**
   * Highlight specific homes by their IDs
   * Uses feature-state to change marker appearance
   */
  highlightHomes(homeIds: string[]): void {
    // Clear existing highlights first
    this.clearHighlights()

    // Store new highlighted IDs
    this.highlightedHomeIds = new Set(homeIds)

    // Apply highlights
    this.applyHighlights()
  }

  /**
   * Clear all home highlights
   */
  clearHighlights(): void {
    // Remove feature-state from all previously highlighted homes
    for (const homeId of this.highlightedHomeIds) {
      try {
        this.map.setFeatureState(
          { source: SOURCE_ID, id: homeId },
          { highlighted: false }
        )
      } catch {
        // Feature may not exist, ignore errors
      }
    }

    this.highlightedHomeIds.clear()
  }

  /**
   * Clean up layers and sources
   */
  destroy(): void {
    // Early return if map is not available
    if (!this.map) {
      return
    }

    try {
      // Remove layer first
      if (this.map.getLayer(CIRCLE_LAYER_ID)) {
        this.map.removeLayer(CIRCLE_LAYER_ID)
      }

      // Then remove source
      if (this.map.getSource(SOURCE_ID)) {
        this.map.removeSource(SOURCE_ID)
      }
    } catch {
      // Layer/source may already be removed, ignore errors during cleanup
    }

    this.homesData.clear()
    this.highlightedHomeIds.clear()
    this.initialized = false
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  /**
   * Apply highlight feature-state to all highlighted homes
   */
  private applyHighlights(): void {
    for (const homeId of this.highlightedHomeIds) {
      try {
        this.map.setFeatureState(
          { source: SOURCE_ID, id: homeId },
          { highlighted: true }
        )
      } catch {
        // Feature may not exist yet, ignore errors
      }
    }
  }

  /**
   * Setup click and hover event handlers
   */
  private setupEventHandlers(): void {
    // Click handler for home markers
    this.map.on('click', CIRCLE_LAYER_ID, (e) => {
      if (!e.features || e.features.length === 0) {
        return
      }

      const feature = e.features[0]
      const homeId = feature.properties?.homeId as string | undefined

      if (!homeId) {
        return
      }

      // Get full home data from stored map
      const homeData = this.homesData.get(homeId)

      if (!homeData) {
        return
      }

      // Emit click event
      this.onHomeClick?.({
        homeId,
        coordinates: homeData.coordinates,
        properties: homeData,
      })
    })

    // Cursor change on hover
    this.map.on('mouseenter', CIRCLE_LAYER_ID, () => {
      this.map.getCanvas().style.cursor = 'pointer'
    })

    this.map.on('mouseleave', CIRCLE_LAYER_ID, () => {
      this.map.getCanvas().style.cursor = ''
    })
  }
}
