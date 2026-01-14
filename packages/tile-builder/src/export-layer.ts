/**
 * ESRI Layer Exporter
 * Exports ESRI ArcGIS REST layers to GeoJSON with proper pagination
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { arcgisToGeoJSON } from '@terraformer/arcgis'
import type { LayerConfig } from './config.js'
import { GEOJSON_DIR } from './config.js'

interface EsriFeature {
  attributes: Record<string, unknown>
  geometry: unknown
}

interface EsriQueryResponse {
  features: EsriFeature[]
  exceededTransferLimit?: boolean
  error?: { message: string }
}

interface GeoJSONFeature {
  type: 'Feature'
  geometry: unknown
  properties: Record<string, unknown>
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

/**
 * Query ESRI layer with pagination
 * ESRI services typically limit to 1000-2000 features per request
 */
async function queryWithPagination(
  url: string,
  outFields: string[],
  onProgress?: (count: number) => void
): Promise<EsriFeature[]> {
  const allFeatures: EsriFeature[] = []
  let offset = 0
  const pageSize = 1000 // Safe default for most ESRI services
  let hasMore = true

  while (hasMore) {
    const queryUrl = new URL(`${url}/query`)
    queryUrl.searchParams.set('where', '1=1')
    queryUrl.searchParams.set('outFields', outFields.join(',') || '*')
    queryUrl.searchParams.set('outSR', '4326') // WGS84 for GeoJSON
    queryUrl.searchParams.set('f', 'json')
    queryUrl.searchParams.set('resultOffset', offset.toString())
    queryUrl.searchParams.set('resultRecordCount', pageSize.toString())

    const response = await fetch(queryUrl.toString())

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = (await response.json()) as EsriQueryResponse

    if (data.error) {
      throw new Error(`ESRI Error: ${data.error.message}`)
    }

    const features = data.features || []
    allFeatures.push(...features)

    onProgress?.(allFeatures.length)

    // Check if there are more features
    if (features.length < pageSize || !data.exceededTransferLimit) {
      hasMore = false
    } else {
      offset += pageSize
    }
  }

  return allFeatures
}

/**
 * Convert ESRI features to GeoJSON FeatureCollection
 */
function convertToGeoJSON(features: EsriFeature[]): GeoJSONFeatureCollection {
  const geoJsonFeatures: GeoJSONFeature[] = features
    .map((feature) => {
      try {
        // Convert ESRI geometry to GeoJSON
        const geometry = arcgisToGeoJSON(feature.geometry as Parameters<typeof arcgisToGeoJSON>[0])

        return {
          type: 'Feature' as const,
          geometry,
          properties: feature.attributes,
        }
      } catch (err) {
        console.warn('Failed to convert feature:', err)
        return null
      }
    })
    .filter((f): f is GeoJSONFeature => f !== null)

  return {
    type: 'FeatureCollection',
    features: geoJsonFeatures,
  }
}

/**
 * Export a single ESRI layer to GeoJSON file
 */
export async function exportLayer(
  config: LayerConfig,
  onProgress?: (message: string) => void
): Promise<string> {
  const outputPath = `${GEOJSON_DIR}/${config.filename}.geojson`

  onProgress?.(`Querying ${config.name}...`)

  // Query all features with pagination
  const features = await queryWithPagination(
    config.url,
    config.outFields,
    (count) => onProgress?.(`${config.name}: ${count} features fetched`)
  )

  onProgress?.(`Converting ${features.length} features to GeoJSON...`)

  // Convert to GeoJSON
  const geojson = convertToGeoJSON(features)

  // Ensure output directory exists
  if (!existsSync(GEOJSON_DIR)) {
    mkdirSync(GEOJSON_DIR, { recursive: true })
  }

  // Write to file
  writeFileSync(outputPath, JSON.stringify(geojson))

  onProgress?.(`Saved ${geojson.features.length} features to ${outputPath}`)

  return outputPath
}

/**
 * Export all configured layers to GeoJSON
 */
export async function exportAllLayers(
  configs: LayerConfig[],
  onProgress?: (message: string) => void
): Promise<Map<string, string>> {
  const results = new Map<string, string>()

  for (const config of configs) {
    try {
      const outputPath = await exportLayer(config, onProgress)
      results.set(config.id, outputPath)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      onProgress?.(`ERROR exporting ${config.name}: ${errorMessage}`)
      console.error(`Failed to export ${config.name}:`, err)
    }
  }

  return results
}
