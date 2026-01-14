/**
 * Geocode Address Tool
 *
 * Converts Milwaukee street addresses to latitude/longitude coordinates
 * using the Mapbox Geocoding API.
 */

import { FunctionTool } from '@google/adk';
import { z } from 'zod';

/**
 * Milwaukee city bounding box to constrain results
 * Format: [west, south, east, north] or "minLng,minLat,maxLng,maxLat"
 */
const MILWAUKEE_BBOX = '-88.1,42.8,-87.8,43.2';

/**
 * Minimum confidence score to accept a geocoding result
 */
const MIN_RELEVANCE = 0.7;

/**
 * Result type for geocoding operations
 */
export interface GeocodeResult {
  success: boolean;
  coordinates?: {
    longitude: number;
    latitude: number;
  };
  formattedAddress?: string;
  confidence?: number;
  zipCode?: string;
  error?: string;
  ambiguous?: boolean;
  candidates?: Array<{
    address: string;
    confidence: number;
  }>;
}

/**
 * Geocode a Milwaukee street address to coordinates.
 */
async function geocodeAddress(params: {
  address: string;
  city?: string;
  state?: string;
}): Promise<GeocodeResult> {
  const { address, city = 'Milwaukee', state = 'WI' } = params;

  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!mapboxToken) {
    return {
      success: false,
      error: 'Mapbox access token not configured',
    };
  }

  // Build the full address query
  const fullAddress = `${address}, ${city}, ${state}`;
  const encodedAddress = encodeURIComponent(fullAddress);

  // Make request to Mapbox Geocoding API
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json`
  );
  url.searchParams.set('access_token', mapboxToken);
  url.searchParams.set('bbox', MILWAUKEE_BBOX);
  url.searchParams.set('limit', '3');
  url.searchParams.set('types', 'address');

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      return {
        success: false,
        error: `Geocoding service error: ${response.status}`,
      };
    }

    const data = await response.json();
    const features = data.features || [];

    // No results found
    if (features.length === 0) {
      return {
        success: false,
        error: 'Address not found in Milwaukee. Please check the spelling or provide a nearby intersection.',
      };
    }

    const bestMatch = features[0];

    // Low confidence - might be wrong address
    if (bestMatch.relevance < MIN_RELEVANCE) {
      return {
        success: false,
        ambiguous: true,
        error: `I'm not confident about this address. Did you mean "${bestMatch.place_name}"?`,
        candidates: features.slice(0, 3).map((f: { place_name: string; relevance: number }) => ({
          address: f.place_name,
          confidence: f.relevance,
        })),
      };
    }

    // Multiple good matches - ask user to choose
    if (features.length > 1 && features[1].relevance > 0.8) {
      return {
        success: false,
        ambiguous: true,
        error: 'I found multiple addresses that match. Which one did you mean?',
        candidates: features.map((f: { place_name: string; relevance: number }) => ({
          address: f.place_name,
          confidence: f.relevance,
        })),
      };
    }

    // Extract zip code from context
    const zipCode = bestMatch.context?.find(
      (c: { id: string; text: string }) => c.id.startsWith('postcode')
    )?.text;

    // Success - return coordinates
    return {
      success: true,
      coordinates: {
        longitude: bestMatch.center[0],
        latitude: bestMatch.center[1],
      },
      formattedAddress: bestMatch.place_name,
      confidence: bestMatch.relevance,
      zipCode,
    };
  } catch (error) {
    return {
      success: false,
      error: `Geocoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * FunctionTool for geocoding addresses in the agent.
 */
export const geocodeAddressTool = new FunctionTool({
  name: 'geocode_address',
  description: 'Convert a Milwaukee street address to latitude/longitude coordinates for zoning lookup. Use this when you need to find zoning information for a specific address.',
  parameters: z.object({
    address: z.string().describe('Street address (e.g., "500 N Water St" or "Water & Wisconsin")'),
    city: z.string().default('Milwaukee').describe('City name (default: Milwaukee)'),
    state: z.string().default('WI').describe('State abbreviation (default: WI)'),
  }),
  execute: geocodeAddress,
});

export { geocodeAddress };
