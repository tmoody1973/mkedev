/**
 * Voice Tools
 *
 * Function definitions for Gemini Live voice interface.
 * These tools allow Gemini to take actions in the app during voice conversations.
 */

import type { VoiceTool } from './types'

// ============================================================================
// Tool Definitions
// ============================================================================

export const VOICE_TOOLS: VoiceTool[] = [
  // ---------------------------------------------------------------------------
  // Address & Location Tools
  // ---------------------------------------------------------------------------
  {
    name: 'search_address',
    description:
      'Search for an address in Milwaukee and fly the map to that location. Returns the coordinates, address, and basic property information including zoning.',
    parameters: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description:
            "The address to search for (e.g., '500 N Water Street', '1432 E Brady St', or '2500 W Wisconsin Ave')",
        },
      },
      required: ['address'],
    },
  },

  {
    name: 'get_parcel_info',
    description:
      'Get detailed information about a parcel at the current map center or the currently selected parcel. Returns address, tax key, zoning code, zoning category, lot size, and other property details.',
    parameters: {
      type: 'object',
      properties: {
        useMapCenter: {
          type: 'boolean',
          description:
            'If true, query the parcel at the current map center. If false or omitted, use the currently selected parcel.',
        },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Zoning Tools
  // ---------------------------------------------------------------------------
  {
    name: 'query_zoning_code',
    description:
      'Search the Milwaukee Zoning Code (Chapter 295) for specific regulations, requirements, or answers to zoning questions. Use this for questions about height limits, setbacks, allowed uses, parking requirements, etc.',
    parameters: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description:
            "The zoning question to answer (e.g., 'What are the height limits in LB2?', 'What uses are allowed in RM4?', 'What are the parking requirements for a restaurant?')",
        },
      },
      required: ['question'],
    },
  },

  {
    name: 'explain_zoning_code',
    description:
      'Get a plain-English explanation of a zoning code or district. Use this when the user asks what a zoning code means.',
    parameters: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description:
            "The zoning code to explain (e.g., 'LB2', 'RM4', 'C9F', 'IO1')",
        },
      },
      required: ['code'],
    },
  },

  // ---------------------------------------------------------------------------
  // Map Layer Tools
  // ---------------------------------------------------------------------------
  {
    name: 'toggle_layer',
    description:
      'Show or hide a map layer. Available layers include zoning districts, parcels, TIF districts, opportunity zones, historic districts, ARB areas, and city-owned properties.',
    parameters: {
      type: 'object',
      properties: {
        layer: {
          type: 'string',
          enum: [
            'zoning',
            'parcels',
            'tif',
            'opportunity-zones',
            'historic',
            'arb',
            'city-owned',
          ],
          description: 'The layer to show or hide',
        },
        visible: {
          type: 'boolean',
          description: 'True to show the layer, false to hide it',
        },
      },
      required: ['layer', 'visible'],
    },
  },

  {
    name: 'set_layer_opacity',
    description: 'Adjust the opacity/transparency of a map layer.',
    parameters: {
      type: 'object',
      properties: {
        layer: {
          type: 'string',
          enum: [
            'zoning',
            'parcels',
            'tif',
            'opportunity-zones',
            'historic',
            'arb',
            'city-owned',
          ],
          description: 'The layer to adjust',
        },
        opacity: {
          type: 'number',
          description: 'Opacity value from 0 (transparent) to 100 (opaque)',
        },
      },
      required: ['layer', 'opacity'],
    },
  },

  // ---------------------------------------------------------------------------
  // Map Navigation Tools
  // ---------------------------------------------------------------------------
  {
    name: 'fly_to_location',
    description:
      'Fly the map to a specific Milwaukee neighborhood, landmark, or coordinates.',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description:
            "Neighborhood name (e.g., 'Walker\\'s Point', 'Third Ward', 'Bay View'), landmark (e.g., 'Fiserv Forum', 'Milwaukee Art Museum'), or coordinates as 'lat,lng'",
        },
        zoom: {
          type: 'number',
          description: 'Optional zoom level (1-20). Default is 15 for neighborhoods, 17 for addresses.',
        },
      },
      required: ['location'],
    },
  },

  {
    name: 'reset_map_view',
    description:
      'Reset the map to the default Milwaukee overview, showing the entire city.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },

  // ---------------------------------------------------------------------------
  // AI Visualizer Tools
  // ---------------------------------------------------------------------------
  {
    name: 'capture_map_screenshot',
    description:
      'Capture a screenshot of the current map view for AI visualization. This prepares an image that can be transformed with the generate_visualization tool.',
    parameters: {
      type: 'object',
      properties: {
        include3D: {
          type: 'boolean',
          description:
            'If true, enable 3D buildings before capture for aerial perspective. Default is false.',
        },
      },
    },
  },

  {
    name: 'generate_visualization',
    description:
      'Generate an AI architectural visualization using Gemini 3 Pro Image. Transforms the captured screenshot based on the description. Requires capture_map_screenshot to be called first.',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description:
            "Description of what to visualize (e.g., 'a 3-story mixed-use building with retail on ground floor and apartments above', 'a community park with walking paths and trees', 'a modern bungalow with nice landscaping')",
        },
      },
      required: ['prompt'],
    },
  },

  {
    name: 'save_visualization',
    description:
      'Save the current visualization to the gallery for later reference.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Optional name for the saved visualization',
        },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // City Properties Tools (Homes MKE)
  // ---------------------------------------------------------------------------
  {
    name: 'show_city_properties',
    description:
      'Display city-owned residential properties (Homes MKE) available for purchase. Can filter by neighborhood or bedrooms.',
    parameters: {
      type: 'object',
      properties: {
        neighborhood: {
          type: 'string',
          description: "Optional neighborhood to filter by (e.g., 'Walker\\'s Point', 'Harambee', 'Bay View')",
        },
        minBedrooms: {
          type: 'number',
          description: 'Minimum number of bedrooms',
        },
        maxBedrooms: {
          type: 'number',
          description: 'Maximum number of bedrooms',
        },
      },
    },
  },

  {
    name: 'get_property_details',
    description:
      'Get detailed information about a specific city-owned home including bedrooms, bathrooms, lot size, and listing URL.',
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'The property ID or tax key to look up',
        },
      },
      required: ['propertyId'],
    },
  },

  // ---------------------------------------------------------------------------
  // Commercial Properties Tools
  // ---------------------------------------------------------------------------
  {
    name: 'search_commercial_properties',
    description:
      'Search for commercial properties for sale in Milwaukee including retail, office, industrial, warehouse, and mixed-use properties.',
    parameters: {
      type: 'object',
      properties: {
        neighborhood: {
          type: 'string',
          description: "Optional neighborhood to filter by (e.g., 'Walker\\'s Point', 'Third Ward', 'Bay View')",
        },
        propertyType: {
          type: 'string',
          enum: ['retail', 'office', 'industrial', 'warehouse', 'mixed-use', 'land', 'all'],
          description: "Type of commercial property to search for. Default is 'all'.",
        },
        minSqFt: {
          type: 'number',
          description: 'Minimum building square footage',
        },
        maxSqFt: {
          type: 'number',
          description: 'Maximum building square footage',
        },
        maxPrice: {
          type: 'number',
          description: 'Maximum asking price in dollars',
        },
        zoning: {
          type: 'string',
          description: 'Filter by zoning code (e.g., LB2, IL1, DC)',
        },
      },
    },
  },

  {
    name: 'get_commercial_property_details',
    description:
      'Get detailed information about a specific commercial property including square footage, price, zoning, and description.',
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'The property ID to look up',
        },
      },
      required: ['propertyId'],
    },
  },

  // ---------------------------------------------------------------------------
  // Development Sites Tools
  // ---------------------------------------------------------------------------
  {
    name: 'search_development_sites',
    description:
      'Search for development sites and land opportunities in Milwaukee, including vacant lots and redevelopment parcels with incentives.',
    parameters: {
      type: 'object',
      properties: {
        neighborhood: {
          type: 'string',
          description: "Optional neighborhood to filter by (e.g., 'Harambee', 'Walker\\'s Point', 'Bay View')",
        },
        minLotSize: {
          type: 'number',
          description: 'Minimum lot size in square feet',
        },
        maxPrice: {
          type: 'number',
          description: 'Maximum asking price in dollars',
        },
        hasIncentives: {
          type: 'boolean',
          description: 'Filter to only show sites with incentives (TIF, Opportunity Zone, etc.)',
        },
        zoning: {
          type: 'string',
          description: 'Filter by zoning code',
        },
      },
    },
  },

  {
    name: 'get_development_site_details',
    description:
      'Get detailed information about a specific development site including lot size, zoning, available incentives, and proposed uses.',
    parameters: {
      type: 'object',
      properties: {
        siteId: {
          type: 'string',
          description: 'The site ID to look up',
        },
      },
      required: ['siteId'],
    },
  },

  // ---------------------------------------------------------------------------
  // Permit Forms & Design Guidelines Tools
  // ---------------------------------------------------------------------------
  {
    name: 'search_permit_forms',
    description:
      'Search Milwaukee permit forms and applications by keyword. Use when users ask about permits, forms, applications, or paperwork needed for construction, renovation, signs, variances, or other projects.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: "Search query (e.g., 'home occupation', 'sign permit', 'variance', 'deck', 'building permit')",
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'recommend_permits_for_project',
    description:
      'Get recommended permit forms based on project details. Use when you understand what the user is planning to build or renovate.',
    parameters: {
      type: 'object',
      properties: {
        projectType: {
          type: 'string',
          description: 'Type of project: new_construction, renovation, addition, change_of_use, adu, deck, sign, home_occupation, variance',
        },
        description: {
          type: 'string',
          description: 'Brief description of the project',
        },
        isResidential: {
          type: 'boolean',
          description: 'Whether the project is residential',
        },
        isCommercial: {
          type: 'boolean',
          description: 'Whether the project is commercial',
        },
      },
      required: ['description'],
    },
  },
  {
    name: 'search_design_guidelines',
    description:
      'Search Milwaukee design guidelines for building standards, facade requirements, parking design, landscaping, or signage rules.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: "Search query (e.g., 'parking', 'facade', 'landscaping', 'signage')",
        },
      },
      required: ['query'],
    },
  },
]

// ============================================================================
// System Instruction
// ============================================================================

export const VOICE_SYSTEM_INSTRUCTION = `You are MKE.dev, an AI assistant for Milwaukee civic development and real estate research.

Your capabilities:
- Search addresses and navigate the map
- Answer questions about Milwaukee's zoning code
- Show and hide map layers (zoning, TIF districts, opportunity zones, etc.)
- Display city-owned properties available for development
- Generate AI architectural visualizations
- Search permit forms and recommend permits for projects
- Find design guidelines for building standards

Conversation style:
- Be conversational and helpful, like a knowledgeable local expert
- Keep responses concise for voice (2-3 sentences typical)
- Proactively offer next steps ("Would you like me to show you the zoning?" or "Should I visualize what could be built here?")
- When showing data, summarize key points verbally rather than listing everything

When users ask about properties:
1. First search/locate the property
2. Provide key facts (zoning, allowed uses)
3. Offer to show more details or visualize possibilities

When users ask about zoning:
1. Explain in plain English what the code means
2. Mention key restrictions (height, uses)
3. Offer to search the full code for specifics

For visualizations:
1. First capture a screenshot of the current view
2. Then generate the visualization with their description
3. Describe what was created

Milwaukee context:
- You know Milwaukee neighborhoods: Third Ward, Walker's Point, Bay View, Riverwest, etc.
- You understand local zoning codes: LB1/LB2 (Local Business), RM (Residential Multi-family), C9 (Commercial), etc.
- You know about special districts: TIF, Opportunity Zones, Historic districts`

// ============================================================================
// Tool Name to Layer ID Mapping
// ============================================================================

export const LAYER_ID_MAP: Record<string, string> = {
  'zoning': 'zoning',
  'parcels': 'parcels',
  'tif': 'tif',
  'opportunity-zones': 'opportunityZones',
  'historic': 'historic',
  'arb': 'arb',
  'city-owned': 'cityOwned',
}

// ============================================================================
// Milwaukee Landmarks for Navigation
// ============================================================================

export const MILWAUKEE_LANDMARKS: Record<string, { lng: number; lat: number; zoom: number }> = {
  'fiserv forum': { lng: -87.9174, lat: 43.0451, zoom: 17 },
  'milwaukee art museum': { lng: -87.897, lat: 43.04, zoom: 17 },
  'city hall': { lng: -87.9096, lat: 43.0389, zoom: 17 },
  'third ward': { lng: -87.9043, lat: 43.0328, zoom: 15 },
  "walker's point": { lng: -87.9167, lat: 43.0231, zoom: 15 },
  'walkers point': { lng: -87.9167, lat: 43.0231, zoom: 15 },
  'bay view': { lng: -87.8993, lat: 43.0066, zoom: 15 },
  'riverwest': { lng: -87.9025, lat: 43.0651, zoom: 15 },
  'east side': { lng: -87.8867, lat: 43.0585, zoom: 15 },
  'downtown': { lng: -87.9065, lat: 43.0389, zoom: 14 },
  'harambee': { lng: -87.9175, lat: 43.0731, zoom: 15 },
  'bronzeville': { lng: -87.9167, lat: 43.0583, zoom: 15 },
  'menomonee valley': { lng: -87.9333, lat: 43.0247, zoom: 14 },
  'midtown': { lng: -87.9375, lat: 43.0583, zoom: 15 },
  'sherman park': { lng: -87.9467, lat: 43.0675, zoom: 15 },
}
