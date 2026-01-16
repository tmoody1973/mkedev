# Spec Shape: Homes MKE Integration

## Overview

This specification integrates the Homes_MKE_Properties ESRI FeatureServer into MKE.dev, enabling users to discover homes for sale in Milwaukee through conversational AI and interactive map visualization.

**ESRI Source**: `https://services1.arcgis.com/5ly0cVV70qsN8Soc/arcgis/rest/services/Homes_MKE_Properties/FeatureServer/0`

---

## 1. Data Pipeline

### 1.1 Convex Schema: `homesMke` Table

Add a new table to `apps/web/convex/schema.ts` following the existing patterns for parcels and incentiveZones.

```typescript
// ---------------------------------------------------------------------------
// Homes MKE - City affordable housing inventory
// ---------------------------------------------------------------------------
homesMke: defineTable({
  // ESRI identifiers
  objectId: v.number(),                    // OBJECTID_1 from ESRI
  taxKey: v.optional(v.string()),          // FK_Tax converted to string

  // Property details
  address: v.string(),                     // ADDRESSES field
  neighborhood: v.string(),                // NEIGHBORHOOD_1 field
  districtName: v.optional(v.string()),   // DistrictName field

  // Property characteristics
  bedrooms: v.number(),                    // NumberOfBedrooms
  fullBaths: v.number(),                   // NumberOfFullBaths
  halfBaths: v.number(),                   // NumberOfHalfBaths
  sqft: v.optional(v.number()),           // Bldg_SF
  yearBuilt: v.optional(v.number()),      // Built
  lotSize: v.optional(v.string()),        // Size_SF_ (stored as string in ESRI)
  units: v.optional(v.number()),          // Number_of_Units

  // Status and listing info
  status: v.union(
    v.literal("for-sale"),
    v.literal("rent-to-own"),
    v.literal("for-rent"),
    v.literal("sold"),
    v.literal("rented")
  ),
  narrative: v.optional(v.string()),      // Property description (max 1000 chars)
  listingUrl: v.optional(v.string()),     // Link field

  // Developer info
  developerName: v.optional(v.string()),  // Developer_Name

  // Location (WGS84 - converted from UTM)
  coordinates: v.array(v.number()),       // [longitude, latitude]

  // Metadata
  lastSyncedAt: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_objectId", ["objectId"])
  .index("by_status", ["status"])
  .index("by_neighborhood", ["neighborhood"])
  .index("by_bedrooms", ["bedrooms"])
  .index("by_lastSynced", ["lastSyncedAt"]),
```

### 1.2 Coordinate Conversion

The ESRI source uses **WKID 32054 (NAD83 / Wisconsin South - ftUS)** coordinate system. Coordinates must be converted to **WGS84 (EPSG:4326)** for Mapbox display.

**Implementation**: Use `proj4` library for coordinate transformation.

```typescript
// convex/lib/projections.ts
import proj4 from 'proj4';

// Define Wisconsin South State Plane (WKID 32054)
proj4.defs('EPSG:32054', '+proj=lcc +lat_0=42 +lon_0=-90 +lat_1=42.7333333333333 +lat_2=44.0666666666667 +x_0=600000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs');

export function utmToWgs84(x: number, y: number): [number, number] {
  const [lng, lat] = proj4('EPSG:32054', 'EPSG:4326', [x, y]);
  return [lng, lat];
}
```

### 1.3 Weekly Cron Sync

Add to `apps/web/convex/crons.ts`:

```typescript
/**
 * Weekly sync of Homes MKE properties.
 * Runs every Monday at 5:00 AM UTC.
 */
crons.weekly(
  "sync-homes-mke",
  { dayOfWeek: "monday", hourUTC: 5, minuteUTC: 0 },
  internal.homesMke.syncFromEsri
);
```

### 1.4 Sync Action

Create `apps/web/convex/homesMke.ts` with sync action:

```typescript
// Pattern: Fetch all features, upsert by objectId, mark stale records
export const syncFromEsri = internalAction({
  handler: async (ctx) => {
    // 1. Query ESRI FeatureServer (paginated, 2000 records per request)
    // 2. Convert coordinates from UTM to WGS84
    // 3. Map Property_Status to status enum
    // 4. Upsert records by objectId
    // 5. Log sync statistics
  },
});
```

**Field Mapping**:
| ESRI Field | Convex Field | Notes |
|------------|--------------|-------|
| OBJECTID_1 | objectId | Primary key for sync |
| FK_Tax | taxKey | Convert double to string |
| ADDRESSES | address | Required |
| NEIGHBORHOOD_1 | neighborhood | Required |
| NumberOfBedrooms | bedrooms | Required |
| NumberOfFullBaths | fullBaths | Required |
| NumberOfHalfBaths | halfBaths | Required |
| Bldg_SF | sqft | Integer |
| Built | yearBuilt | Integer (year) |
| Property_Status | status | Map coded values |
| Narrative | narrative | Max 1000 chars |
| Link | listingUrl | URL string |

**Status Mapping**:
| ESRI Value | Convex Status |
|------------|---------------|
| "For Sale" | "for-sale" |
| "Available for Rent to Own" | "rent-to-own" |
| "Available for Rent" | "for-rent" |
| "Sold" | "sold" |
| "Rented" | "rented" |

---

## 2. Agent Tools

### 2.1 Tool Declarations

Add to `apps/web/convex/agents/tools.ts`:

```typescript
{
  name: "search_homes_for_sale",
  description: "Search for homes available for sale in Milwaukee through the Homes MKE program. Can filter by neighborhood, number of bedrooms, and number of bathrooms.",
  parameters: {
    type: "object",
    properties: {
      neighborhood: {
        type: "string",
        description: "Neighborhood name to filter by (e.g., 'Washington Park', 'Sherman Park')",
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
        description: "Minimum number of full bathrooms",
      },
      status: {
        type: "string",
        enum: ["for-sale", "rent-to-own", "for-rent"],
        description: "Property availability status (default: for-sale)",
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return (default: 10)",
      },
    },
    required: [],
  },
},
{
  name: "get_home_details",
  description: "Get detailed information about a specific Homes MKE property by its address or object ID.",
  parameters: {
    type: "object",
    properties: {
      address: {
        type: "string",
        description: "Property address to look up",
      },
      objectId: {
        type: "number",
        description: "ESRI object ID of the property",
      },
    },
    required: [],
  },
}
```

### 2.2 Tool Implementations

Add to `apps/web/convex/agents/tools.ts`:

```typescript
export async function searchHomesForSale(
  ctx: ActionCtx,
  params: {
    neighborhood?: string;
    minBedrooms?: number;
    maxBedrooms?: number;
    minBaths?: number;
    status?: string;
    limit?: number;
  }
): Promise<{
  success: boolean;
  homes?: Array<{
    objectId: number;
    address: string;
    neighborhood: string;
    bedrooms: number;
    baths: string; // "2 full, 1 half"
    sqft?: number;
    yearBuilt?: number;
    status: string;
    coordinates: [number, number];
  }>;
  count?: number;
  error?: string;
}> {
  // Query homesMke table with filters
  // Return formatted results with highlight-ready objectIds
}

export async function getHomeDetails(
  ctx: ActionCtx,
  params: { address?: string; objectId?: number }
): Promise<{
  success: boolean;
  home?: {
    address: string;
    neighborhood: string;
    bedrooms: number;
    fullBaths: number;
    halfBaths: number;
    sqft?: number;
    yearBuilt?: number;
    lotSize?: string;
    status: string;
    narrative?: string;
    listingUrl?: string;
    developerName?: string;
    coordinates: [number, number];
  };
  error?: string;
}> {
  // Look up by address or objectId
  // Return full property details
}
```

### 2.3 Integration with Zoning Agent

Update `apps/web/convex/agents/zoning.ts`:

1. Add tool declarations to `TOOL_DECLARATIONS` array
2. Add tool cases to the switch statement in the chat handler
3. Update `SYSTEM_INSTRUCTION` to describe homes search capability:

```typescript
// Add to SYSTEM_INSTRUCTION
`
## Homes MKE Search

You can help users find homes for sale through Milwaukee's Homes MKE program using:
- **search_homes_for_sale** - Search available properties by neighborhood, bedrooms, baths
- **get_home_details** - Get full details for a specific property

When users find homes they're interested in, the results will be highlighted on the map.
After returning search results, suggest they click on highlighted properties for more details.
`
```

---

## 3. Map Layer

### 3.1 Layer Configuration

Add to `apps/web/src/components/map/layers/layer-config.ts`:

```typescript
// Add to LayerType union
export type LayerType =
  | 'zoning'
  | 'parcels'
  | 'tif'
  | 'opportunityZones'
  | 'historic'
  | 'arb'
  | 'cityOwned'
  | 'homesMke'  // NEW

/**
 * Homes MKE Layer - City affordable housing inventory
 */
export const HOMES_MKE_LAYER_CONFIG: ESRILayerConfig = {
  id: 'homesMke',
  name: 'Homes for Sale',
  description: 'Milwaukee Homes MKE affordable housing properties',
  url: '', // Not from ESRI - uses Convex data as GeoJSON
  layerNumber: null,
  color: '#EC4899', // pink-500
  fillOpacity: 0.8,
  strokeColor: '#BE185D', // pink-700
  strokeWidth: 2,
  defaultVisible: false,
  interactive: true,
  legendItems: [
    { label: 'For Sale', color: '#EC4899' },
    { label: 'Rent to Own', color: '#8B5CF6' },
    { label: 'For Rent', color: '#10B981' },
  ],
  dataSource: 'Homes MKE - City of Milwaukee',
}
```

### 3.2 GeoJSON Layer Manager

Create `apps/web/src/components/map/layers/homes-layer-manager.ts`:

This is a **separate layer manager** because Homes MKE data comes from Convex (not ESRI FeatureServer). It uses Mapbox's native GeoJSON source.

```typescript
interface HomesLayerManagerOptions {
  map: MapboxMap;
  onHomeClick?: (home: HomeData) => void;
}

export class HomesLayerManager {
  private map: MapboxMap;
  private sourceId = 'homes-mke-source';
  private layerId = 'homes-mke-layer';
  private highlightLayerId = 'homes-mke-highlight';

  constructor(options: HomesLayerManagerOptions) { ... }

  // Initialize with empty GeoJSON
  initialize(): void { ... }

  // Update homes data from Convex query
  updateHomes(homes: HomeData[]): void {
    // Convert to GeoJSON FeatureCollection
    // Update source data
  }

  // Highlight specific homes (called from agent results)
  highlightHomes(objectIds: number[]): void {
    // Set feature-state for highlighting
  }

  // Clear all highlights
  clearHighlights(): void { ... }

  // Toggle layer visibility
  setVisibility(visible: boolean): void { ... }
}
```

### 3.3 Circle Marker Styling

```typescript
// Layer paint properties for circle markers
{
  'circle-radius': [
    'interpolate', ['linear'], ['zoom'],
    10, 4,
    14, 8,
    18, 12
  ],
  'circle-color': [
    'match', ['get', 'status'],
    'for-sale', '#EC4899',    // pink-500
    'rent-to-own', '#8B5CF6', // violet-500
    'for-rent', '#10B981',    // emerald-500
    '#6B7280'                  // gray-500 default
  ],
  'circle-stroke-color': '#000000',
  'circle-stroke-width': 2,
  'circle-opacity': [
    'case',
    ['boolean', ['feature-state', 'highlighted'], false],
    1,
    0.7
  ],
}
```

### 3.4 Highlight Layer for Agent Results

```typescript
// Highlight layer (rendered on top)
{
  'circle-radius': [
    'interpolate', ['linear'], ['zoom'],
    10, 6,
    14, 12,
    18, 18
  ],
  'circle-color': '#FBBF24', // amber-400
  'circle-stroke-color': '#000000',
  'circle-stroke-width': 3,
  'circle-opacity': [
    'case',
    ['boolean', ['feature-state', 'highlighted'], false],
    1,
    0
  ],
}
```

---

## 4. UI Components

### 4.1 HomeCard Component

Create `apps/web/src/components/copilot/HomeCard.tsx` following the ParcelCard pattern:

```typescript
interface HomeCardProps {
  // Basic info
  address: string;
  neighborhood: string;

  // Property characteristics
  bedrooms: number;
  fullBaths: number;
  halfBaths: number;
  sqft?: number;
  yearBuilt?: number;

  // Listing info
  status: string;
  narrative?: string;
  listingUrl?: string;

  // Location
  coordinates?: [number, number];

  // Loading state
  status?: "inProgress" | "executing" | "complete";
}
```

**Card Design (Neobrutalist)**:
- Header: Address + status badge
- Body: Property specs grid (beds/baths/sqft/year)
- Description: narrative text (if available)
- Footer: "View Listing" button (links to listingUrl)

**Status Badge Colors**:
- For Sale: pink-500 background
- Rent to Own: violet-500 background
- For Rent: emerald-500 background

### 4.2 HomesListCard Component

For displaying search results in chat:

```typescript
interface HomesListCardProps {
  homes: Array<{
    objectId: number;
    address: string;
    neighborhood: string;
    bedrooms: number;
    baths: string;
    sqft?: number;
    status: string;
  }>;
  onHomeClick?: (objectId: number) => void;
  status?: "inProgress" | "executing" | "complete";
}
```

**Design**: Compact list with:
- Address (bold)
- Neighborhood tag
- Specs (3 bed / 2 bath / 1,200 sqft)
- Status badge

---

## 5. Chat-to-Map Bridge

### 5.1 MapContext Extension

Add to `apps/web/src/contexts/MapContext.tsx`:

```typescript
interface MapContextValue {
  // ... existing properties

  // Homes highlighting
  highlightedHomeIds: number[];
  highlightHomes: (objectIds: number[]) => void;
  clearHomeHighlights: () => void;
}
```

### 5.2 Hook for Agent Results

The chat handler needs to detect when `search_homes_for_sale` returns results and trigger map highlights:

```typescript
// In ChatPanel.tsx or a custom hook
useEffect(() => {
  if (toolResults.some(t => t.name === 'search_homes_for_sale')) {
    const homesResult = toolResults.find(t => t.name === 'search_homes_for_sale');
    if (homesResult?.result?.homes) {
      const objectIds = homesResult.result.homes.map(h => h.objectId);
      highlightHomes(objectIds);

      // Optionally fly to first result
      const firstHome = homesResult.result.homes[0];
      if (firstHome?.coordinates) {
        flyTo(firstHome.coordinates, 14);
      }
    }
  }
}, [toolResults]);
```

---

## 6. Implementation Order

### Phase 1: Data Pipeline (Backend)
1. Add `homesMke` table to schema
2. Implement `proj4` coordinate conversion utility
3. Create sync action with ESRI fetching
4. Add weekly cron job
5. Run initial sync

### Phase 2: Agent Tools (Backend)
1. Add tool declarations
2. Implement `searchHomesForSale` query
3. Implement `getHomeDetails` query
4. Integrate tools into zoning agent
5. Update system prompt

### Phase 3: Map Layer (Frontend)
1. Add layer configuration
2. Create HomesLayerManager
3. Integrate with ESRILayerLoader
4. Add to LayerPanel toggle
5. Implement highlight API

### Phase 4: UI Components (Frontend)
1. Create HomeCard component
2. Create HomesListCard component
3. Register with CopilotKit
4. Test rendering in chat

### Phase 5: Chat-to-Map Bridge
1. Extend MapContext
2. Wire up tool results to map highlights
3. Add click-to-details flow
4. Test end-to-end flow

---

## 7. Files to Create/Modify

### New Files
- `apps/web/convex/homesMke.ts` - Table functions and sync action
- `apps/web/convex/lib/projections.ts` - Coordinate conversion
- `apps/web/src/components/map/layers/homes-layer-manager.ts` - Map layer
- `apps/web/src/components/copilot/HomeCard.tsx` - Detail card
- `apps/web/src/components/copilot/HomesListCard.tsx` - List card

### Modified Files
- `apps/web/convex/schema.ts` - Add homesMke table
- `apps/web/convex/crons.ts` - Add weekly sync cron
- `apps/web/convex/agents/tools.ts` - Add tool declarations and implementations
- `apps/web/convex/agents/zoning.ts` - Integrate new tools
- `apps/web/src/components/map/layers/layer-config.ts` - Add layer config
- `apps/web/src/components/map/layers/ESRILayerLoader.tsx` - Initialize homes layer
- `apps/web/src/components/map/LayerPanel.tsx` - Add toggle
- `apps/web/src/contexts/MapContext.tsx` - Add highlight state
- `apps/web/src/components/copilot/index.ts` - Export new cards

---

## 8. Testing Considerations

### Data Pipeline
- Verify coordinate conversion accuracy (spot check 3-5 properties on map)
- Test sync handles ESRI pagination (if >2000 records)
- Ensure status enum mapping covers all ESRI values

### Agent Tools
- Test search with various filter combinations
- Verify empty results return helpful message
- Test getHomeDetails with address and objectId

### Map Layer
- Verify circle markers appear at correct locations
- Test highlight/clear cycle
- Confirm layer toggle works

### End-to-End
- "Show me homes for sale in Sherman Park" -> highlights on map
- Click highlighted home -> shows HomeCard popup
- "Tell me about [address]" -> returns details

---

## 9. Dependencies

### NPM Packages (if not already installed)
- `proj4` - Coordinate transformation (may already be available via mapbox-gl)

### Environment Variables
- None required (uses existing ESRI public endpoint)

---

## 10. ESRI Service Details

**Endpoint**: `https://services1.arcgis.com/5ly0cVV70qsN8Soc/arcgis/rest/services/Homes_MKE_Properties/FeatureServer/0`

**Coordinate System**: WKID 32054 (NAD83 / Wisconsin South - ftUS)

**Key Fields**:
| Field | Type | Notes |
|-------|------|-------|
| OBJECTID_1 | OID | Unique identifier |
| ADDRESSES | String(255) | Property address |
| NEIGHBORHOOD_1 | String(255) | Neighborhood name |
| NumberOfBedrooms | Integer | |
| NumberOfFullBaths | Integer | |
| NumberOfHalfBaths | Integer | |
| Bldg_SF | Integer | Building square footage |
| Built | Integer | Year built |
| Property_Status | String(256) | Coded: For Sale, Sold, etc. |
| Narrative | String(1000) | Property description |
| Link | String(1000) | Listing URL |
| Developer_Name | String(256) | Developer |

**Query Endpoint**:
```
/query?where=1=1&outFields=*&f=geojson
```
