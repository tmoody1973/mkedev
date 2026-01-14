#!/usr/bin/env node
/**
 * MKE.dev Tile Builder CLI
 * Converts Milwaukee ESRI GIS data to PMTiles for high-performance mapping
 *
 * Usage:
 *   pnpm --filter @mkedev/tile-builder export   # Export ESRI to GeoJSON
 *   pnpm --filter @mkedev/tile-builder tiles    # Build PMTiles from GeoJSON
 *   pnpm --filter @mkedev/tile-builder upload   # Upload to Cloudflare R2
 *   pnpm --filter @mkedev/tile-builder all      # Run full pipeline
 */

import { program } from 'commander'
import ora from 'ora'
import { LAYER_CONFIGS, OUTPUT_DIR } from './config.js'
import { exportAllLayers, exportLayer } from './export-layer.js'
import { buildTiles, checkTippecanoe, getGeoJSONStats } from './build-tiles.js'
import { uploadToR2, checkR2Status, getPMTilesUrl } from './upload.js'

program
  .name('tile-builder')
  .description('Convert Milwaukee ESRI GIS data to PMTiles')
  .version('0.1.0')

/**
 * Export command - Download ESRI data to GeoJSON
 */
program
  .command('export')
  .description('Export all ESRI layers to GeoJSON files')
  .option('-l, --layer <id>', 'Export specific layer by ID')
  .action(async (options) => {
    const spinner = ora('Starting export...').start()

    try {
      if (options.layer) {
        const config = LAYER_CONFIGS.find((c) => c.id === options.layer)
        if (!config) {
          spinner.fail(`Unknown layer: ${options.layer}`)
          console.log('Available layers:', LAYER_CONFIGS.map((c) => c.id).join(', '))
          process.exit(1)
        }

        await exportLayer(config, (msg) => {
          spinner.text = msg
        })
      } else {
        await exportAllLayers(LAYER_CONFIGS, (msg) => {
          spinner.text = msg
        })
      }

      spinner.succeed('Export complete!')

      // Show stats
      const stats = getGeoJSONStats()
      console.log('\nExported layers:')
      for (const stat of stats) {
        const sizeMB = (stat.size / 1024 / 1024).toFixed(2)
        console.log(`  ${stat.layer}: ${stat.features.toLocaleString()} features (${sizeMB} MB)`)
      }
    } catch (err) {
      spinner.fail(`Export failed: ${err instanceof Error ? err.message : err}`)
      process.exit(1)
    }
  })

/**
 * Tiles command - Build PMTiles from GeoJSON
 */
program
  .command('tiles')
  .description('Build PMTiles from exported GeoJSON files')
  .action(async () => {
    const spinner = ora('Checking tippecanoe...').start()

    try {
      const hasTippecanoe = await checkTippecanoe()
      if (!hasTippecanoe) {
        spinner.fail('tippecanoe is not installed')
        console.log('\nInstall tippecanoe:')
        console.log('  macOS: brew install tippecanoe')
        console.log('  Linux: See https://github.com/felt/tippecanoe#installation')
        process.exit(1)
      }

      spinner.text = 'Building tiles...'

      await buildTiles(LAYER_CONFIGS, (msg) => {
        spinner.text = msg
      })

      spinner.succeed('Tiles built successfully!')
    } catch (err) {
      spinner.fail(`Tile build failed: ${err instanceof Error ? err.message : err}`)
      process.exit(1)
    }
  })

/**
 * Upload command - Upload PMTiles to Cloudflare R2
 */
program
  .command('upload')
  .description('Upload PMTiles to Cloudflare R2')
  .action(async () => {
    const spinner = ora('Uploading to R2...').start()

    try {
      const url = await uploadToR2((msg) => {
        spinner.text = msg
      })

      spinner.succeed('Upload complete!')
      console.log(`\nPMTiles URL: ${url}`)
      console.log(`MapLibre URL: pmtiles://${url}`)
    } catch (err) {
      spinner.fail(`Upload failed: ${err instanceof Error ? err.message : err}`)
      process.exit(1)
    }
  })

/**
 * All command - Run full pipeline
 */
program
  .command('all')
  .description('Run full pipeline: export → tiles → upload')
  .option('--skip-upload', 'Skip upload to R2')
  .action(async (options) => {
    console.log('🗺️  MKE.dev Tile Builder')
    console.log('========================\n')

    const spinner = ora()

    try {
      // Step 1: Export
      spinner.start('Step 1/3: Exporting ESRI layers to GeoJSON...')
      await exportAllLayers(LAYER_CONFIGS, (msg) => {
        spinner.text = `Export: ${msg}`
      })
      spinner.succeed('Step 1/3: Export complete')

      // Step 2: Build tiles
      spinner.start('Step 2/3: Building PMTiles...')
      await buildTiles(LAYER_CONFIGS, (msg) => {
        spinner.text = `Tiles: ${msg}`
      })
      spinner.succeed('Step 2/3: Tiles built')

      // Step 3: Upload (optional)
      if (!options.skipUpload) {
        spinner.start('Step 3/3: Uploading to R2...')
        const url = await uploadToR2((msg) => {
          spinner.text = `Upload: ${msg}`
        })
        spinner.succeed('Step 3/3: Upload complete')
        console.log(`\n✅ PMTiles available at: ${url}`)
      } else {
        spinner.info('Step 3/3: Upload skipped')
        console.log(`\n✅ PMTiles available locally at: ${OUTPUT_DIR}/tiles/milwaukee.pmtiles`)
      }

      console.log('\n🎉 Pipeline complete!')
    } catch (err) {
      spinner.fail(`Pipeline failed: ${err instanceof Error ? err.message : err}`)
      process.exit(1)
    }
  })

/**
 * Status command - Check current state
 */
program
  .command('status')
  .description('Check status of local files and R2')
  .action(async () => {
    console.log('📊 Tile Builder Status\n')

    // Local GeoJSON
    console.log('Local GeoJSON files:')
    const stats = getGeoJSONStats()
    if (stats.length === 0) {
      console.log('  (none - run "export" first)')
    } else {
      for (const stat of stats) {
        const sizeMB = (stat.size / 1024 / 1024).toFixed(2)
        console.log(`  ${stat.layer}: ${stat.features.toLocaleString()} features (${sizeMB} MB)`)
      }
    }

    // R2 Status
    console.log('\nCloudflare R2:')
    try {
      const r2Status = await checkR2Status()
      if (r2Status.exists) {
        const sizeMB = ((r2Status.size || 0) / 1024 / 1024).toFixed(2)
        console.log(`  milwaukee.pmtiles: ${sizeMB} MB`)
        console.log(`  Last modified: ${r2Status.lastModified?.toISOString()}`)
      } else {
        console.log('  (not uploaded - run "upload" first)')
      }
    } catch (err) {
      console.log('  (R2 credentials not configured)')
    }

    console.log('\nPMTiles URL:', getPMTilesUrl())
  })

program.parse()
