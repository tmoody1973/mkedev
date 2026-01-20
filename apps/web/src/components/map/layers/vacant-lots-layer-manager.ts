// =============================================================================
// Vacant Lots Layer Manager for Mapbox GL
// Manages city-owned vacant lot markers from Convex data within Mapbox GL maps
// =============================================================================

import type { Map as MapboxMap } from 'mapbox-gl'

// =============================================================================
// Types
// =============================================================================

/**
 * Vacant lot data structure from Convex vacantLots table
 */
export interface VacantLot {
  id: string
  address: string
  neighborhood?: string
  coordinates: [number, number] // [lng, lat] WGS84
  status: 'available' | 'pending' | 'sold' | 'unknown'
  zoning?: string
  propertyType?: string
  dispositionStatus?: string
  dispositionStrategy?: string
  aldermanicDistrict?: number
  lotSizeSqFt?: number
  acquisitionDate?: string
  currentOwner?: string
}

/**
 * Event emitted when a vacant lot marker is clicked
 */
export interface VacantLotClickEvent {
  lotId: string
  coordinates: [number, number]
  properties: VacantLot
}

/**
 * Options for VacantLotsLayerManager constructor
 */
export interface VacantLotsLayerManagerOptions {
  /** Mapbox map instance */
  map: MapboxMap
  /** Callback when a vacant lot marker is clicked */
  onLotClick?: (event: VacantLotClickEvent) => void
}

// =============================================================================
// Constants
// =============================================================================

const SOURCE_ID = 'vacant-lots-source'
const CIRCLE_LAYER_ID = 'vacant-lots-circles'

// Colors matching spec requirements
const CIRCLE_COLOR_AVAILABLE = '#22c55e' // green-500
const CIRCLE_COLOR_PENDING = '#f97316' // orange-500
const CIRCLE_COLOR_OTHER = '#6b7280' // gray-500
const CIRCLE_COLOR_HIGHLIGHTED = '#f59e0b' // amber-500
const CIRCLE_STROKE_COLOR = '#ffffff'

// =============================================================================
// Vacant Lots Layer Manager Class
// =============================================================================

/**
 * Manages city-owned vacant lot markers within a Mapbox GL map
 * Uses GeoJSON source from Convex data with circle markers
 * Supports highlighting lots by ID using feature-state
 */
export class VacantLotsLayerManager {
  private map: MapboxMap
  private onLotClick?: (event: VacantLotClickEvent) => void
  private lotsData: Map<string, VacantLot> = new Map()
  private highlightedLotIds: Set<string> = new Set()
  private initialized = false

  constructor(options: VacantLotsLayerManagerOptions) {
    this.map = options.map
    this.onLotClick = options.onLotClick
  }

  /**
   * Add the vacant lots layer to the map
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
      promoteId: 'lotId', // Use lotId for feature-state
    })

    // Add circle layer with highlight support via feature-state
    // Color by status: available=green, pending=orange, other=gray
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
        // Circle color: amber when highlighted, otherwise by status
        'circle-color': [
          'case',
          ['boolean', ['feature-state', 'highlighted'], false],
          CIRCLE_COLOR_HIGHLIGHTED,
          // Color by status
          [
            'match',
            ['get', 'status'],
            'available',
            CIRCLE_COLOR_AVAILABLE,
            'pending',
            CIRCLE_COLOR_PENDING,
            CIRCLE_COLOR_OTHER,
          ],
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
   * Update the vacant lots data displayed on the map
   * Converts lots array to GeoJSON and updates the source
   */
  updateData(lots: VacantLot[]): void {
    // Debug: Log coordinates
    if (lots.length > 0) {
      console.log('[VacantLotsLayerManager] Updating with', lots.length, 'lots')
      console.log(
        '[VacantLotsLayerManager] Sample coordinates:',
        lots[0].address,
        lots[0].coordinates
      )
    }

    // Store lots data for click handler lookup
    this.lotsData.clear()
    lots.forEach((lot) => {
      this.lotsData.set(lot.id, lot)
    })

    // Convert to GeoJSON
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: lots.map((lot) => ({
        type: 'Feature' as const,
        id: lot.id, // Used for feature-state
        properties: {
          lotId: lot.id,
          address: lot.address,
          neighborhood: lot.neighborhood || '',
          status: lot.status,
          zoning: lot.zoning || '',
          propertyType: lot.propertyType || '',
          dispositionStatus: lot.dispositionStatus || '',
        },
        geometry: {
          type: 'Point' as const,
          coordinates: lot.coordinates,
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
   * Highlight specific lots by their IDs
   * Uses feature-state to change marker appearance
   */
  highlightLots(lotIds: string[]): void {
    // Clear existing highlights first
    this.clearHighlights()

    // Store new highlighted IDs
    this.highlightedLotIds = new Set(lotIds)

    // Apply highlights
    this.applyHighlights()
  }

  /**
   * Clear all lot highlights
   */
  clearHighlights(): void {
    // Remove feature-state from all previously highlighted lots
    for (const lotId of this.highlightedLotIds) {
      try {
        this.map.setFeatureState(
          { source: SOURCE_ID, id: lotId },
          { highlighted: false }
        )
      } catch {
        // Feature may not exist, ignore errors
      }
    }

    this.highlightedLotIds.clear()
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

    this.lotsData.clear()
    this.highlightedLotIds.clear()
    this.initialized = false
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  /**
   * Apply highlight feature-state to all highlighted lots
   */
  private applyHighlights(): void {
    for (const lotId of this.highlightedLotIds) {
      try {
        this.map.setFeatureState(
          { source: SOURCE_ID, id: lotId },
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
    // Click handler for lot markers
    this.map.on('click', CIRCLE_LAYER_ID, (e) => {
      if (!e.features || e.features.length === 0) {
        return
      }

      const feature = e.features[0]
      const lotId = feature.properties?.lotId as string | undefined

      if (!lotId) {
        return
      }

      // Get full lot data from stored map
      const lotData = this.lotsData.get(lotId)

      if (!lotData) {
        return
      }

      // Emit click event
      this.onLotClick?.({
        lotId,
        coordinates: lotData.coordinates,
        properties: lotData,
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
