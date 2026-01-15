/**
 * Wrapper for mapbox-pmtiles that imports from the compiled dist
 * instead of the TypeScript source (which causes build issues)
 */

// @ts-expect-error - Import from dist to avoid TypeScript source compilation issues
import { PmTilesSource as DistPmTilesSource } from 'mapbox-pmtiles/dist/mapbox-pmtiles.js'

export interface PMTilesHeader {
  minZoom: number
  maxZoom: number
  tileType: number
  centerZoom: number
  centerLon: number
  centerLat: number
}

export const PmTilesSource = DistPmTilesSource as {
  SOURCE_TYPE: string
  getHeader(url: string): Promise<PMTilesHeader>
}
