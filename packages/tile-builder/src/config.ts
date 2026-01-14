/**
 * Milwaukee ESRI Layer Configuration
 * All layer URLs and metadata for tile generation
 */

export interface LayerConfig {
  /** Unique layer identifier */
  id: string
  /** Display name */
  name: string
  /** Full ESRI REST URL */
  url: string
  /** Output filename (without extension) */
  filename: string
  /** Min zoom level for tiles */
  minZoom: number
  /** Max zoom level for tiles */
  maxZoom: number
  /** Fields to include (empty = all) */
  outFields: string[]
  /** Whether this layer has many features (needs aggressive simplification) */
  highDensity: boolean
}

const ESRI_BASE = 'https://milwaukeemaps.milwaukee.gov/arcgis/rest/services'

export const LAYER_CONFIGS: LayerConfig[] = [
  {
    id: 'zoning',
    name: 'Zoning Districts',
    url: `${ESRI_BASE}/planning/zoning/MapServer/11`,
    filename: 'zoning',
    minZoom: 10,
    maxZoom: 16,
    outFields: ['*'], // Get all fields - Zoning, ZoningCategory, ZoningType
    highDensity: false,
  },
  {
    id: 'parcels',
    name: 'Parcels (MPROP)',
    url: `${ESRI_BASE}/property/parcels_mprop/MapServer/2`,
    filename: 'parcels',
    minZoom: 13, // Only show at higher zoom due to density
    maxZoom: 18,
    outFields: ['*'], // Get all fields
    highDensity: true, // ~150k features
  },
  {
    id: 'tif',
    name: 'TIF Districts',
    url: `${ESRI_BASE}/planning/special_districts/MapServer/8`,
    filename: 'tif',
    minZoom: 10,
    maxZoom: 16,
    outFields: ['*'], // Get all fields
    highDensity: false,
  },
  {
    id: 'opportunity-zones',
    name: 'Opportunity Zones',
    url: `${ESRI_BASE}/planning/special_districts/MapServer/9`,
    filename: 'opportunity-zones',
    minZoom: 10,
    maxZoom: 16,
    outFields: ['*'],
    highDensity: false,
  },
  {
    id: 'historic',
    name: 'Historic Districts',
    url: `${ESRI_BASE}/planning/special_districts/MapServer/17`,
    filename: 'historic',
    minZoom: 10,
    maxZoom: 16,
    outFields: ['*'],
    highDensity: false,
  },
  {
    id: 'arb',
    name: 'ARB Areas',
    url: `${ESRI_BASE}/planning/special_districts/MapServer/1`,
    filename: 'arb',
    minZoom: 10,
    maxZoom: 16,
    outFields: ['*'],
    highDensity: false,
  },
  {
    id: 'city-owned',
    name: 'City-Owned Lots',
    url: `${ESRI_BASE}/property/govt_owned/MapServer/5`,
    filename: 'city-owned',
    minZoom: 12,
    maxZoom: 16,
    outFields: ['*'],
    highDensity: false,
  },
]

/**
 * Output directories
 */
export const OUTPUT_DIR = './output'
export const GEOJSON_DIR = `${OUTPUT_DIR}/geojson`
export const TILES_DIR = `${OUTPUT_DIR}/tiles`

/**
 * Cloudflare R2 configuration
 */
export const R2_CONFIG = {
  bucket: process.env.R2_BUCKET || 'mkedev-tiles',
  accountId: process.env.R2_ACCOUNT_ID || '',
  accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  publicUrl: process.env.R2_PUBLIC_URL || '',
}

/**
 * PMTiles output filename
 */
export const PMTILES_FILENAME = 'milwaukee.pmtiles'
