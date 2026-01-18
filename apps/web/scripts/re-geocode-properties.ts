/**
 * Re-geocode Commercial Properties and Development Sites
 *
 * This script fetches all properties from Convex, geocodes their addresses
 * using Google Geocoding API, and updates the coordinates in the database.
 *
 * Usage:
 *   npx tsx scripts/re-geocode-properties.ts
 *
 * Required environment variables:
 *   - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: Google Maps API key with Geocoding enabled
 *   - CONVEX_URL or NEXT_PUBLIC_CONVEX_URL: Convex deployment URL
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, "../.env.local") });

// Configuration
const GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const RATE_LIMIT_DELAY_MS = 200; // 5 requests per second max for free tier
const CITY_STATE = "Milwaukee, WI";

// Get environment variables
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

if (!GOOGLE_API_KEY) {
  console.error("ERROR: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is required");
  process.exit(1);
}

if (!CONVEX_URL) {
  console.error("ERROR: CONVEX_URL or NEXT_PUBLIC_CONVEX_URL is required");
  process.exit(1);
}

// Initialize Convex client
const convex = new ConvexHttpClient(CONVEX_URL);

interface GeocodeResult {
  success: boolean;
  coordinates?: [number, number]; // [lng, lat]
  formattedAddress?: string;
  error?: string;
}

/**
 * Geocode an address using Google Geocoding API
 */
async function geocodeAddress(address: string): Promise<GeocodeResult> {
  try {
    // Clean up address - remove range format issues
    let cleanAddress = address
      .replace(/(\d+)-\d+\s/, "$1 ") // "2602-12 West" -> "2602 West"
      .trim();

    // Add city/state if not present
    if (!cleanAddress.toLowerCase().includes("milwaukee")) {
      cleanAddress = `${cleanAddress}, ${CITY_STATE}`;
    }

    const url = `${GOOGLE_GEOCODE_URL}?address=${encodeURIComponent(cleanAddress)}&key=${GOOGLE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;

      return {
        success: true,
        coordinates: [location.lng, location.lat], // [lng, lat] format
        formattedAddress: result.formatted_address,
      };
    } else if (data.status === "ZERO_RESULTS") {
      return {
        success: false,
        error: `No results found for: ${cleanAddress}`,
      };
    } else {
      return {
        success: false,
        error: `Geocoding failed: ${data.status} - ${data.error_message || "Unknown error"}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Re-geocode all commercial properties
 */
async function regeocodeCommercialProperties(): Promise<void> {
  console.log("\n=== Re-geocoding Commercial Properties ===\n");

  // Fetch all commercial properties
  const properties = await convex.query(api.commercialProperties.searchProperties, {});
  console.log(`Found ${properties.length} commercial properties\n`);

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (const property of properties) {
    const { _id, address, coordinates: oldCoords } = property;

    console.log(`Processing: ${address}`);
    console.log(`  Old coordinates: [${oldCoords?.[0]}, ${oldCoords?.[1]}]`);

    // Geocode the address
    const result = await geocodeAddress(address);

    if (result.success && result.coordinates) {
      const [newLng, newLat] = result.coordinates;
      const [oldLng, oldLat] = oldCoords || [0, 0];

      // Check if coordinates changed significantly (more than 0.001 degrees ≈ 100m)
      const lngDiff = Math.abs(newLng - oldLng);
      const latDiff = Math.abs(newLat - oldLat);

      if (lngDiff > 0.001 || latDiff > 0.001) {
        console.log(`  New coordinates: [${newLng}, ${newLat}]`);
        console.log(`  Formatted: ${result.formattedAddress}`);
        console.log(`  UPDATING (moved ${(lngDiff * 111000).toFixed(0)}m lng, ${(latDiff * 111000).toFixed(0)}m lat)`);

        // Update in Convex
        await convex.mutation(api.commercialProperties.updateCoordinates, {
          id: _id as Id<"commercialProperties">,
          coordinates: result.coordinates,
        });

        updated++;
      } else {
        console.log(`  Coordinates unchanged, skipping`);
        skipped++;
      }
    } else {
      console.log(`  ERROR: ${result.error}`);
      failed++;
    }

    // Rate limiting
    await sleep(RATE_LIMIT_DELAY_MS);
  }

  console.log(`\nCommercial Properties Summary:`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped (unchanged): ${skipped}`);
  console.log(`  Failed: ${failed}`);
}

/**
 * Re-geocode all development sites
 */
async function regecodeDevelopmentSites(): Promise<void> {
  console.log("\n=== Re-geocoding Development Sites ===\n");

  // Fetch all development sites
  const sites = await convex.query(api.developmentSites.searchSites, {});
  console.log(`Found ${sites.length} development sites\n`);

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (const site of sites) {
    const { _id, address, coordinates: oldCoords } = site;

    console.log(`Processing: ${address}`);
    console.log(`  Old coordinates: [${oldCoords?.[0]}, ${oldCoords?.[1]}]`);

    // Geocode the address
    const result = await geocodeAddress(address);

    if (result.success && result.coordinates) {
      const [newLng, newLat] = result.coordinates;
      const [oldLng, oldLat] = oldCoords || [0, 0];

      // Check if coordinates changed significantly
      const lngDiff = Math.abs(newLng - oldLng);
      const latDiff = Math.abs(newLat - oldLat);

      if (lngDiff > 0.001 || latDiff > 0.001) {
        console.log(`  New coordinates: [${newLng}, ${newLat}]`);
        console.log(`  Formatted: ${result.formattedAddress}`);
        console.log(`  UPDATING (moved ${(lngDiff * 111000).toFixed(0)}m lng, ${(latDiff * 111000).toFixed(0)}m lat)`);

        // Update in Convex
        await convex.mutation(api.developmentSites.updateCoordinates, {
          id: _id as Id<"developmentSites">,
          coordinates: result.coordinates,
        });

        updated++;
      } else {
        console.log(`  Coordinates unchanged, skipping`);
        skipped++;
      }
    } else {
      console.log(`  ERROR: ${result.error}`);
      failed++;
    }

    // Rate limiting
    await sleep(RATE_LIMIT_DELAY_MS);
  }

  console.log(`\nDevelopment Sites Summary:`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped (unchanged): ${skipped}`);
  console.log(`  Failed: ${failed}`);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log("Re-geocoding Properties Script");
  console.log("==============================");
  console.log(`Convex URL: ${CONVEX_URL}`);
  console.log(`Google API Key: ${GOOGLE_API_KEY?.slice(0, 10)}...`);

  await regeocodeCommercialProperties();
  await regecodeDevelopmentSites();

  console.log("\n==============================");
  console.log("Re-geocoding complete!");
}

main().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
