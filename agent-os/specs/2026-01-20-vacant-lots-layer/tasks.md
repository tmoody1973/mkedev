# Task Breakdown: Vacant Lots Layer

## Overview
Total Tasks: 6 Task Groups, 32 Sub-tasks

This feature adds a city-owned vacant lots layer to MKE.dev with full feature parity to the homes layer, including map markers, popup details, generative UI cards, and voice/agent tools.

## Task List

### Data Layer

#### Task Group 1: Convex Schema & Data Sync
**Dependencies:** None

- [ ] 1.0 Complete Convex schema and data sync layer
  - [ ] 1.1 Write 4-6 focused tests for vacant lots data layer
    - Test vacantLots table schema validation
    - Test listAvailable query returns only "available" status lots
    - Test searchLots with neighborhood and zoning filters
    - Test getForMap returns minimal data structure for map display
    - Test getById returns full lot details
  - [ ] 1.2 Add vacantLots table to `apps/web/convex/schema.ts`
    - Fields: taxKey, address, coordinates, zoning, neighborhood, propertyType, dispositionStatus, dispositionStrategy, aldermanicDistrict, acquisitionDate, currentOwner
    - Status union: `"available" | "pending" | "sold" | "unknown"`
    - Sync metadata: esriObjectId, lastSyncedAt, createdAt, updatedAt
    - Coordinates as `v.array(v.number())` for [longitude, latitude] WGS84
    - Indexes: by_taxKey, by_status, by_neighborhood, by_dispositionStatus
    - Follow pattern from `homesForSale` table definition
  - [ ] 1.3 Create `apps/web/convex/vacantLots.ts` with CRUD queries
    - `listAvailable`: List lots with status "available", optional neighborhood filter
    - `searchLots`: Filter by neighborhood, zoning, propertyType, dispositionStatus with in-memory filtering
    - `getByTaxKey`: Look up by Milwaukee tax key using index
    - `getById`: Get by Convex document ID
    - `getForMap`: Return minimal data (id, coordinates, status, address) for GeoJSON source
    - `getStats`: Count by status and neighborhood
    - `triggerSync`: Action wrapper for manual sync
    - Follow patterns from `apps/web/convex/homes.ts`
  - [ ] 1.4 Create `apps/web/convex/ingestion/vacantLotsSync.ts` for ESRI sync
    - Use ESRI MapServer/1 endpoint for city-owned vacant lots
    - Request with outSR=4326 for WGS84 coordinates
    - Map DISPOSITIONSTATUS to status union: Available -> "available", Pending -> "pending"
    - Deduplicate by taxKey, keeping most recent record
    - Upsert logic: insert new, update changed, mark missing as "sold"
    - Follow patterns from `apps/web/convex/ingestion/homesSync.ts`
  - [ ] 1.5 Create `apps/web/convex/ingestion/vacantLotsSyncMutations.ts`
    - `upsertLots` mutation for batch database operations
    - Follow pattern from `homesSyncMutations.ts`
  - [ ] 1.6 Ensure data layer tests pass
    - Run ONLY the 4-6 tests written in 1.1
    - Verify schema compiles successfully with `pnpm convex dev`
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 1.1 pass
- vacantLots table exists in schema with correct fields and indexes
- All CRUD queries return expected data shapes
- Sync action successfully fetches and transforms ESRI data
- Manual sync can be triggered via `npx convex run vacantLots:triggerSync`

---

### Map Layer

#### Task Group 2: Layer Manager & Map Integration
**Dependencies:** Task Group 1

- [ ] 2.0 Complete map layer integration
  - [ ] 2.1 Write 4-6 focused tests for vacant lots layer manager
    - Test VacantLotsLayerManager initialization and addLayer
    - Test updateData converts lots to GeoJSON features correctly
    - Test highlightLots/clearHighlights sets feature state
    - Test click handler emits VacantLotClickEvent with correct properties
    - Test circle color matches status (available=#22c55e, pending=#f97316)
  - [ ] 2.2 Add VacantLotsLayerConfig to `apps/web/src/components/map/layers/layer-config.ts`
    - Source ID: "vacant-lots-source"
    - Layer ID: "vacant-lots-circles"
    - Group: "City Properties" section
    - Color by status: available=#22c55e (green-500), pending=#f97316 (orange-500), other=#6b7280 (gray-500)
    - Highlighted state: radius 12, color #f59e0b (amber-500)
  - [ ] 2.3 Create `apps/web/src/components/map/layers/vacant-lots-layer-manager.ts`
    - Follow `homes-layer-manager.ts` pattern exactly
    - Types: VacantLot interface, VacantLotClickEvent interface, VacantLotsLayerManagerOptions
    - GeoJSON source creation with promoteId for feature-state
    - Circle layer with case expression for status-based coloring
    - Store lot data in Map for click handler lookup
    - Event handlers for click (emit VacantLotClickEvent) and hover (cursor change)
    - Methods: addLayer, setLayerVisibility, updateData, highlightLots, clearHighlights, destroy
  - [ ] 2.4 Create `apps/web/src/components/map/layers/useVacantLotsLayer.ts` hook
    - Follow `useHomesLayer` or `useESRILayers` pattern
    - Subscribe to vacantLots.getForMap query
    - Initialize VacantLotsLayerManager when map is ready
    - Update layer data when query results change
    - Handle cleanup on unmount
    - Return highlightLots and clearHighlights methods for external use
  - [ ] 2.5 Export from `apps/web/src/components/map/layers/index.ts`
    - Export VacantLotsLayerManager class
    - Export VacantLot and VacantLotClickEvent types
    - Export useVacantLotsLayer hook
  - [ ] 2.6 Ensure layer manager tests pass
    - Run ONLY the 4-6 tests written in 2.1
    - Verify layer renders on map with test data
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 2.1 pass
- VacantLotsLayerManager properly initializes source and layer
- Circles render with correct colors based on status
- Click events emit with full lot properties
- Highlight/clear feature state works correctly

---

### UI Components

#### Task Group 3: Popup & UI Components
**Dependencies:** Task Group 2

- [ ] 3.0 Complete popup and UI components
  - [ ] 3.1 Write 4-6 focused tests for VacantLotPopup component
    - Test renders address, tax key, zoning, neighborhood correctly
    - Test "Analyze Lot" button calls onAnalyze callback with lot context
    - Test "Open Street View" button opens correct Google Street View URL
    - Test loading state shows skeleton UI
    - Test neobrutalist styling (border, shadow) renders correctly
  - [ ] 3.2 Create `apps/web/src/components/map/VacantLotPopup.tsx`
    - Follow `HomePopup.tsx` structure and neobrutalist styling exactly
    - Header with green LandPlot icon and "Vacant Lot" title
    - Display: address, tax key, zoning, property type, disposition status, neighborhood
    - "Analyze Lot" button (sky-500): calls onAnalyze callback with lot context
    - "Open Street View" button (amber-500): opens Google Street View at coordinates
    - "Capture & Visualize" button (purple-500): calls onVisualize callback
    - Close button (X) in top-right corner
    - Absolute positioning for map overlay
    - Loading skeleton state with animate-pulse
  - [ ] 3.3 Add VacantLotPopup to MapContainer rendering
    - Import VacantLotPopup component
    - Add state for selectedVacantLot
    - Wire onVacantLotClick from layer manager to set selectedVacantLot
    - Render popup when selectedVacantLot is set
    - Wire onAnalyze to send lot context to chat
    - Wire onOpenStreetView to open Google Street View
    - Wire onVisualize to trigger visualizer flow
    - Wire onClose to clear selectedVacantLot
  - [ ] 3.4 Ensure popup tests pass
    - Run ONLY the 4-6 tests written in 3.1
    - Verify popup displays correctly on map
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 3.1 pass
- Popup displays all lot details in neobrutalist style
- All action buttons trigger correct callbacks
- Popup closes when clicking X or clicking elsewhere on map

---

### CopilotKit Integration

#### Task Group 4: CopilotKit Card & Actions
**Dependencies:** Task Group 1

- [ ] 4.0 Complete CopilotKit card integration
  - [ ] 4.1 Write 4-6 focused tests for VacantLotCard component
    - Test renders property details grid correctly
    - Test Google Static Street View image loads with correct URL params
    - Test action buttons (Fly to Location, Open Street View, Visualize Potential) trigger callbacks
    - Test loading skeleton state displays with animate-pulse
    - Test neobrutalist shadow and border styling
  - [ ] 4.2 Create `apps/web/src/components/copilot/VacantLotCard.tsx`
    - Follow `HomeCard.tsx` pattern with RetroUI neobrutalist styling
    - Google Static Street View image at top: `https://maps.googleapis.com/maps/api/streetview?size=600x400&fov=90&location={lat},{lng}&key={API_KEY}`
    - Property details grid with icons: zoning, property type, disposition status, neighborhood, aldermanic district
    - Additional info section: acquisition date, current owner, disposition strategy
    - Action buttons: Fly to Location, Open Street View, Visualize Potential
    - Loading skeleton state with animate-pulse
    - Props: lotId, address, coordinates, zoning, propertyType, dispositionStatus, neighborhood, aldermanicDistrict, acquisitionDate, currentOwner, dispositionStrategy, status, onFlyTo, onOpenStreetView, onVisualize
  - [ ] 4.3 Create `apps/web/src/components/copilot/VacantLotsListCard.tsx`
    - Follow `HomesListCard.tsx` pattern for displaying search results
    - List view of vacant lots with summary info
    - Each item shows: address, neighborhood, zoning, status badge
    - Clickable items to expand or view details
    - "View on Map" button to highlight lots on map
  - [ ] 4.4 Register renderVacantLotCard action in `apps/web/src/components/copilot/CopilotActions.tsx`
    - Add `renderVacantLotCard` action using useCopilotAction hook
    - Parameters: lotId (required)
    - Render VacantLotCard with status "inProgress" during query execution
    - Wire onFlyTo to map flyTo function
    - Wire onOpenStreetView to Street View modal/link
    - Wire onVisualize to visualizer flow
    - Add `renderVacantLotsList` action for search results
  - [ ] 4.5 Add "vacant-lot" card type to messages schema
    - Update card type union in `apps/web/convex/schema.ts` messages.cards
    - Add `v.literal("vacant-lot")` and `v.literal("vacant-lots-list")` to card type union
  - [ ] 4.6 Export components from `apps/web/src/components/copilot/index.ts`
    - Export VacantLotCard component
    - Export VacantLotsListCard component
    - Export VacantLotCardProps interface
  - [ ] 4.7 Ensure card tests pass
    - Run ONLY the 4-6 tests written in 4.1
    - Verify card renders correctly in chat panel
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 4.1 pass
- VacantLotCard renders with Street View image and property details
- VacantLotsListCard renders list of lots correctly
- CopilotKit actions trigger card rendering in chat
- Action buttons work correctly (fly to, street view, visualize)

---

### Agent Tools

#### Task Group 5: Voice & Agent Tools
**Dependencies:** Task Group 1

- [ ] 5.0 Complete voice and agent tool integration
  - [ ] 5.1 Write 4-6 focused tests for vacant lots agent tools
    - Test search_vacant_lots returns VacantLotSummary[] with correct fields
    - Test search_vacant_lots filters by neighborhood correctly
    - Test get_vacant_lot_details returns full VacantLotDetails
    - Test error handling returns { success: false, error: string }
  - [ ] 5.2 Add tool declarations to `apps/web/convex/agents/tools.ts`
    - Add `search_vacant_lots` tool declaration
      - Description: Search for city-owned vacant lots available for development
      - Parameters: neighborhood, zoning, propertyType, dispositionStatus, limit
      - Required: [] (all optional)
    - Add `get_vacant_lot_details` tool declaration
      - Description: Get detailed information about a specific vacant lot
      - Parameters: lotId (required)
    - Follow existing tool declaration patterns for search_homes_for_sale and get_home_details
  - [ ] 5.3 Add type interfaces for tool responses
    - Add `VacantLotSummary` interface: lotId, address, neighborhood, zoning, propertyType, dispositionStatus
    - Add `VacantLotDetails` interface: All VacantLotSummary fields plus coordinates, aldermanicDistrict, acquisitionDate, currentOwner, dispositionStrategy, status
  - [ ] 5.4 Implement tool functions in `apps/web/convex/agents/tools.ts`
    - `searchVacantLots(ctx, params)`: Call ctx.runQuery(api.vacantLots.searchLots), return VacantLotSummary[]
    - `getVacantLotDetails(ctx, params)`: Call ctx.runQuery(api.vacantLots.getById), return VacantLotDetails
    - Handle errors with { success: false, error: string } pattern
    - Follow patterns from searchHomesForSale and getHomeDetails
  - [ ] 5.5 Add tool handlers to zoning agent in `apps/web/convex/agents/zoning.ts`
    - Add case for "search_vacant_lots" in tool execution switch
    - Add case for "get_vacant_lot_details" in tool execution switch
    - Call tool implementation functions
  - [ ] 5.6 Ensure agent tools tests pass
    - Run ONLY the 4-6 tests written in 5.1
    - Verify tools return expected data shapes
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 5.1 pass
- search_vacant_lots returns filtered results correctly
- get_vacant_lot_details returns full lot information
- Agent can respond to "show me vacant lots in [neighborhood]" queries
- Error responses follow established pattern

---

### Polish & Integration

#### Task Group 6: LayerPanel & Integration Testing
**Dependencies:** Task Groups 1-5

- [ ] 6.0 Complete LayerPanel integration and final polish
  - [ ] 6.1 Add vacant lots toggle to LayerPanel
    - Add to "City Properties" section alongside "Homes for Sale"
    - Use green LandPlot icon from lucide-react
    - Toggle label: "Vacant Lots"
    - Wire visibility toggle to useVacantLotsLayer hook
    - Show count badge when layer is active
  - [ ] 6.2 Integration testing - Layer rendering
    - Trigger manual sync: `npx convex run vacantLots:triggerSync`
    - Verify circles render on map at correct coordinates
    - Verify colors match status (green for available, orange for pending)
    - Verify layer visibility toggle works
  - [ ] 6.3 Integration testing - Popup functionality
    - Click on vacant lot marker
    - Verify popup displays with correct lot details
    - Test "Analyze Lot" sends context to chat
    - Test "Open Street View" opens correct URL
    - Test "Capture & Visualize" triggers visualizer
    - Test popup closes correctly
  - [ ] 6.4 Integration testing - Voice queries
    - Test "Show me vacant lots in [neighborhood]" query
    - Verify agent uses search_vacant_lots tool
    - Verify VacantLotsListCard renders in chat
    - Test "Tell me about this vacant lot" with lot selected
    - Verify agent uses get_vacant_lot_details tool
    - Verify VacantLotCard renders with full details
  - [ ] 6.5 Integration testing - Card rendering
    - Verify VacantLotCard displays Street View image
    - Test "Fly to Location" button moves map
    - Test "Open Street View" opens correct URL
    - Test "Visualize Potential" triggers flow

**Acceptance Criteria:**
- Vacant lots layer toggle appears in LayerPanel under "City Properties"
- Layer renders correctly with status-based coloring
- Popup displays and all buttons function correctly
- Voice queries successfully trigger tools and render cards
- All integration flows work end-to-end

---

### Testing

#### Task Group 7: Test Review & Gap Analysis
**Dependencies:** Task Groups 1-6

- [ ] 7.0 Review existing tests and fill critical gaps only
  - [ ] 7.1 Review tests from Task Groups 1-6
    - Review the 4-6 tests written by data layer (Task 1.1)
    - Review the 4-6 tests written by layer manager (Task 2.1)
    - Review the 4-6 tests written by popup (Task 3.1)
    - Review the 4-6 tests written by card (Task 4.1)
    - Review the 4-6 tests written by agent tools (Task 5.1)
    - Total existing tests: approximately 20-30 tests
  - [ ] 7.2 Analyze test coverage gaps for vacant lots feature only
    - Identify critical user workflows that lack test coverage
    - Focus ONLY on gaps related to vacant lots feature requirements
    - Do NOT assess entire application test coverage
    - Prioritize end-to-end workflows over unit test gaps
  - [ ] 7.3 Write up to 8 additional strategic tests maximum
    - Add maximum of 8 new tests to fill identified critical gaps
    - Focus on integration points between components
    - Test full flow: click lot -> popup -> analyze -> chat -> card
    - Do NOT write comprehensive coverage for all scenarios
    - Skip edge cases unless business-critical
  - [ ] 7.4 Run feature-specific tests only
    - Run ONLY tests related to vacant lots feature
    - Expected total: approximately 28-38 tests maximum
    - Do NOT run the entire application test suite
    - Verify critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 28-38 tests total)
- Critical user workflows for vacant lots are covered
- No more than 8 additional tests added when filling gaps
- Testing focused exclusively on vacant lots feature requirements

---

## Execution Order

Recommended implementation sequence:

1. **Task Group 1: Convex Schema & Data Sync** (Data Layer)
   - Foundation for all other tasks
   - No dependencies

2. **Task Group 2: Layer Manager & Map Integration** (Map Layer)
   - Depends on Task Group 1 for data
   - Enables visual validation of data

3. **Task Group 3: Popup & UI Components** (UI)
   - Depends on Task Group 2 for click events
   - Completes map interaction flow

4. **Task Group 4: CopilotKit Card & Actions** (Generative UI)
   - Depends on Task Group 1 for queries
   - Can be done in parallel with Task Group 3

5. **Task Group 5: Voice & Agent Tools** (Agent Integration)
   - Depends on Task Group 1 for queries
   - Can be done in parallel with Task Groups 3-4

6. **Task Group 6: LayerPanel & Integration Testing** (Polish)
   - Depends on all previous task groups
   - Final integration and validation

7. **Task Group 7: Test Review & Gap Analysis** (Testing)
   - Depends on all previous task groups
   - Final validation and coverage check

---

## Key Files to Create

| File Path | Description |
|-----------|-------------|
| `apps/web/convex/schema.ts` | Update: Add vacantLots table |
| `apps/web/convex/vacantLots.ts` | New: CRUD queries for vacant lots |
| `apps/web/convex/ingestion/vacantLotsSync.ts` | New: ESRI sync action |
| `apps/web/convex/ingestion/vacantLotsSyncMutations.ts` | New: Upsert mutations |
| `apps/web/src/components/map/layers/vacant-lots-layer-manager.ts` | New: Mapbox layer manager |
| `apps/web/src/components/map/layers/useVacantLotsLayer.ts` | New: React hook for layer |
| `apps/web/src/components/map/VacantLotPopup.tsx` | New: Map popup component |
| `apps/web/src/components/copilot/VacantLotCard.tsx` | New: CopilotKit card |
| `apps/web/src/components/copilot/VacantLotsListCard.tsx` | New: List card for search results |
| `apps/web/convex/agents/tools.ts` | Update: Add vacant lot tools |
| `apps/web/convex/agents/zoning.ts` | Update: Add tool handlers |
| `apps/web/src/components/copilot/CopilotActions.tsx` | Update: Register card actions |
| `apps/web/src/components/map/layers/index.ts` | Update: Export new layer |
| `apps/web/src/components/copilot/index.ts` | Update: Export new cards |

---

## Reference Files

| Pattern | Reference File |
|---------|----------------|
| Schema table definition | `apps/web/convex/schema.ts` (homesForSale table) |
| CRUD queries | `apps/web/convex/homes.ts` |
| ESRI sync action | `apps/web/convex/ingestion/homesSync.ts` |
| Sync mutations | `apps/web/convex/ingestion/homesSyncMutations.ts` |
| Layer manager class | `apps/web/src/components/map/layers/homes-layer-manager.ts` |
| Map popup | `apps/web/src/components/map/HomePopup.tsx` |
| CopilotKit card | `apps/web/src/components/copilot/HomeCard.tsx` |
| Agent tools | `apps/web/convex/agents/tools.ts` |
