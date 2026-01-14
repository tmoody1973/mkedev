/**
 * PMTiles Layer Manager
 * High-performance vector tile rendering using PMTiles
 *
 * This is an alternative to the ESRI REST approach that provides:
 * - Faster tile loading from pre-generated PMTiles
 * - Better performance for large datasets (parcels)
 * - Offline capability with cached tiles
 *
 * To use PMTiles:
 * 1. Run the tile-builder to generate milwaukee.pmtiles
 * 2. Upload to Cloudflare R2 or serve locally
 * 3. Set NEXT_PUBLIC_PMTILES_URL environment variable
 * 4. Import and use PMTilesLayerManager instead of ESRILayerManager
 */

import mapboxgl from 'mapbox-gl'
import { PmTilesSource } from 'mapbox-pmtiles'
import type { LayerType } from './layer-config'
import {
  ZONING_CATEGORY_COLORS,
  ZONE_BASE_HEIGHTS,
  ZONE_3D_OPACITY,
  ZONE_3D_NEUTRAL_COLOR,
} from './layer-config'

// PMTiles source type needs to be registered once
let sourceTypeRegistered = false

function registerPMTilesSourceType() {
  if (sourceTypeRegistered) return

  // Register PmTilesSource with Mapbox GL JS
  ;(mapboxgl.Style as unknown as { setSourceType: (type: string, source: unknown) => void })
    .setSourceType(PmTilesSource.SOURCE_TYPE, PmTilesSource)
  sourceTypeRegistered = true
}

export interface PMTilesLayerManagerOptions {
  map: mapboxgl.Map
  pmtilesUrl: string
  onFeatureClick?: (event: { layerId: LayerType; properties: Record<string, unknown>; coordinates: [number, number] }) => void
  onFeatureHover?: (event: { layerId: LayerType; properties: Record<string, unknown>; coordinates: [number, number] } | null) => void
}

/**
 * Zoning color expression - shared between 2D and 3D layers
 */
const ZONING_COLOR_EXPRESSION: mapboxgl.Expression = [
  'match',
  ['get', 'Zoning'],
  // Single-Family Residential (light greens)
  'RS1', '#90EE90',
  'RS2', '#7CCD7C',
  'RS3', '#6BBF6B',
  'RS4', '#5AB05A',
  'RS5', '#4AA04A',
  'RS6', '#3A903A',
  // Two-Family Residential (medium greens)
  'RT1', '#32CD32',
  'RT2', '#2EB82E',
  'RT3', '#2AAA2A',
  'RT4', '#269B26',
  // Multi-Family Residential (teal greens)
  'RM1', '#20B2AA',
  'RM2', '#1DA59D',
  'RM3', '#1A9890',
  'RM4', '#178B83',
  'RM5', '#147E76',
  'RM6', '#117169',
  'RM7', '#0E645C',
  // Residential-Office
  'RO1', '#48D1CC',
  'RO2', '#40BFB9',
  // Neighborhood Shopping (light blues)
  'NS1', '#87CEEB',
  'NS2', '#7EC8E3',
  // Local Business (medium blues)
  'LB1', '#6495ED',
  'LB2', '#5A89E0',
  // Regional Business (darker blues)
  'RB1', '#4169E1',
  'RB2', '#3A5FD4',
  // Commercial Service (blue-purple)
  'CS', '#6A5ACD',
  // Industrial Light (light purple)
  'IL1', '#DDA0DD',
  'IL2', '#D896D8',
  // Industrial Mixed (medium purple)
  'IM', '#BA55D3',
  // Industrial Heavy (dark purple)
  'IH', '#9932CC',
  // Mixed-Use (oranges)
  'MX1', '#FFA500',
  'MX2', '#FF8C00',
  'MX3', '#FF7F00',
  // Downtown (coral/salmon)
  'DX1', '#FF7F50',
  'DX2', '#FF6347',
  'DX3', '#FA8072',
  // Parks (bright green)
  'PK', '#00FF00',
  // Planned Development (yellow)
  'PD', '#FFD700',
  // Institutional/Public (gray)
  'IF', '#A9A9A9',
  // Default fallback by category prefix
  [
    'match',
    ['slice', ['get', 'Zoning'], 0, 2],
    'RS', ZONING_CATEGORY_COLORS.residential,
    'RT', ZONING_CATEGORY_COLORS.residential,
    'RM', ZONING_CATEGORY_COLORS.residential,
    'RO', ZONING_CATEGORY_COLORS.residential,
    'NS', ZONING_CATEGORY_COLORS.commercial,
    'LB', ZONING_CATEGORY_COLORS.commercial,
    'RB', ZONING_CATEGORY_COLORS.commercial,
    'CS', ZONING_CATEGORY_COLORS.commercial,
    'IM', ZONING_CATEGORY_COLORS.industrial,
    'IH', ZONING_CATEGORY_COLORS.industrial,
    'IL', ZONING_CATEGORY_COLORS.industrial,
    'MX', ZONING_CATEGORY_COLORS['mixed-use'],
    'DX', ZONING_CATEGORY_COLORS['mixed-use'],
    ZONING_CATEGORY_COLORS.special,
  ],
]

/**
 * Zoning height expression for 3D extrusion based on zone category
 */
const ZONING_HEIGHT_EXPRESSION: mapboxgl.Expression = [
  'match',
  ['slice', ['get', 'Zoning'], 0, 2],
  // Residential districts
  'RS', ZONE_BASE_HEIGHTS.residential,
  'RT', ZONE_BASE_HEIGHTS.residential,
  'RM', ZONE_BASE_HEIGHTS.residential,
  'RO', ZONE_BASE_HEIGHTS.residential,
  // Commercial districts
  'NS', ZONE_BASE_HEIGHTS.commercial,
  'LB', ZONE_BASE_HEIGHTS.commercial,
  'RB', ZONE_BASE_HEIGHTS.commercial,
  'CS', ZONE_BASE_HEIGHTS.commercial,
  // Industrial districts
  'IM', ZONE_BASE_HEIGHTS.industrial,
  'IH', ZONE_BASE_HEIGHTS.industrial,
  'IL', ZONE_BASE_HEIGHTS.industrial,
  // Mixed-use districts
  'MX', ZONE_BASE_HEIGHTS['mixed-use'],
  'DX', ZONE_BASE_HEIGHTS['mixed-use'],
  // Default to special
  ZONE_BASE_HEIGHTS.special,
]

/**
 * Layer styling configuration
 */
const LAYER_STYLES: Record<
  LayerType,
  {
    type: 'fill' | 'line'
    paint: mapboxgl.FillPaint | mapboxgl.LinePaint
    minzoom?: number
    maxzoom?: number
  }
> = {
  zoning: {
    type: 'fill',
    paint: {
      'fill-color': ZONING_COLOR_EXPRESSION,
      'fill-opacity': 0.5,
    },
    minzoom: 10,
    maxzoom: 22,
  },
  parcels: {
    type: 'fill',
    paint: {
      'fill-color': '#78716C',
      'fill-opacity': 0.1,
      'fill-outline-color': '#44403C',
    },
    minzoom: 13,
    maxzoom: 22,
  },
  tif: {
    type: 'fill',
    paint: {
      'fill-color': '#0EA5E9',
      'fill-opacity': 0.3,
      'fill-outline-color': '#0369A1',
    },
    minzoom: 10,
    maxzoom: 22,
  },
  opportunityZones: {
    type: 'fill',
    paint: {
      'fill-color': '#F59E0B',
      'fill-opacity': 0.25,
      'fill-outline-color': '#D97706',
    },
    minzoom: 10,
    maxzoom: 22,
  },
  historic: {
    type: 'fill',
    paint: {
      'fill-color': '#A16207',
      'fill-opacity': 0.25,
      'fill-outline-color': '#854D0E',
    },
    minzoom: 10,
    maxzoom: 22,
  },
  arb: {
    type: 'fill',
    paint: {
      'fill-color': '#EC4899',
      'fill-opacity': 0.2,
      'fill-outline-color': '#BE185D',
    },
    minzoom: 10,
    maxzoom: 22,
  },
  cityOwned: {
    type: 'fill',
    paint: {
      'fill-color': '#10B981',
      'fill-opacity': 0.4,
      'fill-outline-color': '#047857',
    },
    minzoom: 12,
    maxzoom: 22,
  },
}

/**
 * PMTiles source layer IDs (must match tippecanoe -L names)
 */
const SOURCE_LAYER_IDS: Record<LayerType, string> = {
  zoning: 'zoning',
  parcels: 'parcels',
  tif: 'tif',
  opportunityZones: 'opportunity-zones',
  historic: 'historic',
  arb: 'arb',
  cityOwned: 'city-owned',
}

/**
 * PMTiles Layer Manager
 * Uses pre-generated vector tiles for high-performance rendering
 */
export class PMTilesLayerManager {
  private map: mapboxgl.Map
  private pmtilesUrl: string
  private sourceId = 'milwaukee-pmtiles'
  private layerVisibility: Map<LayerType, boolean> = new Map()
  private layerOpacity: Map<LayerType, number> = new Map()
  private is3DMode = false
  private onFeatureClick?: PMTilesLayerManagerOptions['onFeatureClick']
  private onFeatureHover?: PMTilesLayerManagerOptions['onFeatureHover']

  constructor(options: PMTilesLayerManagerOptions) {
    this.map = options.map
    this.pmtilesUrl = options.pmtilesUrl
    this.onFeatureClick = options.onFeatureClick
    this.onFeatureHover = options.onFeatureHover
  }

  /**
   * Initialize all layers from PMTiles source
   */
  async initialize(initialVisibility: Record<LayerType, boolean>): Promise<void> {
    // Register PMTiles source type
    registerPMTilesSourceType()

    // Get PMTiles header for metadata
    const header = await PmTilesSource.getHeader(this.pmtilesUrl)
    console.log('PMTiles header:', header)

    // Check if already initialized (race condition from React StrictMode)
    if (this.map.getSource(this.sourceId)) {
      console.log('PMTiles source already exists, skipping initialization')
      return
    }

    // Add PMTiles source using mapbox-pmtiles
    this.map.addSource(this.sourceId, {
      type: PmTilesSource.SOURCE_TYPE as 'vector',
      url: this.pmtilesUrl,
      minzoom: header.minZoom,
      maxzoom: header.maxZoom,
    })

    // Add layers
    for (const [layerId, style] of Object.entries(LAYER_STYLES)) {
      const visible = initialVisibility[layerId as LayerType] ?? false
      this.layerVisibility.set(layerId as LayerType, visible)
      this.layerOpacity.set(layerId as LayerType, (style.paint as mapboxgl.FillPaint)['fill-opacity'] as number || 1)

      this.map.addLayer({
        id: `pmtiles-${layerId}`,
        type: style.type,
        source: this.sourceId,
        'source-layer': SOURCE_LAYER_IDS[layerId as LayerType],
        paint: style.paint as mapboxgl.AnyPaint,
        layout: {
          visibility: visible ? 'visible' : 'none',
        },
        minzoom: style.minzoom,
        maxzoom: style.maxzoom,
      })
    }

    // Setup click handlers
    this.setupEventHandlers()
  }

  /**
   * Set visibility for a layer
   */
  setLayerVisibility(layerId: LayerType, visible: boolean): void {
    // For zoning in 3D mode, control both 2D and 3D layers together
    if (layerId === 'zoning' && this.is3DMode) {
      const mapLayerId3D = 'pmtiles-zoning-3d'
      if (this.map.getLayer(mapLayerId3D)) {
        this.map.setLayoutProperty(mapLayerId3D, 'visibility', visible ? 'visible' : 'none')
      }
    }

    const mapLayerId = `pmtiles-${layerId}`
    if (this.map.getLayer(mapLayerId)) {
      // In Option D, 2D zoning layer stays visible in 3D mode (shows ground colors)
      this.map.setLayoutProperty(mapLayerId, 'visibility', visible ? 'visible' : 'none')
      this.layerVisibility.set(layerId, visible)
    }
  }

  /**
   * Set opacity for a layer
   * Handles fill-extrusion-opacity for 3D zoning layer
   * In Option D, both 2D and 3D layers are visible, so update both
   */
  setLayerOpacity(layerId: LayerType, opacity: number): void {
    this.layerOpacity.set(layerId, opacity)

    // For zoning in 3D mode, update both layers
    if (layerId === 'zoning' && this.is3DMode) {
      const mapLayerId3D = 'pmtiles-zoning-3d'
      if (this.map.getLayer(mapLayerId3D)) {
        this.map.setPaintProperty(mapLayerId3D, 'fill-extrusion-opacity', opacity * ZONE_3D_OPACITY)
      }
    }

    // Always update 2D layer (visible in both 2D and 3D modes in Option D)
    const mapLayerId = `pmtiles-${layerId}`
    if (this.map.getLayer(mapLayerId)) {
      this.map.setPaintProperty(mapLayerId, 'fill-opacity', opacity)
    }
  }

  /**
   * Toggle zoning layer between 2D (fill) and 3D (fill-extrusion) mode
   * Option D: Keep 2D zone colors on ground, use neutral color for 3D extrusions
   */
  setZoning3DMode(enabled: boolean): void {
    if (this.is3DMode === enabled) return
    this.is3DMode = enabled

    const zoningVisible = this.layerVisibility.get('zoning') ?? true
    const zoningOpacity = this.layerOpacity.get('zoning') ?? 0.5

    if (enabled) {
      // Keep 2D zoning layer visible (shows zone colors on ground)
      // Don't hide it - this is Option D

      // Add 3D zoning layer with neutral color if it doesn't exist
      if (!this.map.getLayer('pmtiles-zoning-3d')) {
        this.map.addLayer({
          id: 'pmtiles-zoning-3d',
          type: 'fill-extrusion',
          source: this.sourceId,
          'source-layer': SOURCE_LAYER_IDS.zoning,
          paint: {
            // Neutral color for clean architectural look
            'fill-extrusion-color': ZONE_3D_NEUTRAL_COLOR,
            'fill-extrusion-opacity': zoningOpacity * ZONE_3D_OPACITY,
            'fill-extrusion-height': ZONING_HEIGHT_EXPRESSION,
            'fill-extrusion-base': 0,
          },
          layout: {
            visibility: zoningVisible ? 'visible' : 'none',
          },
          minzoom: 10,
          maxzoom: 22,
        })
      } else {
        // Layer exists, just update visibility and opacity
        this.map.setLayoutProperty('pmtiles-zoning-3d', 'visibility', zoningVisible ? 'visible' : 'none')
        this.map.setPaintProperty('pmtiles-zoning-3d', 'fill-extrusion-opacity', zoningOpacity * ZONE_3D_OPACITY)
      }
    } else {
      // Hide 3D zoning layer
      if (this.map.getLayer('pmtiles-zoning-3d')) {
        this.map.setLayoutProperty('pmtiles-zoning-3d', 'visibility', 'none')
      }

      // 2D zoning layer stays visible (already visible, no change needed)
    }
  }

  /**
   * Setup click and hover handlers
   */
  private setupEventHandlers(): void {
    // Parcel click handler
    this.map.on('click', 'pmtiles-parcels', (e) => {
      if (!e.features || e.features.length === 0) return

      const feature = e.features[0]
      this.onFeatureClick?.({
        layerId: 'parcels',
        properties: feature.properties || {},
        coordinates: [e.lngLat.lng, e.lngLat.lat],
      })
    })

    // Zoning hover handler for tooltip
    this.map.on('mousemove', 'pmtiles-zoning', (e) => {
      if (!e.features || e.features.length === 0) {
        this.onFeatureHover?.(null)
        return
      }

      const feature = e.features[0]
      this.onFeatureHover?.({
        layerId: 'zoning',
        properties: feature.properties || {},
        coordinates: [e.lngLat.lng, e.lngLat.lat],
      })
    })

    this.map.on('mouseleave', 'pmtiles-zoning', () => {
      this.onFeatureHover?.(null)
    })

    // Cursor changes on hover
    const interactiveLayers = ['pmtiles-parcels', 'pmtiles-zoning']
    for (const layer of interactiveLayers) {
      this.map.on('mouseenter', layer, () => {
        this.map.getCanvas().style.cursor = 'pointer'
      })
      this.map.on('mouseleave', layer, () => {
        this.map.getCanvas().style.cursor = ''
      })
    }
  }

  /**
   * Clear parcel selection (stub for compatibility)
   */
  clearSelection(): void {
    // PMTiles doesn't track selection state the same way
    // The selection highlight is handled via map feature state if needed
  }

  /**
   * Highlight parcel by tax key (stub for compatibility)
   */
  highlightParcelByTaxKey(_taxKey: string): void {
    // This could be implemented using map.setFeatureState if needed
    // For now, this is a compatibility stub
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Remove 3D zoning layer if it exists
    if (this.map.getLayer('pmtiles-zoning-3d')) {
      this.map.removeLayer('pmtiles-zoning-3d')
    }

    // Remove standard layers
    for (const layerId of Object.keys(LAYER_STYLES)) {
      const mapLayerId = `pmtiles-${layerId}`
      if (this.map.getLayer(mapLayerId)) {
        this.map.removeLayer(mapLayerId)
      }
    }

    // Remove source
    if (this.map.getSource(this.sourceId)) {
      this.map.removeSource(this.sourceId)
    }
  }
}

/**
 * Check if PMTiles URL is configured
 */
export function isPMTilesConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_PMTILES_URL
}

/**
 * Get the PMTiles URL from environment
 */
export function getPMTilesUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_PMTILES_URL
}
