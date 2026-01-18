// =============================================================================
// Commercial Properties Layer Manager for Mapbox GL
// Manages commercial property markers from Convex data within Mapbox GL maps
// =============================================================================

import type { Map as MapboxMap } from 'mapbox-gl'
import { COMMERCIAL_LAYER_CONFIG } from './layer-config'

// =============================================================================
// Types
// =============================================================================

/**
 * Commercial property data structure from Convex commercialProperties table
 */
export interface CommercialProperty {
  _id: string
  address: string
  coordinates: [number, number] // [lng, lat] WGS84
  propertyType?: string
  buildingSqFt?: number
  lotSizeSqFt?: number
  askingPrice?: number
  zoning?: string
  status: 'available' | 'sold' | 'pending' | 'unknown'
}

/**
 * Event emitted when a commercial property marker is clicked
 */
export interface CommercialPropertyClickEvent {
  propertyId: string
  coordinates: [number, number]
  properties: CommercialProperty
}

/**
 * Options for CommercialLayerManager constructor
 */
export interface CommercialLayerManagerOptions {
  /** Mapbox map instance */
  map: MapboxMap
  /** Callback when a property marker is clicked */
  onPropertyClick?: (event: CommercialPropertyClickEvent) => void
}

// =============================================================================
// Constants
// =============================================================================

const SOURCE_ID = 'commercial-properties-source'
const CIRCLE_LAYER_ID = 'commercial-properties-circles'

const { color: CIRCLE_COLOR_DEFAULT, highlightColor: CIRCLE_COLOR_HIGHLIGHTED, strokeColor: CIRCLE_STROKE_COLOR, circleRadius, highlightRadius } = COMMERCIAL_LAYER_CONFIG

// =============================================================================
// Commercial Layer Manager Class
// =============================================================================

/**
 * Manages commercial property markers within a Mapbox GL map
 * Uses GeoJSON source from Convex data with circle markers
 * Supports highlighting properties by ID using feature-state
 */
export class CommercialLayerManager {
  private map: MapboxMap
  private onPropertyClick?: (event: CommercialPropertyClickEvent) => void
  private propertiesData: Map<string, CommercialProperty> = new Map()
  private highlightedPropertyIds: Set<string> = new Set()
  private initialized = false

  constructor(options: CommercialLayerManagerOptions) {
    this.map = options.map
    this.onPropertyClick = options.onPropertyClick
  }

  /**
   * Add the commercial properties layer to the map
   */
  addLayer(): void {
    if (this.initialized) {
      return
    }

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
      promoteId: 'propertyId',
    })

    // Add circle layer with highlight support via feature-state
    this.map.addLayer({
      id: CIRCLE_LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-radius': [
          'case',
          ['boolean', ['feature-state', 'highlighted'], false],
          highlightRadius,
          circleRadius,
        ],
        'circle-color': [
          'case',
          ['boolean', ['feature-state', 'highlighted'], false],
          CIRCLE_COLOR_HIGHLIGHTED,
          CIRCLE_COLOR_DEFAULT,
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': CIRCLE_STROKE_COLOR,
      },
    })

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
   * Update the commercial properties data displayed on the map
   */
  updateData(properties: CommercialProperty[]): void {
    if (properties.length > 0) {
      console.log('[CommercialLayerManager] Updating with', properties.length, 'properties')
    }

    this.propertiesData.clear()
    properties.forEach((prop) => {
      this.propertiesData.set(prop._id, prop)
    })

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: properties.map((prop) => ({
        type: 'Feature' as const,
        id: prop._id,
        properties: {
          propertyId: prop._id,
          address: prop.address,
          propertyType: prop.propertyType,
          buildingSqFt: prop.buildingSqFt,
          askingPrice: prop.askingPrice,
          zoning: prop.zoning,
          status: prop.status,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: prop.coordinates,
        },
      })),
    }

    const source = this.map.getSource(SOURCE_ID)
    if (source && 'setData' in source) {
      source.setData(geojson)
    }

    this.applyHighlights()
  }

  /**
   * Highlight specific properties by their IDs
   */
  highlightProperties(propertyIds: string[]): void {
    this.clearHighlights()
    this.highlightedPropertyIds = new Set(propertyIds)
    this.applyHighlights()
  }

  /**
   * Clear all property highlights
   */
  clearHighlights(): void {
    for (const propertyId of this.highlightedPropertyIds) {
      try {
        this.map.setFeatureState(
          { source: SOURCE_ID, id: propertyId },
          { highlighted: false }
        )
      } catch {
        // Feature may not exist, ignore errors
      }
    }

    this.highlightedPropertyIds.clear()
  }

  /**
   * Clean up layers and sources
   */
  destroy(): void {
    if (!this.map) {
      return
    }

    try {
      if (this.map.getLayer(CIRCLE_LAYER_ID)) {
        this.map.removeLayer(CIRCLE_LAYER_ID)
      }

      if (this.map.getSource(SOURCE_ID)) {
        this.map.removeSource(SOURCE_ID)
      }
    } catch {
      // Ignore cleanup errors
    }

    this.propertiesData.clear()
    this.highlightedPropertyIds.clear()
    this.initialized = false
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  private applyHighlights(): void {
    for (const propertyId of this.highlightedPropertyIds) {
      try {
        this.map.setFeatureState(
          { source: SOURCE_ID, id: propertyId },
          { highlighted: true }
        )
      } catch {
        // Feature may not exist yet, ignore errors
      }
    }
  }

  private setupEventHandlers(): void {
    this.map.on('click', CIRCLE_LAYER_ID, (e) => {
      if (!e.features || e.features.length === 0) {
        return
      }

      const feature = e.features[0]
      const propertyId = feature.properties?.propertyId as string | undefined

      if (!propertyId) {
        return
      }

      const propertyData = this.propertiesData.get(propertyId)

      if (!propertyData) {
        return
      }

      this.onPropertyClick?.({
        propertyId,
        coordinates: propertyData.coordinates,
        properties: propertyData,
      })
    })

    this.map.on('mouseenter', CIRCLE_LAYER_ID, () => {
      this.map.getCanvas().style.cursor = 'pointer'
    })

    this.map.on('mouseleave', CIRCLE_LAYER_ID, () => {
      this.map.getCanvas().style.cursor = ''
    })
  }
}
