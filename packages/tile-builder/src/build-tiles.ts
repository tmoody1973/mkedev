/**
 * Tile Builder
 * Generates PMTiles from GeoJSON using tippecanoe
 */

import { spawn } from 'child_process'
import { existsSync, mkdirSync, readdirSync, statSync, readFileSync } from 'fs'
import { join } from 'path'
import type { LayerConfig } from './config.js'
import { GEOJSON_DIR, TILES_DIR, PMTILES_FILENAME } from './config.js'

/**
 * Check if tippecanoe is installed
 */
export async function checkTippecanoe(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('tippecanoe', ['--version'], { stdio: 'pipe' })
    child.on('close', (code) => resolve(code === 0))
    child.on('error', () => resolve(false))
  })
}

/**
 * Build PMTiles from GeoJSON files using tippecanoe
 */
export async function buildTiles(
  configs: LayerConfig[],
  onProgress?: (message: string) => void
): Promise<string> {
  // Check tippecanoe is installed
  const hasTippecanoe = await checkTippecanoe()
  if (!hasTippecanoe) {
    throw new Error(
      'tippecanoe is not installed. Install with: brew install tippecanoe (macOS) or see https://github.com/felt/tippecanoe'
    )
  }

  // Ensure tiles output directory exists
  if (!existsSync(TILES_DIR)) {
    mkdirSync(TILES_DIR, { recursive: true })
  }

  const outputPath = join(TILES_DIR, PMTILES_FILENAME)

  // Build tippecanoe arguments
  const args: string[] = [
    '-o', outputPath,
    '--force', // Overwrite existing file
    '--no-feature-limit', // Don't limit features per tile
    '--no-tile-size-limit', // Don't limit tile size (we'll handle with simplification)
    '--detect-shared-borders', // Better polygon rendering
    '--coalesce-densest-as-needed', // Smart simplification
    '--extend-zooms-if-still-dropping', // Extend zoom if losing features
  ]

  // Add each layer
  for (const config of configs) {
    const geojsonPath = join(GEOJSON_DIR, `${config.filename}.geojson`)

    if (!existsSync(geojsonPath)) {
      onProgress?.(`Skipping ${config.name}: GeoJSON file not found`)
      continue
    }

    // Layer-specific options
    const layerArgs = [
      '-L',
      `${config.id}:${geojsonPath}`,
      `-Z${config.minZoom}`, // Min zoom for this layer
      `-z${config.maxZoom}`, // Max zoom for this layer
    ]

    // Add simplification for high-density layers
    if (config.highDensity) {
      layerArgs.push(
        '--simplification=10', // More aggressive simplification
        '--drop-densest-as-needed'
      )
    }

    args.push(...layerArgs)
  }

  onProgress?.('Running tippecanoe...')
  onProgress?.(`Command: tippecanoe ${args.join(' ')}`)

  // Run tippecanoe
  return new Promise((resolve, reject) => {
    const child = spawn('tippecanoe', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (data) => {
      stdout += data.toString()
      onProgress?.(data.toString().trim())
    })

    child.stderr?.on('data', (data) => {
      stderr += data.toString()
      // tippecanoe outputs progress to stderr
      const line = data.toString().trim()
      if (line) onProgress?.(line)
    })

    child.on('close', (code) => {
      if (code === 0) {
        onProgress?.(`PMTiles created: ${outputPath}`)
        resolve(outputPath)
      } else {
        reject(new Error(`tippecanoe failed with code ${code}: ${stderr}`))
      }
    })

    child.on('error', (err) => {
      reject(new Error(`Failed to run tippecanoe: ${err.message}`))
    })
  })
}

/**
 * Get info about existing GeoJSON files
 */
export function getGeoJSONStats(): { layer: string; features: number; size: number }[] {
  if (!existsSync(GEOJSON_DIR)) return []

  const stats: { layer: string; features: number; size: number }[] = []
  const files = readdirSync(GEOJSON_DIR).filter((f) => f.endsWith('.geojson'))

  for (const file of files) {
    const path = join(GEOJSON_DIR, file)
    const { size } = statSync(path)
    const content = readFileSync(path, 'utf-8')
    const geojson = JSON.parse(content)

    stats.push({
      layer: file.replace('.geojson', ''),
      features: geojson.features?.length || 0,
      size,
    })
  }

  return stats
}
