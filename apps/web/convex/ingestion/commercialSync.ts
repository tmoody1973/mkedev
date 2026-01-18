"use node";

/**
 * Commercial Properties & Development Sites Sync Action
 *
 * Fetches property data from Browse.ai robots, geocodes addresses via Mapbox,
 * and syncs to the Convex database.
 *
 * Browse.ai Robots:
 * - Commercial Properties: 019bd1dc-df2e-7747-8e54-142a383e8822
 * - Development Sites: 019bd1ff-bd45-7594-a466-ed701e505915
 */

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

// =============================================================================
// Constants
// =============================================================================

const BROWSE_AI_BASE_URL = "https://api.browse.ai/v2";
const COMMERCIAL_ROBOT_ID = "019bd1dc-df2e-7747-8e54-142a383e8822";
const DEVELOPMENT_SITES_ROBOT_ID = "019bd1ff-bd45-7594-a466-ed701e505915";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const GEOCODE_BATCH_SIZE = 10;

// Milwaukee bounding box for geocoding validation
const MILWAUKEE_BOUNDS = {
  minLat: 42.5,
  maxLat: 44.0,
  minLng: -89.0,
  maxLng: -87.0,
};

// =============================================================================
// Types
// =============================================================================

interface BrowseAiTask {
  id: string;
  status: string;
  createdAt: string;
  finishedAt?: string;
  // Browse.ai uses dynamic list names based on robot configuration
  capturedLists?: Record<string, unknown[]>;
}

interface BrowseAiProperty {
  // Actual field names from Browse.ai robot
  "Property Address"?: string;
  "Property Type"?: string;
  "Square Footage"?: string;
  "Asking Price"?: string;
  "Neighborhood Description"?: string;
  "Listing Sheet Link"?: string;
  "Property Image"?: string;
  "Image Alt Text"?: string;
  "Additional Photos Link"?: string;
  "Assessor Page Link"?: string;
  "Historic Land Use Investigation Link"?: string;
  "Proposal Summary Link"?: string;
  "Proposal Due Date"?: string;
  Position?: string;
}

interface BrowseAiSite {
  // Actual field names from Browse.ai development sites robot
  Address?: string;
  "Asking Price"?: string;
  "Development Type"?: string;
  Neighborhood?: string;
  "Square Footage"?: string;
  "RFP Link"?: string;
  "Property Photo"?: string;
  "Assessor Page Link"?: string;
  "Historical Land Use Link"?: string;
  Position?: string;
}

interface BrowseAiTasksResponse {
  statusCode: number;
  result: {
    robotTasks: {
      items: BrowseAiTask[];
    };
  };
}

interface CommercialPropertyData {
  browseAiTaskId: string;
  address: string;
  coordinates: [number, number];
  propertyType?: "retail" | "office" | "industrial" | "warehouse" | "mixed-use" | "land";
  buildingSqFt?: number;
  lotSizeSqFt?: number;
  zoning?: string;
  askingPrice?: number;
  pricePerSqFt?: number;
  contactInfo?: string;
  listingUrl?: string;
  description?: string;
  status: "available" | "sold" | "pending" | "unknown";
  lastSyncedAt: number;
  createdAt: number;
  updatedAt: number;
}

interface DevelopmentSiteData {
  browseAiTaskId: string;
  address: string;
  coordinates: [number, number];
  siteName?: string;
  lotSizeSqFt?: number;
  zoning?: string;
  currentUse?: string;
  proposedUse?: string;
  askingPrice?: number;
  incentives?: string[];
  contactInfo?: string;
  listingUrl?: string;
  description?: string;
  status: "available" | "sold" | "pending" | "unknown";
  lastSyncedAt: number;
  createdAt: number;
  updatedAt: number;
}

interface SyncResult {
  success: boolean;
  message: string;
  stats?: {
    fetched: number;
    geocoded: number;
    inserted: number;
    updated: number;
    failed: number;
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function getBrowseAiApiKey(): string {
  const apiKey = process.env.BROWSEAI_API_KEY;
  if (!apiKey) {
    throw new Error("BROWSEAI_API_KEY environment variable is not set");
  }
  return apiKey;
}

function getMapboxToken(): string {
  const token = process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    throw new Error("MAPBOX_ACCESS_TOKEN environment variable is not set");
  }
  return token;
}

/**
 * Fetch with retry logic
 */
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Fetch attempt ${attempt}/${retries} failed: ${lastError.message}`);

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
    }
  }

  throw lastError || new Error("Fetch failed after retries");
}

/**
 * Geocode an address using Mapbox API
 */
async function geocodeAddress(
  address: string,
  mapboxToken: string
): Promise<[number, number] | null> {
  try {
    const encodedAddress = encodeURIComponent(`${address}, Milwaukee, WI`);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&bbox=${MILWAUKEE_BOUNDS.minLng},${MILWAUKEE_BOUNDS.minLat},${MILWAUKEE_BOUNDS.maxLng},${MILWAUKEE_BOUNDS.maxLat}&limit=1`;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Geocoding failed for "${address}": HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      console.warn(`No geocoding results for "${address}"`);
      return null;
    }

    const [lng, lat] = data.features[0].center;

    // Validate coordinates are in Milwaukee area
    if (
      lat < MILWAUKEE_BOUNDS.minLat ||
      lat > MILWAUKEE_BOUNDS.maxLat ||
      lng < MILWAUKEE_BOUNDS.minLng ||
      lng > MILWAUKEE_BOUNDS.maxLng
    ) {
      console.warn(`Coordinates outside Milwaukee for "${address}": [${lng}, ${lat}]`);
      return null;
    }

    return [lng, lat];
  } catch (error) {
    console.error(`Geocoding error for "${address}":`, error);
    return null;
  }
}

/**
 * Parse price string to number (e.g., "$500,000" -> 500000)
 */
function parsePrice(priceStr: string | undefined): number | undefined {
  if (!priceStr) return undefined;
  const cleaned = priceStr.replace(/[$,\s]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? undefined : num;
}

/**
 * Parse square footage string to number (e.g., "5,000 sq ft" -> 5000)
 */
function parseSqFt(sqftStr: string | undefined): number | undefined {
  if (!sqftStr) return undefined;
  const cleaned = sqftStr.replace(/[,\s]|sq\.?\s*ft\.?/gi, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? undefined : num;
}

/**
 * Map building type to property type enum
 */
function mapPropertyType(
  buildingType: string | undefined
): CommercialPropertyData["propertyType"] {
  if (!buildingType) return undefined;
  const normalized = buildingType.toLowerCase().trim();

  if (normalized.includes("retail") || normalized.includes("store")) return "retail";
  if (normalized.includes("office")) return "office";
  if (normalized.includes("industrial") || normalized.includes("manufacturing")) return "industrial";
  if (normalized.includes("warehouse") || normalized.includes("distribution")) return "warehouse";
  if (normalized.includes("mixed")) return "mixed-use";
  if (normalized.includes("land") || normalized.includes("lot") || normalized.includes("vacant")) return "land";

  return undefined;
}

/**
 * Parse incentives string to array (e.g., "TIF, Opportunity Zone" -> ["TIF", "Opportunity Zone"])
 */
function parseIncentives(incentivesStr: string | undefined): string[] | undefined {
  if (!incentivesStr) return undefined;
  const incentives = incentivesStr
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return incentives.length > 0 ? incentives : undefined;
}

/**
 * Fetch tasks from Browse.ai robot
 */
async function fetchBrowseAiTasks(robotId: string, apiKey: string): Promise<BrowseAiTask[]> {
  const url = `${BROWSE_AI_BASE_URL}/robots/${robotId}/tasks?page=1`;
  const options: RequestInit = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  };

  const response = await fetchWithRetry<BrowseAiTasksResponse>(url, options);

  if (response.statusCode !== 200) {
    throw new Error(`Browse.ai API error: ${response.statusCode}`);
  }

  return response.result.robotTasks.items.filter(
    (task) => task.status === "successful" && task.capturedLists
  );
}

// =============================================================================
// Sync Actions
// =============================================================================

/**
 * Sync commercial properties from Browse.ai
 */
export const syncCommercialProperties = internalAction({
  args: {},
  handler: async (ctx): Promise<SyncResult> => {
    const startTime = Date.now();
    console.log("Starting Commercial Properties sync from Browse.ai...");

    try {
      const browseAiKey = getBrowseAiApiKey();
      const mapboxToken = getMapboxToken();

      // Fetch tasks from Browse.ai
      const tasks = await fetchBrowseAiTasks(COMMERCIAL_ROBOT_ID, browseAiKey);
      console.log(`Fetched ${tasks.length} completed tasks from Browse.ai`);

      // Extract all properties from tasks
      // Browse.ai uses "Commercial Property Listings" as the list name
      const allProperties: BrowseAiProperty[] = [];
      const taskIdMap = new Map<string, string>(); // address -> taskId

      for (const task of tasks) {
        // Try multiple possible list names
        const capturedLists = task.capturedLists as Record<string, BrowseAiProperty[]> | undefined;
        const properties = capturedLists?.["Commercial Property Listings"] ||
                          capturedLists?.Properties ||
                          [];
        for (const prop of properties) {
          const address = prop["Property Address"];
          if (address) {
            allProperties.push(prop);
            taskIdMap.set(address, task.id);
          }
        }
      }

      console.log(`Found ${allProperties.length} properties to process`);

      // Geocode addresses in batches
      const syncTimestamp = Date.now();
      const transformedProperties: CommercialPropertyData[] = [];
      let geocodedCount = 0;
      let failedCount = 0;

      for (let i = 0; i < allProperties.length; i += GEOCODE_BATCH_SIZE) {
        const batch = allProperties.slice(i, i + GEOCODE_BATCH_SIZE);

        const geocodePromises = batch.map(async (prop) => {
          const address = prop["Property Address"]!;
          const coordinates = await geocodeAddress(address, mapboxToken);

          if (!coordinates) {
            failedCount++;
            return null;
          }

          geocodedCount++;
          const taskId = taskIdMap.get(address) || `unknown-${Date.now()}`;

          return {
            browseAiTaskId: taskId,
            address,
            coordinates,
            propertyType: mapPropertyType(prop["Property Type"]),
            buildingSqFt: parseSqFt(prop["Square Footage"]),
            lotSizeSqFt: undefined, // Not in the scrape
            zoning: undefined, // Not in the scrape
            askingPrice: parsePrice(prop["Asking Price"]),
            pricePerSqFt: undefined, // Not in the scrape
            contactInfo: undefined, // Not in the scrape
            listingUrl: prop["Listing Sheet Link"] || undefined,
            description: prop["Neighborhood Description"] || undefined,
            status: "available" as const,
            lastSyncedAt: syncTimestamp,
            createdAt: syncTimestamp,
            updatedAt: syncTimestamp,
          };
        });

        const results = await Promise.all(geocodePromises);
        for (const r of results) {
          if (r !== null) {
            transformedProperties.push(r);
          }
        }

        // Small delay between batches to avoid rate limits
        if (i + GEOCODE_BATCH_SIZE < allProperties.length) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      console.log(`Geocoded ${geocodedCount} properties, ${failedCount} failed`);

      // Batch upsert to database
      const BATCH_SIZE = 50;
      let totalInserted = 0;
      let totalUpdated = 0;

      for (let i = 0; i < transformedProperties.length; i += BATCH_SIZE) {
        const batch = transformedProperties.slice(i, i + BATCH_SIZE);

        const result = await ctx.runMutation(
          internal.ingestion.commercialSyncMutations.upsertCommercialProperties,
          { properties: batch }
        );

        totalInserted += result.inserted;
        totalUpdated += result.updated;
      }

      const duration = Date.now() - startTime;
      const message = `Commercial sync completed in ${duration}ms: ${totalInserted} inserted, ${totalUpdated} updated, ${failedCount} failed geocoding`;
      console.log(message);

      return {
        success: true,
        message,
        stats: {
          fetched: allProperties.length,
          geocoded: geocodedCount,
          inserted: totalInserted,
          updated: totalUpdated,
          failed: failedCount,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Commercial Properties sync failed:", errorMessage);

      return {
        success: false,
        message: `Sync failed: ${errorMessage}`,
      };
    }
  },
});

/**
 * Sync development sites from Browse.ai
 */
export const syncDevelopmentSites = internalAction({
  args: {},
  handler: async (ctx): Promise<SyncResult> => {
    const startTime = Date.now();
    console.log("Starting Development Sites sync from Browse.ai...");

    try {
      const browseAiKey = getBrowseAiApiKey();
      const mapboxToken = getMapboxToken();

      // Fetch tasks from Browse.ai
      const tasks = await fetchBrowseAiTasks(DEVELOPMENT_SITES_ROBOT_ID, browseAiKey);
      console.log(`Fetched ${tasks.length} completed tasks from Browse.ai`);

      // Extract all sites from tasks
      // Browse.ai uses "Development Sites" as the list name
      const allSites: BrowseAiSite[] = [];
      const taskIdMap = new Map<string, string>();

      for (const task of tasks) {
        // Try multiple possible list names
        const capturedLists = task.capturedLists as Record<string, BrowseAiSite[]> | undefined;
        const sites = capturedLists?.["Development Sites"] ||
                     capturedLists?.Sites ||
                     [];
        for (const site of sites) {
          if (site.Address) {
            allSites.push(site);
            taskIdMap.set(site.Address, task.id);
          }
        }
      }

      console.log(`Found ${allSites.length} sites to process`);

      // Geocode addresses in batches
      const syncTimestamp = Date.now();
      const transformedSites: DevelopmentSiteData[] = [];
      let geocodedCount = 0;
      let failedCount = 0;

      for (let i = 0; i < allSites.length; i += GEOCODE_BATCH_SIZE) {
        const batch = allSites.slice(i, i + GEOCODE_BATCH_SIZE);

        const geocodePromises = batch.map(async (site) => {
          const address = site.Address!;
          const coordinates = await geocodeAddress(address, mapboxToken);

          if (!coordinates) {
            failedCount++;
            return null;
          }

          geocodedCount++;
          const taskId = taskIdMap.get(address) || `unknown-${Date.now()}`;

          // Extract neighborhood name from the Neighborhood field (e.g., "541 North 20th Street\nAvenues West Neighborhood\n...")
          const neighborhoodParts = site.Neighborhood?.split('\n') || [];
          const siteName = neighborhoodParts.length > 1 ? neighborhoodParts[1] : undefined;

          return {
            browseAiTaskId: taskId,
            address,
            coordinates,
            siteName: siteName || undefined,
            lotSizeSqFt: parseSqFt(site["Square Footage"]),
            zoning: undefined, // Not in the scrape
            currentUse: undefined, // Not in the scrape
            proposedUse: site["Development Type"] || undefined,
            askingPrice: parsePrice(site["Asking Price"]),
            incentives: undefined, // Not in the scrape
            contactInfo: undefined, // Not in the scrape
            listingUrl: site["RFP Link"] || undefined,
            description: site.Neighborhood || undefined,
            status: "available" as const,
            lastSyncedAt: syncTimestamp,
            createdAt: syncTimestamp,
            updatedAt: syncTimestamp,
          };
        });

        const results = await Promise.all(geocodePromises);
        for (const r of results) {
          if (r !== null) {
            transformedSites.push(r);
          }
        }

        // Small delay between batches
        if (i + GEOCODE_BATCH_SIZE < allSites.length) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      console.log(`Geocoded ${geocodedCount} sites, ${failedCount} failed`);

      // Batch upsert to database
      const BATCH_SIZE = 50;
      let totalInserted = 0;
      let totalUpdated = 0;

      for (let i = 0; i < transformedSites.length; i += BATCH_SIZE) {
        const batch = transformedSites.slice(i, i + BATCH_SIZE);

        const result = await ctx.runMutation(
          internal.ingestion.commercialSyncMutations.upsertDevelopmentSites,
          { sites: batch }
        );

        totalInserted += result.inserted;
        totalUpdated += result.updated;
      }

      const duration = Date.now() - startTime;
      const message = `Development Sites sync completed in ${duration}ms: ${totalInserted} inserted, ${totalUpdated} updated, ${failedCount} failed geocoding`;
      console.log(message);

      return {
        success: true,
        message,
        stats: {
          fetched: allSites.length,
          geocoded: geocodedCount,
          inserted: totalInserted,
          updated: totalUpdated,
          failed: failedCount,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Development Sites sync failed:", errorMessage);

      return {
        success: false,
        message: `Sync failed: ${errorMessage}`,
      };
    }
  },
});
