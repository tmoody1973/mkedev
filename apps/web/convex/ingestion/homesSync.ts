"use node";

/**
 * Homes MKE ESRI FeatureServer Sync Action
 *
 * Fetches property data from the Homes_MKE_Properties ESRI FeatureServer,
 * converts UTM coordinates to WGS84, and syncs to the Convex database.
 *
 * ESRI Source: https://services1.arcgis.com/5ly0cVV70qsN8Soc/arcgis/rest/services/Homes_MKE_Properties/FeatureServer/0
 */

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import proj4 from "proj4";

// =============================================================================
// Constants
// =============================================================================

const ESRI_BASE_URL =
  "https://services1.arcgis.com/5ly0cVV70qsN8Soc/arcgis/rest/services/Homes_MKE_Properties/FeatureServer/0";

const MAX_RECORDS_PER_REQUEST = 2000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Wisconsin South State Plane (EPSG:32054) - Lambert Conformal Conic
// Used by Milwaukee's ESRI services
const EPSG_32054 =
  "+proj=lcc +lat_1=45.5 +lat_2=42.73333333333333 +lat_0=42 +lon_0=-90 +x_0=600000 +y_0=0 +datum=NAD83 +units=us-ft +no_defs";

// Register the projection
proj4.defs("EPSG:32054", EPSG_32054);

// =============================================================================
// Types
// =============================================================================

interface ESRIFeatureAttributes {
  OBJECTID_1: number;
  ObjectId: number;
  FK_Tax: number | null;
  ADDRESSES: string | null;
  NEIGHBORHOOD_1: string | null;
  NumberOfBedrooms: number | null;
  NumberOfFullBaths: number | null;
  NumberOfHalfBaths: number | null;
  Bldg_SF: number | null;
  Built: number | null;
  Property_Status: string | null;
  Narrative: string | null;
  Link: string | null;
  Developer_Name: string | null;
}

interface ESRIFeature {
  attributes: ESRIFeatureAttributes;
  geometry: {
    x: number;
    y: number;
  } | null;
}

interface ESRIQueryResponse {
  features: ESRIFeature[];
  exceededTransferLimit?: boolean;
}

interface HomeForSaleData {
  esriObjectId: string;
  taxKey: string;
  address: string;
  neighborhood: string;
  coordinates: number[];
  bedrooms: number;
  fullBaths: number;
  halfBaths: number;
  buildingSqFt: number;
  yearBuilt: number;
  status: "for_sale" | "sold" | "unknown";
  narrative?: string;
  listingUrl?: string;
  developerName?: string;
  imageUrls?: string[];
  primaryImageUrl?: string;
  lastSyncedAt: number;
  createdAt: number;
  updatedAt: number;
}

interface ESRIAttachment {
  id: number;
  name: string;
  contentType: string;
  size: number;
}

interface ESRIAttachmentsResponse {
  attachmentInfos?: ESRIAttachment[];
}

interface SyncResult {
  success: boolean;
  message: string;
  stats?: {
    fetched: number;
    transformed: number;
    inserted: number;
    updated: number;
    markedSold: number;
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert UTM coordinates (EPSG:32054) to WGS84 (EPSG:4326)
 */
function convertToWGS84(utmX: number, utmY: number): [number, number] {
  const [lng, lat] = proj4("EPSG:32054", "EPSG:4326", [utmX, utmY]);
  return [lng, lat];
}

/**
 * Map ESRI Property_Status to our status enum
 */
function mapPropertyStatus(
  status: string | null
): "for_sale" | "sold" | "unknown" {
  if (!status) return "unknown";
  const normalized = status.toLowerCase().trim();
  if (normalized === "for sale" || normalized === "available") return "for_sale";
  if (normalized === "sold" || normalized === "closed") return "sold";
  return "unknown";
}

/**
 * Transform ESRI feature to our schema format
 */
function transformFeature(
  feature: ESRIFeature,
  syncTimestamp: number
): HomeForSaleData | null {
  const attrs = feature.attributes;
  const geometry = feature.geometry;

  // Skip features without geometry
  if (!geometry || geometry.x === 0 || geometry.y === 0) {
    return null;
  }

  // Convert coordinates
  const [lng, lat] = convertToWGS84(geometry.x, geometry.y);

  // Validate converted coordinates are in Milwaukee area
  // Milwaukee: ~43.0 lat, ~-87.9 lng
  if (lat < 42.5 || lat > 44.0 || lng < -89.0 || lng > -87.0) {
    console.warn(
      `Invalid coordinates for OBJECTID ${attrs.OBJECTID_1}: [${lng}, ${lat}]`
    );
    return null;
  }

  return {
    esriObjectId: String(attrs.OBJECTID_1),
    taxKey: attrs.FK_Tax ? String(attrs.FK_Tax) : "",
    address: attrs.ADDRESSES || "Unknown Address",
    neighborhood: attrs.NEIGHBORHOOD_1 || "Unknown",
    coordinates: [lng, lat],
    bedrooms: attrs.NumberOfBedrooms || 0,
    fullBaths: attrs.NumberOfFullBaths || 0,
    halfBaths: attrs.NumberOfHalfBaths || 0,
    buildingSqFt: attrs.Bldg_SF || 0,
    yearBuilt: attrs.Built || 0,
    status: mapPropertyStatus(attrs.Property_Status),
    narrative: attrs.Narrative || undefined,
    listingUrl: attrs.Link || undefined,
    developerName: attrs.Developer_Name || undefined,
    lastSyncedAt: syncTimestamp,
    createdAt: syncTimestamp,
    updatedAt: syncTimestamp,
  };
}

/**
 * Fetch attachments for a specific feature
 * Returns array of image URLs
 */
async function fetchAttachments(objectId: number): Promise<string[]> {
  try {
    const url = `${ESRI_BASE_URL}/${objectId}/attachments?f=json`;
    const response = await fetch(url);

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as ESRIAttachmentsResponse;

    if (!data.attachmentInfos || data.attachmentInfos.length === 0) {
      return [];
    }

    // Filter to only image attachments and build URLs
    const imageAttachments = data.attachmentInfos.filter((att) =>
      att.contentType.startsWith("image/")
    );

    return imageAttachments.map(
      (att) => `${ESRI_BASE_URL}/${objectId}/attachments/${att.id}`
    );
  } catch {
    // Silently fail for attachments - not critical
    return [];
  }
}

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(
  url: string,
  retries: number = MAX_RETRIES
): Promise<ESRIQueryResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Check for ESRI error response
      if (data.error) {
        throw new Error(`ESRI Error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      return data as ESRIQueryResponse;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `Fetch attempt ${attempt + 1}/${retries} failed: ${lastError.message}`
      );

      if (attempt < retries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1))
        );
      }
    }
  }

  throw lastError || new Error("Fetch failed after retries");
}

/**
 * Fetch all features from ESRI with pagination
 */
async function fetchAllFeatures(): Promise<ESRIFeature[]> {
  const allFeatures: ESRIFeature[] = [];
  let resultOffset = 0;
  let hasMore = true;

  while (hasMore) {
    const queryParams = new URLSearchParams({
      where: "1=1", // Get all records
      outFields: "*",
      returnGeometry: "true",
      resultOffset: String(resultOffset),
      resultRecordCount: String(MAX_RECORDS_PER_REQUEST),
      f: "json",
    });

    const url = `${ESRI_BASE_URL}/query?${queryParams}`;
    console.log(`Fetching records starting at offset ${resultOffset}...`);

    const response = await fetchWithRetry(url);

    if (response.features && response.features.length > 0) {
      allFeatures.push(...response.features);
      resultOffset += response.features.length;

      // Check if there are more records
      hasMore =
        response.exceededTransferLimit === true ||
        response.features.length === MAX_RECORDS_PER_REQUEST;
    } else {
      hasMore = false;
    }
  }

  console.log(`Fetched ${allFeatures.length} total features from ESRI`);
  return allFeatures;
}

// =============================================================================
// Main Sync Action
// =============================================================================

export const syncFromESRI = internalAction({
  args: {},
  handler: async (ctx): Promise<SyncResult> => {
    const startTime = Date.now();
    console.log("Starting Homes MKE sync from ESRI FeatureServer...");

    try {
      // Fetch all features
      const features = await fetchAllFeatures();
      const syncTimestamp = Date.now();

      // Transform features
      const transformedHomes: HomeForSaleData[] = [];
      const syncedObjectIds: string[] = [];

      for (const feature of features) {
        const transformed = transformFeature(feature, syncTimestamp);
        if (transformed) {
          transformedHomes.push(transformed);
          syncedObjectIds.push(transformed.esriObjectId);
        }
      }

      console.log(
        `Transformed ${transformedHomes.length} of ${features.length} features`
      );

      // Fetch attachments for each home in parallel (batched to avoid rate limits)
      console.log("Fetching image attachments...");
      const ATTACHMENT_BATCH_SIZE = 10;

      for (let i = 0; i < transformedHomes.length; i += ATTACHMENT_BATCH_SIZE) {
        const batch = transformedHomes.slice(i, i + ATTACHMENT_BATCH_SIZE);

        const attachmentPromises = batch.map(async (home) => {
          const imageUrls = await fetchAttachments(
            parseInt(home.esriObjectId, 10)
          );
          home.imageUrls = imageUrls;
          home.primaryImageUrl = imageUrls.length > 0 ? imageUrls[0] : undefined;
        });

        await Promise.all(attachmentPromises);
      }

      const homesWithImages = transformedHomes.filter(
        (h) => h.imageUrls && h.imageUrls.length > 0
      ).length;
      console.log(`${homesWithImages} homes have images`);

      // Batch upsert to database (Convex has limits on mutation size)
      const BATCH_SIZE = 100;
      let totalInserted = 0;
      let totalUpdated = 0;
      let totalMarkedSold = 0;

      for (let i = 0; i < transformedHomes.length; i += BATCH_SIZE) {
        const batch = transformedHomes.slice(i, i + BATCH_SIZE);
        const isLastBatch = i + BATCH_SIZE >= transformedHomes.length;

        const result = await ctx.runMutation(
          internal.ingestion.homesSyncMutations.upsertHomes,
          {
            homes: batch,
            // Only pass full list of synced IDs on the last batch
            syncedObjectIds: isLastBatch ? syncedObjectIds : [],
          }
        );

        totalInserted += result.inserted;
        totalUpdated += result.updated;
        totalMarkedSold += result.markedSold;
      }

      const duration = Date.now() - startTime;
      const message = `Sync completed in ${duration}ms: ${totalInserted} inserted, ${totalUpdated} updated, ${totalMarkedSold} marked sold`;
      console.log(message);

      return {
        success: true,
        message,
        stats: {
          fetched: features.length,
          transformed: transformedHomes.length,
          inserted: totalInserted,
          updated: totalUpdated,
          markedSold: totalMarkedSold,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Homes MKE sync failed:", errorMessage);

      return {
        success: false,
        message: `Sync failed: ${errorMessage}`,
      };
    }
  },
});
