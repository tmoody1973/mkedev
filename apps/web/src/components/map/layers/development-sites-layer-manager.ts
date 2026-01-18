// =============================================================================
// Development Sites Layer Manager for Mapbox GL
// Manages development site markers from Convex data within Mapbox GL maps
// =============================================================================

import type { Map as MapboxMap } from 'mapbox-gl'
import { DEVELOPMENT_SITES_LAYER_CONFIG } from './layer-config'

// =============================================================================
// Types
// =============================================================================

/**
 * Development site data structure from Convex developmentSites table
 */
export interface DevelopmentSite {
  _id: string
  address: string
  coordinates: [number, number] // [lng, lat] WGS84
  siteName?: string
  lotSizeSqFt?: number
  askingPrice?: number
  zoning?: string
  incentives?: string[]
  status: 'available' | 'sold' | 'pending' | 'unknown'
}

/**
 * Event emitted when a development site marker is clicked
 */
export interface DevelopmentSiteClickEvent {
  siteId: string
  coordinates: [number, number]
  properties: DevelopmentSite
}

/**
 * Options for DevelopmentSitesLayerManager constructor
 */
export interface DevelopmentSitesLayerManagerOptions {
  /** Mapbox map instance */
  map: MapboxMap
  /** Callback when a site marker is clicked */
  onSiteClick?: (event: DevelopmentSiteClickEvent) => void
}

// =============================================================================
// Constants
// =============================================================================

const SOURCE_ID = 'development-sites-source'
const CIRCLE_LAYER_ID = 'development-sites-circles'

const { color: CIRCLE_COLOR_DEFAULT, highlightColor: CIRCLE_COLOR_HIGHLIGHTED, strokeColor: CIRCLE_STROKE_COLOR, circleRadius, highlightRadius } = DEVELOPMENT_SITES_LAYER_CONFIG

// =============================================================================
// Development Sites Layer Manager Class
// =============================================================================

/**
 * Manages development site markers within a Mapbox GL map
 * Uses GeoJSON source from Convex data with circle markers
 * Supports highlighting sites by ID using feature-state
 */
export class DevelopmentSitesLayerManager {
  private map: MapboxMap
  private onSiteClick?: (event: DevelopmentSiteClickEvent) => void
  private sitesData: Map<string, DevelopmentSite> = new Map()
  private highlightedSiteIds: Set<string> = new Set()
  private initialized = false

  constructor(options: DevelopmentSitesLayerManagerOptions) {
    this.map = options.map
    this.onSiteClick = options.onSiteClick
  }

  /**
   * Add the development sites layer to the map
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
      promoteId: 'siteId',
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
   * Update the development sites data displayed on the map
   */
  updateData(sites: DevelopmentSite[]): void {
    if (sites.length > 0) {
      console.log('[DevelopmentSitesLayerManager] Updating with', sites.length, 'sites')
    }

    this.sitesData.clear()
    sites.forEach((site) => {
      this.sitesData.set(site._id, site)
    })

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: sites.map((site) => ({
        type: 'Feature' as const,
        id: site._id,
        properties: {
          siteId: site._id,
          address: site.address,
          siteName: site.siteName,
          lotSizeSqFt: site.lotSizeSqFt,
          askingPrice: site.askingPrice,
          zoning: site.zoning,
          incentivesCount: site.incentives?.length || 0,
          status: site.status,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: site.coordinates,
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
   * Highlight specific sites by their IDs
   */
  highlightSites(siteIds: string[]): void {
    this.clearHighlights()
    this.highlightedSiteIds = new Set(siteIds)
    this.applyHighlights()
  }

  /**
   * Clear all site highlights
   */
  clearHighlights(): void {
    for (const siteId of this.highlightedSiteIds) {
      try {
        this.map.setFeatureState(
          { source: SOURCE_ID, id: siteId },
          { highlighted: false }
        )
      } catch {
        // Feature may not exist, ignore errors
      }
    }

    this.highlightedSiteIds.clear()
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

    this.sitesData.clear()
    this.highlightedSiteIds.clear()
    this.initialized = false
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  private applyHighlights(): void {
    for (const siteId of this.highlightedSiteIds) {
      try {
        this.map.setFeatureState(
          { source: SOURCE_ID, id: siteId },
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
      const siteId = feature.properties?.siteId as string | undefined

      if (!siteId) {
        return
      }

      const siteData = this.sitesData.get(siteId)

      if (!siteData) {
        return
      }

      this.onSiteClick?.({
        siteId,
        coordinates: siteData.coordinates,
        properties: siteData,
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
