# Task Breakdown: Commercial Properties & Development Sites Integration

## Overview
Total Tasks: 7 Task Groups, ~35 Sub-tasks

This feature integrates Browse.ai scraped commercial property and development site data into MKE.dev, enabling users to search for commercial real estate through conversational AI and interactive map visualization.

## Task List

### Phase 1: Database & Schema

#### Task Group 1: Convex Schema Extensions
**Dependencies:** None

- [ ] 1.0 Complete database schema additions
  - [ ] 1.1 Add `commercialProperties` table to `convex/schema.ts`
    - Fields: `browseAiTaskId`, `address`, `coordinates`, `propertyType`, `buildingSqFt`, `lotSizeSqFt`, `zoning`, `askingPrice`, `pricePerSqFt`, `contactInfo`, `listingUrl`, `description`, `status`, `lastSyncedAt`, `createdAt`, `updatedAt`
    - Property type enum: `retail`, `office`, `industrial`, `warehouse`, `mixed-use`, `land`
    - Status enum: `available`, `sold`, `pending`, `unknown`
    - Indexes: `by_browseAiTaskId`, `by_status`, `by_propertyType`, `by_zoning`
  - [ ] 1.2 Add `developmentSites` table to `convex/schema.ts`
    - Fields: `browseAiTaskId`, `address`, `coordinates`, `siteName`, `lotSizeSqFt`, `zoning`, `askingPrice`, `currentUse`, `proposedUse`, `incentives`, `contactInfo`, `listingUrl`, `description`, `status`, `lastSyncedAt`, `createdAt`, `updatedAt`
    - Status enum: `available`, `sold`, `pending`, `unknown`
    - Incentives: optional array of strings (e.g., `["TIF", "Opportunity Zone"]`)
    - Indexes: `by_browseAiTaskId`, `by_status`, `by_zoning`
  - [ ] 1.3 Add new card types to `messages` table schema
    - Add `commercial-property`, `commercial-properties-list`, `development-site`, `development-sites-list` to cards type union
  - [ ] 1.4 Run `pnpm convex dev` to generate types and verify schema compiles

**Acceptance Criteria:**
- Schema compiles without errors
- New tables appear in Convex dashboard
- TypeScript types generate correctly in `_generated/dataModel.d.ts`

---

### Phase 2: Browse.ai Sync

#### Task Group 2: Commercial Properties Sync
**Dependencies:** Task Group 1

- [ ] 2.0 Complete commercial properties sync implementation
  - [ ] 2.1 Create `convex/ingestion/commercialSync.ts` following `homesSync.ts` pattern
    - Use Node.js runtime (`"use node"`)
    - Browse.ai API endpoint: `GET https://api.browse.ai/v2/robots/{robotId}/tasks`
    - Commercial robot ID: `019bd1dc-df2e-7747-8e54-142a383e8822`
    - Parse `capturedLists.Properties` array from response
    - Implement `fetchWithRetry` helper (3 retries, 1000ms base delay with exponential backoff)
  - [ ] 2.2 Add Mapbox geocoding helper function in `commercialSync.ts`
    - Geocode addresses using Mapbox Geocoding API
    - Apply Milwaukee bounding box: `-88.1,42.8,-87.8,43.2`
    - Validate coordinates are within Milwaukee area (lat 42.5-44.0, lng -89.0 to -87.0)
    - Batch geocoding requests (10 concurrent max) to avoid rate limits
    - Skip properties that fail geocoding with warning log
  - [ ] 2.3 Create `convex/ingestion/commercialSyncMutations.ts`
    - Implement `upsertCommercialProperties` internal mutation
    - Use `browseAiTaskId` as unique identifier for upsert logic
    - Preserve `createdAt` on updates, always update `updatedAt` and `lastSyncedAt`
    - Mark properties not in latest sync as status `unknown`
  - [ ] 2.4 Create `syncCommercialProperties` internal action that:
    - Fetches from Browse.ai API
    - Geocodes addresses
    - Batch upserts to database (batch size: 100)
  - [ ] 2.5 Test sync manually via Convex dashboard: `npx convex run ingestion/commercialSync:syncCommercialProperties`

**Acceptance Criteria:**
- Sync fetches data from Browse.ai successfully
- Properties are geocoded and stored with valid coordinates
- Upsert logic correctly handles new and existing records

#### Task Group 3: Development Sites Sync
**Dependencies:** Task Group 2

- [ ] 3.0 Complete development sites sync implementation
  - [ ] 3.1 Add `syncDevelopmentSites` internal action to `commercialSync.ts`
    - Development sites robot ID: `019bd1ff-bd45-7594-a466-ed701e505915`
    - Reuse `fetchWithRetry` and geocoding helpers from Task Group 2
  - [ ] 3.2 Add `upsertDevelopmentSites` internal mutation to `commercialSyncMutations.ts`
    - Same upsert pattern as commercial properties
    - Handle incentives array field
  - [ ] 3.3 Add cron jobs to `convex/crons.ts`
    - Commercial properties sync: Monday at 7:00 AM UTC
    - Development sites sync: Monday at 7:30 AM UTC
    - Call internal actions: `internal.ingestion.commercialSync.syncCommercialProperties` and `internal.ingestion.commercialSync.syncDevelopmentSites`
  - [ ] 3.4 Test development sites sync manually

**Acceptance Criteria:**
- Development sites sync fetches and stores data correctly
- Cron jobs are registered and visible in Convex dashboard
- Both syncs can run independently without conflicts

---

### Phase 3: Query Functions

#### Task Group 4: Convex Queries
**Dependencies:** Task Group 3

- [ ] 4.0 Complete query functions
  - [ ] 4.1 Create `convex/commercialProperties.ts` with queries
    - `searchProperties`: Filter by propertyType, minSqFt, maxSqFt, maxPrice, zoning, limit
    - `getById`: Get single property by Convex document ID
    - `getByZoning`: Get properties by zoning code
    - `getStats`: Return counts by status and property type
    - `getForMap`: Return minimal data for GeoJSON rendering (id, coordinates, address, propertyType)
    - `triggerSync`: Public action to manually trigger sync
  - [ ] 4.2 Create `convex/developmentSites.ts` with queries
    - `searchSites`: Filter by minLotSize, maxPrice, zoning, incentive, limit
    - `getById`: Get single site by Convex document ID
    - `getStats`: Return counts by status
    - `getForMap`: Return minimal data for GeoJSON rendering
    - `triggerSync`: Public action to manually trigger sync
  - [ ] 4.3 Verify queries work via Convex dashboard function runner

**Acceptance Criteria:**
- All queries return expected data shapes
- Filtering works correctly
- `getForMap` returns minimal data suitable for map rendering

---

### Phase 4: Agent Tools

#### Task Group 5: Gemini Agent Tool Integration
**Dependencies:** Task Group 4

- [ ] 5.0 Complete agent tool integration
  - [ ] 5.1 Add tool declarations to `TOOL_DECLARATIONS` array in `convex/agents/tools.ts`
    - `search_commercial_properties`: params `propertyType`, `minSqFt`, `maxSqFt`, `maxPrice`, `zoning`, `limit`
    - `search_development_sites`: params `minLotSize`, `maxPrice`, `zoning`, `incentive`, `limit`
    - `get_commercial_property_details`: param `propertyId` (Convex document ID)
    - `get_development_site_details`: param `siteId` (Convex document ID)
  - [ ] 5.2 Implement tool functions in `convex/agents/tools.ts`
    - `searchCommercialProperties(ctx, params)`: Call `api.commercialProperties.searchProperties`
    - `searchDevelopmentSites(ctx, params)`: Call `api.developmentSites.searchSites`
    - `getCommercialPropertyDetails(ctx, params)`: Call `api.commercialProperties.getById`
    - `getDevelopmentSiteDetails(ctx, params)`: Call `api.developmentSites.getById`
    - Return consistent response shape: `{ success: boolean, properties/sites?: [], error?: string }`
  - [ ] 5.3 Add tool execution handlers in `convex/agents/zoning.ts` switch statement
  - [ ] 5.4 Update system instruction in agent to mention commercial properties and development sites capabilities
  - [ ] 5.5 Test tools via chat: "Show me commercial properties for sale", "Find development sites with TIF incentives"

**Acceptance Criteria:**
- Agent can search for commercial properties via natural language
- Agent can search for development sites via natural language
- Agent returns structured property/site data for rendering

---

### Phase 5: CopilotKit Components

#### Task Group 6: Generative UI Cards
**Dependencies:** Task Group 5

- [ ] 6.0 Complete CopilotKit card components
  - [ ] 6.1 Create `src/components/copilot/CommercialPropertyCard.tsx`
    - Follow `HomeCard.tsx` structure and styling
    - Display: address, property type badge, building sqft, lot size, asking price, price/sqft, zoning, contact info, description
    - Property type badge colors: retail (blue), office (purple), industrial (gray), warehouse (orange), mixed-use (teal), land (green)
    - Action buttons: View Listing, Fly to Location
    - RetroUI neobrutalist styling with violet-500 accent color
  - [ ] 6.2 Create `src/components/copilot/DevelopmentSiteCard.tsx`
    - Display: site name, address, lot size, zoning, asking price, current/proposed use, incentives badges
    - Incentives badges: TIF (amber), Opportunity Zone (emerald), other (gray)
    - Action buttons: View Listing, Fly to Location
    - RetroUI neobrutalist styling with green-500 accent color
  - [ ] 6.3 Create `src/components/copilot/CommercialPropertiesListCard.tsx`
    - Follow `HomesListCard.tsx` pattern
    - Compact list view with property type badges
    - Click handler for property selection
  - [ ] 6.4 Create `src/components/copilot/DevelopmentSitesListCard.tsx`
    - Compact list view with incentive badges
    - Click handler for site selection
  - [ ] 6.5 Register actions in `src/components/copilot/CopilotActions.tsx`
    - `search_commercial_properties` renders `CommercialPropertiesListCard`
    - `get_commercial_property_details` renders `CommercialPropertyCard`
    - `search_development_sites` renders `DevelopmentSitesListCard`
    - `get_development_site_details` renders `DevelopmentSiteCard`
  - [ ] 6.6 Export components from `src/components/copilot/index.ts`
  - [ ] 6.7 Verify cards render correctly in chat interface

**Acceptance Criteria:**
- Cards render with correct data and styling
- Action buttons work (View Listing opens URL, Fly to Location triggers map callback)
- Loading states display skeleton UI
- Cards match neobrutalist design system

---

### Phase 6: Map Layers

#### Task Group 7: Mapbox Layer Integration
**Dependencies:** Task Group 6

- [ ] 7.0 Complete map layer integration
  - [ ] 7.1 Create `src/components/map/layers/commercial-properties-layer-manager.ts`
    - Follow `homes-layer-manager.ts` class structure
    - Source ID: `commercial-properties-source`
    - Layer ID: `commercial-properties-circles`
    - Purple circle markers (`#a855f7` / violet-500)
    - Highlight color: amber-500
    - Methods: `addLayer`, `updateData`, `highlightProperties`, `clearHighlights`, `destroy`, `setLayerVisibility`
    - Click handler emits `onPropertyClick` event
  - [ ] 7.2 Create `src/components/map/layers/development-sites-layer-manager.ts`
    - Source ID: `development-sites-source`
    - Layer ID: `development-sites-circles`
    - Green circle markers (`#22c55e` / green-500)
    - Highlight color: amber-500
    - Click handler emits `onSiteClick` event
  - [ ] 7.3 Create `src/components/map/layers/useCommercialPropertiesLayer.ts` hook
    - Fetch data from `api.commercialProperties.getForMap`
    - Initialize and manage `CommercialPropertiesLayerManager` instance
    - Handle visibility toggle
  - [ ] 7.4 Create `src/components/map/layers/useDevelopmentSitesLayer.ts` hook
    - Fetch data from `api.developmentSites.getForMap`
    - Initialize and manage `DevelopmentSitesLayerManager` instance
  - [ ] 7.5 Register layers in `src/components/map/layers/layer-config.ts`
    - Add layer configurations with IDs and default visibility (off by default)
  - [ ] 7.6 Export from `src/components/map/layers/index.ts`
  - [ ] 7.7 Add layer toggles to map layer panel UI
  - [ ] 7.8 Verify layers render on map with correct colors and click handlers work

**Acceptance Criteria:**
- Commercial properties display as purple circles on map
- Development sites display as green circles on map
- Clicking markers triggers property/site selection
- Highlights work when agent returns search results
- Layer toggles control visibility

---

### Phase 7: Testing & Integration

#### Task Group 8: Manual Testing & Verification
**Dependencies:** Task Groups 1-7

- [ ] 8.0 Complete integration testing
  - [ ] 8.1 Manual sync test
    - Run `npx convex run commercialProperties:triggerSync`
    - Run `npx convex run developmentSites:triggerSync`
    - Verify data appears in Convex dashboard
  - [ ] 8.2 Agent tool testing
    - Test: "Show me commercial properties in downtown Milwaukee"
    - Test: "Find industrial warehouses under $500,000"
    - Test: "Are there any development sites with TIF incentives?"
    - Test: "Tell me more about [property address]"
    - Verify cards render with correct data
  - [ ] 8.3 Map layer testing
    - Toggle commercial properties layer on
    - Verify purple markers appear at correct locations
    - Click marker and verify popup/selection works
    - Toggle development sites layer on
    - Verify green markers appear
    - Test layer visibility toggling
  - [ ] 8.4 End-to-end chat flow testing
    - Search -> List Card -> Select -> Detail Card -> Fly to Location
    - Verify map highlights and flies to selected property
    - Verify Street View button works (if coordinates available)

**Acceptance Criteria:**
- All sync operations complete successfully
- Agent responds to natural language queries about commercial properties
- Cards display correct information
- Map layers work correctly with highlighting
- Full user workflow functions end-to-end

---

## Execution Order

Recommended implementation sequence:

1. **Phase 1: Database & Schema** (Task Group 1)
   - Must be completed first as all other tasks depend on schema

2. **Phase 2: Browse.ai Sync** (Task Groups 2-3)
   - Sync must work before queries can return data
   - Commercial sync first, then development sites

3. **Phase 3: Query Functions** (Task Group 4)
   - Queries needed before agent tools can call them

4. **Phase 4: Agent Tools** (Task Group 5)
   - Tools needed before CopilotKit can render results

5. **Phase 5: CopilotKit Components** (Task Group 6)
   - Cards needed for complete user experience

6. **Phase 6: Map Layers** (Task Group 7)
   - Can be done in parallel with Phase 5 if desired

7. **Phase 7: Testing** (Task Group 8)
   - Final verification after all features complete

---

## Reference Files

| Purpose | File Path |
|---------|-----------|
| Schema pattern | `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/convex/schema.ts` |
| Sync action pattern | `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/convex/ingestion/homesSync.ts` |
| Sync mutation pattern | `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/convex/ingestion/homesSyncMutations.ts` |
| Query pattern | `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/convex/homes.ts` |
| Agent tools pattern | `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/convex/agents/tools.ts` |
| Card component pattern | `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/copilot/HomeCard.tsx` |
| List card pattern | `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/copilot/HomesListCard.tsx` |
| CopilotActions pattern | `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/copilot/CopilotActions.tsx` |
| Layer manager pattern | `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/map/layers/homes-layer-manager.ts` |
| Cron jobs | `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/convex/crons.ts` |

---

## Environment Variables Required

```bash
# Browse.ai API (for sync)
BROWSE_AI_API_KEY=your-browse-ai-api-key

# Mapbox (for geocoding - already configured)
MAPBOX_ACCESS_TOKEN=pk.ey...
```

---

## Notes

- Browse.ai robot IDs are specific to the MKE.dev account configuration
- Geocoding is required because Browse.ai data does not include coordinates
- Weekly cron schedule aligns with existing homes sync (Monday mornings)
- Layer colors chosen to differentiate from existing homes layer (sky-500)
- All cards follow RetroUI neobrutalist styling with appropriate accent colors
