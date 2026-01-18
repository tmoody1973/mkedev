# Specification: Commercial Properties & Development Sites Integration

## Goal
Integrate Browse.ai scraped commercial property and development site data into the MKE.dev platform, enabling users to search for and explore commercial real estate opportunities through conversational AI and interactive map visualization.

## User Stories
- As a developer or investor, I want to search for commercial properties in Milwaukee so that I can identify potential investment opportunities.
- As a business owner, I want to find available development sites so that I can evaluate locations for expansion.

## Specific Requirements

**Convex Schema: commercialProperties Table**
- Create table with fields: `browseAiTaskId`, `address`, `coordinates`, `propertyType`, `buildingSqFt`, `lotSizeSqFt`, `zoning`, `askingPrice`, `pricePerSqFt`, `contactInfo`, `listingUrl`, `description`, `status`, `lastSyncedAt`, `createdAt`, `updatedAt`
- Property type is an enum: `retail`, `office`, `industrial`, `warehouse`, `mixed-use`, `land`
- Status enum: `available`, `sold`, `pending`, `unknown`
- Create indexes: `by_browseAiTaskId`, `by_status`, `by_propertyType`, `by_zoning`
- Coordinates stored as `[longitude, latitude]` array for Mapbox compatibility

**Convex Schema: developmentSites Table**
- Create table with fields: `browseAiTaskId`, `address`, `coordinates`, `siteName`, `lotSizeSqFt`, `zoning`, `askingPrice`, `currentUse`, `proposedUse`, `incentives`, `contactInfo`, `listingUrl`, `description`, `status`, `lastSyncedAt`, `createdAt`, `updatedAt`
- Status enum: `available`, `sold`, `pending`, `unknown`
- Create indexes: `by_browseAiTaskId`, `by_status`, `by_zoning`
- Incentives stored as optional array of strings (e.g., `["TIF", "Opportunity Zone"]`)

**Browse.ai Sync Action**
- Create `convex/ingestion/commercialSync.ts` following `homesSync.ts` pattern
- Use Node.js runtime (`"use node"`) for Browse.ai API calls
- Fetch from Browse.ai API: `GET https://api.browse.ai/v2/robots/{robotId}/tasks`
- Commercial robot ID: `019bd1dc-df2e-7747-8e54-142a383e8822`
- Development sites robot ID: `019bd1ff-bd45-7594-a466-ed701e505915`
- Parse `capturedLists.Properties` array from Browse.ai response
- Implement retry logic with exponential backoff (3 retries, 1000ms base delay)

**Mapbox Geocoding Integration**
- Geocode addresses using Mapbox Geocoding API before saving to database
- Apply Milwaukee bounding box: `-88.1,42.8,-87.8,43.2`
- Validate coordinates are within Milwaukee area (lat 42.5-44.0, lng -89.0 to -87.0)
- Skip properties that fail geocoding with warning log
- Batch geocoding requests to avoid rate limits (10 concurrent max)

**Convex Mutations for Sync**
- Create `convex/ingestion/commercialSyncMutations.ts` with `upsertCommercialProperties` and `upsertDevelopmentSites` mutations
- Use `browseAiTaskId` as unique identifier for upsert logic
- Preserve `createdAt` on updates, always update `updatedAt` and `lastSyncedAt`
- Mark properties not in latest sync as status `unknown` (not sold, since removal may be temporary)

**Agent Tools**
- Add `search_commercial_properties` tool with parameters: `propertyType`, `minSqFt`, `maxSqFt`, `maxPrice`, `zoning`, `limit`
- Add `search_development_sites` tool with parameters: `minLotSize`, `maxPrice`, `zoning`, `incentive`, `limit`
- Add `get_commercial_property_details` tool with parameter: `propertyId` (Convex document ID)
- Add `get_development_site_details` tool with parameter: `siteId` (Convex document ID)
- Register tools in `TOOL_DECLARATIONS` array in `convex/agents/tools.ts`

**Convex Queries**
- Create `convex/commercialProperties.ts` with queries: `searchProperties`, `getById`, `getByZoning`, `getStats`, `getForMap`
- Create `convex/developmentSites.ts` with queries: `searchSites`, `getById`, `getStats`, `getForMap`
- `searchProperties` supports filtering by propertyType, sqFt range, price range, zoning
- `getForMap` returns minimal data for GeoJSON rendering (id, coordinates, address, propertyType)

**CopilotKit Card Components**
- Create `CommercialPropertyCard.tsx` following `HomeCard.tsx` pattern
- Display: address, property type badge, square footage, lot size, asking price, price/sqft, zoning, contact info, description
- Include image gallery if images available (future enhancement)
- Action buttons: View Listing, Fly to Location
- Create `DevelopmentSiteCard.tsx` with: site name, address, lot size, zoning, asking price, current/proposed use, incentives badges
- Create `CommercialPropertiesListCard.tsx` and `DevelopmentSitesListCard.tsx` following `HomesListCard.tsx` pattern
- All cards use RetroUI neobrutalist styling with sky-500 primary color

**Map Layer Integration**
- Create `commercial-layer-manager.ts` following `homes-layer-manager.ts` pattern
- Purple circle markers (#a855f7 / violet-500) for commercial properties
- Green circle markers (#22c55e / green-500) for development sites
- Feature-state highlighting support with amber highlight color
- Register in `layer-config.ts` with layer IDs: `commercial-properties-circles`, `development-sites-circles`
- Add click handlers that emit `onPropertyClick` and `onSiteClick` events

**Cron Job for Weekly Sync**
- Add weekly cron job in `convex/crons.ts` for commercial properties sync
- Schedule: Monday at 7:00 AM UTC (after homes sync at 6:00 AM)
- Separate cron for development sites sync at 7:30 AM UTC
- Crons call internal actions: `internal.ingestion.commercialSync.syncCommercialProperties` and `internal.ingestion.commercialSync.syncDevelopmentSites`

## Existing Code to Leverage

**`convex/ingestion/homesSync.ts`**
- Follow the same `internalAction` pattern with Node.js runtime
- Reuse `fetchWithRetry` helper function pattern for Browse.ai API calls
- Adapt coordinate validation logic for geocoded addresses
- Use same batch upsert pattern with configurable batch size

**`convex/homes.ts`**
- Follow same query patterns: `searchHomes`, `getById`, `getForMap`, `getStats`
- Reuse filtering logic pattern for in-memory filtering after index queries
- Adapt `triggerSync` public action pattern for manual sync trigger

**`src/components/copilot/HomeCard.tsx`**
- Copy component structure and styling patterns
- Adapt props interface for commercial property fields
- Reuse image gallery component logic
- Keep same action button styling and interaction patterns

**`src/components/map/layers/homes-layer-manager.ts`**
- Follow same class structure with `addLayer`, `updateData`, `highlightProperties`, `destroy` methods
- Reuse GeoJSON source creation and circle layer styling patterns
- Adapt feature-state highlighting logic
- Use same event handler setup pattern

**`convex/agents/tools.ts`**
- Add new tool declarations following existing patterns
- Implement tool functions calling Convex queries via `ctx.runQuery`
- Return consistent response shape: `{ success: boolean, properties?: [], error?: string }`

## Out of Scope
- Image scraping from property listing pages (future enhancement)
- Price history tracking and trend analysis
- Property comparison side-by-side view
- Saved searches and property alerts
- PDF report generation for commercial properties
- Investment return calculator
- Property contact form integration
- Virtual tour or 3D visualization
- Auction properties or foreclosure listings
- Multi-city expansion beyond Milwaukee
