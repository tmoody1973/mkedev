/**
 * Zoning Agent Tools
 *
 * Tool implementations for the Zoning Interpreter Agent.
 * These run as Convex actions and integrate with external APIs.
 */

// =============================================================================
// Tool Declarations for Gemini Function Calling
// =============================================================================

export const TOOL_DECLARATIONS = [
  {
    name: "geocode_address",
    description:
      "Convert a Milwaukee street address to latitude/longitude coordinates for zoning lookup. Use this when you need to find zoning information for a specific address.",
    parameters: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: 'Street address (e.g., "500 N Water St")',
        },
        city: {
          type: "string",
          description: "City name (default: Milwaukee)",
        },
        state: {
          type: "string",
          description: "State abbreviation (default: WI)",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "query_zoning_at_point",
    description:
      "Get zoning district and overlay information (TIF, Opportunity Zone, Historic District) for a specific location. Requires longitude and latitude coordinates from geocoding.",
    parameters: {
      type: "object",
      properties: {
        longitude: {
          type: "number",
          description: "Longitude coordinate (e.g., -87.9095)",
        },
        latitude: {
          type: "number",
          description: "Latitude coordinate (e.g., 43.0389)",
        },
      },
      required: ["longitude", "latitude"],
    },
  },
  {
    name: "calculate_parking",
    description:
      "Calculate required parking spaces based on use type, building size, and zoning district. Use this after determining the zoning district to give specific parking requirements.",
    parameters: {
      type: "object",
      properties: {
        useType: {
          type: "string",
          enum: [
            "restaurant",
            "retail",
            "office",
            "medical",
            "industrial",
            "warehouse",
            "assembly",
            "residential",
          ],
          description: "Type of use (e.g., restaurant, retail, office)",
        },
        grossFloorArea: {
          type: "number",
          description: "Gross floor area in square feet",
        },
        zoningDistrict: {
          type: "string",
          description: "Zoning district code (e.g., DC, RS6, LB2)",
        },
        seatingCapacity: {
          type: "number",
          description: "Seating capacity (for assembly uses like theaters)",
        },
        units: {
          type: "number",
          description: "Number of dwelling units (for residential)",
        },
      },
      required: ["useType", "grossFloorArea", "zoningDistrict"],
    },
  },
  {
    name: "query_zoning_code",
    description:
      "Query the Milwaukee zoning code documents for detailed regulations, permitted uses, dimensional standards, and other zoning requirements. Use this to answer specific questions about zoning rules.",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "The specific zoning question to answer",
        },
        zoningDistrict: {
          type: "string",
          description: "Zoning district code for context (e.g., RS6, DC, LB2)",
        },
        useType: {
          type: "string",
          description: "Type of use for context (e.g., restaurant, residential)",
        },
      },
      required: ["question"],
    },
  },
];

// =============================================================================
// Tool Implementations
// =============================================================================

const MILWAUKEE_BBOX = "-88.1,42.8,-87.8,43.2";
const ESRI_BASE = "https://milwaukeemaps.milwaukee.gov/arcgis/rest/services";

/**
 * Fetch with retry logic for ESRI endpoints.
 */
async function fetchWithRetry(
  url: string,
  maxRetries = 3,
  delayMs = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError || new Error("Fetch failed after retries");
}

/**
 * Geocode a Milwaukee address to coordinates.
 */
export async function geocodeAddress(params: {
  address: string;
  city?: string;
  state?: string;
}): Promise<{
  success: boolean;
  coordinates?: { longitude: number; latitude: number };
  formattedAddress?: string;
  error?: string;
}> {
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
  if (!mapboxToken) {
    return { success: false, error: "Mapbox token not configured" };
  }

  const { address, city = "Milwaukee", state = "WI" } = params;
  const fullAddress = `${address}, ${city}, ${state}`;
  const encodedAddress = encodeURIComponent(fullAddress);

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&bbox=${MILWAUKEE_BBOX}&limit=1&types=address`;
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, error: `Geocoding error: ${response.status}` };
    }

    const data = await response.json();
    const feature = data.features?.[0];

    if (!feature || feature.relevance < 0.7) {
      return {
        success: false,
        error: "Address not found in Milwaukee. Please check the spelling.",
      };
    }

    return {
      success: true,
      coordinates: {
        longitude: feature.center[0],
        latitude: feature.center[1],
      },
      formattedAddress: feature.place_name,
    };
  } catch (error) {
    return {
      success: false,
      error: `Geocoding failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Query zoning district at a coordinate point.
 */
export async function queryZoningAtPoint(params: {
  longitude: number;
  latitude: number;
}): Promise<{
  success: boolean;
  zoningDistrict?: string;
  zoningDescription?: string;
  overlayZones?: string[];
  error?: string;
}> {
  const { longitude, latitude } = params;

  try {
    // Query zoning layer with retry (inSR=4326 for WGS84 coordinates)
    const zoningUrl = `${ESRI_BASE}/planning/zoning/MapServer/11/query?geometry=${longitude},${latitude}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=json`;
    const zoningResponse = await fetchWithRetry(zoningUrl);

    const zoningData = await zoningResponse.json();
    const zoning = zoningData.features?.[0]?.attributes;

    if (!zoning) {
      return {
        success: false,
        error: "No zoning information found at this location.",
      };
    }

    // Query overlay zones (non-critical, continue on failure)
    const overlays: string[] = [];

    // TIF Districts
    try {
      const tifUrl = `${ESRI_BASE}/planning/special_districts/MapServer/8/query?geometry=${longitude},${latitude}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=TIF_NAME&returnGeometry=false&f=json`;
      const tifResponse = await fetchWithRetry(tifUrl, 2, 500);
      const tifData = await tifResponse.json();
      const tif = tifData.features?.[0]?.attributes;
      if (tif?.TIF_NAME) {
        overlays.push(`TIF District: ${tif.TIF_NAME}`);
      }
    } catch {
      // Continue without TIF
    }

    // Opportunity Zones
    try {
      const ozUrl = `${ESRI_BASE}/planning/special_districts/MapServer/9/query?geometry=${longitude},${latitude}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=json`;
      const ozResponse = await fetchWithRetry(ozUrl, 2, 500);
      const ozData = await ozResponse.json();
      if (ozData.features?.length > 0) {
        overlays.push("Opportunity Zone");
      }
    } catch {
      // Continue without OZ
    }

    return {
      success: true,
      zoningDistrict: zoning.Zoning || zoning.ZONING || "Unknown",
      zoningCategory: zoning.ZoningCategory || "",
      zoningType: zoning.ZoningType || "",
      overlayZones: overlays,
    };
  } catch (error) {
    // ESRI query failed - return partial success with coordinates
    // The agent can still help by asking for the zoning district or using RAG
    return {
      success: false,
      error: "Milwaukee GIS server is temporarily unavailable. Please provide the zoning district code (e.g., RS6, LB2, DC) if you know it, or I can look up general zoning information for this area.",
      coordinates: { longitude, latitude },
      suggestion: "Use query_zoning_code tool to look up zoning information based on the neighborhood or address area.",
    };
  }
}

/**
 * Calculate required parking spaces.
 */
const REDUCED_PARKING_DISTRICTS = ["DC", "DL1", "DL2", "DL3", "DL4", "DR1", "DR2"];
const PARKING_RATIOS: Record<string, { standard: number; reduced: number; min: number }> = {
  restaurant: { standard: 100, reduced: 400, min: 0 },
  retail: { standard: 300, reduced: 600, min: 3 },
  office: { standard: 400, reduced: 1000, min: 3 },
  medical: { standard: 200, reduced: 400, min: 5 },
  industrial: { standard: 1000, reduced: 1000, min: 3 },
  warehouse: { standard: 2000, reduced: 2000, min: 2 },
  assembly: { standard: 50, reduced: 100, min: 10 },
  residential: { standard: 1, reduced: 0.5, min: 0 },
};

export function calculateParking(params: {
  useType: string;
  grossFloorArea: number;
  zoningDistrict: string;
  seatingCapacity?: number;
  units?: number;
}): {
  requiredSpaces: number;
  ratio: string;
  isReducedDistrict: boolean;
  calculation: string;
  notes: string;
  codeReference: string;
} {
  const { useType, grossFloorArea, zoningDistrict, seatingCapacity, units } = params;

  const useTypeLower = useType.toLowerCase();
  const isReducedDistrict = REDUCED_PARKING_DISTRICTS.includes(zoningDistrict.toUpperCase());
  const ratioConfig = PARKING_RATIOS[useTypeLower] || PARKING_RATIOS.retail;
  const ratio = isReducedDistrict ? ratioConfig.reduced : ratioConfig.standard;

  let requiredSpaces: number;
  let calculation: string;
  let ratioString: string;

  if (useTypeLower === "residential" && units !== undefined) {
    requiredSpaces = Math.ceil(units * ratio);
    calculation = `${units} units × ${ratio} spaces/unit = ${requiredSpaces} spaces`;
    ratioString = `${ratio} space(s) per unit`;
  } else if (useTypeLower === "assembly" && seatingCapacity !== undefined) {
    requiredSpaces = Math.ceil(seatingCapacity / ratio);
    calculation = `${seatingCapacity} seats ÷ ${ratio} = ${requiredSpaces} spaces`;
    ratioString = `1 space per ${ratio} seats`;
  } else {
    requiredSpaces = Math.ceil(grossFloorArea / ratio);
    calculation = `${grossFloorArea.toLocaleString()} sq ft ÷ ${ratio} = ${requiredSpaces} spaces`;
    ratioString = `1 space per ${ratio} sq ft`;
  }

  requiredSpaces = Math.max(requiredSpaces, ratioConfig.min);

  const notes = isReducedDistrict
    ? `The ${zoningDistrict} district has reduced parking requirements. Shared parking and in-lieu fees may be available.`
    : "Standard parking requirements apply.";

  return {
    requiredSpaces,
    ratio: ratioString,
    isReducedDistrict,
    calculation,
    notes,
    codeReference: "Section 295-403 (Off-Street Parking Requirements)",
  };
}
