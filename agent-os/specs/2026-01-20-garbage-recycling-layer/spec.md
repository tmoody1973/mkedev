# Specification: Garbage & Recycling Collection Layer

## Goal

Integrate Milwaukee DPW Sanitation collection data into MKE.dev to display color-coded garbage and recycling routes on the map, and enable users to query collection schedules for any address via voice or chat.

## User Stories

- As a Milwaukee resident, I want to see which garbage collection day my address falls on so that I know when to put out my bins.
- As a user viewing the map, I want to toggle garbage and recycling layers to understand collection patterns across the city.

## Specific Requirements

**Tile Builder: Sanitation Layer Configs**
- Add garbage route layers (A-E) to `packages/tile-builder/src/config.ts` using DPW_Sanitation MapServer layers 3-7
- Add recycling layers (summer layer 12, winter layer 13) with separate configs for seasonal switching
- Use outSR=4326 (WGS84) and minZoom 10, maxZoom 16 for all sanitation layers
- Export each garbage day as separate GeoJSON then combine into single PMTiles with source-layer names

**PMTiles Build Script Update**
- Modify `packages/tile-builder/src/build-tiles.ts` to include sanitation layers in combined PMTiles
- Use tippecanoe source-layer naming: garbage-day-a, garbage-day-b, garbage-day-c, garbage-day-d, garbage-day-e, recycling
- Generate sanitation-specific PMTiles file `sanitation.pmtiles` separate from main milwaukee.pmtiles

**Layer Config: GarbageLayerConfig Type**
- Add `GarbageLayerType` union type to `apps/web/src/components/map/layers/layer-config.ts`
- Define `GARBAGE_DAY_COLORS` constant mapping days A-E to specified hex colors
- Add `GARBAGE_LAYER_CONFIG` and `RECYCLING_LAYER_CONFIG` following existing ESRILayerConfig pattern
- Include legendItems array with all 5 day colors for garbage layer legend

**SanitationLayerManager Class**
- Create `apps/web/src/components/map/layers/sanitation-layer-manager.ts` following PMTilesLayerManager patterns
- Load from separate sanitation.pmtiles URL (NEXT_PUBLIC_SANITATION_PMTILES_URL env var)
- Implement color-by-day expression using match on garbage day property from ESRI data
- Add click handler that emits collection day, route ID, and feature properties

**Recycling Season Switcher**
- Add helper function `getRecyclingSeasonLayer()` that returns "summer" or "winter" based on current date
- Milwaukee recycling switches: summer schedule March 15 - October 31, winter November 1 - March 14
- SanitationLayerManager should auto-select correct recycling source-layer on initialization

**Click Popup: Collection Info**
- Display collection day letter and full weekday name (e.g., "Day A - Monday")
- Show route ID from ESRI feature properties
- Calculate next collection date using helper function that accounts for current day of week
- Add holiday delay indicator when within 7 days of a collection-affecting holiday

**Holiday Date Calculator**
- Create `apps/web/src/lib/sanitation/holiday-utils.ts` with utility functions
- Define COLLECTION_HOLIDAYS array with fixed dates (Jan 1, Jul 4, Dec 25) and floating dates (Memorial Day, Labor Day, Thanksgiving)
- `getNextHoliday()` returns upcoming holiday affecting collection
- `isCollectionDelayed()` returns boolean if collection shifts due to holiday

**Cron Job: Pre-Holiday Data Refresh**
- Add cron entries to `apps/web/convex/crons.ts` for holiday refreshes
- Schedule refreshes 2 days before each major holiday using crons.scheduled()
- Call internal action that triggers tile-builder re-export and R2 upload
- Target holidays: New Year's Day, Memorial Day, July 4th, Labor Day, Thanksgiving, Christmas

**Agent Tool: query_collection_schedule**
- Add tool declaration to `TOOL_DECLARATIONS` in `apps/web/convex/agents/tools.ts`
- Parameters: address (required string), includeRecycling (optional boolean, default true)
- Implementation: geocode address, point-in-polygon query against ESRI DPW_Sanitation layers
- Return: collectionDay, weekdayName, routeId, nextGarbageDate, nextRecyclingDate, holidayDelay

**Voice Tool: query_collection_schedule**
- Add matching tool definition to `apps/web/src/lib/voice/voice-tools.ts`
- Description: "Find garbage and recycling collection schedule for a Milwaukee address"
- Add to VOICE_SYSTEM_INSTRUCTION context about collection schedule queries

**LayerPanel Toggle Integration**
- Add "Garbage Collection" and "Recycling" toggles to layer panel component
- Use existing toggle pattern from zoning/parcels layers
- Group under new "City Services" collapsible section in layer panel

## Existing Code to Leverage

**packages/tile-builder/src/config.ts**
- Copy LayerConfig interface structure for sanitation layer definitions
- Use same ESRI_BASE URL pattern for DPW_Sanitation MapServer
- Follow minZoom/maxZoom conventions from existing layer configs

**packages/tile-builder/src/export-layer.ts**
- Reuse queryWithPagination function for ESRI feature extraction
- Use same arcgisToGeoJSON conversion pipeline
- Follow exportLayer/exportAllLayers patterns for new sanitation export

**apps/web/src/components/map/layers/pmtiles-layer-manager.ts**
- Copy class structure for SanitationLayerManager
- Reuse registerPMTilesSourceType helper for PMTiles protocol
- Follow same initialize/addLayers/setLayerVisibility patterns
- Copy color expression pattern from ZONING_COLOR_EXPRESSION for day-based coloring

**apps/web/convex/agents/tools.ts**
- Follow TOOL_DECLARATIONS structure for query_collection_schedule
- Use existing geocodeAddress function for address-to-coordinates conversion
- Copy queryZoningAtPoint pattern for point-in-polygon ESRI query against sanitation layers

**apps/web/convex/crons.ts**
- Follow existing crons.weekly() pattern structure
- Use internal.ingestion action pattern for scheduled tasks

## Out of Scope

- Real-time collection truck tracking or GPS data
- Push notifications for collection reminders
- Integration with Milwaukee 311 service requests
- Bulk/special collection scheduling
- Recycling bin request or replacement functionality
- Snow removal or leaf collection layers (separate future spec)
- Street sweeping schedule integration
- Cart survey data visualization
- Historical collection data or missed pickup reporting
- User preferences for collection reminders
