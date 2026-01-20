# Specification: Vacant Lots Layer

## Goal
Add a city-owned vacant lots layer to MKE.dev with full feature parity to the homes layer, enabling users to discover, analyze, and visualize development opportunities on city-owned real estate through map markers, popup details, generative UI cards, and voice/agent tools.

## User Stories
- As a developer, I want to see available city-owned vacant lots on the map so that I can identify potential development sites
- As a homebuyer, I want to filter vacant lots by neighborhood and zoning so that I can find lots suitable for building my home

## Specific Requirements

**Convex Schema: vacantLots table**
- Define table with fields: taxKey, address, coordinates, zoning, neighborhood, propertyType, dispositionStatus, dispositionStrategy, aldermanicDistrict, acquisitionDate, currentOwner
- Status field as union: "available" | "pending" | "sold" | "unknown"
- Add indexes: by_taxKey, by_status, by_neighborhood, by_dispositionStatus
- Include sync metadata fields: esriObjectId, lastSyncedAt, createdAt, updatedAt
- Coordinates stored as [longitude, latitude] array in WGS84

**ESRI Data Sync Action**
- Create `convex/ingestion/vacantLotsSync.ts` following `homesSync.ts` pattern
- Fetch from ESRI MapServer/1 endpoint with outSR=4326 for WGS84 coordinates
- Map DISPOSITIONSTATUS to status union (Available -> "available", Pending -> "pending")
- Deduplicate by taxKey, keeping most recent record
- Upsert logic: insert new, update changed, mark missing as "sold"

**Convex Queries: vacantLots.ts**
- `listAvailable`: List lots with status "available", optional neighborhood filter
- `searchLots`: Filter by neighborhood, zoning, propertyType, dispositionStatus
- `getByTaxKey`: Look up by Milwaukee tax key
- `getById`: Get by Convex document ID
- `getForMap`: Minimal data for GeoJSON source (id, coordinates, status, address)
- `getStats`: Count by status and neighborhood

**VacantLotsLayerManager Class**
- Follow `homes-layer-manager.ts` pattern exactly
- Source ID: "vacant-lots-source", Layer ID: "vacant-lots-circles"
- Circle color by status using case expression: available=#22c55e, pending=#f97316, other=#6b7280
- Highlighted state: radius 12, color #f59e0b (amber-500)
- Store lot data in Map for click handler lookup
- Emit VacantLotClickEvent with lotId, coordinates, properties

**VacantLotPopup Component**
- Follow `HomePopup.tsx` structure and neobrutalist styling
- Header with green LandPlot icon and "Vacant Lot" title
- Display: address, tax key, zoning, property type, disposition status, neighborhood
- "Analyze Lot" button (sky-500): sends lot context to chat via callback
- "Open Street View" button (amber-500): opens Google Street View at coordinates
- "Capture & Visualize" button (purple-500): triggers visualizer flow

**VacantLotCard Component (CopilotKit)**
- Follow `HomeCard.tsx` pattern with RetroUI neobrutalist styling
- Google Static Street View image at top (size=600x400, fov=90)
- Property details grid: zoning, property type, disposition status, neighborhood, aldermanic district
- Additional info section: acquisition date, current owner, disposition strategy
- Action buttons: Fly to Location, Open Street View, Visualize Potential
- Loading skeleton state with animate-pulse

**Agent Tool Declarations**
- `search_vacant_lots`: parameters for neighborhood, zoning, propertyType, dispositionStatus, limit
- `get_vacant_lot_details`: parameter for lotId (Convex document ID)
- Add to TOOL_DECLARATIONS array in `convex/agents/tools.ts`
- Return VacantLotSummary and VacantLotDetails interfaces

**Agent Tool Implementations**
- `searchVacantLots`: call ctx.runQuery(api.vacantLots.searchLots), return VacantLotSummary[]
- `getVacantLotDetails`: call ctx.runQuery(api.vacantLots.getById), return full VacantLotDetails
- Handle errors with success: false and error message

**CopilotKit Action Integration**
- Register `renderVacantLotCard` action in CopilotActions.tsx
- Render VacantLotCard with status "inProgress" during execution
- Wire onFlyTo to map flyTo, onOpenStreetView to Street View modal
- Add "vacant-lot" card type to messages schema

**Map Integration**
- Add VacantLotsLayerManager to MapContainer.tsx
- Initialize with onVacantLotClick callback
- Create useVacantLotsLayer hook following useHomesLayer pattern
- Add "Vacant Lots" toggle to LayerPanel with green LandPlot icon

## Visual Design

No visual mockups provided. Follow existing patterns from:
- HomePopup.tsx for popup styling
- HomeCard.tsx for card component layout
- LayerPanel.tsx for layer toggle styling

## Existing Code to Leverage

**apps/web/src/components/map/layers/homes-layer-manager.ts**
- Complete implementation pattern for point layer management
- GeoJSON source creation with promoteId for feature-state
- Circle layer with case expressions for status-based coloring
- Event handlers for click and hover with cursor changes
- Highlight/clear methods using setFeatureState

**apps/web/src/components/map/HomePopup.tsx**
- Neobrutalist popup overlay structure and positioning
- Icon boxes with colored backgrounds and borders
- Property details grid with labeled sections
- Action button styling with shadow transitions

**apps/web/src/components/copilot/HomeCard.tsx**
- Image gallery with navigation and counter
- Property details grid with icons
- Loading skeleton with animate-pulse
- Action buttons with RetroUI shadow effects

**apps/web/convex/homes.ts**
- Query patterns with indexes and filters
- Search with optional parameters and in-memory filtering
- getForMap returning minimal data for map display
- triggerSync action wrapping internal sync function

**apps/web/convex/agents/tools.ts**
- TOOL_DECLARATIONS array structure with name, description, parameters
- Tool implementation functions with ActionCtx
- Error handling pattern returning { success: false, error: string }
- Type interfaces for Summary and Details responses

## Out of Scope
- Cron job for automatic ESRI sync (manual trigger only for now)
- Batch geocoding of addresses without coordinates
- Historical data tracking for sold lots
- Price estimation or valuation features
- Integration with city purchase/RFP process
- Push notifications for new available lots
- Favorites or saved lots functionality
- Comparison view for multiple lots
- Export to PDF or spreadsheet
- Mobile-specific optimizations beyond responsive design
