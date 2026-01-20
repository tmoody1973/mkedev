"use node";

/**
 * Vacant Lots ESRI MapServer Sync Action
 *
 * Fetches city-owned vacant lot data from the Strong Neighborhoods ESRI MapServer,
 * and syncs to the Convex database.
 *
 * ESRI Source: https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/StrongNeighborhood/StrongNeighborhood/MapServer/1
 */

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

// =============================================================================
// Constants
// =============================================================================

const ESRI_BASE_URL =
  "https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/StrongNeighborhood/StrongNeighborhood/MapServer/1";

const MAX_RECORDS_PER_REQUEST = 1000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// =============================================================================
// Types
// =============================================================================

interface ESRIFeatureAttributes {
  OBJECTID: number;
  TAXKEY: string | null;
  COMBINEDADDRESS: string | null;
  NEIGHBORHOOD: string | null;
  ZONING: string | null;
  PROPERTYTYPE: string | null;
  DISPOSITIONSTATUS: string | null;
  DISPOSITIONSTRATEGY: string | null;
  ALDERMANICDISTRICT: number | null;
  ACQUISITIONDATE: number | null; // Unix timestamp in milliseconds
  CURRENTOWNER: string | null;
  LOTSIZE: number | null; // Lot size in square feet if available
  // Common variations in field names
  Taxkey?: string | null;
  CombinedAddress?: string | null;
  Neighborhood?: string | null;
  Zoning?: string | null;
  PropertyType?: string | null;
  DispositionStatus?: string | null;
  DispositionStrategy?: string | null;
  AldermanicDistrict?: number | null;
  AcquisitionDate?: number | null;
  CurrentOwner?: string | null;
  LotSize?: number | null;
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
  error?: {
    code: number;
    message: string;
    details?: string[];
  };
}

interface VacantLotData {
  esriObjectId: string;
  taxKey: string;
  address: string;
  neighborhood?: string;
  coordinates: number[];
  zoning?: string;
  propertyType?: string;
  aldermanicDistrict?: number;
  lotSizeSqFt?: number;
  dispositionStatus?: string;
  dispositionStrategy?: string;
  acquisitionDate?: string;
  currentOwner?: string;
  status: "available" | "pending" | "sold" | "unknown";
  lastSyncedAt: number;
  createdAt: number;
  updatedAt: number;
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
 * Map ESRI DispositionStatus to our status enum
 */
function mapDispositionStatus(
  status: string | null | undefined
): "available" | "pending" | "sold" | "unknown" {
  if (!status) return "unknown";
  const normalized = status.toLowerCase().trim();

  // Available statuses
  if (
    normalized === "available" ||
    normalized === "for sale" ||
    normalized === "active" ||
    normalized.includes("available")
  ) {
    return "available";
  }

  // Pending statuses
  if (
    normalized === "pending" ||
    normalized === "under contract" ||
    normalized === "offer pending" ||
    normalized.includes("pending")
  ) {
    return "pending";
  }

  // Sold statuses
  if (
    normalized === "sold" ||
    normalized === "closed" ||
    normalized === "transferred" ||
    normalized.includes("sold")
  ) {
    return "sold";
  }

  return "unknown";
}

/**
 * Format acquisition date from Unix timestamp to ISO string
 */
function formatAcquisitionDate(
  timestamp: number | null | undefined
): string | undefined {
  if (!timestamp) return undefined;
  try {
    return new Date(timestamp).toISOString().split("T")[0];
  } catch {
    return undefined;
  }
}

/**
 * Get attribute value handling case variations
 */
function getAttr<T>(
  attrs: ESRIFeatureAttributes,
  upperKey: keyof ESRIFeatureAttributes,
  mixedKey: keyof ESRIFeatureAttributes
): T | null {
  return (attrs[upperKey] ?? attrs[mixedKey] ?? null) as T | null;
}

/**
 * Transform ESRI feature to our schema format
 */
function transformFeature(
  feature: ESRIFeature,
  syncTimestamp: number
): VacantLotData | null {
  const attrs = feature.attributes;
  const geometry = feature.geometry;

  // Skip features without geometry
  if (!geometry || (geometry.x === 0 && geometry.y === 0)) {
    return null;
  }

  // Get coordinates (already in WGS84 when using outSR=4326)
  const lng = geometry.x;
  const lat = geometry.y;

  // Validate coordinates are in Milwaukee area
  // Milwaukee: ~43.0 lat, ~-87.9 lng
  if (lat < 42.5 || lat > 44.0 || lng < -89.0 || lng > -87.0) {
    console.warn(
      `Invalid coordinates for OBJECTID ${attrs.OBJECTID}: [${lng}, ${lat}]`
    );
    return null;
  }

  const taxKey =
    getAttr<string>(attrs, "TAXKEY", "Taxkey") || String(attrs.OBJECTID);
  const address =
    getAttr<string>(attrs, "COMBINEDADDRESS", "CombinedAddress") ||
    "Unknown Address";
  const neighborhood = getAttr<string>(attrs, "NEIGHBORHOOD", "Neighborhood");
  const zoning = getAttr<string>(attrs, "ZONING", "Zoning");
  const propertyType = getAttr<string>(attrs, "PROPERTYTYPE", "PropertyType");
  const dispositionStatus = getAttr<string>(
    attrs,
    "DISPOSITIONSTATUS",
    "DispositionStatus"
  );
  const dispositionStrategy = getAttr<string>(
    attrs,
    "DISPOSITIONSTRATEGY",
    "DispositionStrategy"
  );
  const aldermanicDistrict = getAttr<number>(
    attrs,
    "ALDERMANICDISTRICT",
    "AldermanicDistrict"
  );
  const acquisitionDateRaw = getAttr<number>(
    attrs,
    "ACQUISITIONDATE",
    "AcquisitionDate"
  );
  const currentOwner = getAttr<string>(attrs, "CURRENTOWNER", "CurrentOwner");
  const lotSize = getAttr<number>(attrs, "LOTSIZE", "LotSize");

  return {
    esriObjectId: String(attrs.OBJECTID),
    taxKey,
    address,
    neighborhood: neighborhood || undefined,
    coordinates: [lng, lat],
    zoning: zoning || undefined,
    propertyType: propertyType || undefined,
    aldermanicDistrict: aldermanicDistrict || undefined,
    lotSizeSqFt: lotSize || undefined,
    dispositionStatus: dispositionStatus || undefined,
    dispositionStrategy: dispositionStrategy || undefined,
    acquisitionDate: formatAcquisitionDate(acquisitionDateRaw),
    currentOwner: currentOwner || undefined,
    status: mapDispositionStatus(dispositionStatus),
    lastSyncedAt: syncTimestamp,
    createdAt: syncTimestamp,
    updatedAt: syncTimestamp,
  };
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
        throw new Error(
          `ESRI Error: ${data.error.message || JSON.stringify(data.error)}`
        );
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
      outSR: "4326", // Request WGS84 coordinates
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
    console.log("Starting Vacant Lots sync from ESRI MapServer...");

    try {
      // Fetch all features
      const features = await fetchAllFeatures();
      const syncTimestamp = Date.now();

      // Transform features
      const transformedLots: VacantLotData[] = [];
      const syncedObjectIds: string[] = [];
      const seenTaxKeys = new Set<string>();

      for (const feature of features) {
        const transformed = transformFeature(feature, syncTimestamp);
        if (transformed) {
          // Deduplicate by taxKey, keeping the first (most recent from ESRI)
          if (!seenTaxKeys.has(transformed.taxKey)) {
            seenTaxKeys.add(transformed.taxKey);
            transformedLots.push(transformed);
            syncedObjectIds.push(transformed.esriObjectId);
          }
        }
      }

      console.log(
        `Transformed ${transformedLots.length} of ${features.length} features (${features.length - transformedLots.length} skipped/deduplicated)`
      );

      // Batch upsert to database (Convex has limits on mutation size)
      const BATCH_SIZE = 100;
      let totalInserted = 0;
      let totalUpdated = 0;
      let totalMarkedSold = 0;

      for (let i = 0; i < transformedLots.length; i += BATCH_SIZE) {
        const batch = transformedLots.slice(i, i + BATCH_SIZE);
        const isLastBatch = i + BATCH_SIZE >= transformedLots.length;

        const result = await ctx.runMutation(
          internal.ingestion.vacantLotsSyncMutations.upsertLots,
          {
            lots: batch,
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
          transformed: transformedLots.length,
          inserted: totalInserted,
          updated: totalUpdated,
          markedSold: totalMarkedSold,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Vacant Lots sync failed:", errorMessage);

      return {
        success: false,
        message: `Sync failed: ${errorMessage}`,
      };
    }
  },
});
