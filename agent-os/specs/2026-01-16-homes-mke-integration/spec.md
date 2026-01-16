# Specification: Homes MKE Integration

## Goal
Integrate the Homes_MKE_Properties ESRI FeatureServer into MKE.dev to enable users to search for homes for sale via chat, view results on the map with highlighted markers, and access detailed property cards with listing information.

## User Stories
- As a homebuyer, I want to ask the AI about homes for sale in specific neighborhoods so that I can discover available properties matching my criteria.
- As a user viewing search results, I want to see the homes highlighted on the map so that I can understand their locations relative to the city.

## Specific Requirements

**Convex Schema: homesForSale Table**
- Add new `homesForSale` table following existing schema patterns in `apps/web/convex/schema.ts`
- Include fields: esriObjectId, taxKey, address, neighborhood, coordinates (WGS84), bedrooms, fullBaths, halfBaths, buildingSqFt, yearBuilt, status, narrative, listingUrl, developerName
- Use `v.union()` for status field with literals: "for_sale", "sold", "unknown"
- Add indexes: by_status, by_neighborhood, by_taxKey, by_esriObjectId
- Include sync metadata: lastSyncedAt, createdAt, updatedAt (timestamps as v.number())

**ESRI Data Sync Action**
- Create `apps/web/convex/ingestion/homesSync.ts` following patterns from existing ingestion actions
- Fetch from ESRI FeatureServer with pagination (max 2000 records per request)
- Convert UTM Zone 54N coordinates (WKID 32054) to WGS84 using proj4 library
- Implement upsert logic: update existing records by esriObjectId, insert new ones
- Mark records not in latest sync as "sold" or "unknown" status
- Use internal action pattern with `"use node"` directive for Node.js runtime

**Weekly Cron Job**
- Add cron job to `apps/web/convex/crons.ts` following existing cron patterns
- Schedule: Monday at 6:00 AM UTC using `crons.weekly()`
- Call internal sync action: `internal.ingestion.homesSync.syncFromESRI`

**Agent Tool: search_homes_for_sale**
- Add tool declaration to `TOOL_DECLARATIONS` array in `apps/web/convex/agents/tools.ts`
- Parameters: neighborhood (optional string), minBedrooms, maxBedrooms, minBaths (optional numbers), limit (default 10)
- Return array with home summaries including Convex document IDs for map highlighting
- Query `homesForSale` table with status="for_sale" filter

**Agent Tool: get_home_details**
- Add second tool declaration to `TOOL_DECLARATIONS` in tools.ts
- Required parameter: homeId (string - Convex document ID)
- Return full home details including narrative, listing URL, and coordinates
- Used for generating HomeCard UI component

**Tool Execution in Zoning Agent**
- Add switch cases for new tools in `apps/web/convex/agents/zoning.ts` chat handler
- Follow existing pattern: call tool implementation, track success, log to Opik tracer
- Update SYSTEM_INSTRUCTION to describe home search capabilities

**Map Layer: HomesLayerManager**
- Create `apps/web/src/components/map/layers/homes-layer-manager.ts` following ESRILayerManager patterns
- Use GeoJSON source from Convex query (homes with status="for_sale")
- Add circle layer with house icon styling (sky-500 color scheme)
- Implement click handler to emit home selection events
- Implement `highlightHomes(homeIds: string[])` method using feature-state

**HomeCard UI Component**
- Create `apps/web/src/components/copilot/HomeCard.tsx` following ParcelCard patterns
- Display: address, neighborhood, beds/baths/sqft/year built, property description (narrative)
- Include "View Listing" button (opens external URL in new tab)
- Include "Fly to Location" button using MapContext flyTo
- Use RetroUI neobrutalist styling: border-2, shadow-[4px_4px_0], sky-500 accents
- Support loading state with animate-pulse skeleton

**HomesListCard UI Component**
- Create component for displaying multiple home search results in chat
- Show condensed list of homes with key details (address, beds/baths, neighborhood)
- Each item clickable to fly to location and show full HomeCard
- Display count of results found

**Chat-to-Map Bridge**
- Modify `apps/web/src/app/HomeContent.tsx` to handle home-listing card type
- Extract home IDs from search_homes_for_sale tool results
- Call map layer's highlightHomes API when results returned
- Add home-listing to GenerativeCard type union in chat types

**GenerativeCard Type Update**
- Add "home-listing" and "homes-list" to card type union in `apps/web/src/components/chat/types.ts`
- Define data interface for home listing cards matching HomeCard props

## Visual Design
No visual mockups provided. Follow existing ParcelCard and ZoneInfoCard patterns for styling consistency.

## Existing Code to Leverage

**apps/web/convex/schema.ts**
- Follow existing table definition patterns with defineTable, v validators
- Use same timestamp convention (createdAt, updatedAt as v.number())
- Copy index definition pattern from parcels and documents tables

**apps/web/convex/agents/tools.ts and zoning.ts**
- Copy TOOL_DECLARATIONS structure for new tool definitions
- Follow existing tool execution pattern in chat handler switch statement
- Use same error handling and Opik tracing patterns

**apps/web/convex/ingestion/ directory**
- Reference gemini.ts and firecrawl.ts for external API action patterns
- Use "use node" directive and action() wrapper
- Follow retry logic pattern from fetchWithRetry helper

**apps/web/src/components/map/layers/esri-layer-manager.ts**
- Copy layer management patterns: addLayer, setLayerVisibility, highlight methods
- Use same feature-state approach for highlighting selected features
- Follow event handler setup pattern for click/hover

**apps/web/src/components/copilot/ParcelCard.tsx**
- Copy component structure: loading state, header, content sections
- Use same Tailwind classes for RetroUI styling
- Follow same props interface pattern with optional fields

## Out of Scope
- Real-time ESRI FeatureServer streaming (use weekly batch sync instead)
- Home price data (not available in ESRI source)
- Home images/photos display (external URLs only, no image fetching)
- Filtering by square footage or year built in agent tool (keep filters simple)
- Saved searches or favorites functionality
- Push notifications for new listings
- Integration with external real estate APIs (Zillow, Redfin)
- Home comparison features
- Mortgage calculator or affordability tools
- Historical sale data or price trends
