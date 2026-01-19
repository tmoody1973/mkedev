// =============================================================================
// ESRI Layer Manager for Mapbox GL
// Manages ESRI ArcGIS FeatureServer layers within Mapbox GL maps
// =============================================================================

import type { Map as MapboxMap } from 'mapbox-gl'
import FeatureService from 'mapbox-gl-arcgis-featureserver'
import type { ESRILayerConfig, ESRILayerType } from './layer-config'
import { ALL_LAYER_CONFIGS, ZONING_CATEGORY_COLORS } from './layer-config'

// =============================================================================
// Types
// =============================================================================

export interface ParcelData {
  taxKey: string
  address: string
  zoneCode: string
  owner?: string
  assessedValue?: number
  lotSize?: number
}

export interface LayerClickEvent {
  layerId: ESRILayerType
  coordinates: [number, number]
  properties: Record<string, unknown>
  parcelData?: ParcelData
}

export interface ESRILayerManagerOptions {
  /** Mapbox map instance */
  map: MapboxMap
  /** Callback when a layer feature is clicked */
  onFeatureClick?: (event: LayerClickEvent) => void
  /** Callback when hovering over a feature */
  onFeatureHover?: (event: LayerClickEvent | null) => void
}

// =============================================================================
// Layer ID Utilities
// =============================================================================

/**
 * Generate unique source ID for a layer
 */
function getSourceId(layerId: ESRILayerType): string {
  return `esri-source-${layerId}`
}

/**
 * Generate unique fill layer ID
 */
function getFillLayerId(layerId: ESRILayerType): string {
  return `esri-fill-${layerId}`
}

/**
 * Generate unique stroke layer ID
 */
function getStrokeLayerId(layerId: ESRILayerType): string {
  return `esri-stroke-${layerId}`
}

/**
 * Generate unique highlight layer ID (stroke)
 */
function getHighlightLayerId(layerId: ESRILayerType): string {
  return `esri-highlight-${layerId}`
}

/**
 * Generate unique highlight fill layer ID
 */
function getHighlightFillLayerId(layerId: ESRILayerType): string {
  return `esri-highlight-fill-${layerId}`
}

// =============================================================================
// ESRI Layer Manager Class
// =============================================================================

/**
 * Manages ESRI ArcGIS FeatureServer layers within a Mapbox GL map
 * Provides methods for adding, removing, and controlling layer visibility
 */
export class ESRILayerManager {
  private map: MapboxMap
  private featureServices: Map<ESRILayerType, FeatureService> = new Map()
  private layerConfigs: Map<ESRILayerType, ESRILayerConfig> = new Map()
  private onFeatureClick?: (event: LayerClickEvent) => void
  private onFeatureHover?: (event: LayerClickEvent | null) => void
  private selectedFeatureId: string | null = null

  constructor(options: ESRILayerManagerOptions) {
    this.map = options.map
    this.onFeatureClick = options.onFeatureClick
    this.onFeatureHover = options.onFeatureHover

    // Initialize layer configs map
    ALL_LAYER_CONFIGS.forEach((config) => {
      this.layerConfigs.set(config.id, config)
    })
  }

  /**
   * Initialize all ESRI layers on the map
   * Should be called after the map has loaded
   */
  async initializeLayers(
    initialVisibility: Record<ESRILayerType, boolean>
  ): Promise<void> {
    // Add layers in reverse order so first layers appear on top
    const reversedConfigs = [...ALL_LAYER_CONFIGS].reverse()

    for (const config of reversedConfigs) {
      await this.addLayer(config, initialVisibility[config.id] ?? config.defaultVisible)
    }

    // Set up event handlers for interactive layers
    this.setupEventHandlers()
  }

  /**
   * Add a single ESRI layer to the map
   */
  private async addLayer(
    config: ESRILayerConfig,
    visible: boolean
  ): Promise<void> {
    const sourceId = getSourceId(config.id)
    const fillLayerId = getFillLayerId(config.id)
    const strokeLayerId = getStrokeLayerId(config.id)

    // Skip if source already exists (prevents duplicate source errors on re-mount)
    if (this.map.getSource(sourceId)) {
      console.log(`Source ${sourceId} already exists, skipping layer creation`)
      // Ensure layers are set to correct visibility
      this.setLayerVisibility(config.id, visible)
      return
    }

    // Build the service URL with layer number if specified
    const serviceUrl = config.layerNumber !== null
      ? `${config.url}/${config.layerNumber}`
      : config.url

    try {
      // Create FeatureService instance
      const featureService = new FeatureService(sourceId, this.map, {
        url: serviceUrl,
      })

      this.featureServices.set(config.id, featureService)

      // Wait for source to be loaded
      await new Promise<void>((resolve, reject) => {
        const checkSource = () => {
          if (this.map.getSource(sourceId)) {
            resolve()
          } else {
            // Check again on next frame
            requestAnimationFrame(checkSource)
          }
        }

        // Start checking after a short delay to allow FeatureService to initialize
        setTimeout(checkSource, 100)

        // Timeout after 10 seconds
        setTimeout(() => reject(new Error(`Timeout loading layer: ${config.id}`)), 10000)
      })

      // Add fill layer with category-based styling for zoning
      if (config.id === 'zoning') {
        this.addZoningFillLayer(fillLayerId, sourceId, config, visible)
      } else {
        this.addStandardFillLayer(fillLayerId, sourceId, config, visible)
      }

      // Add stroke layer
      this.addStrokeLayer(strokeLayerId, sourceId, config, visible)

      // Add highlight layer for interactive layers
      if (config.interactive) {
        this.addHighlightLayer(config.id, sourceId)
      }
    } catch (error) {
      console.error(`Failed to add layer ${config.id}:`, error)
    }
  }

  /**
   * Add standard fill layer with uniform color
   */
  private addStandardFillLayer(
    layerId: string,
    sourceId: string,
    config: ESRILayerConfig,
    visible: boolean
  ): void {
    if (this.map.getLayer(layerId)) return

    this.map.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      layout: {
        visibility: visible ? 'visible' : 'none',
      },
      paint: {
        'fill-color': config.color,
        'fill-opacity': config.fillOpacity,
      },
    })
  }

  /**
   * Add zoning fill layer with category-based coloring
   */
  private addZoningFillLayer(
    layerId: string,
    sourceId: string,
    config: ESRILayerConfig,
    visible: boolean
  ): void {
    if (this.map.getLayer(layerId)) return

    // Create match expression for zoning categories
    // This uses the ZONING field from ESRI data to determine color
    const colorExpression: mapboxgl.Expression = [
      'match',
      ['slice', ['get', 'ZONING'], 0, 2], // Get first 2 chars of zone code
      // Residential prefixes
      'RS', ZONING_CATEGORY_COLORS.residential,
      'RT', ZONING_CATEGORY_COLORS.residential,
      'RM', ZONING_CATEGORY_COLORS.residential,
      'RO', ZONING_CATEGORY_COLORS.residential,
      // Commercial prefixes
      'NS', ZONING_CATEGORY_COLORS.commercial,
      'LB', ZONING_CATEGORY_COLORS.commercial,
      'RB', ZONING_CATEGORY_COLORS.commercial,
      'CS', ZONING_CATEGORY_COLORS.commercial,
      // Industrial prefixes
      'IM', ZONING_CATEGORY_COLORS.industrial,
      'IH', ZONING_CATEGORY_COLORS.industrial,
      'IL', ZONING_CATEGORY_COLORS.industrial,
      // Mixed-use prefixes
      'MX', ZONING_CATEGORY_COLORS['mixed-use'],
      'DX', ZONING_CATEGORY_COLORS['mixed-use'],
      // Default to special
      ZONING_CATEGORY_COLORS.special,
    ]

    this.map.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      layout: {
        visibility: visible ? 'visible' : 'none',
      },
      paint: {
        'fill-color': colorExpression,
        'fill-opacity': config.fillOpacity,
      },
    })
  }

  /**
   * Add stroke/outline layer
   */
  private addStrokeLayer(
    layerId: string,
    sourceId: string,
    config: ESRILayerConfig,
    visible: boolean
  ): void {
    if (this.map.getLayer(layerId)) return

    this.map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: {
        visibility: visible ? 'visible' : 'none',
      },
      paint: {
        'line-color': config.strokeColor,
        'line-width': config.strokeWidth,
      },
    })
  }

  /**
   * Add highlight layers for selected/hovered features
   * Includes both a fill layer (semi-transparent) and a stroke layer (bold outline)
   */
  private addHighlightLayer(layerId: ESRILayerType, sourceId: string): void {
    const highlightFillLayerId = getHighlightFillLayerId(layerId)
    const highlightLineLayerId = getHighlightLayerId(layerId)

    // Add fill highlight layer (semi-transparent blue fill for selected parcel)
    if (!this.map.getLayer(highlightFillLayerId)) {
      this.map.addLayer({
        id: highlightFillLayerId,
        type: 'fill',
        source: sourceId,
        layout: {
          visibility: 'visible',
        },
        paint: {
          'fill-color': '#3B82F6', // blue-500
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.35, // Semi-transparent when selected
            ['boolean', ['feature-state', 'hover'], false],
            0.15, // Light fill on hover
            0, // Invisible when not selected/hovered
          ],
        },
      })
    }

    // Add line highlight layer (bold outline for selected parcel)
    if (!this.map.getLayer(highlightLineLayerId)) {
      this.map.addLayer({
        id: highlightLineLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          visibility: 'visible',
        },
        paint: {
          'line-color': '#2563EB', // blue-600
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            3.5, // Thick border when selected
            ['boolean', ['feature-state', 'hover'], false],
            2, // Medium border on hover
            0, // No border when not selected/hovered
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            1,
            ['boolean', ['feature-state', 'hover'], false],
            0.8,
            0,
          ],
        },
      })
    }
  }

  /**
   * Set up click and hover event handlers for interactive layers
   */
  private setupEventHandlers(): void {
    // Handle click events on parcels layer
    const parcelsFillLayer = getFillLayerId('parcels')

    this.map.on('click', parcelsFillLayer, (e) => {
      if (!e.features || e.features.length === 0) return

      const feature = e.features[0]
      const properties = feature.properties || {}

      // Extract parcel data from ESRI properties
      const parcelData: ParcelData = {
        taxKey: properties.TAXKEY || properties.taxkey || '',
        address: this.formatAddress(properties),
        zoneCode: properties.ZONING || properties.zoning || '',
        owner: properties.OWNER || properties.owner,
        assessedValue: properties.C_A_TOTAL || properties.assessed_value,
        lotSize: properties.LOT_AREA || properties.lot_area,
      }

      // Update selected feature state
      if (this.selectedFeatureId) {
        this.map.setFeatureState(
          { source: getSourceId('parcels'), id: this.selectedFeatureId },
          { selected: false }
        )
      }

      const featureId = feature.id?.toString()
      if (featureId) {
        this.selectedFeatureId = featureId
        this.map.setFeatureState(
          { source: getSourceId('parcels'), id: featureId },
          { selected: true }
        )
      }

      // Trigger callback
      this.onFeatureClick?.({
        layerId: 'parcels',
        coordinates: [e.lngLat.lng, e.lngLat.lat],
        properties,
        parcelData,
      })
    })

    // Handle hover events on zoning layer
    const zoningFillLayer = getFillLayerId('zoning')

    this.map.on('mousemove', zoningFillLayer, (e) => {
      if (!e.features || e.features.length === 0) return

      const feature = e.features[0]
      const properties = feature.properties || {}

      this.map.getCanvas().style.cursor = 'pointer'

      this.onFeatureHover?.({
        layerId: 'zoning',
        coordinates: [e.lngLat.lng, e.lngLat.lat],
        properties,
      })
    })

    this.map.on('mouseleave', zoningFillLayer, () => {
      this.map.getCanvas().style.cursor = ''
      this.onFeatureHover?.(null)
    })

    // Handle hover on parcels layer
    this.map.on('mousemove', parcelsFillLayer, () => {
      this.map.getCanvas().style.cursor = 'pointer'
    })

    this.map.on('mouseleave', parcelsFillLayer, () => {
      this.map.getCanvas().style.cursor = ''
    })
  }

  /**
   * Format address from ESRI parcel properties
   */
  private formatAddress(properties: Record<string, unknown>): string {
    const houseNumber = properties.HOUSE_NR_LO || properties.house_number || ''
    const direction = properties.SDIR || properties.direction || ''
    const street = properties.STREET || properties.street || ''
    const streetType = properties.STTYPE || properties.street_type || ''

    const parts = [houseNumber, direction, street, streetType].filter(Boolean)
    return parts.join(' ').trim() || 'Unknown Address'
  }

  /**
   * Set visibility for a specific layer
   */
  setLayerVisibility(layerId: ESRILayerType, visible: boolean): void {
    const fillLayerId = getFillLayerId(layerId)
    const strokeLayerId = getStrokeLayerId(layerId)
    const visibility = visible ? 'visible' : 'none'

    if (this.map.getLayer(fillLayerId)) {
      this.map.setLayoutProperty(fillLayerId, 'visibility', visibility)
    }

    if (this.map.getLayer(strokeLayerId)) {
      this.map.setLayoutProperty(strokeLayerId, 'visibility', visibility)
    }
  }

  /**
   * Set opacity for a specific layer
   */
  setLayerOpacity(layerId: ESRILayerType, opacity: number): void {
    const fillLayerId = getFillLayerId(layerId)

    if (this.map.getLayer(fillLayerId)) {
      this.map.setPaintProperty(fillLayerId, 'fill-opacity', opacity)
    }
  }

  /**
   * Clear selected parcel highlight
   */
  clearSelection(): void {
    if (this.selectedFeatureId) {
      this.map.setFeatureState(
        { source: getSourceId('parcels'), id: this.selectedFeatureId },
        { selected: false }
      )
      this.selectedFeatureId = null
    }
  }

  /**
   * Highlight a specific parcel by tax key
   */
  highlightParcelByTaxKey(taxKey: string): void {
    // Query features at the source level to find matching parcel
    const source = this.map.getSource(getSourceId('parcels'))
    if (!source) return

    // Use querySourceFeatures to find the parcel
    const features = this.map.querySourceFeatures(getSourceId('parcels'), {
      filter: ['==', ['get', 'TAXKEY'], taxKey],
    })

    if (features.length > 0 && features[0].id) {
      this.clearSelection()
      this.selectedFeatureId = features[0].id.toString()
      this.map.setFeatureState(
        { source: getSourceId('parcels'), id: this.selectedFeatureId },
        { selected: true }
      )
    }
  }

  /**
   * Get all layer configurations
   */
  getLayerConfigs(): ESRILayerConfig[] {
    return ALL_LAYER_CONFIGS
  }

  /**
   * Get configuration for a specific layer
   */
  getLayerConfig(layerId: ESRILayerType): ESRILayerConfig | undefined {
    return this.layerConfigs.get(layerId)
  }

  /**
   * Clean up layers and event handlers
   * Should be called when the map is being removed
   */
  destroy(): void {
    // Early return if map is not available
    if (!this.map) {
      this.featureServices.clear()
      return
    }

    // Remove all layers
    ALL_LAYER_CONFIGS.forEach((config) => {
      const fillLayerId = getFillLayerId(config.id)
      const strokeLayerId = getStrokeLayerId(config.id)
      const highlightLayerId = getHighlightLayerId(config.id)

      try {
        if (this.map.getLayer(highlightLayerId)) {
          this.map.removeLayer(highlightLayerId)
        }
        if (this.map.getLayer(strokeLayerId)) {
          this.map.removeLayer(strokeLayerId)
        }
        if (this.map.getLayer(fillLayerId)) {
          this.map.removeLayer(fillLayerId)
        }
        if (this.map.getSource(getSourceId(config.id))) {
          this.map.removeSource(getSourceId(config.id))
        }
      } catch {
        // Layer may already be removed, ignore errors during cleanup
      }
    })

    this.featureServices.clear()
  }
}
