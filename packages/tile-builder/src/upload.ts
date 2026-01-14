/**
 * Cloudflare R2 Upload
 * Uploads PMTiles to Cloudflare R2 for serving
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { createReadStream, statSync, existsSync } from 'fs'
import { join } from 'path'
import { R2_CONFIG, TILES_DIR, PMTILES_FILENAME } from './config.js'

/**
 * Create S3-compatible client for Cloudflare R2
 */
function createR2Client(): S3Client {
  if (!R2_CONFIG.accountId || !R2_CONFIG.accessKeyId || !R2_CONFIG.secretAccessKey) {
    throw new Error(
      'Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables.'
    )
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_CONFIG.accessKeyId,
      secretAccessKey: R2_CONFIG.secretAccessKey,
    },
  })
}

/**
 * Upload PMTiles file to R2
 */
export async function uploadToR2(
  onProgress?: (message: string) => void
): Promise<string> {
  const filePath = join(TILES_DIR, PMTILES_FILENAME)

  if (!existsSync(filePath)) {
    throw new Error(`PMTiles file not found: ${filePath}. Run 'tiles' command first.`)
  }

  const client = createR2Client()
  const fileStats = statSync(filePath)
  const fileSizeMB = (fileStats.size / 1024 / 1024).toFixed(2)

  onProgress?.(`Uploading ${PMTILES_FILENAME} (${fileSizeMB} MB) to R2...`)

  const fileStream = createReadStream(filePath)

  const command = new PutObjectCommand({
    Bucket: R2_CONFIG.bucket,
    Key: PMTILES_FILENAME,
    Body: fileStream,
    ContentType: 'application/x-protobuf',
    // Add cache headers for CDN
    CacheControl: 'public, max-age=604800', // 1 week cache
    Metadata: {
      'uploaded-at': new Date().toISOString(),
    },
  })

  await client.send(command)

  // Construct public URL
  const publicUrl = R2_CONFIG.publicUrl
    ? `${R2_CONFIG.publicUrl}/${PMTILES_FILENAME}`
    : `https://${R2_CONFIG.bucket}.${R2_CONFIG.accountId}.r2.cloudflarestorage.com/${PMTILES_FILENAME}`

  onProgress?.(`Upload complete: ${publicUrl}`)

  return publicUrl
}

/**
 * Check if PMTiles exists in R2
 */
export async function checkR2Status(): Promise<{
  exists: boolean
  lastModified?: Date
  size?: number
}> {
  try {
    const client = createR2Client()

    const command = new HeadObjectCommand({
      Bucket: R2_CONFIG.bucket,
      Key: PMTILES_FILENAME,
    })

    const response = await client.send(command)

    return {
      exists: true,
      lastModified: response.LastModified,
      size: response.ContentLength,
    }
  } catch (err) {
    return { exists: false }
  }
}

/**
 * Generate the PMTiles URL for use in MapLibre/Mapbox
 */
export function getPMTilesUrl(): string {
  if (R2_CONFIG.publicUrl) {
    return `pmtiles://${R2_CONFIG.publicUrl}/${PMTILES_FILENAME}`
  }

  // For development, use local file
  return `pmtiles://${join(process.cwd(), TILES_DIR, PMTILES_FILENAME)}`
}
