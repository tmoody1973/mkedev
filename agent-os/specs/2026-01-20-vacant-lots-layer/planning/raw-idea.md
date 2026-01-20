# Raw Idea: Vacant Lots Layer

## Initial Request
Add a Vacant Lots layer to MKE.dev with full feature parity like parcels and homes layers.

## Data Source
- **ESRI REST API:** https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/StrongNeighborhood/StrongNeighborhood/MapServer/1
- **Layer Name:** City owned real estate - active inventory
- **Geometry:** Point (esriGeometryPoint)
- **Coordinate System:** UTM Zone 54N (WKID: 32054) - requires conversion to WGS84

## Available Fields from ESRI
| Field | Type | Description |
|-------|------|-------------|
| TAXKEY | String | Milwaukee tax key identifier |
| COMBINEDADDRESS | String | Full street address |
| HOUSENUMBER | Integer | House number |
| STREETDIRECTION | String | Street direction prefix |
| STREETNAME | String | Street name |
| STREETTYPE | String | Street suffix (St, Ave, etc.) |
| ZIPCODE | String | ZIP code |
| ZONING | String | Zoning classification |
| NEIGHBORHOODCLASSIFICATION | String | Neighborhood name |
| ALDERMANICDISTRICT | String | Aldermanic district number |
| PROPERTYCLASS | String | Property classification |
| PROPERTYTYPE | String | Property type category |
| DEVELOPMENTTYPE | String | Development type |
| DISPOSITIONSTATUS | String | Disposition status (Available, Pending, etc.) |
| DISPOSITIONSTRATEGY | String | Strategy for disposition |
| PARCELSTATUS | String | Parcel status |
| CURRENTOWNER | String | Current owner name |
| MUNICIPALBUYER | String | Municipal buyer if applicable |
| ACQUISITIONDATE | Date | Date of acquisition |
| MASTERCARDSTATUS | String | Master card status |
| OCCUPANCYSTATUS | String | Occupancy status |

## Requirements Summary

### 1. Map Layer
- Clickable point markers (following homes layer pattern)
- Color coding by disposition status:
  - Available: #22c55e (green-500)
  - Pending: #f97316 (orange-500)
  - Other: #6b7280 (gray-500)
- Highlight on hover/click: #f59e0b (amber-500)

### 2. VacantLotPopup Component
Following HomePopup pattern with:
- Address, Tax Key, Zoning, Property Type display
- "Analyze Lot" button - sends context to chat
- "Open Street View" button - opens Google Street View
- "Capture & Visualize" button - opens AI visualizer

### 3. VacantLotCard (CopilotKit Generative UI)
Following HomeCard pattern with:
- Static Street View image (Google Static Street View API)
- All property details (address, zoning, lot info, disposition status)
- Action buttons: Fly to Location, Open Street View, Visualize
- Loading skeleton state for async rendering

### 4. Voice Tool
- `search_vacant_lots` - search with filters (neighborhood, zoning, property type)
- `get_vacant_lot_details` - get full details for a specific lot
- Returns VacantLotCard in chat

### 5. Agent Tool Integration
Add vacant lot tools to zoning agent for chat integration

## Existing Patterns to Follow
- `apps/web/src/components/map/layers/homes-layer-manager.ts` - Point layer management
- `apps/web/src/components/map/HomePopup.tsx` - Popup styling pattern
- `apps/web/src/components/copilot/HomeCard.tsx` - Card with Street View
- `apps/web/convex/homes.ts` - Data queries pattern
- `apps/web/convex/agents/tools.ts` - Tool declarations pattern

## Color Scheme
| Status | Color | Hex |
|--------|-------|-----|
| Available | Green | #22c55e (green-500) |
| Pending | Orange | #f97316 (orange-500) |
| Other | Gray | #6b7280 (gray-500) |
| Highlight | Amber | #f59e0b (amber-500) |

## Technical Notes
- ESRI returns coordinates in UTM Zone 54N (WKID: 32054), must convert to WGS84 [lng, lat]
- Tax keys match parcel data - can cross-reference with parcels table
- Some tax keys may appear multiple times (stacked points in ESRI)
- Need deduplication strategy based on taxKey
