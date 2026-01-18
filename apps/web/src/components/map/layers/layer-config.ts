// =============================================================================
// ESRI Layer Configuration for Milwaukee GIS
// =============================================================================

/**
 * Milwaukee GIS ESRI ArcGIS REST service configuration
 * Base URL for all Milwaukee city layers
 * Source: https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/
 */
export const MILWAUKEE_GIS_BASE_URL =
  'https://milwaukeemaps.milwaukee.gov/arcgis/rest/services'

/**
 * Layer category types matching zoning district categories
 */
export type ZoningCategory =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'mixed-use'
  | 'special'

/**
 * ESRI/PMTiles layer type identifiers
 * These are layers sourced from ESRI or PMTiles
 */
export type ESRILayerType =
  | 'zoning'
  | 'parcels'
  | 'tif'
  | 'opportunityZones'
  | 'historic'
  | 'arb'
  | 'cityOwned'

/**
 * All layer type identifiers matching MapContext layer visibility keys
 * Includes both ESRI layers and custom layers (homes, commercial, development sites)
 */
export type LayerType = ESRILayerType | 'homes' | 'commercialProperties' | 'developmentSites'

/**
 * Legend item for categorical layer display
 */
export interface LegendItem {
  label: string
  color: string
}

/**
 * Configuration for each ESRI layer
 */
export interface ESRILayerConfig {
  /** Unique layer identifier (matches MapContext layerVisibility keys) */
  id: ESRILayerType
  /** Display name for the layer */
  name: string
  /** Layer description */
  description: string
  /** Full URL to the ESRI service */
  url: string
  /** Layer number within the service */
  layerNumber: number | null
  /** Primary fill color for the layer */
  color: string
  /** Fill opacity (0-1) */
  fillOpacity: number
  /** Border/stroke color */
  strokeColor: string
  /** Border/stroke width */
  strokeWidth: number
  /** Whether layer is visible by default */
  defaultVisible: boolean
  /** Whether this layer supports click interaction */
  interactive: boolean
  /** Legend items for categorical display */
  legendItems: LegendItem[]
  /** Data source attribution */
  dataSource: string
}

/**
 * Configuration for the Homes layer (non-ESRI, uses Convex data)
 */
export interface HomesLayerConfig {
  /** Layer identifier */
  id: 'homes'
  /** Display name for the layer */
  name: string
  /** Layer description */
  description: string
  /** Circle color (default state) */
  color: string
  /** Circle color when highlighted */
  highlightColor: string
  /** Circle radius in pixels */
  circleRadius: number
  /** Circle radius when highlighted */
  highlightRadius: number
  /** Stroke/border color */
  strokeColor: string
  /** Stroke width */
  strokeWidth: number
  /** Whether layer is visible by default */
  defaultVisible: boolean
  /** Whether this layer supports click interaction */
  interactive: boolean
  /** Legend items for display */
  legendItems: LegendItem[]
  /** Data source attribution */
  dataSource: string
}

// =============================================================================
// Zoning Category Color Configuration
// =============================================================================

/**
 * Color palette for zoning categories
 * Used for category-based color coding of zoning districts
 */
export const ZONING_CATEGORY_COLORS: Record<ZoningCategory, string> = {
  residential: '#22C55E', // green-500
  commercial: '#3B82F6', // blue-500
  industrial: '#A855F7', // purple-500
  'mixed-use': '#F97316', // orange-500
  special: '#EAB308', // yellow-500
}

/**
 * Base extrusion heights for 3D zoning visualization (in meters)
 * Heights represent typical building heights for each zone category
 */
export const ZONE_BASE_HEIGHTS: Record<ZoningCategory, number> = {
  residential: 10, // ~3 floors
  commercial: 20, // ~6 floors
  industrial: 30, // ~9 floors (tall warehouses/factories)
  'mixed-use': 25, // ~7-8 floors
  special: 15, // ~4-5 floors (parks, institutional)
}

/**
 * 3D Layer opacity for fill-extrusion
 * Semi-transparent to show Mapbox Standard 3D buildings beneath
 */
export const ZONE_3D_OPACITY = 0.6

/**
 * Neutral color for 3D extrusions
 * Using stone-500 for clean architectural look
 * Zone colors remain visible on the 2D ground plane
 */
export const ZONE_3D_NEUTRAL_COLOR = '#78716c'

/**
 * Zoning code prefix to category mapping
 * Based on Milwaukee zoning code structure
 */
export const ZONING_CODE_CATEGORIES: Record<string, ZoningCategory> = {
  // Residential districts
  RS: 'residential',
  RT: 'residential',
  RM: 'residential',
  RO: 'residential',
  // Commercial districts
  NS: 'commercial',
  LB: 'commercial',
  RB: 'commercial',
  CS: 'commercial',
  // Industrial districts
  IM: 'industrial',
  IH: 'industrial',
  IL: 'industrial',
  // Mixed-use districts
  MX: 'mixed-use',
  DX: 'mixed-use',
  // Special districts
  PD: 'special',
  PK: 'special',
  IF: 'special',
  C9: 'special',
}

/**
 * Get zoning category from zone code
 * @param zoneCode - Milwaukee zoning code (e.g., "RS6", "LB2", "IM")
 * @returns The category for the zone code
 */
export function getZoningCategory(zoneCode: string): ZoningCategory {
  const prefix = zoneCode.replace(/[0-9]/g, '').toUpperCase()
  return ZONING_CODE_CATEGORIES[prefix] || 'special'
}

/**
 * Get color for a specific zone code
 * @param zoneCode - Milwaukee zoning code
 * @returns Hex color string for the zone
 */
export function getZoningColor(zoneCode: string): string {
  const category = getZoningCategory(zoneCode)
  return ZONING_CATEGORY_COLORS[category]
}

/**
 * Get base height for a specific zone code (for 3D extrusion)
 * @param zoneCode - Milwaukee zoning code
 * @returns Height in meters for the zone
 */
export function getZoningHeight(zoneCode: string): number {
  const category = getZoningCategory(zoneCode)
  return ZONE_BASE_HEIGHTS[category]
}

// =============================================================================
// ESRI Layer Configurations
// =============================================================================

/**
 * Zoning Districts Layer (Layer 11)
 * Shows Milwaukee zoning districts with category-based coloring
 */
export const ZONING_LAYER_CONFIG: ESRILayerConfig = {
  id: 'zoning',
  name: 'Zoning Districts',
  description: 'Milwaukee zoning districts with category-based coloring',
  url: `${MILWAUKEE_GIS_BASE_URL}/planning/zoning/MapServer`,
  layerNumber: 11,
  color: '#3B82F6',
  fillOpacity: 0.4,
  strokeColor: '#1E40AF',
  strokeWidth: 1,
  defaultVisible: true,
  interactive: true,
  legendItems: [
    { label: 'Residential', color: ZONING_CATEGORY_COLORS.residential },
    { label: 'Commercial', color: ZONING_CATEGORY_COLORS.commercial },
    { label: 'Industrial', color: ZONING_CATEGORY_COLORS.industrial },
    { label: 'Mixed-Use', color: ZONING_CATEGORY_COLORS['mixed-use'] },
    { label: 'Special', color: ZONING_CATEGORY_COLORS.special },
  ],
  dataSource: 'Milwaukee GIS - Zoning Districts',
}

/**
 * Parcels/MPROP Layer (Layer 2)
 * Master Property (MPROP) data with parcel boundaries
 * Styled as clickable outlines with transparent fill
 */
export const PARCELS_LAYER_CONFIG: ESRILayerConfig = {
  id: 'parcels',
  name: 'Parcels',
  description: 'Property parcels with MPROP data',
  url: `${MILWAUKEE_GIS_BASE_URL}/property/parcels_mprop/MapServer`,
  layerNumber: 2,
  color: '#78716C',
  fillOpacity: 0, // Transparent fill - outline only
  strokeColor: '#57534E', // stone-600 for better visibility
  strokeWidth: 0.75,
  defaultVisible: true,
  interactive: true,
  legendItems: [],
  dataSource: 'Milwaukee GIS - MPROP',
}

/**
 * TIF Districts Layer (Layer 8)
 * Tax Increment Financing districts (TID)
 */
export const TIF_LAYER_CONFIG: ESRILayerConfig = {
  id: 'tif',
  name: 'TIF Districts',
  description: 'Tax Increment Financing districts',
  url: `${MILWAUKEE_GIS_BASE_URL}/planning/special_districts/MapServer`,
  layerNumber: 8,
  color: '#0EA5E9',
  fillOpacity: 0.3,
  strokeColor: '#0369A1',
  strokeWidth: 2,
  defaultVisible: false,
  interactive: false,
  legendItems: [{ label: 'TIF District', color: '#0EA5E9' }],
  dataSource: 'Milwaukee GIS - TIF Districts',
}

/**
 * Opportunity Zones Layer (Layer 9)
 * Federal Opportunity Zone designations
 */
export const OPPORTUNITY_ZONES_LAYER_CONFIG: ESRILayerConfig = {
  id: 'opportunityZones',
  name: 'Opportunity Zones',
  description: 'Federal Qualified Opportunity Zones',
  url: `${MILWAUKEE_GIS_BASE_URL}/planning/special_districts/MapServer`,
  layerNumber: 9,
  color: '#F59E0B',
  fillOpacity: 0.25,
  strokeColor: '#D97706',
  strokeWidth: 2,
  defaultVisible: false,
  interactive: false,
  legendItems: [{ label: 'Opportunity Zone', color: '#F59E0B' }],
  dataSource: 'Milwaukee GIS - Opportunity Zones',
}

/**
 * Historic Districts Layer (Layer 17)
 * Local and national historic districts
 */
export const HISTORIC_LAYER_CONFIG: ESRILayerConfig = {
  id: 'historic',
  name: 'Historic Districts',
  description: 'Local and national historic districts',
  url: `${MILWAUKEE_GIS_BASE_URL}/planning/special_districts/MapServer`,
  layerNumber: 17,
  color: '#A16207',
  fillOpacity: 0.25,
  strokeColor: '#854D0E',
  strokeWidth: 2,
  defaultVisible: false,
  interactive: false,
  legendItems: [{ label: 'Historic District', color: '#A16207' }],
  dataSource: 'Milwaukee GIS - Historic Districts',
}

/**
 * ARB Areas Layer (Layer 1)
 * Architectural Review Board areas
 */
export const ARB_LAYER_CONFIG: ESRILayerConfig = {
  id: 'arb',
  name: 'ARB Areas',
  description: 'Architectural Review Board overlay areas',
  url: `${MILWAUKEE_GIS_BASE_URL}/planning/special_districts/MapServer`,
  layerNumber: 1,
  color: '#EC4899',
  fillOpacity: 0.2,
  strokeColor: '#BE185D',
  strokeWidth: 2,
  defaultVisible: false,
  interactive: false,
  legendItems: [{ label: 'ARB Area', color: '#EC4899' }],
  dataSource: 'Milwaukee GIS - ARB Areas',
}

/**
 * City-Owned Lots Layer (Layer 5 - Municipal properties)
 * Properties owned by the City of Milwaukee
 */
export const CITY_OWNED_LAYER_CONFIG: ESRILayerConfig = {
  id: 'cityOwned',
  name: 'City-Owned Lots',
  description: 'Properties owned by the City of Milwaukee',
  url: `${MILWAUKEE_GIS_BASE_URL}/property/govt_owned/MapServer`,
  layerNumber: 5,
  color: '#10B981',
  fillOpacity: 0.4,
  strokeColor: '#047857',
  strokeWidth: 2,
  defaultVisible: false,
  interactive: true,
  legendItems: [{ label: 'City-Owned Property', color: '#10B981' }],
  dataSource: 'Milwaukee GIS - City-Owned Properties',
}

// =============================================================================
// Homes Layer Configuration (Non-ESRI, Convex data)
// =============================================================================

/**
 * Homes For Sale Layer
 * Properties from Homes MKE program via Convex
 * Uses circle markers instead of fill polygons
 */
export const HOMES_LAYER_CONFIG: HomesLayerConfig = {
  id: 'homes',
  name: 'Homes For Sale',
  description: 'Homes for sale from Homes MKE program',
  color: '#0ea5e9', // sky-500
  highlightColor: '#f59e0b', // amber-500
  circleRadius: 8,
  highlightRadius: 12,
  strokeColor: '#ffffff',
  strokeWidth: 2,
  defaultVisible: true,
  interactive: true,
  legendItems: [
    { label: 'Home For Sale', color: '#0ea5e9' },
    { label: 'Selected', color: '#f59e0b' },
  ],
  dataSource: 'Homes MKE - City of Milwaukee',
}

/**
 * Commercial Properties Layer Config
 * Properties from Browse.ai scraping via Convex
 */
export interface CommercialLayerConfig {
  id: 'commercialProperties'
  name: string
  description: string
  color: string
  highlightColor: string
  circleRadius: number
  highlightRadius: number
  strokeColor: string
  strokeWidth: number
  defaultVisible: boolean
  interactive: boolean
  legendItems: LegendItem[]
  dataSource: string
}

export const COMMERCIAL_LAYER_CONFIG: CommercialLayerConfig = {
  id: 'commercialProperties',
  name: 'Commercial Properties',
  description: 'Commercial real estate for sale',
  color: '#a855f7', // purple-500
  highlightColor: '#f59e0b', // amber-500
  circleRadius: 8,
  highlightRadius: 12,
  strokeColor: '#ffffff',
  strokeWidth: 2,
  defaultVisible: false,
  interactive: true,
  legendItems: [
    { label: 'Commercial Property', color: '#a855f7' },
    { label: 'Selected', color: '#f59e0b' },
  ],
  dataSource: 'Browse.ai Scraping',
}

/**
 * Development Sites Layer Config
 * Development opportunity sites from Browse.ai scraping
 */
export interface DevelopmentSitesLayerConfig {
  id: 'developmentSites'
  name: string
  description: string
  color: string
  highlightColor: string
  circleRadius: number
  highlightRadius: number
  strokeColor: string
  strokeWidth: number
  defaultVisible: boolean
  interactive: boolean
  legendItems: LegendItem[]
  dataSource: string
}

export const DEVELOPMENT_SITES_LAYER_CONFIG: DevelopmentSitesLayerConfig = {
  id: 'developmentSites',
  name: 'Development Sites',
  description: 'Development opportunity sites with incentives',
  color: '#22c55e', // green-500
  highlightColor: '#f59e0b', // amber-500
  circleRadius: 10,
  highlightRadius: 14,
  strokeColor: '#ffffff',
  strokeWidth: 2,
  defaultVisible: false,
  interactive: true,
  legendItems: [
    { label: 'Development Site', color: '#22c55e' },
    { label: 'Selected', color: '#f59e0b' },
  ],
  dataSource: 'Browse.ai Scraping',
}

/**
 * All ESRI layer configurations in display order
 */
export const ALL_LAYER_CONFIGS: ESRILayerConfig[] = [
  ZONING_LAYER_CONFIG,
  PARCELS_LAYER_CONFIG,
  TIF_LAYER_CONFIG,
  OPPORTUNITY_ZONES_LAYER_CONFIG,
  HISTORIC_LAYER_CONFIG,
  ARB_LAYER_CONFIG,
  CITY_OWNED_LAYER_CONFIG,
]

/**
 * Get layer configuration by ID
 * @param layerId - Layer identifier
 * @returns Layer configuration or undefined
 */
export function getLayerConfig(layerId: LayerType): ESRILayerConfig | HomesLayerConfig | CommercialLayerConfig | DevelopmentSitesLayerConfig | undefined {
  if (layerId === 'homes') {
    return HOMES_LAYER_CONFIG
  }
  if (layerId === 'commercialProperties') {
    return COMMERCIAL_LAYER_CONFIG
  }
  if (layerId === 'developmentSites') {
    return DEVELOPMENT_SITES_LAYER_CONFIG
  }
  return ALL_LAYER_CONFIGS.find((config) => config.id === layerId)
}
