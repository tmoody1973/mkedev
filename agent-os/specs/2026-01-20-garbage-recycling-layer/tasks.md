# Task Breakdown: Garbage & Recycling Collection Layer

## Overview
Total Tasks: 40
Total Task Groups: 6

This spec integrates Milwaukee DPW Sanitation collection data into MKE.dev, enabling map visualization of garbage/recycling routes and voice/chat queries for collection schedules.

---

## Task List

### Tile Builder Infrastructure

#### Task Group 1: Tile Builder Setup & ESRI Export
**Dependencies:** None

- [ ] 1.0 Complete tile-builder sanitation layer configuration
  - [ ] 1.1 Write 3 focused tests for sanitation tile-builder config
    - Test that sanitation layer configs have correct ESRI URLs
    - Test that all 5 garbage day layers (A-E) are defined
    - Test that recycling summer/winter layers are defined
  - [ ] 1.2 Add sanitation layer configs to `packages/tile-builder/src/config.ts`
    - Add SANITATION_LAYER_CONFIGS array with garbage routes A-E (layers 3-7)
    - Add recycling summer layer 12 and winter layer 13
    - Use ESRI_BASE + `/DPW/DPW_Sanitation/MapServer` URL pattern
    - Set outSR=4326 (WGS84) and minZoom 10, maxZoom 16
    - Set outFields: ['*'] to capture ROUTE_ID, COLLECTION_DAY properties
  - [ ] 1.3 Create `packages/tile-builder/src/export-sanitation.ts`
    - Export function `exportSanitationLayers()` using existing `queryWithPagination`
    - Export each garbage day (A-E) as separate GeoJSON files
    - Export recycling summer and winter as separate GeoJSON files
    - Reuse `arcgisToGeoJSON` conversion from export-layer.ts
  - [ ] 1.4 Update `packages/tile-builder/src/build-tiles.ts`
    - Add `buildSanitationTiles()` function
    - Use tippecanoe source-layer naming: garbage-day-a, garbage-day-b, garbage-day-c, garbage-day-d, garbage-day-e, recycling-summer, recycling-winter
    - Generate separate `sanitation.pmtiles` file (not combined with milwaukee.pmtiles)
  - [ ] 1.5 Add SANITATION_PMTILES_FILENAME constant to config.ts
    - Set value: 'sanitation.pmtiles'
  - [ ] 1.6 Update `packages/tile-builder/src/upload.ts` for sanitation tiles
    - Add function to upload sanitation.pmtiles to R2
    - Use same R2_CONFIG pattern as milwaukee.pmtiles
  - [ ] 1.7 Run tile-builder sanitation tests
    - Execute only the 3 tests written in 1.1
    - Verify configs compile without errors

**Acceptance Criteria:**
- Sanitation layer configs defined with correct ESRI URLs and layer numbers
- Export script successfully fetches garbage and recycling routes from ESRI
- tippecanoe generates sanitation.pmtiles with correct source-layer names
- Upload to R2 succeeds with accessible public URL

---

### Layer Manager & Configuration

#### Task Group 2: Layer Config & SanitationLayerManager
**Dependencies:** Task Group 1

- [ ] 2.0 Complete layer config and manager implementation
  - [ ] 2.1 Write 4 focused tests for sanitation layer functionality
    - Test GarbageLayerType union type includes all days A-E
    - Test GARBAGE_DAY_COLORS has correct hex values for each day
    - Test getRecyclingSeasonLayer returns correct season based on date
    - Test SanitationLayerManager initializes with correct PMTiles URL
  - [ ] 2.2 Add sanitation types to `apps/web/src/components/map/layers/layer-config.ts`
    - Add `GarbageDay` union type: 'A' | 'B' | 'C' | 'D' | 'E'
    - Add `SanitationLayerType` union type: 'garbage' | 'recycling'
    - Update `LayerType` to include SanitationLayerType
    - Add `GARBAGE_DAY_COLORS` constant with 5 distinct hex colors
    - Add `GARBAGE_LAYER_CONFIG` following ESRILayerConfig pattern
    - Add `RECYCLING_LAYER_CONFIG` following ESRILayerConfig pattern
    - Include legendItems array mapping days A-E to colors and weekday names
  - [ ] 2.3 Create `apps/web/src/components/map/layers/sanitation-layer-manager.ts`
    - Follow PMTilesLayerManager class structure
    - Load from NEXT_PUBLIC_SANITATION_PMTILES_URL env var
    - Create `SanitationLayerManagerOptions` interface with map, pmtilesUrl, onFeatureClick
    - Implement `initialize()` method with retry logic (copy pattern from PMTilesLayerManager)
    - Implement garbage day color expression using Mapbox match expression on COLLECTION_DAY property
    - Add separate layers for garbage and recycling with appropriate source-layer references
  - [ ] 2.4 Add recycling season switcher helper
    - Create `getRecyclingSeasonLayer()` function
    - Return 'summer' for March 15 - October 31
    - Return 'winter' for November 1 - March 14
    - Use in SanitationLayerManager to select correct recycling source-layer
  - [ ] 2.5 Add click handler to SanitationLayerManager
    - Emit collection day letter, route ID, and feature properties
    - Include coordinates for popup positioning
    - Follow onFeatureClick pattern from PMTilesLayerManager
  - [ ] 2.6 Implement setLayerVisibility and setLayerOpacity methods
    - Follow patterns from PMTilesLayerManager
    - Handle garbage and recycling layers independently
  - [ ] 2.7 Create `apps/web/src/components/map/layers/useSanitationLayer.ts` hook
    - Initialize SanitationLayerManager on map load
    - Handle layer visibility state
    - Handle feature click events
    - Cleanup on unmount
  - [ ] 2.8 Run layer manager tests
    - Execute only the 4 tests written in 2.1
    - Verify types compile correctly

**Acceptance Criteria:**
- GarbageLayerType and colors properly defined
- SanitationLayerManager loads sanitation.pmtiles and renders layers
- Season switcher correctly determines summer/winter recycling layer
- Click handler emits collection info for popup display

---

### Map UI Integration

#### Task Group 3: Map Integration & UI Components
**Dependencies:** Task Group 2

- [ ] 3.0 Complete map integration and UI components
  - [ ] 3.1 Write 3 focused tests for sanitation UI components
    - Test SanitationPopup renders collection day and next date
    - Test LayerPanel renders City Services section with toggles
    - Test sanitation layers respond to visibility toggles
  - [ ] 3.2 Create `apps/web/src/components/map/SanitationPopup.tsx`
    - Display collection day letter and full weekday name (e.g., "Day A - Monday")
    - Show route ID from feature properties
    - Calculate and display next collection date
    - Add holiday delay indicator (show warning when within 7 days of holiday)
    - Style with RetroUI neobrutalist patterns (border, box-shadow)
  - [ ] 3.3 Create `apps/web/src/components/map/SanitationLayerLoader.tsx`
    - Use useSanitationLayer hook
    - Connect to MapContext for layer visibility state
    - Pass onFeatureClick to show SanitationPopup
  - [ ] 3.4 Update MapContainer to include SanitationLayerLoader
    - Add SanitationLayerLoader component inside map container
    - Conditionally render based on sanitation PMTiles URL availability
  - [ ] 3.5 Update LayerPanel with City Services section
    - Add new collapsible "City Services" section
    - Add "Garbage Collection" toggle with legend showing day colors
    - Add "Recycling" toggle
    - Follow existing toggle pattern from zoning/parcels layers
    - Display current recycling season (Summer/Winter) as badge
  - [ ] 3.6 Update MapContext for sanitation layer visibility
    - Add `garbage` and `recycling` to layerVisibility state
    - Default both to false (opt-in layers)
  - [ ] 3.7 Export sanitation components from layers/index.ts
    - Export SanitationLayerManager, useSanitationLayer, getSanitationPMTilesUrl
  - [ ] 3.8 Run UI component tests
    - Execute only the 3 tests written in 3.1
    - Verify components render without errors

**Acceptance Criteria:**
- SanitationPopup displays collection info with next collection date
- SanitationLayerLoader integrates with MapContext
- LayerPanel shows City Services section with garbage/recycling toggles
- Layers toggle visibility correctly

---

### Holiday & Cron Infrastructure

#### Task Group 4: Holiday Utilities & Cron Jobs
**Dependencies:** None (can run in parallel with Groups 2-3)

- [ ] 4.0 Complete holiday utilities and cron infrastructure
  - [ ] 4.1 Write 4 focused tests for holiday utilities
    - Test getNextHoliday returns correct upcoming holiday
    - Test isCollectionDelayed returns true for day after holiday
    - Test getNextCollectionDate accounts for holiday delays
    - Test calculateFloatingHoliday correctly computes Memorial Day/Labor Day/Thanksgiving
  - [ ] 4.2 Create `apps/web/src/lib/sanitation/holiday-utils.ts`
    - Define COLLECTION_HOLIDAYS array with fixed dates (Jan 1, Jul 4, Dec 25)
    - Add floating holiday calculations for Memorial Day (last Monday of May), Labor Day (first Monday of September), Thanksgiving (fourth Thursday of November)
    - Implement `getNextHoliday(fromDate?: Date)` - returns {name, date} or null
    - Implement `isCollectionDelayed(collectionDate: Date)` - returns boolean
    - Implement `getNextCollectionDate(collectionDay: GarbageDay, fromDate?: Date)` - returns Date
    - Implement `getHolidayDelayMessage(holiday: {name: string, date: Date})` - returns user-friendly message
  - [ ] 4.3 Create `apps/web/convex/ingestion/sanitationSync.ts`
    - Create internal action `triggerSanitationTileRefresh`
    - This will be a placeholder that logs refresh trigger (actual tile refresh requires tile-builder CLI)
    - Add mutation to track last refresh timestamp in a sanitationMetadata table
  - [ ] 4.4 Add cron entries to `apps/web/convex/crons.ts`
    - Add cron.scheduled() entries for pre-holiday refreshes
    - Schedule 2 days before: New Year's Day (Dec 30), Memorial Day, July 4th (Jul 2), Labor Day, Thanksgiving, Christmas (Dec 23)
    - Call internal.ingestion.sanitationSync.triggerSanitationTileRefresh
    - Add comments documenting each holiday target
  - [ ] 4.5 Run holiday utility tests
    - Execute only the 4 tests written in 4.1
    - Verify date calculations are correct

**Acceptance Criteria:**
- Holiday utilities correctly identify collection-affecting holidays
- Floating holiday calculations work for Memorial Day, Labor Day, Thanksgiving
- Cron jobs scheduled for 2 days before each major holiday
- getNextCollectionDate accounts for holiday delays

---

### Voice & Agent Integration

#### Task Group 5: Voice & Agent Tools
**Dependencies:** Task Groups 2, 4

- [ ] 5.0 Complete voice and agent tool integration
  - [ ] 5.1 Write 3 focused tests for collection schedule tool
    - Test query_collection_schedule tool declaration schema is valid
    - Test tool returns correct collection day for known address
    - Test tool returns holiday delay info when applicable
  - [ ] 5.2 Add query_collection_schedule to TOOL_DECLARATIONS in `apps/web/convex/agents/tools.ts`
    - Parameters: address (required string), includeRecycling (optional boolean, default true)
    - Description: "Find garbage and recycling collection schedule for a Milwaukee address"
    - Add to existing TOOL_DECLARATIONS array following same pattern
  - [ ] 5.3 Implement queryCollectionSchedule tool function in tools.ts
    - Geocode address using existing geocodeAddress function
    - Query DPW_Sanitation layers via ESRI REST point-in-polygon
    - Use fetchWithRetry for reliability
    - Return: collectionDay, weekdayName, routeId, nextGarbageDate, nextRecyclingDate, holidayDelay
  - [ ] 5.4 Add voice tool to `apps/web/src/lib/voice/voice-tools.ts`
    - Add query_collection_schedule to VOICE_TOOL_DECLARATIONS
    - Match parameter schema from agent tools
    - Add to VOICE_SYSTEM_INSTRUCTION context explaining collection schedule capability
  - [ ] 5.5 Add tool handler in voice session hook
    - Add case for 'query_collection_schedule' in tool response handler
    - Call the queryCollectionSchedule function
    - Format response for voice output (readable dates, clear day names)
  - [ ] 5.6 Register tool in zoning agent for chat integration
    - Add to tool list in `apps/web/convex/agents/zoning.ts` if not auto-registered
    - Ensure agent system prompt mentions collection schedule capability
  - [ ] 5.7 Run voice tool tests
    - Execute only the 3 tests written in 5.1
    - Verify tool declarations are valid

**Acceptance Criteria:**
- query_collection_schedule tool declared with correct schema
- Tool implementation geocodes and queries ESRI successfully
- Voice tool integrated with handler for spoken responses
- Zoning agent can answer collection schedule questions

---

### Testing & Polish

#### Task Group 6: Test Review & Final Verification
**Dependencies:** Task Groups 1-5

- [ ] 6.0 Review and verify complete implementation
  - [ ] 6.1 Review tests from Task Groups 1-5
    - Review 3 tests from tile-builder (Task 1.1)
    - Review 4 tests from layer manager (Task 2.1)
    - Review 3 tests from UI components (Task 3.1)
    - Review 4 tests from holiday utilities (Task 4.1)
    - Review 3 tests from voice tools (Task 5.1)
    - Total existing tests: 17 tests
  - [ ] 6.2 Analyze test coverage gaps for sanitation feature
    - Check end-to-end flow: map layer render -> click -> popup
    - Check voice query flow: voice input -> tool call -> response
    - Check cron trigger flow: scheduled time -> action called
    - Identify any critical untested paths
  - [ ] 6.3 Write up to 6 additional integration tests if needed
    - Test full map layer lifecycle (load, toggle, click, popup)
    - Test collection schedule calculation with different days
    - Test holiday delay scenarios
    - Test voice tool response formatting
  - [ ] 6.4 Manual verification checklist
    - [ ] Verify sanitation.pmtiles loads from R2 URL
    - [ ] Verify garbage routes display with correct day colors
    - [ ] Verify recycling layer auto-selects correct season
    - [ ] Verify click popup shows collection info and next date
    - [ ] Verify holiday delay indicator appears when appropriate
    - [ ] Verify LayerPanel toggles work for City Services section
    - [ ] Verify voice query "When is garbage pickup at [address]?" works
    - [ ] Verify chat query returns collection schedule
  - [ ] 6.5 Run all feature-specific tests
    - Run 17 existing tests + up to 6 new tests
    - Expected total: 17-23 tests
    - Verify all pass

**Acceptance Criteria:**
- All 17-23 feature-specific tests pass
- Map layers render and respond to interactions
- Voice and chat queries return accurate collection schedules
- Holiday delay indicators display correctly
- Manual verification checklist complete

---

## Execution Order

Recommended implementation sequence:

1. **Task Group 1: Tile Builder Setup** (first - creates data source)
2. **Task Group 4: Holiday Utilities & Cron** (parallel with 2-3, no dependencies)
3. **Task Group 2: Layer Config & Manager** (depends on 1)
4. **Task Group 3: Map Integration & UI** (depends on 2)
5. **Task Group 5: Voice & Agent Tools** (depends on 2, 4)
6. **Task Group 6: Testing & Polish** (depends on 1-5)

**Parallel Execution Opportunity:**
- Groups 1 and 4 can be implemented in parallel
- Groups 2-3 depend on Group 1 but not on Group 4
- Group 5 depends on both 2 and 4

---

## Environment Variables Required

Add to `.env.local`:
```bash
NEXT_PUBLIC_SANITATION_PMTILES_URL=https://your-r2-url/sanitation.pmtiles
```

---

## ESRI Service Reference

DPW Sanitation MapServer: `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/DPW/DPW_Sanitation/MapServer`

| Layer | Name | Description |
|-------|------|-------------|
| 3 | Garbage Day A | Monday collection routes |
| 4 | Garbage Day B | Tuesday collection routes |
| 5 | Garbage Day C | Wednesday collection routes |
| 6 | Garbage Day D | Thursday collection routes |
| 7 | Garbage Day E | Friday collection routes |
| 12 | Recycling Summer | Summer recycling schedule (Mar 15 - Oct 31) |
| 13 | Recycling Winter | Winter recycling schedule (Nov 1 - Mar 14) |

---

## Color Palette for Garbage Days

```typescript
const GARBAGE_DAY_COLORS = {
  A: '#EF4444', // red-500 (Monday)
  B: '#F97316', // orange-500 (Tuesday)
  C: '#EAB308', // yellow-500 (Wednesday)
  D: '#22C55E', // green-500 (Thursday)
  E: '#3B82F6', // blue-500 (Friday)
}
```
