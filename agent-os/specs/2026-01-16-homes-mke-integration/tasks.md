# Task Breakdown: Homes MKE Integration

## Overview
Total Tasks: 36

This feature integrates the Homes_MKE_Properties ESRI FeatureServer into MKE.dev, enabling users to search for homes for sale via chat, view results on the map with highlighted markers, and access detailed property cards with listing information.

## Task List

### Database Layer

#### Task Group 1: Convex Schema and Sync Infrastructure
**Dependencies:** None

- [x] 1.0 Complete database layer for homes data
  - [x] 1.1 Write 4-6 focused tests for homesForSale schema and sync logic
    - Test homesForSale table schema validation
    - Test upsert logic (update existing by esriObjectId, insert new)
    - Test status field transitions (for_sale, sold, unknown)
    - Test UTM to WGS84 coordinate conversion accuracy
    - Test index queries (by_status, by_neighborhood, by_taxKey)
  - [x] 1.2 Add homesForSale table to Convex schema
    - Add to `apps/web/convex/schema.ts` following existing table patterns
    - Fields: esriObjectId (string), taxKey (string), address (string), neighborhood (string)
    - Fields: coordinates (array of numbers - WGS84 [lng, lat])
    - Fields: bedrooms (number), fullBaths (number), halfBaths (number)
    - Fields: buildingSqFt (number), yearBuilt (number)
    - Fields: status (v.union with literals: "for_sale", "sold", "unknown")
    - Fields: narrative (optional string), listingUrl (optional string), developerName (optional string)
    - Fields: lastSyncedAt (number), createdAt (number), updatedAt (number)
    - Add indexes: by_status, by_neighborhood, by_taxKey, by_esriObjectId
  - [x] 1.3 Create homesSync.ts ingestion action
    - Create `apps/web/convex/ingestion/homesSync.ts` with "use node" directive
    - Install proj4 dependency: `pnpm add proj4 @types/proj4`
    - Implement UTM Zone 54N (WKID 32054) to WGS84 conversion using proj4
    - Fetch from ESRI FeatureServer with pagination (max 2000 records per request)
    - Implement upsert logic: match by esriObjectId, update or insert
    - Mark records not in latest sync as "sold" or "unknown" status
    - Follow fetchWithRetry pattern from existing ingestion actions
    - Export internal action: syncFromESRI
  - [x] 1.4 Add homesForSale queries
    - Create `apps/web/convex/homes.ts` with query functions
    - Add `listForSale` query: filter by status="for_sale", optional neighborhood filter
    - Add `getByTaxKey` query: lookup by tax key
    - Add `getById` query: lookup by Convex document ID
    - Add `searchHomes` query: filter by neighborhood, bedroom range, bath minimum
  - [x] 1.5 Add weekly cron job for homes sync
    - Add to `apps/web/convex/crons.ts` following existing cron patterns
    - Schedule: Monday at 6:00 AM UTC using crons.weekly()
    - Call internal action: internal.ingestion.homesSync.syncFromESRI
  - [x] 1.6 Ensure database layer tests pass
    - Run ONLY the 4-6 tests written in 1.1
    - Verify schema deploys successfully with `pnpm convex dev`
    - Verify coordinate conversion produces valid WGS84 coordinates

**Acceptance Criteria:**
- homesForSale table deployed to Convex
- Sync action fetches and transforms ESRI data correctly
- UTM coordinates convert to WGS84 accurately (Milwaukee area: ~43.0 lat, ~-87.9 lng)
- Indexes support required query patterns
- Cron job scheduled for weekly sync

### Agent Tools Layer

#### Task Group 2: Agent Tools for Home Search
**Dependencies:** Task Group 1

- [x] 2.0 Complete agent tools for home search functionality
  - [x] 2.1 Write 4-6 focused tests for agent tools
    - Test search_homes_for_sale returns homes matching filters
    - Test search_homes_for_sale handles empty results gracefully
    - Test get_home_details returns full property information
    - Test get_home_details handles invalid homeId
    - Test tools return Convex document IDs for map highlighting
  - [x] 2.2 Add search_homes_for_sale tool declaration
    - Add to TOOL_DECLARATIONS array in `apps/web/convex/agents/tools.ts`
    - Parameters: neighborhood (optional string), minBedrooms (optional number), maxBedrooms (optional number), minBaths (optional number), limit (optional number, default 10)
    - Description: Search for homes currently for sale in Milwaukee with optional filters
    - Return type includes: homeId, address, neighborhood, bedrooms, fullBaths, halfBaths, buildingSqFt
  - [x] 2.3 Add get_home_details tool declaration
    - Add to TOOL_DECLARATIONS array in tools.ts
    - Parameters: homeId (required string - Convex document ID)
    - Description: Get full details for a specific home including narrative and listing URL
    - Return type includes all homesForSale fields plus coordinates
  - [x] 2.4 Implement tool execution functions
    - Add searchHomesForSale() function in tools.ts
    - Add getHomeDetails() function in tools.ts
    - Use existing Convex query patterns from homes.ts
    - Format response to match tool return types
  - [x] 2.5 Add tool handling in zoning agent
    - Add switch cases in `apps/web/convex/agents/zoning.ts` chat handler
    - Handle "search_homes_for_sale" tool call
    - Handle "get_home_details" tool call
    - Follow existing pattern: call tool implementation, track success, log to Opik tracer
  - [x] 2.6 Update SYSTEM_INSTRUCTION for home search
    - Add capability description for home search to zoning agent system prompt
    - Include guidance: when to use search_homes_for_sale vs get_home_details
    - Note: explain available filters (neighborhood, bedrooms, baths)
  - [x] 2.7 Ensure agent tools tests pass
    - Run ONLY the 4-6 tests written in 2.1
    - Verify tools appear in Gemini function calling declarations
    - Test tool execution via agent chat

**Acceptance Criteria:**
- Both tools appear in agent's available tools
- search_homes_for_sale filters work correctly
- get_home_details returns complete home information
- Agent can respond to home search queries naturally

### Map Layer

#### Task Group 3: Homes Map Layer with Highlighting
**Dependencies:** Task Group 1

- [x] 3.0 Complete homes map layer with highlight capability
  - [x] 3.1 Write 3-5 focused tests for HomesLayerManager
    - Test layer initialization with homes GeoJSON source
    - Test highlightHomes() method highlights correct markers
    - Test clearHighlights() removes all highlighting
    - Test click handler emits home selection events
  - [x] 3.2 Create HomesLayerManager class
    - Create `apps/web/src/components/map/layers/homes-layer-manager.ts`
    - Follow ESRILayerManager patterns for class structure
    - Constructor takes MapboxMap instance and event callbacks
    - Use GeoJSON source from Convex query (homes with status="for_sale")
    - Add circle layer with sky-500 color scheme for markers
    - Add highlight layer using feature-state pattern
  - [x] 3.3 Implement layer methods
    - addLayer(): Create GeoJSON source and circle layer
    - setLayerVisibility(visible: boolean): Toggle layer visibility
    - updateData(homes: HomeForSale[]): Refresh GeoJSON source data
    - highlightHomes(homeIds: string[]): Highlight multiple homes by ID using feature-state
    - clearHighlights(): Remove all highlighting
    - destroy(): Clean up layers and sources
  - [x] 3.4 Implement click handler
    - Setup click event on homes circle layer
    - Extract home ID and coordinates from clicked feature
    - Emit selection event via callback: onHomeClick(homeId, coordinates)
    - Update cursor on hover (pointer cursor)
  - [x] 3.5 Add layer config entry
    - Add homes layer config to `apps/web/src/components/map/layers/layer-config.ts`
    - Define LayerType union to include 'homes'
    - Set default visibility, color (sky-500), and icon styling
  - [x] 3.6 Export HomesLayerManager
    - Add export to `apps/web/src/components/map/layers/index.ts`
    - Export types: HomeClickEvent, HomesLayerManagerOptions
  - [x] 3.7 Ensure map layer tests pass
    - Run ONLY the 3-5 tests written in 3.1
    - Verify layer renders on map
    - Test highlight/unhighlight functionality

**Acceptance Criteria:**
- Homes appear as sky-500 circle markers on map
- highlightHomes() visually distinguishes selected homes
- Click handler provides home ID for card display
- Layer integrates with existing map layer system

### Frontend UI Components

#### Task Group 4: HomeCard and HomesListCard Components
**Dependencies:** Task Group 2, Task Group 3

- [x] 4.0 Complete UI components for home listings
  - [x] 4.1 Write 4-6 focused tests for UI components
    - Test HomeCard renders all property fields correctly
    - Test HomeCard loading state shows skeleton
    - Test HomeCard "View Listing" button opens external URL
    - Test HomesListCard renders list of homes
    - Test HomesListCard item click triggers flyTo and selection
  - [x] 4.2 Create HomeCard component
    - Create `apps/web/src/components/copilot/HomeCard.tsx`
    - Follow ParcelCard component structure and styling patterns
    - Props interface: address, neighborhood, coordinates, bedrooms, fullBaths, halfBaths, buildingSqFt, yearBuilt, narrative, listingUrl, status
    - Display sections: header with address/neighborhood, property details (beds/baths/sqft/year), narrative
    - Use RetroUI neobrutalist styling: border-2, shadow-[4px_4px_0], rounded-lg
    - Color scheme: sky-500 accents, stone backgrounds
  - [x] 4.3 Implement HomeCard actions
    - "View Listing" button: opens listingUrl in new tab (window.open)
    - "Fly to Location" button: uses MapContext or callback to fly to coordinates
    - Handle missing listingUrl: hide or disable button
    - Support loading state with animate-pulse skeleton UI
  - [x] 4.4 Create HomesListCard component
    - Create `apps/web/src/components/copilot/HomesListCard.tsx`
    - Props: homes array, onHomeSelect callback, status
    - Display result count header (e.g., "Found 5 homes for sale")
    - Render condensed list with: address, beds/baths, neighborhood
    - Each item clickable to trigger flyTo and show full HomeCard
    - Use consistent RetroUI styling with HomeCard
  - [x] 4.5 Add exports to copilot index
    - Export HomeCard from `apps/web/src/components/copilot/index.ts`
    - Export HomesListCard from index.ts
    - Export props interfaces: HomeCardProps, HomesListCardProps
  - [x] 4.6 Ensure UI component tests pass
    - Run ONLY the 4-6 tests written in 4.1
    - Verify components render without errors
    - Test loading and complete states

**Acceptance Criteria:**
- HomeCard displays all property information clearly
- View Listing opens external URL correctly
- HomesListCard shows search results compactly
- Clicking list item triggers map flyTo
- Both components follow RetroUI design system

### CopilotKit Integration

#### Task Group 5: Generative UI and Chat-to-Map Bridge
**Dependencies:** Task Group 2, Task Group 3, Task Group 4

- [x] 5.0 Complete CopilotKit integration and chat-to-map bridge
  - [x] 5.1 Write 3-5 focused tests for CopilotKit integration
    - Test useCopilotAction registers for search_homes_for_sale
    - Test useCopilotAction registers for get_home_details
    - Test HomeContent extracts home IDs and calls highlightHomes
    - Test GenerativeCard type includes home-listing and homes-list
  - [x] 5.2 Update GenerativeCard types
    - Modify `apps/web/src/components/chat/types.ts`
    - Add "home-listing" to card type union
    - Add "homes-list" to card type union
    - Define HomeListingCardData interface matching HomeCardProps
    - Define HomesListCardData interface matching HomesListCardProps
  - [x] 5.3 Register CopilotActions for home tools
    - Add to `apps/web/src/components/copilot/CopilotActions.tsx`
    - Register useCopilotAction for search_homes_for_sale
      - Render HomesListCard with results
      - Handle loading state (inProgress/executing)
      - Handle complete state with result array
    - Register useCopilotAction for get_home_details
      - Render HomeCard with full details
      - Handle loading state
      - Handle complete state
  - [x] 5.4 Update HomeContent for chat-to-map bridge
    - Modify `apps/web/src/app/HomeContent.tsx`
    - Import HomesLayerManager or access via MapContext
    - Listen for search_homes_for_sale tool completion
    - Extract home IDs from tool result
    - Call map layer's highlightHomes(homeIds) when results returned
    - Handle homes-list and home-listing card types in renderCard
  - [x] 5.5 Connect HomeCard flyTo to map
    - Pass flyTo callback from MapContext to HomeCard
    - Implement flyTo: call map.flyTo({ center: coordinates, zoom: 17 })
    - Highlight single home when HomeCard flyTo triggered
  - [x] 5.6 Ensure CopilotKit integration tests pass
    - Run ONLY the 3-5 tests written in 5.1
    - Verify generative UI renders in chat
    - Test map highlighting triggers on search results

**Acceptance Criteria:**
- search_homes_for_sale renders HomesListCard in chat
- get_home_details renders HomeCard in chat
- Search results trigger map highlights automatically
- flyTo from cards centers map on home location

### Testing

#### Task Group 6: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-5

- [x] 6.0 Review existing tests and fill critical gaps only
  - [x] 6.1 Review tests from Task Groups 1-5
    - Review the 4-6 tests from database layer (Task 1.1)
    - Review the 4-6 tests from agent tools (Task 2.1)
    - Review the 3-5 tests from map layer (Task 3.1)
    - Review the 4-6 tests from UI components (Task 4.1)
    - Review the 3-5 tests from CopilotKit integration (Task 5.1)
    - Total existing tests: approximately 18-28 tests
  - [x] 6.2 Analyze test coverage gaps for Homes MKE feature only
    - Identify critical user workflows lacking coverage:
      - User asks "show me homes for sale in Bay View"
      - User clicks on highlighted home marker
      - User clicks "View Listing" to open external URL
    - Focus ONLY on gaps related to this spec's feature requirements
    - Prioritize end-to-end workflows over unit test gaps
  - [x] 6.3 Write up to 8 additional strategic tests maximum
    - Test end-to-end: chat query -> tool call -> map highlight -> card display
    - Test map marker click -> HomeCard display
    - Test HomesListCard item click -> flyTo -> single home highlight
    - Test coordinate conversion edge cases (if not covered)
    - Do NOT write comprehensive coverage for all scenarios
  - [x] 6.4 Run feature-specific tests only
    - Run ONLY tests related to Homes MKE Integration feature
    - Expected total: approximately 26-36 tests maximum
    - Do NOT run the entire application test suite
    - Verify all critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass
- Critical user workflows for home search are covered
- No more than 8 additional tests added when filling gaps
- Testing focused exclusively on Homes MKE Integration

## Execution Order

Recommended implementation sequence:
1. **Database Layer (Task Group 1)** - Foundation: schema, sync, queries, cron
2. **Agent Tools Layer (Task Group 2)** - Chat integration: tool declarations and handlers
3. **Map Layer (Task Group 3)** - Visual: homes layer with highlighting
4. **Frontend UI Components (Task Group 4)** - Cards: HomeCard and HomesListCard
5. **CopilotKit Integration (Task Group 5)** - Glue: generative UI and chat-to-map bridge
6. **Test Review & Gap Analysis (Task Group 6)** - Validation: ensure quality

## Technical Notes

### Coordinate Conversion
The ESRI FeatureServer uses UTM Zone 54N (WKID 32054). Use proj4 for conversion:
```typescript
import proj4 from 'proj4';

// Define UTM Zone 54N projection
proj4.defs('EPSG:32054', '+proj=lcc +lat_1=45.5 +lat_2=42.73333333333333 +lat_0=42 +lon_0=-90 +x_0=600000 +y_0=0 +datum=NAD83 +units=us-ft +no_defs');

// Convert UTM to WGS84
const [lng, lat] = proj4('EPSG:32054', 'EPSG:4326', [utmX, utmY]);
```

### RetroUI Styling Reference
```css
/* Card container */
border-2 border-black dark:border-white
rounded-lg
bg-white dark:bg-stone-900
shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white]

/* Primary accent */
bg-sky-500 hover:bg-sky-600

/* Loading skeleton */
animate-pulse bg-stone-300 dark:bg-stone-600
```

### Existing Patterns to Follow
- **Schema**: `apps/web/convex/schema.ts` - parcels, documents tables
- **Ingestion**: `apps/web/convex/ingestion/gemini.ts` - action patterns, fetchWithRetry
- **Tools**: `apps/web/convex/agents/tools.ts` - TOOL_DECLARATIONS structure
- **Layer Manager**: `apps/web/src/components/map/layers/esri-layer-manager.ts`
- **Cards**: `apps/web/src/components/copilot/ParcelCard.tsx`
- **CopilotActions**: `apps/web/src/components/copilot/CopilotActions.tsx`
- **Crons**: `apps/web/convex/crons.ts` - weekly scheduling

## Dependencies to Install

```bash
# For UTM to WGS84 coordinate conversion
pnpm add proj4
pnpm add -D @types/proj4
```
