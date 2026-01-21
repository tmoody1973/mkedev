/**
 * Zoning Agent Tools
 *
 * Tool implementations for the Zoning Interpreter Agent.
 * These run as Convex actions and integrate with external APIs.
 */

import type { GenericActionCtx } from "convex/server";
import { api } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import type { Id } from "../_generated/dataModel";

// Action context type using our DataModel
type ActionCtx = GenericActionCtx<DataModel>;

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
  {
    name: "query_area_plans",
    description:
      "Query Milwaukee neighborhood area plans for development goals, land use recommendations, housing strategies, and community vision. Use this for questions about specific neighborhoods or areas like Menomonee Valley, Third Ward, Near North Side, Downtown, etc.",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "The specific question about neighborhood plans or development vision",
        },
        neighborhood: {
          type: "string",
          description: "Neighborhood name for context (e.g., Menomonee Valley, Third Ward, Near North Side)",
        },
      },
      required: ["question"],
    },
  },
  {
    name: "query_incentives",
    description:
      "Query Milwaukee housing incentive and assistance programs. Use this for questions about down payment assistance, home repair loans, homebuyer programs, STRONG Homes, ARCH, and other financial assistance for homeowners and buyers in Milwaukee.",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "The specific question about housing incentives or assistance programs",
        },
        programType: {
          type: "string",
          enum: ["down-payment", "home-repair", "homebuyer", "all"],
          description: "Type of program to focus on (optional, defaults to searching all programs)",
        },
      },
      required: ["question"],
    },
  },
  // ---------------------------------------------------------------------------
  // Homes MKE Tools
  // ---------------------------------------------------------------------------
  {
    name: "search_homes_for_sale",
    description:
      "Search for homes currently for sale in Milwaukee. Returns a list of available homes with their key details. Use this when users ask about homes for sale, available properties, or want to find a house in a specific neighborhood or with certain features (bedrooms, bathrooms).",
    parameters: {
      type: "object",
      properties: {
        neighborhood: {
          type: "string",
          description: "Filter by neighborhood name (e.g., Bay View, Third Ward, Walkers Point, Downtown). Case-insensitive partial match supported.",
        },
        minBedrooms: {
          type: "number",
          description: "Minimum number of bedrooms",
        },
        maxBedrooms: {
          type: "number",
          description: "Maximum number of bedrooms",
        },
        minBaths: {
          type: "number",
          description: "Minimum number of bathrooms (full baths count as 1, half baths as 0.5)",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 10, max: 50)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_home_details",
    description:
      "Get detailed information about a specific home for sale, including full property description, listing URL, and precise location. Use this after search_homes_for_sale to get more details about a specific property, or when you have a home ID from a previous interaction.",
    parameters: {
      type: "object",
      properties: {
        homeId: {
          type: "string",
          description: "The Convex document ID of the home (obtained from search_homes_for_sale results)",
        },
      },
      required: ["homeId"],
    },
  },
  // ---------------------------------------------------------------------------
  // Commercial Properties & Development Sites Tools
  // ---------------------------------------------------------------------------
  {
    name: "search_commercial_properties",
    description:
      "Search for commercial properties for sale in Milwaukee. Returns a list of available commercial properties with key details. Use this when users ask about commercial real estate, retail spaces, office buildings, industrial properties, or warehouses for sale.",
    parameters: {
      type: "object",
      properties: {
        propertyType: {
          type: "string",
          enum: ["retail", "office", "industrial", "warehouse", "mixed-use", "land", "all"],
          description: "Type of commercial property to search for",
        },
        minSqFt: {
          type: "number",
          description: "Minimum building square footage",
        },
        maxSqFt: {
          type: "number",
          description: "Maximum building square footage",
        },
        maxPrice: {
          type: "number",
          description: "Maximum asking price in dollars",
        },
        zoning: {
          type: "string",
          description: "Filter by zoning code (e.g., LB2, IL1, DC)",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 10, max: 50)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_commercial_property_details",
    description:
      "Get detailed information about a specific commercial property, including full description, contact info, listing URL, and precise location. Use this after search_commercial_properties to get more details about a specific property.",
    parameters: {
      type: "object",
      properties: {
        propertyId: {
          type: "string",
          description: "The Convex document ID of the commercial property (obtained from search results)",
        },
      },
      required: ["propertyId"],
    },
  },
  {
    name: "search_development_sites",
    description:
      "Search for development sites available in Milwaukee. These are parcels marketed for new construction or redevelopment, often with city incentives. Use this when users ask about development opportunities, vacant land, buildable lots, or sites with incentives like TIF or Opportunity Zone benefits.",
    parameters: {
      type: "object",
      properties: {
        minLotSize: {
          type: "number",
          description: "Minimum lot size in square feet",
        },
        maxPrice: {
          type: "number",
          description: "Maximum asking price in dollars",
        },
        zoning: {
          type: "string",
          description: "Filter by zoning code (e.g., RS6, LB2, IL1)",
        },
        incentive: {
          type: "string",
          description: "Filter by incentive type (e.g., TIF, Opportunity Zone, NMTC)",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 10, max: 50)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_development_site_details",
    description:
      "Get detailed information about a specific development site, including incentives, proposed uses, contact info, and precise location. Use this after search_development_sites to get more details about a specific site.",
    parameters: {
      type: "object",
      properties: {
        siteId: {
          type: "string",
          description: "The Convex document ID of the development site (obtained from search results)",
        },
      },
      required: ["siteId"],
    },
  },
  // ---------------------------------------------------------------------------
  // Vacant Lots Tools - City-Owned Vacant Lots
  // ---------------------------------------------------------------------------
  {
    name: "search_vacant_lots",
    description:
      "Search for city-owned vacant lots available in Milwaukee through the Strong Neighborhoods program. Returns a list of vacant parcels with their key details. Use this when users ask about vacant lots, empty land for sale by the city, city-owned parcels, or land available for development or purchase from the city.",
    parameters: {
      type: "object",
      properties: {
        neighborhood: {
          type: "string",
          description: "Filter by neighborhood name (e.g., Bay View, Harambee, Sherman Park). Case-insensitive partial match supported.",
        },
        status: {
          type: "string",
          enum: ["available", "pending", "sold", "all"],
          description: "Filter by disposition status (default: available)",
        },
        zoning: {
          type: "string",
          description: "Filter by zoning code (e.g., RS6, RT4, LB2)",
        },
        minLotSize: {
          type: "number",
          description: "Minimum lot size in square feet",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 10, max: 50)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_vacant_lot_details",
    description:
      "Get detailed information about a specific city-owned vacant lot, including zoning, lot size, disposition status, acquisition date, and precise location. Use this after search_vacant_lots to get more details about a specific lot, or when you have a lot ID from a previous interaction.",
    parameters: {
      type: "object",
      properties: {
        lotId: {
          type: "string",
          description: "The Convex document ID of the vacant lot (obtained from search_vacant_lots results)",
        },
      },
      required: ["lotId"],
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
  zoningCategory?: string;
  zoningType?: string;
  overlayZones?: string[];
  error?: string;
  coordinates?: { longitude: number; latitude: number };
  suggestion?: string;
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

// =============================================================================
// Homes MKE Tool Implementations
// =============================================================================

/**
 * Home summary type returned by search_homes_for_sale.
 */
export interface HomeSummary {
  homeId: string;
  address: string;
  neighborhood: string;
  bedrooms: number;
  fullBaths: number;
  halfBaths: number;
  buildingSqFt: number;
}

/**
 * Full home details type returned by get_home_details.
 */
export interface HomeDetails {
  homeId: string;
  address: string;
  neighborhood: string;
  districtName?: string;
  coordinates: [number, number];
  bedrooms: number;
  fullBaths: number;
  halfBaths: number;
  buildingSqFt: number;
  lotSizeSqFt?: number;
  yearBuilt: number;
  numberOfUnits?: number;
  hasOutbuildings?: boolean;
  status: string;
  narrative?: string;
  listingUrl?: string;
  developerName?: string;
  imageUrls?: string[];
  primaryImageUrl?: string;
}

/**
 * Search for homes currently for sale in Milwaukee.
 * Calls the Convex homes.searchHomes query.
 */
export async function searchHomesForSale(
  ctx: ActionCtx,
  params: {
    neighborhood?: string;
    minBedrooms?: number;
    maxBedrooms?: number;
    minBaths?: number;
    limit?: number;
  }
): Promise<{
  success: boolean;
  homes?: HomeSummary[];
  count?: number;
  error?: string;
}> {
  try {
    // Enforce reasonable limit
    const limit = Math.min(params.limit ?? 10, 50);

    // Query homes from Convex
    const homes = await ctx.runQuery(api.homes.searchHomes, {
      neighborhood: params.neighborhood,
      minBedrooms: params.minBedrooms,
      maxBedrooms: params.maxBedrooms,
      minBaths: params.minBaths,
      limit,
    });

    // Transform to tool response format
    const homeSummaries: HomeSummary[] = homes.map(
      (home: {
        _id: string;
        address: string;
        neighborhood: string;
        bedrooms: number;
        fullBaths: number;
        halfBaths: number;
        buildingSqFt: number;
      }) => ({
        homeId: home._id,
        address: home.address,
        neighborhood: home.neighborhood,
        bedrooms: home.bedrooms,
        fullBaths: home.fullBaths,
        halfBaths: home.halfBaths,
        buildingSqFt: home.buildingSqFt,
      })
    );

    return {
      success: true,
      homes: homeSummaries,
      count: homeSummaries.length,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to search homes: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Get detailed information about a specific home.
 * Calls the Convex homes.getById query.
 */
export async function getHomeDetails(
  ctx: ActionCtx,
  params: {
    homeId: string;
  }
): Promise<{
  success: boolean;
  home?: HomeDetails;
  error?: string;
}> {
  try {
    // Query home from Convex
    const home = await ctx.runQuery(api.homes.getById, {
      id: params.homeId as Id<"homesForSale">,
    });

    if (!home) {
      return {
        success: false,
        error: `Home not found with ID: ${params.homeId}`,
      };
    }

    // Transform to tool response format
    const homeDetails: HomeDetails = {
      homeId: home._id,
      address: home.address,
      neighborhood: home.neighborhood,
      districtName: home.districtName,
      coordinates: home.coordinates as [number, number],
      bedrooms: home.bedrooms,
      fullBaths: home.fullBaths,
      halfBaths: home.halfBaths,
      buildingSqFt: home.buildingSqFt,
      lotSizeSqFt: home.lotSizeSqFt,
      yearBuilt: home.yearBuilt,
      numberOfUnits: home.numberOfUnits,
      hasOutbuildings: home.hasOutbuildings,
      status: home.status,
      narrative: home.narrative,
      listingUrl: home.listingUrl,
      developerName: home.developerName,
      imageUrls: home.imageUrls,
      primaryImageUrl: home.primaryImageUrl,
    };

    return {
      success: true,
      home: homeDetails,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to get home details: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// =============================================================================
// Commercial Properties Tool Implementations
// =============================================================================

/**
 * Commercial property summary type returned by search_commercial_properties.
 */
export interface CommercialPropertySummary {
  propertyId: string;
  address: string;
  propertyType?: string;
  buildingSqFt?: number;
  lotSizeSqFt?: number;
  askingPrice?: number;
  zoning?: string;
}

/**
 * Full commercial property details type.
 */
export interface CommercialPropertyDetails {
  propertyId: string;
  address: string;
  coordinates: [number, number];
  propertyType?: string;
  buildingSqFt?: number;
  lotSizeSqFt?: number;
  zoning?: string;
  askingPrice?: number;
  pricePerSqFt?: number;
  contactInfo?: string;
  listingUrl?: string;
  description?: string;
  status: string;
}

/**
 * Search for commercial properties in Milwaukee.
 * Calls the Convex commercialProperties.searchProperties query.
 */
export async function searchCommercialProperties(
  ctx: ActionCtx,
  params: {
    propertyType?: "retail" | "office" | "industrial" | "warehouse" | "mixed-use" | "land" | "all";
    minSqFt?: number;
    maxSqFt?: number;
    maxPrice?: number;
    zoning?: string;
    limit?: number;
  }
): Promise<{
  success: boolean;
  properties?: CommercialPropertySummary[];
  count?: number;
  error?: string;
}> {
  try {
    // Enforce reasonable limit
    const limit = Math.min(params.limit ?? 10, 50);

    // Query properties from Convex
    const properties = await ctx.runQuery(api.commercialProperties.searchProperties, {
      propertyType: params.propertyType,
      minSqFt: params.minSqFt,
      maxSqFt: params.maxSqFt,
      maxPrice: params.maxPrice,
      zoning: params.zoning,
      limit,
    });

    // Transform to tool response format
    const propertySummaries: CommercialPropertySummary[] = properties.map(
      (prop: {
        _id: string;
        address: string;
        propertyType?: string;
        buildingSqFt?: number;
        lotSizeSqFt?: number;
        askingPrice?: number;
        zoning?: string;
      }) => ({
        propertyId: prop._id,
        address: prop.address,
        propertyType: prop.propertyType,
        buildingSqFt: prop.buildingSqFt,
        lotSizeSqFt: prop.lotSizeSqFt,
        askingPrice: prop.askingPrice,
        zoning: prop.zoning,
      })
    );

    return {
      success: true,
      properties: propertySummaries,
      count: propertySummaries.length,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to search commercial properties: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Get detailed information about a specific commercial property.
 * Calls the Convex commercialProperties.getById query.
 */
export async function getCommercialPropertyDetails(
  ctx: ActionCtx,
  params: {
    propertyId: string;
  }
): Promise<{
  success: boolean;
  property?: CommercialPropertyDetails;
  error?: string;
}> {
  try {
    // Query property from Convex
    const property = await ctx.runQuery(api.commercialProperties.getById, {
      id: params.propertyId as Id<"commercialProperties">,
    });

    if (!property) {
      return {
        success: false,
        error: `Commercial property not found with ID: ${params.propertyId}`,
      };
    }

    // Transform to tool response format
    const propertyDetails: CommercialPropertyDetails = {
      propertyId: property._id,
      address: property.address,
      coordinates: property.coordinates as [number, number],
      propertyType: property.propertyType,
      buildingSqFt: property.buildingSqFt,
      lotSizeSqFt: property.lotSizeSqFt,
      zoning: property.zoning,
      askingPrice: property.askingPrice,
      pricePerSqFt: property.pricePerSqFt,
      contactInfo: property.contactInfo,
      listingUrl: property.listingUrl,
      description: property.description,
      status: property.status,
    };

    return {
      success: true,
      property: propertyDetails,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to get commercial property details: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// =============================================================================
// Development Sites Tool Implementations
// =============================================================================

/**
 * Development site summary type returned by search_development_sites.
 */
export interface DevelopmentSiteSummary {
  siteId: string;
  address: string;
  siteName?: string;
  lotSizeSqFt?: number;
  askingPrice?: number;
  zoning?: string;
  incentives?: string[];
}

/**
 * Full development site details type.
 */
export interface DevelopmentSiteDetails {
  siteId: string;
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
  status: string;
}

/**
 * Search for development sites in Milwaukee.
 * Calls the Convex developmentSites.searchSites query.
 */
export async function searchDevelopmentSites(
  ctx: ActionCtx,
  params: {
    minLotSize?: number;
    maxPrice?: number;
    zoning?: string;
    incentive?: string;
    limit?: number;
  }
): Promise<{
  success: boolean;
  sites?: DevelopmentSiteSummary[];
  count?: number;
  error?: string;
}> {
  try {
    // Enforce reasonable limit
    const limit = Math.min(params.limit ?? 10, 50);

    // Query sites from Convex
    const sites = await ctx.runQuery(api.developmentSites.searchSites, {
      minLotSize: params.minLotSize,
      maxPrice: params.maxPrice,
      zoning: params.zoning,
      incentive: params.incentive,
      limit,
    });

    // Transform to tool response format
    const siteSummaries: DevelopmentSiteSummary[] = sites.map(
      (site: {
        _id: string;
        address: string;
        siteName?: string;
        lotSizeSqFt?: number;
        askingPrice?: number;
        zoning?: string;
        incentives?: string[];
      }) => ({
        siteId: site._id,
        address: site.address,
        siteName: site.siteName,
        lotSizeSqFt: site.lotSizeSqFt,
        askingPrice: site.askingPrice,
        zoning: site.zoning,
        incentives: site.incentives,
      })
    );

    return {
      success: true,
      sites: siteSummaries,
      count: siteSummaries.length,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to search development sites: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Get detailed information about a specific development site.
 * Calls the Convex developmentSites.getById query.
 */
export async function getDevelopmentSiteDetails(
  ctx: ActionCtx,
  params: {
    siteId: string;
  }
): Promise<{
  success: boolean;
  site?: DevelopmentSiteDetails;
  error?: string;
}> {
  try {
    // Query site from Convex
    const site = await ctx.runQuery(api.developmentSites.getById, {
      id: params.siteId as Id<"developmentSites">,
    });

    if (!site) {
      return {
        success: false,
        error: `Development site not found with ID: ${params.siteId}`,
      };
    }

    // Transform to tool response format
    const siteDetails: DevelopmentSiteDetails = {
      siteId: site._id,
      address: site.address,
      coordinates: site.coordinates as [number, number],
      siteName: site.siteName,
      lotSizeSqFt: site.lotSizeSqFt,
      zoning: site.zoning,
      currentUse: site.currentUse,
      proposedUse: site.proposedUse,
      askingPrice: site.askingPrice,
      incentives: site.incentives,
      contactInfo: site.contactInfo,
      listingUrl: site.listingUrl,
      description: site.description,
      status: site.status,
    };

    return {
      success: true,
      site: siteDetails,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to get development site details: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// =============================================================================
// Vacant Lots Tool Implementations
// =============================================================================

/**
 * Vacant lot summary type returned by search_vacant_lots.
 */
export interface VacantLotSummary {
  lotId: string;
  address: string;
  neighborhood?: string;
  coordinates: [number, number];
  status: "available" | "pending" | "sold" | "unknown";
  zoning?: string;
  lotSizeSqFt?: number;
}

/**
 * Full vacant lot details type returned by get_vacant_lot_details.
 */
export interface VacantLotDetails {
  lotId: string;
  taxKey?: string;
  address: string;
  neighborhood?: string;
  aldermanicDistrict?: number;
  coordinates: [number, number];
  zoning?: string;
  propertyType?: string;
  lotSizeSqFt?: number;
  dispositionStatus?: string;
  dispositionStrategy?: string;
  acquisitionDate?: string;
  currentOwner?: string;
  status: "available" | "pending" | "sold" | "unknown";
}

/**
 * Search for city-owned vacant lots in Milwaukee.
 * Calls the Convex vacantLots.searchLots query.
 */
export async function searchVacantLots(
  ctx: ActionCtx,
  params: {
    neighborhood?: string;
    status?: "available" | "pending" | "sold" | "all";
    zoning?: string;
    minLotSize?: number;
    limit?: number;
  }
): Promise<{
  success: boolean;
  lots?: VacantLotSummary[];
  count?: number;
  message?: string;
  error?: string;
}> {
  try {
    // Enforce reasonable limit
    const limit = Math.min(params.limit ?? 10, 50);

    // Note: The searchLots query only supports available lots by default
    // The status filter from the tool is informational - query returns available lots
    // Query lots from Convex
    const lots = await ctx.runQuery(api.vacantLots.searchLots, {
      neighborhood: params.neighborhood,
      zoning: params.zoning,
      limit,
    });

    // Transform to tool response format
    const lotSummaries: VacantLotSummary[] = lots.map(
      (lot: {
        _id: string;
        address: string;
        neighborhood?: string;
        coordinates: number[];
        status: "available" | "pending" | "sold" | "unknown";
        zoning?: string;
        lotSizeSqFt?: number;
      }) => ({
        lotId: lot._id,
        address: lot.address,
        neighborhood: lot.neighborhood,
        coordinates: lot.coordinates as [number, number],
        status: lot.status,
        zoning: lot.zoning,
        lotSizeSqFt: lot.lotSizeSqFt,
      })
    );

    // Return informative message based on results
    if (lotSummaries.length === 0) {
      return {
        success: true,
        lots: [],
        count: 0,
        message: params.neighborhood
          ? `No city-owned vacant lots currently available in ${params.neighborhood}. The Strong Neighborhoods program inventory changes frequently. Users can check https://city.milwaukee.gov/strongneighborhoods for the latest listings.`
          : "No city-owned vacant lots currently match the search criteria. The vacant lots data may need to be synced, or there may be no lots matching the specified filters. Try broadening the search or checking specific neighborhoods like Harambee, Lindsay Heights, or Washington Park.",
      };
    }

    return {
      success: true,
      lots: lotSummaries,
      count: lotSummaries.length,
      message: `Found ${lotSummaries.length} city-owned vacant lot${lotSummaries.length === 1 ? "" : "s"}. These lots are available through the Strong Neighborhoods program.`,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to search vacant lots: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Get detailed information about a specific vacant lot.
 * Calls the Convex vacantLots.getByIdEnriched query for lot size enrichment from parcels.
 */
export async function getVacantLotDetails(
  ctx: ActionCtx,
  params: {
    lotId: string;
  }
): Promise<{
  success: boolean;
  lot?: VacantLotDetails;
  error?: string;
}> {
  try {
    // Query lot from Convex with lot size enrichment from parcels layer
    const lot = await ctx.runQuery(api.vacantLots.getByIdEnriched, {
      id: params.lotId as Id<"vacantLots">,
    });

    if (!lot) {
      return {
        success: false,
        error: `Vacant lot not found with ID: ${params.lotId}`,
      };
    }

    // Transform to tool response format
    const lotDetails: VacantLotDetails = {
      lotId: lot._id,
      taxKey: lot.taxKey,
      address: lot.address,
      neighborhood: lot.neighborhood,
      aldermanicDistrict: lot.aldermanicDistrict,
      coordinates: lot.coordinates as [number, number],
      zoning: lot.zoning,
      propertyType: lot.propertyType,
      lotSizeSqFt: lot.lotSizeSqFt,
      dispositionStatus: lot.dispositionStatus,
      dispositionStrategy: lot.dispositionStrategy,
      acquisitionDate: lot.acquisitionDate,
      currentOwner: lot.currentOwner,
      status: lot.status,
    };

    return {
      success: true,
      lot: lotDetails,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to get vacant lot details: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
