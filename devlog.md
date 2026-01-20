# MKE.dev Development Log

> Voice-first AI-powered civic intelligence platform for Milwaukee
> Gemini 3 Hackathon | Deadline: February 10, 2026

---

## 2026-01-14 - Project Initialization

### Completed
- [x] Product planning complete (mission.md, roadmap.md, tech-stack.md)
- [x] Foundation Week 1 spec shaped and written
- [x] Tasks breakdown created (12 task groups, 5 phases)
- [x] CLAUDE.md project guidelines established
- [x] Progress tracking setup (devlog + Plane.so integration)

### Key Decisions
- **Monorepo structure**: pnpm workspaces with `apps/web` + `apps/agents`
- **UI Framework**: RetroUI (retroui.dev) for neobrutalist design
- **Auth**: Clerk with Google OAuth + email/password only
- **Map layers**: All 7 ESRI layers from day one (no incremental rollout)
- **Document ingestion**: Convex cron jobs + manual trigger for Firecrawl/Gemini RAG

### Tech Stack Confirmed
- Next.js 15 (App Router)
- Convex (real-time backend)
- Clerk (auth)
- Mapbox GL JS + Milwaukee ESRI ArcGIS
- RetroUI (neobrutalist components)
- Google Gemini 3 + ADK (agents)
- CopilotKit (generative UI)

### Notes
- Hackathon sprint: 4 weeks to deadline
- Foundation Week 1 is critical path - establishes all infrastructure
- Reference components available in `product-plan/` folder

### Next Up
- [ ] Initialize monorepo with pnpm workspaces
- [ ] Set up Next.js 15 with RetroUI
- [ ] Configure Convex schema
- [ ] Integrate Clerk authentication
- [ ] Build Mapbox + ESRI layers

---

## 2026-01-14 - Plane.so Integration

### Completed
- [x] Plane.so MCP server connected
- [x] Created "Foundation Week 1" cycle (Jan 14-20)
- [x] Synced all 12 task groups as work items

### Plane Project Setup
- **Project:** mkedev (MKEDEV1)
- **Cycle:** Foundation Week 1
- **Work Items:** 12 task groups synced

### Work Items Created
1. Task Group 1: Monorepo & Project Structure (High)
2. Task Group 2: Tailwind & RetroUI Configuration (High)
3. Task Group 3: Convex Backend Setup (High)
4. Task Group 4: Clerk Authentication Integration (High)
5. Task Group 5: Mapbox Base Setup (High)
6. Task Group 6: ESRI Layer Integration (High)
7. Task Group 7: Layer Controls Panel (Medium)
8. Task Group 8: App Shell & Layout (High)
9. Task Group 9: Chat Panel Component (High)
10. Task Group 10: Parcel Click Interaction (Medium)
11. Task Group 11: Document Ingestion Setup (Medium)
12. Task Group 12: End-to-End Integration & Test Review (High)

### Notes
- Plane sync commands now available: `/plane-sync`, `/plane-sync status`
- Auto-logging enabled for task completions

---

## 2026-01-14 - Foundation Week 1 Complete

### Completed
- [x] Task Group 1: Monorepo & Project Structure
- [x] Task Group 2: Tailwind & RetroUI Configuration
- [x] Task Group 3: Convex Backend Setup
- [x] Task Group 4: Clerk Authentication Integration
- [x] Task Group 5: Mapbox Base Setup
- [x] Task Group 6: ESRI Layer Integration
- [x] Task Group 7: Layer Controls Panel
- [x] Task Group 8: App Shell & Layout
- [x] Task Group 9: Chat Panel Component
- [x] Task Group 10: Parcel Click Interaction
- [x] Task Group 11: Document Ingestion Setup
- [x] Task Group 12: E2E Integration & Test Review

### Implementation Summary

**Infrastructure (Task Groups 1-3)**
- pnpm monorepo with `apps/web` and `apps/agents`
- Next.js 15 with App Router, TypeScript, Tailwind
- RetroUI neobrutalist components (Button, Card, Input, Badge, Avatar)
- Convex schema with 8 tables (users, parcels, zoningDistricts, incentiveZones, areaPlans, conversations, messages, documents)
- Full Convex functions for all tables

**Authentication (Task Group 4)**
- Clerk integration with Google OAuth + email/password
- ClerkConvexProvider for authenticated queries
- Clerk-Convex user sync via webhooks
- UserMenu component with avatar and dropdown

**Map Integration (Task Groups 5-7)**
- Mapbox GL JS centered on Milwaukee (43.0389, -87.9065)
- 7 ESRI ArcGIS layers integrated:
  - Zoning Districts (Layer 11) with category colors
  - Parcels/MPROP (Layer 2) with click interaction
  - TIF Districts (Layer 8)
  - Opportunity Zones (Layer 9)
  - Historic Districts (Layer 17)
  - ARB Areas (Layer 1)
  - City-Owned Lots
- LayerPanel with visibility toggles and opacity sliders

**Application UI (Task Groups 8-10)**
- AppShell with 40/60 split (chat/map)
- Mobile responsive with collapsible map overlay
- Header with logo, voice toggle, layers button, UserMenu
- ChatPanel with empty state, message list, loading indicator
- ParcelPopup with address, tax key, zoning code
- Full parcel-to-chat context flow

**Data Pipeline (Task Group 11)**
- Firecrawl API integration for web crawling
- Gemini File Search for PDF RAG
- Convex cron jobs for automated refresh
- Corpus config with 15 PDF sources + 8 web sources

**Testing (Task Group 12)**
- 63 tests passing across 7 test files
- Integration tests for cross-component flows
- Full verification report in `verification/final-verification.md`

### Test Results
```
Test Files: 7 passed
Tests: 63 passed
Duration: ~1.7s
```

### Environment Status
- Development server runs successfully
- Clerk in keyless mode (keys available to claim)
- Convex requires `npx convex dev` to initialize
- Mapbox token configured in .env.local

### Next Up (Week 2)
- [ ] Voice interface with Gemini Live API
- [ ] Generative UI cards with CopilotKit
- [ ] Conversation history persistence
- [ ] Address search/geocoding
- [ ] Agent system in `apps/agents`

---

## 2026-01-14 - Map Display Bug Fix

### Issue
Map was not rendering tiles despite Mapbox controls appearing in the DOM. The map panel showed a dark/black area instead of Milwaukee streets.

### Root Causes Identified
1. **Container dimensions**: Mapbox canvas wasn't getting proper width/height
2. **React StrictMode double-mounting**: ESRI layers tried to add duplicate sources
3. **Race condition**: Map load event sometimes fired before listener attached
4. **Missing resize call**: Map needed explicit resize after container rendered

### Fixes Applied

**MapContainer.tsx**
- Added explicit `style={{ width: '100%', height: '100%' }}` to mapbox-container div
- Added `map.resize()` call in load handler to ensure proper canvas dimensions
- Added `map.once('idle')` resize for slower style loads
- Added `map.loaded()` check to handle race condition where map loads before listener

**esri-layer-manager.ts**
- Added source existence check in `addLayer()` to prevent duplicate source errors:
  ```typescript
  if (this.map.getSource(sourceId)) {
    console.log(`Source ${sourceId} already exists, skipping`)
    this.setLayerVisibility(config.id, visible)
    return
  }
  ```

**useESRILayers.ts**
- Used refs for callbacks to prevent effect re-runs
- Added `isInitializedRef` to prevent double initialization in StrictMode
- Removed callback dependencies from useEffect array

### Result
Milwaukee map now renders correctly with:
- Street map tiles visible
- Neighborhoods labeled (Harambee, Lindsay Heights, Midtown, etc.)
- Highways marked (43, 145, 18, 59, 794)
- Parks and landmarks visible
- Mapbox controls functional (zoom, compass, scale)
- ESRI layer loading indicator working

### Technical Notes
- Mapbox GL JS requires container with explicit dimensions to render
- React 18 StrictMode double-mounts components, requiring idempotent initialization
- `map.resize()` is essential when container size changes or is set dynamically

---

## 2026-01-14 - ESRI Layer URL Corrections

### Issue
ESRI map layers were not loading correctly due to incorrect service URLs and paths.

### Root Cause
The layer configuration was using incorrect URLs:
- **Wrong domain**: `gis.milwaukee.gov` instead of `milwaukeemaps.milwaukee.gov`
- **Wrong service paths**: Individual MapServer endpoints instead of unified `special_districts/MapServer`

### Fixes Applied

**layer-config.ts**
- Updated base URL from `gis.milwaukee.gov` to `milwaukeemaps.milwaukee.gov`
- Fixed service paths per GIS Data Sources Strategy document:

| Layer | Old Path | New Path |
|-------|----------|----------|
| Parcels | `/planning/parcels/MapServer` | `/property/parcels_mprop/MapServer` |
| TIF | `/planning/TIF/MapServer` | `/planning/special_districts/MapServer` |
| Opportunity Zones | `/planning/OpportunityZones/MapServer` | `/planning/special_districts/MapServer` |
| Historic | `/planning/historic/MapServer` | `/planning/special_districts/MapServer` |
| ARB | `/planning/ARB/MapServer` | `/planning/special_districts/MapServer` |
| City-Owned | `/govt_owned/MapServer` | `/property/govt_owned/MapServer` |

### Result
All 7 ESRI layers now load correctly:
- Zoning Districts (Layer 11)
- Parcels/MPROP (Layer 2)
- TIF Districts (Layer 8)
- Opportunity Zones (Layer 9)
- Historic Districts (Layer 17)
- ARB Areas (Layer 1)
- City-Owned Lots

### Reference
GIS Data Sources Strategy document saved to `agent-os/product/gis-data-sources.md`

---

## 2026-01-14 - 3D Map with Zoning-Colored Buildings

### Completed
- [x] Task Group 1: MapContext State Management
- [x] Task Group 2: Header 3D Toggle Button
- [x] Task Group 3: Map Style Switching
- [x] Task Group 4: Zoning Fill-Extrusion Layer
- [x] Task Group 5: Camera Animation
- [x] Task Group 6: Integration & Test Review

### Implementation Summary

**State Management (Task Group 1)**
- Added `is3DMode` boolean state to MapContext with localStorage persistence
- Key `mkedev-3d-mode` stores preference across sessions
- `toggle3DMode` and `setIs3DMode` exposed via useMap hook

**Header 3D Toggle (Task Group 2)**
- Added Box icon button between Voice toggle and Layers button
- Neobrutalist styling with shadow and translate hover effects
- Active state shows sky-500 background when 3D enabled
- Full accessibility with aria-label and aria-pressed attributes

**Map Style Switching (Task Group 3)**
- 2D mode: `mapbox://styles/mapbox/streets-v12`
- 3D mode: `mapbox://styles/mapbox/standard` (includes built-in 3D buildings)
- PMTiles layers preserved across style changes via `style.load` event
- `reinitializeLayers()` method added to useESRILayers hook

**Fill-Extrusion Layer (Task Group 4)**
- Created `pmtiles-zoning-3d` fill-extrusion layer for 3D mode
- Zone-based heights: residential (10m), commercial (20m), industrial (30m), mixed-use (25m), special (15m)
- Semi-transparent (0.6 opacity) to show Mapbox Standard 3D buildings beneath
- Zone colors match existing 2D layer (greens/blues/purples/oranges)
- `setZoning3DMode()` method toggles between fill and fill-extrusion layers

**Camera Animation (Task Group 5)**
- 3D view: pitch 45°, bearing -17.6°
- 2D view: pitch 0°, bearing 0°
- Animation duration: 1500ms
- Current center/zoom preserved during transitions
- `animateTo3DView()` and `animateTo2DView()` functions in MapContext

**Integration Testing (Task Group 6)**
- 30 new tests for 3D map feature
- Total: 93 tests passing
- Cross-component integration verified

### Key Files Modified
- `apps/web/src/contexts/MapContext.tsx` - 3D state, camera animation
- `apps/web/src/components/shell/Header.tsx` - 3D toggle button
- `apps/web/src/components/shell/AppShell.tsx` - Wire Header to MapContext
- `apps/web/src/components/map/MapContainer.tsx` - Style switching, camera trigger
- `apps/web/src/components/map/layers/layer-config.ts` - Zone height constants
- `apps/web/src/components/map/layers/pmtiles-layer-manager.ts` - 3D layer, setZoning3DMode
- `apps/web/src/components/map/layers/useESRILayers.ts` - reinitializeLayers
- `apps/web/src/components/map/layers/ESRILayerLoader.tsx` - isStyleChanging prop

### Test Files Created
- `apps/web/src/__tests__/map/MapContext3D.test.tsx`
- `apps/web/src/__tests__/shell/Header3D.test.tsx`
- `apps/web/src/__tests__/map/MapStyle3D.test.tsx`
- `apps/web/src/__tests__/map/layers/FillExtrusion3D.test.ts`
- `apps/web/src/__tests__/map/CameraAnimation3D.test.tsx`
- `apps/web/src/__tests__/map/3DMapIntegration.test.tsx`

### Test Results
```
Test Files: 7 new + existing
Tests: 93 passed (30 new for 3D feature)
Duration: ~2s
```

### Plane.so Sync
- **Cycle:** Week 2: 3D Map & Voice Integration (Jan 14-21)
- **Cycle ID:** 12119c1a-c624-4f37-9a3d-e11090fd9b11
- **Work Items:** 6 task groups synced

### Constants Added
```typescript
// Camera
CAMERA_3D_PITCH = 45
CAMERA_3D_BEARING = -17.6
CAMERA_ANIMATION_DURATION = 1500

// Styles
MAP_STYLE_2D = 'mapbox://styles/mapbox/streets-v12'
MAP_STYLE_3D = 'mapbox://styles/mapbox/standard'

// Zone Heights (meters)
ZONE_BASE_HEIGHTS = {
  residential: 10,
  commercial: 20,
  industrial: 30,
  'mixed-use': 25,
  special: 15
}
ZONE_3D_OPACITY = 0.6
```

### Next Up
- [ ] Voice interface with Gemini Live API
- [ ] Generative UI cards with CopilotKit
- [ ] Conversation history persistence
- [ ] Address search/geocoding

---

## 2026-01-14 - Mapbox Spatial Tools Integration

### Completed
- [x] Added Mapbox MCP server to Claude Code configuration
- [x] Created Mapbox spatial tools prototype library
- [x] Created spec and tasks for Google ADK agent integration

### Mapbox MCP Server Configuration
```json
// .mcp.json
{
  "mcpServers": {
    "mapbox": {
      "type": "http",
      "url": "https://mcp.mapbox.com/mcp",
      "headers": { "Authorization": "Bearer ${MAPBOX_TOKEN}" }
    }
  }
}
```

### Mapbox Tools Library Created
Location: `/apps/web/src/lib/mapbox/`

**High-Value Tools:**
| Tool | Purpose |
|------|---------|
| `forwardGeocode()` | Address → Coordinates |
| `reverseGeocode()` | Coordinates → Address |
| `searchPOI()` | Find nearby restaurants, shops, etc. |
| `getIsochrone()` | Areas reachable in X minutes |
| `getDirections()` | Route with distance/duration |
| `getTravelTime()` | Simplified travel time lookup |
| `getStaticMapUrl()` | Generate map image URL |
| `calculateDistance()` | Offline distance calculation |
| `pointInPolygon()` | Geofencing (e.g., is parcel in TIF?) |

**Milwaukee Constants:**
```typescript
MILWAUKEE_CENTER: { lng: -87.9065, lat: 43.0389 }
MILWAUKEE_LANDMARKS: { artMuseum, fiservForum, cityHall, ... }
```

### Spec & Tasks Created
- **Spec:** `/agent-os/specs/2026-01-14-mapbox-agent-tools/spec.md`
- **Tasks:** `/agent-os/specs/2026-01-14-mapbox-agent-tools/tasks.md`
- 4 task groups: Convex Actions, ADK Tools, Testing, UI Integration

### API Tests Verified
```
✅ Geocoding: "Milwaukee Art Museum" → { lng: -87.897, lat: 43.039 }
✅ Isochrone: 10-min driving polygon returned
✅ Static Maps: URL generation working
```

### Next Up (Mapbox Integration)
- [ ] Create Convex actions for server-side API calls
- [ ] Define Google ADK agent tool schemas
- [ ] Add isochrone visualization to map
- [ ] Display static maps in chat responses

---

## 2026-01-14 - Zoning Interpreter Agent & File Search RAG

### Completed
- [x] Gemini File Search Stores setup and migration
- [x] Upload 12 Milwaukee Zoning Code PDFs to persistent store
- [x] Zoning Interpreter Agent with Gemini function calling
- [x] Fix ESRI URL and spatial reference for zoning queries
- [x] RAG V2 with automatic store discovery and fallback

### File Search Stores Migration

**Problem:** Legacy RAG used direct file uploads which expired after 48 hours.

**Solution:** Migrated to Gemini File Search Stores for persistent document storage.

**Setup Script:** `apps/web/scripts/setup-file-search-stores.ts`
- Fixed monorepo path resolution: `path.resolve(__dirname, "../../..")`
- Used correct API endpoint: `uploadToFileSearchStore` (not `uploadFile`)
- Added long-running operation polling for upload completion

**Documents Uploaded:**
```
Store: fileSearchStores/mkedevzoningcodes-nynmfrg2yrl7
Documents: 12 (CH295-sub1 through sub11 + CH295table)
Status: Active
```

**Sync Action Added:** `syncStoresFromGemini` registers external stores in Convex

### Zoning Interpreter Agent

**Location:** `apps/web/convex/agents/zoning.ts`

**Architecture:**
- Gemini function calling with 4 tools
- MAX_TOOL_CALLS = 10 for complex queries
- System prompt with Milwaukee-specific instructions

**Tools Implemented:**

| Tool | Implementation | Purpose |
|------|---------------|---------|
| `geocode_address` | Mapbox Geocoding API | Address → Coordinates |
| `query_zoning_at_point` | Milwaukee ESRI REST | Coordinates → Zoning District |
| `calculate_parking` | Local calculation | Parking requirements by use type |
| `query_zoning_code` | RAG V2 (File Search) | Search zoning code documents |

### ESRI Integration Fix

**Problem:** Zoning queries failing with "unsuccessful tunnel" and empty results.

**Root Causes:**
1. Wrong URL: Used `gis.milwaukee.gov` instead of `milwaukeemaps.milwaukee.gov`
2. Missing spatial reference: Needed `inSR=4326` for WGS84 coordinates

**Fix Applied in `tools.ts`:**
```typescript
// Before (broken)
const ESRI_BASE = "https://gis.milwaukee.gov/arcgis/rest/services";
const url = `${ESRI_BASE}/.../query?geometry=${lng},${lat}&...`;

// After (working)
const ESRI_BASE = "https://milwaukeemaps.milwaukee.gov/arcgis/rest/services";
const url = `${ESRI_BASE}/.../query?geometry=${lng},${lat}&inSR=4326&...`;
```

**Field Names:** Also fixed to use correct case (`Zoning` not `ZONING`)

### Test Results

```
✅ Geocoding: "500 N Water St" → { lng: -87.908, lat: 43.036 }
✅ Zoning Query: { district: "C9F(A)", category: "DOWNTOWN", type: "OFFICE AND SERVICE" }
✅ RAG Query: Returns detailed zoning info with code citations
✅ Full Agent: Multi-tool workflow with parking calculations
```

**Example Agent Response:**
```
"How many parking spaces for a 5000 sq ft restaurant at 500 N Water St?"

→ Tools used: geocode_address, query_zoning_at_point, calculate_parking, query_zoning_code (3x)
→ Answer: 0 motor vehicle (downtown), 4 bicycle (2 short-term + 2 long-term)
→ Code references: Section 295-403, Section 295-404, Table 295-404-1
```

### Key Files Created/Modified

**New Files:**
- `apps/web/convex/agents/zoning.ts` - Agent with function calling
- `apps/web/convex/agents/tools.ts` - Tool implementations
- `apps/web/convex/ingestion/fileSearchStores.ts` - Store management
- `apps/web/convex/ingestion/ragV2.ts` - File Search RAG
- `apps/web/convex/ingestion/types.ts` - Shared types
- `apps/web/scripts/setup-file-search-stores.ts` - Upload script

**Schema Updates:**
- `fileSearchStores` table - Store metadata
- `storeDocuments` table - Document tracking

### Lessons Learned

1. **Always verify external API URLs** - Different Milwaukee GIS servers exist
2. **Spatial references matter** - ESRI needs explicit `inSR` for WGS84 coordinates
3. **File Search Stores persist** - No more 48-hour expiration for RAG documents
4. **Function calling is powerful** - Gemini handles multi-step workflows well

### Next Up
- [ ] Voice interface with Gemini Live API
- [ ] CopilotKit generative UI cards
- [ ] Conversation history persistence
- [ ] Area Plan Advisor agent

---

## 2026-01-14 - Opik LLM Observability Integration

### Completed
- [x] Install `opik` TypeScript SDK
- [x] Create OpikTraceManager utility for Convex actions
- [x] Instrument Zoning Interpreter Agent with tracing
- [x] Add environment variables documentation
- [x] Update CLAUDE.md with Opik usage guidelines

### Implementation Summary

**Opik Utility Module:** `apps/web/convex/lib/opik.ts`

Created a trace manager class that provides:
- `startTrace()` - Begin a new trace for agent interactions
- `startSpan()` / `endSpan()` - Track individual LLM calls with token usage
- `logToolExecution()` - Log tool calls with timing
- `endTrace()` - Complete trace with final output
- `addScore()` - Add feedback scores for evaluation
- `flush()` - Ensure all data is sent before action completes

**Zoning Agent Integration:** `apps/web/convex/agents/zoning.ts`

The `chat` action now traces:
- Full conversation lifecycle (input message, output response)
- Each LLM call iteration with token usage metrics
- All tool executions (geocode, zoning query, parking calc, RAG)
- Success/failure status with error details

### Key Features

| Feature | Description |
|---------|-------------|
| Auto-disable | If `OPIK_API_KEY` not set, tracing silently disabled |
| Token tracking | Captures prompt/completion/total tokens per call |
| Tool timing | Records duration of each tool execution |
| Error capture | Logs errors with trace context |
| Hierarchical | Spans nest under traces automatically |

### Environment Variables

```bash
OPIK_API_KEY=...              # Required to enable tracing
OPIK_WORKSPACE=...            # Optional workspace name
OPIK_PROJECT_NAME=mkedev-civic-ai  # Project in Opik dashboard
```

### Usage Pattern

```typescript
import { createTraceManager } from "../lib/opik";

const tracer = createTraceManager();
tracer.startTrace({ name: "agent", input: {...}, tags: [...] });

// Track LLM calls
const spanId = tracer.startSpan({ name: "llm-call", input: {...} });
// ... make LLM call ...
tracer.endSpan(spanId, { output: {...}, usage: {...} });

// Track tools
tracer.logToolExecution({ name: "tool", args: {...} }, { result: {...} });

// Complete trace
await tracer.endTrace({ response: "...", success: true });
```

### Next Up
- [ ] Set up Opik account and get API key
- [ ] Test tracing with live queries
- [ ] Add evaluation metrics (hallucination, relevance)
- [ ] Voice interface with Gemini Live API
- [ ] CopilotKit generative UI cards

---

## 2026-01-15 - File Search Stores Upload & Citation Extraction

### Completed
- [x] Upload 27 PDF documents to Gemini File Search Stores
- [x] Fix upload script with correct API endpoints
- [x] Fix grounding metadata extraction for citations
- [x] Add citation UI components (CitationText, PDFViewerModal)
- [x] Add document URL mapping for local PDF viewing

### File Search Stores Setup

**Problem:** File Search Stores existed in Convex but had no documents - the legacy Gemini Files API was being used instead.

**Solution:** Rewrote upload script to use correct two-step approach:
1. Upload file to Gemini Files API (resumable upload)
2. Wait for file processing (poll until ACTIVE)
3. Import into File Search Store

**Script:** `apps/web/scripts/upload-to-file-search.ts`

```bash
pnpm upload-file-search           # Upload all documents
pnpm upload-file-search:status    # Check store status
pnpm upload-file-search:reset     # Delete store records
```

**Documents Uploaded:**
| Category | Documents | Store |
|----------|-----------|-------|
| zoning-codes | 12 | `fileSearchStores/mkedevzoningcodes-51m0bamz6gth` |
| area-plans | 13 | `fileSearchStores/mkedevareaplans-espdo1ktw7fd` |
| policies | 2 | `fileSearchStores/mkedevpolicies-oe5qvxtk947k` |

### Grounding Metadata Fix

**Problem:** Citations returning as fallback even though File Search was working.

**Investigation:** Created debug action to inspect raw Gemini response:
```typescript
export const debugRawResponse = action({...})
```

**Discovery:** Grounding metadata structure was different than expected:
```javascript
// Expected
groundingChunks[].retrievedContext.uri
groundingChunks[].retrievedContext.title

// Actual (File Search format)
groundingChunks[].retrievedContext.fileSearchStore
groundingChunks[].retrievedContext.title (file ID)
groundingChunks[].retrievedContext.text (content)
```

**Fix Applied in `ragV2.ts`:**
- Updated `extractCitationsFromGrounding()` to handle File Search format
- Extract source name from `fileSearchStore` field
- Map store names to human-readable names (e.g., "Milwaukee Zoning Code Chapter 295")
- Include excerpt from retrieved text

### Citation UI Components

**CitationText.tsx**
- Parses `[1]`, `[2]` citation markers from response text
- Renders clickable links that open PDF viewer
- Uses `documentUrls.ts` to map source IDs to PDF URLs

**PDFViewerModal.tsx**
- Modal dialog with embedded PDF viewer (react-pdf)
- Page navigation and zoom controls
- Opens PDFs from `/public/docs/` folder

**documentUrls.ts**
- Maps RAG source IDs to local PDF URLs
- Supports both zoning codes and area plans
- Fuzzy matching for various citation formats

### Test Results

```
Dev Environment:
✅ File Search Stores: 3 active stores with 27 documents
✅ RAG queries: Using gemini-3-flash-preview with File Search tool
✅ Grounding metadata: Now extracting citations correctly
✅ Citation format: { sourceId, sourceName, excerpt }
```

**Example Response:**
```json
{
  "citations": [{
    "sourceId": "fileSearchStores/mkedevzoningcodes-51m0bamz6gth",
    "sourceName": "Milwaukee Zoning Code Chapter 295",
    "excerpt": "$N=$ Prohibited Use..."
  }],
  "confidence": 0.5,
  "processingTimeMs": 17741
}
```

### Key Files Modified/Created

**New Files:**
- `apps/web/scripts/upload-to-file-search.ts` - Upload CLI
- `apps/web/src/components/chat/CitationText.tsx` - Citation renderer
- `apps/web/src/components/ui/PDFViewerModal.tsx` - PDF viewer
- `apps/web/src/lib/documentUrls.ts` - URL mapping
- `apps/web/src/lib/citations.ts` - Citation parsing
- `apps/web/public/docs/` - 27 PDF documents

**Modified Files:**
- `apps/web/convex/ingestion/ragV2.ts` - Grounding metadata extraction
- `apps/web/convex/ingestion/fileSearchStores.ts` - Delete mutations
- `apps/web/src/hooks/useZoningAgent.ts` - Citation extraction from tool results
- `apps/web/package.json` - Upload scripts

### Lessons Learned

1. **File Search API format differs from docs** - The REST endpoint structure wasn't clearly documented; had to discover via trial and error
2. **Grounding metadata varies by source type** - File Search uses `fileSearchStore` field, not `uri`
3. **Debug actions are essential** - Created `debugRawResponse` to inspect actual API responses
4. **Two Convex deployments** - dev and prod use different databases; stores needed in both

### Notes

- Production deployment may need store records synced (currently in dev only)
- Large PDF warning from GitHub (57.65 MB) - consider Git LFS
- Inline citations `[1.2]`, `[1.4]` come from Gemini's grounding, not our markers

### Next Up
- [ ] Voice interface with Gemini Live API
- [ ] CopilotKit generative UI cards
- [ ] Sync File Search Stores to production
- [ ] Add page-level citations (specific PDF pages)

---

## 2026-01-16 - Map Performance & Chat Bug Fixes

### Completed
- [x] Parcel layer styling - transparent fill with outline only
- [x] PMTiles service worker caching for faster loads
- [x] Homes layer re-initialization after 3D mode toggle
- [x] Retry logic for failed map tile fetches
- [x] Service-specific error messages in map UI
- [x] Fix duplicate chat message persistence

### Parcel Layer Styling

**Problem:** Parcel layer was too dark/prominent, obscuring the base map.

**Root Cause:** The app uses PMTiles (not ESRI REST) for parcel rendering with hardcoded styles in `pmtiles-layer-manager.ts`, not the shared `layer-config.ts`.

**Fix Applied:**
```typescript
// pmtiles-layer-manager.ts
parcels: {
  type: 'fill',
  paint: {
    'fill-color': '#78716C',
    'fill-opacity': 0,  // Transparent fill - outline only
    'fill-outline-color': '#57534E',  // stone-600
  },
}
```

Also fixed `?? 1` instead of `|| 1` to properly handle opacity 0.

### PMTiles Service Worker Caching

**New Files:**
- `apps/web/public/pmtiles-sw.js` - Service worker with 7-day cache
- `apps/web/src/components/map/PMTilesCacheProvider.tsx` - SW registration
- `apps/web/src/lib/pmtiles-cache.ts` - IndexedDB utilities

**Features:**
- 7-day cache expiration
- Automatic retry with exponential backoff (1s, 2s, 4s)
- Stale cache fallback when network fails
- Unique cache keys including Range headers

### Homes Layer Fix

**Problem:** Home markers disappeared after toggling 3D mode.

**Root Cause:** `HomesLayerLoader` wasn't re-initializing after map style changes.

**Fix Applied:**
- Added `reinitializeLayers()` to `useHomesLayer` hook
- Added `isStyleChanging` prop to `HomesLayerLoader`
- `MapContainer` now passes `isStyleChanging` to both layer loaders

### Retry Logic & Error Messages

**PMTiles Layer Manager:**
- 3 retry attempts with exponential backoff on initialization
- Clear error message: "PMTiles tile server unreachable after 3 attempts"

**Service Worker:**
- `fetchWithRetry()` with 3 attempts and exponential backoff
- Falls back to stale cache on total failure
- Returns 503 with structured error JSON if no cache

**UI Error Messages:**
- Identifies failing service: PMTiles, ESRI, or Mapbox
- Shows service name in error footer
- "Refresh Page" button in error overlay

### Duplicate Chat Messages Fix

**Problem:** Asking about homes/parcels created duplicate responses in chat.

**Root Causes:**
1. `persistMessage` in effect dependencies caused re-runs
2. Non-awaited async persistence calls raced
3. No deduplication in Convex mutation

**Fixes Applied:**

**Convex `addMessage` mutation:**
```typescript
// Check last 5 messages within 10 seconds for duplicates
const isDuplicate = recentMessages.some(
  (msg) =>
    msg.role === args.role &&
    msg.content === args.content &&
    now - msg.timestamp < 10000
);
if (isDuplicate) return existingMsg?._id;
```

**HomeContent.tsx persistence effect:**
- Use `persistMessageRef` to avoid dependency array issues
- Add `isPersistingRef` to prevent concurrent calls
- Await persistence calls sequentially

### Files Modified

| File | Changes |
|------|---------|
| `pmtiles-layer-manager.ts` | Outline-only parcels, retry logic |
| `public/pmtiles-sw.js` | Service worker with caching + retry |
| `PMTilesCacheProvider.tsx` | SW registration component |
| `pmtiles-cache.ts` | IndexedDB cache utilities |
| `ClientProviders.tsx` | Added PMTilesCacheProvider |
| `useHomesLayer.ts` | Added reinitializeLayers |
| `HomesLayerLoader.tsx` | Added isStyleChanging prop |
| `MapContainer.tsx` | Better errors, pass isStyleChanging |
| `ESRILayerLoader.tsx` | Service-specific error messages |
| `conversations.ts` | Deduplication in addMessage |
| `HomeContent.tsx` | Fixed persistence effect |

### Commits
- `feat(map): Make parcel layer outline-only for better visibility`
- `feat(map): Add retry logic and improved error handling for map layers`
- `fix(chat): Prevent duplicate message persistence`

### Next Up
- [ ] Voice interface with Gemini Live API
- [ ] CopilotKit generative UI polish
- [ ] Production deployment preparation

---

## 2026-01-17 - Citation System Improvements

### Completed
- [x] Fix citation links showing "0 VIEWABLE" with no clickable PDFs
- [x] Add section references (e.g., "295-503", "Table 295-503-1") to citations
- [x] Add page number extraction from grounding chunks
- [x] Fix area plan detection for "Fond du Lac & North" and other plans
- [x] Add area-plan-context cards for area plan citations
- [x] Deploy to correct Convex deployment (sleek-possum-794)

### Root Cause Analysis

**Citation Links Not Working**

The `useZoningAgent.ts` hook was dropping `sourceId` from citations:
```typescript
// Before (broken)
citations?: Array<{ sourceName?: string }>;

// After (fixed)
citations?: Array<{
  sourceId?: string;
  sourceName?: string;
  excerpt?: string;
  sectionReference?: string;
  pageNumber?: number;
}>;
```

**Wrong Convex Deployment**

`npx convex deploy` was pushing to `hip-meadowlark-762` but users connect to `sleek-possum-794`. Fixed by using `npx convex dev --once` for development deployment.

### Section Reference Extraction

Added `extractSectionReference()` function in `ragV2.ts`:
```typescript
const patterns = [
  /Table\s*295-\d{3}(?:-\d+)?/gi,  // Table 295-503-1
  /Section\s*295-\d{3}/gi,         // Section 295-503
  /295-\d{3}(?:-\d+)?/g,           // 295-503 or 295-503-1
  /Subchapter\s*\d+/gi,            // Subchapter 5
];
```

### Page Number Extraction

Added `extractPageHint()` function:
```typescript
const patterns = [
  /Page\s*(\d+)/i,     // Page 5
  /pg\.?\s*(\d+)/i,    // pg. 5
  /-\s*(\d+)\s*-/,     // - 5 -
];
```

### Area Plan Detection Fix

Improved pattern matching in `detectAreaPlan()`:
```typescript
// Before (missed many plans)
{ patterns: ['fondy'], key: 'fondy-north-plan', ... }

// After (comprehensive)
{
  patterns: [
    'fond du lac & north',
    'fond du lac and north',
    'fondy',
    'fondy north',
    'north avenue corridor'
  ],
  key: 'fondy-north-plan',
  title: 'Fond du Lac & North Area Plan'
}
```

### Area Plan Context Cards

Added card creation in `useZoningAgent.ts`:
```typescript
if (areaPlanData && areaPlanData.citations?.length > 0) {
  cards.push({
    type: 'area-plan-context',
    data: {
      answer: areaPlanData.answer,
      citations: areaPlanData.citations,
      confidence: 0.7,
    },
  });
}
```

### UI Improvements

Citation buttons now display:
- Document title (clickable)
- Section reference in parentheses (e.g., "(Table 295-503-1)")
- Page number (e.g., "p.5")

Example: `[View] Residential Districts (295-503) p.12`

### Files Modified

| File | Changes |
|------|---------|
| `convex/ingestion/ragV2.ts` | extractSectionReference(), extractPageHint(), improved detectAreaPlan() |
| `convex/ingestion/types.ts` | Added pageNumber, sectionReference to Citation interface |
| `src/hooks/useZoningAgent.ts` | Fixed citation types, added area-plan-context card creation |
| `src/app/HomeContent.tsx` | Display section reference and page number in citation buttons |

### Commits
- `543ddce` fix(citations): Include sourceId in citation types for PDF URL matching
- `62c6529` feat(citations): Add section references, page numbers, and area plan citations

### Lessons Learned

1. **Type preservation matters** - Dropping fields in intermediate types breaks downstream features
2. **Multiple Convex deployments** - Dev and prod use different URLs; verify deployment target
3. **Pattern matching flexibility** - Area plan detection needs multiple patterns per plan
4. **Grounding chunk analysis** - Section references and page hints exist in RAG response text

---

## 2026-01-17 - PDF Report Generation with Hybiscus

### Completed
- [x] Research Hybiscus API documentation and endpoints
- [x] Create Convex action for PDF report generation
- [x] Design report template structure for conversations
- [x] Create React hook for report generation state management
- [x] Add "Download Report" button to ChatPanel UI
- [x] Wire up report generation to HomeContent

### Implementation Summary

**Hybiscus API Integration**

The [Hybiscus API](https://hybiscus.dev) provides a three-step process:
1. POST to `/api/v1/build-report` with JSON payload
2. Poll `/api/v1/get-task-status` until SUCCESS
3. Retrieve PDF from `/api/v1/get-report`

**New Files Created:**

| File | Purpose |
|------|---------|
| `convex/reports.ts` | Convex action that builds and fetches PDF reports |
| `src/hooks/useReportGenerator.ts` | React hook for report generation state |

**Modified Files:**

| File | Changes |
|------|---------|
| `src/components/chat/ChatPanel.tsx` | Added Download icon, report button, loading state |
| `src/app/HomeContent.tsx` | Integrated useReportGenerator hook |

### Report Structure

The generated PDF includes:
- **Title**: "MKE.dev Conversation Report"
- **Byline**: Conversation title + generation date
- **Summary Section**: Message count and introduction
- **Message Transcript**: Each message as a Section component with:
  - Role label (You / MKE.dev Assistant)
  - Timestamp
  - Markdown-formatted content
  - Generative UI card data converted to text
- **Footer**: MKE.dev branding

### Card Type Support

All generative UI cards are converted to readable text:
- `zone-info` → Zoning district, category, overlays
- `parcel-info` → Address, zoning, area plan, parking
- `code-citation` → Answer text with source references
- `area-plan-context` → Area plan answer with sources
- `home-listing` → Property details (beds, baths, sqft, year)
- `homes-list` → List of available homes
- `parcel-analysis` → Parking calculations

### UI Features

- Download button appears in chat header when messages exist
- Button disabled during loading or report generation
- Loading spinner shows "Generating..." during API call
- PDF opens in new browser tab for download
- 30-second timeout with polling

### Environment Variable

```bash
HYBISCUS_API_KEY=your_api_key_here
```

Get API key from [hybiscus.dev](https://hybiscus.dev)

### Technical Notes

1. **Convex action** handles external API calls (Hybiscus requires server-side)
2. **Polling interval**: 1 second with max 30 attempts
3. **Report components**: Using Section, Text, Vertical Spacer
4. **Markdown support**: `markdown_format: true` for text blocks
5. **Build verified**: TypeScript passes, Next.js builds successfully

### Next Up
- [ ] Voice interface with Gemini Live API
- [ ] CopilotKit generative UI polish
- [ ] Production deployment preparation

---

## 2026-01-18 - UI Enhancements: Street View, Reports Modal, Landing Page

### Completed
- [x] Add MKE.dev logo to PDF reports via GitHub raw URL
- [x] Display generated reports in modal instead of new tab
- [x] Create interactive Street View modal with Google Maps JavaScript API
- [x] Add Street View buttons to ParcelCard and HomeCard
- [x] Implement screenshot capture using Static Street View API
- [x] Fix Area Plans tab truncation with scrollable container
- [x] Redesign landing page with real app screenshots

### Implementation Summary

**PDF Report Enhancements**

| Change | Description |
|--------|-------------|
| Logo header | MKE.dev logo added via GitHub raw URL |
| Modal viewer | Reports now open in PDFViewerModal with page nav |
| Hook updates | `useReportGenerator` returns `pdfUrl` and `clearPdfUrl` |

**Street View Modal** (`/components/ui/StreetViewModal.tsx`)

Features:
- Interactive Google Street View panorama (pan, zoom, navigate)
- Screenshot capture button using Static Street View API
- Preview modal with download functionality
- Keyboard shortcuts (Escape to close)
- Fallback to Google Maps if JavaScript API unavailable

Integration:
- Added `onOpenStreetView` prop to ParcelCard and HomeCard
- Street View button in ParcelCard Quick Actions (sky blue)
- Street View button in HomeCard Action Buttons (amber)
- Modal state managed in HomeContent.tsx

**Note**: Requires enabling Maps JavaScript API in Google Cloud Console for the API key.

**ParcelCard Fix**

- Added `max-h-48 overflow-y-auto` to Area Plans tab
- Plan name stays sticky at top while scrolling
- Prevents card from growing too tall with long descriptions

**Landing Page Redesign**

New structure:
1. **Hero Section** - Centered logo, tagline, full app screenshot
2. **Feature Showcase** - 3 alternating image/text layouts with:
   - "Ask Anything About Zoning" - AI chat screenshot
   - "Rich Property Intelligence" - ParcelCard screenshot
   - "Discover Homes For Sale" - Home listing screenshot
3. **Features Grid** - 6 feature cards with new icons
4. **Use Cases** - Enhanced cards for Developers, Homebuyers, City Staff
5. **CTA Section** - "Ready to Build in Milwaukee?"

Screenshots renamed for clarity:
- `chat-zoning-response.png`
- `parcel-card-streetview.png`
- `homes-search-map.png`
- `home-listing-layers.png`

### New Components

| Component | Purpose |
|-----------|---------|
| `StreetViewModal` | Interactive Google Street View with screenshot capture |
| `FeatureShowcase` | Alternating image/text layout for landing page |

### Modified Files

| File | Changes |
|------|---------|
| `convex/reports.ts` | Added logo constant and Image component |
| `useReportGenerator.ts` | Added pdfUrl state and clearPdfUrl |
| `HomeContent.tsx` | Modal states for reports and Street View |
| `ParcelCard.tsx` | Street View button, scrollable Area Plans |
| `HomeCard.tsx` | Street View button |
| `LandingPage.tsx` | Complete redesign with screenshots |
| `ui/index.ts` | Export StreetViewModal and PDFViewerModal |

### Git Commits

```
9dea437 feat(landing): Redesign landing page with real app screenshots
2c3db0b fix(ui): Add scrollable area to ParcelCard Area Plans tab
70edbdd feat(ui): Add interactive Street View modal with screenshot capture
0678aa0 feat(reports): Add logo to PDF reports and modal viewer
```

### Technical Notes

1. **Google Maps API**: JavaScript API needed for interactive Street View (Static API works for screenshots)
2. **Screenshot workflow**: Captures current position/heading/pitch/zoom and requests from Static API
3. **Coordinate handling**: StreetViewModal accepts both `{lat, lng}` and `[lng, lat]` formats
4. **Dark mode**: All new components support light/dark themes

### Next Up
- [ ] Enable Google Maps JavaScript API for Street View
- [ ] Voice interface with Gemini Live API
- [ ] Production deployment preparation

---

## 2026-01-18 - Incentives RAG & Chat Onboarding

### Completed
- [x] Add "incentives" category to Convex schema (documents, storeDocuments, fileSearchStores)
- [x] Update all category validators in fileSearchStores.ts
- [x] Create upload-incentives.ts script for HTML and PDF files
- [x] Upload 8 incentive documents to new mkedev-incentives File Search Store
- [x] Add suggested prompts to ChatPanel for user onboarding
- [x] Update Planning Ingestion Agent to use Playwright instead of Firecrawl
- [x] Test RAG queries against incentives store

### Incentives File Search Store

**Problem:** Users asking about Milwaukee housing incentive programs had no RAG source to query.

**Solution:** Created new "incentives" category and uploaded 8 documents covering:
- $25,000 STRONG Homes Loan Program (HTML + PDF brochure)
- $35,000 Homebuyer Assistance Program (HTML + PDF brochure)
- ARCH Program (HTML + PDF application)
- Milwaukee Home Down Payment Assistance (HTML + PDF guidelines)

**Store:** `fileSearchStores/mkedevincentives-v06gcynm7nyc`

**Script:** `apps/web/scripts/upload-incentives.ts`
- Handles both HTML and PDF files with dynamic MIME type detection
- Creates store, uploads all documents, registers in Convex

### Schema Updates

Added "incentives" to multiple validators:
- `convex/schema.ts` - documents table, storeDocuments table, fileSearchStores table
- `convex/ingestion/fileSearchStores.ts` - 6 category validators
- `convex/ingestion/rag.ts` - category union
- `convex/ingestion/ragV2.ts` - category union
- `convex/ingestion/documents.ts` - documentCategory union

### Chat Onboarding

**Problem:** Users didn't know what questions to ask or what information was available.

**Solution:** Added suggested prompts to ChatPanel empty state with 4 clickable buttons:

| Category | Prompt |
|----------|--------|
| Zoning | "What are the zoning requirements for opening a restaurant in the Third Ward?" |
| Housing | "What are the requirements for building a home on a city-owned lot?" |
| Incentives | "What TIF districts and financial incentives are available in Milwaukee?" |
| Area Plans | "What development opportunities are in the Menomonee Valley?" |

Each button sends the prompt directly to the chat input on click.

### Planning Ingestion Agent

**Problem:** Firecrawl was removed from requirements; needed alternative for web scraping.

**Solution:** Created `playwright_scraper.py` tool for the Planning Ingestion Agent:
- Uses Playwright for reliable page rendering
- Handles bot detection with realistic user agent and wait strategies
- Converts HTML to markdown using markdownify
- Extracts PDF links from pages for separate download

### RAG Test Results

```
Query: "What is the STRONG Homes Loan Program?"
Store: fileSearchStores/mkedevincentives-v06gcynm7nyc
Response: Detailed answer with eligibility requirements, loan amounts ($1,000-$25,000),
          interest rates (0% for <60% AMI, 3% for 60-150% AMI),
          homeownership retention credit (25% forgiven after 10 years)
Citations: STRONG Homes Loan Brochure, $25,000 STRONG Homes Loan Program
```

### Git Commits

```
9bc0b17 feat(incentives): Add incentives document category and File Search Store
37b80a2 docs(readme): Update with incentives RAG and chat onboarding features
```

### RAG Document Corpus Now

| Store | Documents | Status |
|-------|-----------|--------|
| mkedev-zoning-codes | 12 PDFs | Active |
| mkedev-area-plans | 13 PDFs | Active |
| mkedev-policies | 2 PDFs | Active |
| Milwaukee Planning Documents | 7 docs | Active |
| mkedev-incentives | 8 docs | Active |
| **Total** | **42 documents** | |

### Next Up
- [ ] Voice interface with Gemini Live API
- [ ] Test query_incentives tool in zoning agent
- [ ] Production deployment preparation

---

## 2026-01-18 - Gemini 3 Context Caching + Thinking Levels

### Completed
- [x] Implement 1M token context window with Gemini 3
- [x] Add Thinking Levels (high) for complex feasibility queries
- [x] Create smart query router (RAG vs deep analysis)
- [x] Build query classifier (simple/complex/feasibility)
- [x] Deploy and test with Milwaukee zoning corpus

### Implementation Summary

**Gemini 3 Hackathon Features**

This is a KEY implementation for the Gemini 3 Hackathon - demonstrating:
1. **1M Context Window** - Full zoning corpus loaded directly into Gemini 3
2. **Thinking Levels** - Deep reasoning with `thinkingLevel: "high"`
3. **Smart Query Router** - Auto-routes simple queries to RAG, complex to Gemini 3

**New File:** `apps/web/convex/agents/contextCache.ts`

| Function | Purpose |
|----------|---------|
| `loadZoningCorpus` | Load full zoning documents into context |
| `deepAnalysis` | Gemini 3 with 1M context + optional thinking |
| `smartQuery` | Auto-route to RAG or Gemini 3 based on query type |
| `classifyQuery` | Classify as simple/complex/feasibility |
| `testDeepAnalysis` | Test brewery example with thinking |
| `testSmartQuery` | Test the smart router |

**Models Used:**
- `gemini-3-flash-preview` - Fast analysis with 1M context
- `gemini-3-pro-preview` - Deep thinking with reasoning output

**Query Classification Patterns:**
```typescript
// Complex patterns (triggers deep analysis)
/compare|across|all zones|every zone|comprehensive/i
/conflict|contradiction|overlap/i
/what are my options|where can I|which zones allow/i

// Feasibility patterns (triggers thinking)
/feasibility|feasible|can I build/i
/mixed.?use.*development/i
/comply|compliance|meet.*requirements/i
```

### Test Results

**Complex Query (Gemini 3 Flash):**
```
Query: "Compare ALL commercial zones - which allow breweries with taprooms?"
Method: deep-context
Model: gemini-3-flash-preview
Response: Comprehensive table comparing NS1, NS2, LB1, LB2, CS, RB1, RB2
         with brewing permissions, taproom rules, outdoor seating, parking
```

**Feasibility Query (Gemini 3 Pro with Thinking):**
```
Query: "What zones allow brewery + taproom + live music?"
Method: deep-thinking
Model: gemini-3-pro-preview
Reasoning: "I'm tackling this Milwaukee brewery project. I'm starting by
           zeroing in on the user's need... First, the uses themselves:
           'Craft Brewery' – is it 'Light Manufacturing,' 'Tavern,'..."
Response: Top 3 recommendations with detailed compliance analysis
```

### Thinking Levels Output

The reasoning field shows Gemini 3's internal thought process:
- Breaking down complex queries into components
- Cross-referencing zoning code sections
- Identifying potential conflicts
- Synthesizing recommendations

Example reasoning excerpt:
> "So, synthesizing it all... the Industrial Mixed is the first candidate.
> It allows brewing and commercial. Music is generally okay, and moderate parking.
> LB2 would be second, for good foot traffic, but I need to make sure brewing is small-scale..."

### API Configuration

```typescript
// Gemini 3 models for hackathon
const GEMINI_FLASH_MODEL = "gemini-3-flash-preview";
const GEMINI_PRO_MODEL = "gemini-3-pro-preview";

// Thinking configuration
thinkingConfig: {
  thinkingLevel: "high",  // or "low" for faster
  includeThoughts: true,  // Return reasoning in response
}
```

### Files Created/Modified

| File | Changes |
|------|---------|
| `convex/agents/contextCache.ts` | New - Full implementation |
| `convex/ingestion/documents.ts` | Added `listAll` internalQuery |

### Key Decisions

1. **Direct context over caching** - Gemini 3 preview models don't support explicit caching API yet, so we load full corpus directly into each request
2. **Query classification first** - Classify before routing to minimize costs on simple queries
3. **Thinking for feasibility only** - `thinkingLevel: "high"` only on complex/feasibility queries to balance cost/latency
4. **RAG fallback** - If deep analysis fails, falls back to RAG for simple queries

### Hackathon Differentiation

This implementation showcases Gemini 3's unique capabilities:
- **Not just RAG** - Cross-references entire zoning code simultaneously
- **Shows reasoning** - Exposes how AI thinks through complex civic queries
- **Comparative analysis** - Tables comparing ALL zones (not just relevant snippets)
- **Deep feasibility** - Multi-factor analysis with conflict detection

### Next Up
- [ ] Integrate Nano Banana for architectural visualization
- [ ] Add Gemini Live voice interface
- [ ] Wire smartQuery into main chat flow

---

## 2026-01-18 - AI Site Visualizer with Gemini 3 Pro Image

### Completed
- [x] Build complete Site Visualizer with Gemini 3 Pro Image (`gemini-3-pro-image-preview`)
- [x] Implement Konva.js mask painting canvas (brush/eraser tools)
- [x] Create Zustand store for visualizer state management
- [x] Add map screenshot capture via camera button
- [x] Add Street View screenshot capture with "Visualize" button
- [x] Build screenshot gallery with thumbnail grid
- [x] Connect Convex action for image generation
- [x] Fix environment variable name (`GEMINI_API_KEY`)
- [x] Add error display UI and debug logging

### Implementation Summary

**Site Visualizer Feature** - Core Hackathon Showcase

This is a KEY feature for the Gemini 3 Hackathon, demonstrating:
1. **Gemini 3 Pro Image** (`gemini-3-pro-image-preview`) for architectural visualization
2. **Inpainting with masks** - Paint areas to modify, AI generates contextual architecture
3. **Zoning-aware generation** - Prompts enhanced with Milwaukee zoning constraints

**New Components Created:**

| Component | Purpose |
|-----------|---------|
| `SiteVisualizer.tsx` | Full-screen modal with mode switching |
| `VisualizerCanvas.tsx` | Konva.js canvas for image + mask layer |
| `MaskToolbar.tsx` | Brush/eraser tools with size slider |
| `ImageCapture.tsx` | Screenshot gallery + file upload |
| `PromptInput.tsx` | Prompt textarea with generate button |
| `GenerationResult.tsx` | Side-by-side Original vs AI comparison |
| `MapScreenshotButton.tsx` | Purple camera button on map |

**Screenshot Capture Flow:**

| Source | Capture Method | Result |
|--------|----------------|--------|
| Map | Camera button (bottom-left) | Added to gallery |
| Street View | Capture → Visualize button | Added to gallery + opens visualizer |
| File Upload | Click upload button | Opens file picker |

**Zustand Store:** `visualizerStore.ts`

State managed:
- `mode`: 'idle' | 'capture' | 'edit' | 'generate' | 'result'
- `sourceImage`, `maskImage`, `generatedImage`: Base64 strings
- `screenshots`: Array of `ScreenshotEntry` (up to 20)
- `activeTool`, `brushSize`, `isDrawing`: Canvas editing state
- `prompt`, `isGenerating`, `generationError`: Generation state
- `history`, `historyIndex`: Undo/redo support

**Convex Action:** `convex/visualization/generate.ts`

```typescript
// Gemini 3 Pro Image generation
const model = genAI.getGenerativeModel({
  model: "gemini-3-pro-image-preview"
});

const result = await model.generateContent({
  contents: [{
    role: "user",
    parts: [
      { inlineData: { mimeType: "image/png", data: sourceImageBase64 } },
      { inlineData: { mimeType: "image/png", data: maskImageBase64 } },
      { text: enhancedPrompt }
    ]
  }],
  generationConfig: {
    responseModalities: ["TEXT", "IMAGE"]
  }
});
```

### Screenshot Gallery

**Problem:** Original design had capture directly open visualizer, but users wanted to:
1. Take multiple screenshots at different angles
2. Browse and select the best one for visualization

**Solution:** Gallery approach with persistent storage:
- Camera button on map saves to gallery instantly (green checkmark feedback)
- Street View "Visualize" button converts static image to base64 and saves
- Gallery shows thumbnails with address and timestamp
- Click any thumbnail to use for visualization
- Hover reveals delete button

**Gallery Features:**
- Max 20 screenshots stored in session
- Grid layout with responsive columns (2/3/4 based on screen)
- Hover overlay shows address and time
- Screenshots persist in visualizer store (not localStorage - too large)

### Key Files Created/Modified

**New Files:**
- `src/stores/visualizerStore.ts` - Zustand store
- `src/stores/index.ts` - Store exports
- `src/components/visualizer/*.tsx` - 6 components
- `src/components/map/MapScreenshotButton.tsx` - Camera button
- `convex/visualization/generate.ts` - Gemini API action

**Modified Files:**
- `src/contexts/MapContext.tsx` - Added `captureMapScreenshot()`
- `src/components/map/MapContainer.tsx` - Added `MapScreenshotButton`, `onParcelVisualize`
- `src/components/ui/StreetViewModal.tsx` - Added "Visualize" button with gallery integration
- `src/components/map/ParcelPopup.tsx` - Added "Visualize this site" button
- `src/app/HomeContent.tsx` - Visualizer modal state and handlers

### Bug Fixes

| Bug | Root Cause | Fix |
|-----|------------|-----|
| "Nothing generated" | Placeholder code returning original image | Connected actual Convex action |
| API key not found | Wrong env var name | Changed to `GEMINI_API_KEY` |
| Map capture null | `mapRef.current` not updating | Added camera button approach |
| Street View not in gallery | Only download option | Added "Visualize" button |

### Git Commits

```
d55efcc feat(visualizer): Add Street View capture to visualizer gallery
328e5ed feat(visualizer): Add screenshot gallery for map captures
4a6e0d4 feat(visualizer): Connect map capture to visualizer
3d128e9 fix(visualizer): Use correct env var name GEMINI_API_KEY
d7b7e90 fix(visualizer): Add error display and debug logging
524c4ea fix(visualizer): Connect PromptInput to actual Gemini 3 Pro Image API
efedeae feat(visualizer): Add AI Site Visualizer with Gemini 3 Pro Image
```

### Hackathon Differentiation

The Site Visualizer showcases Gemini 3's unique capabilities:
- **Image generation** - Not just text, actual architectural visualization
- **Inpainting** - Mask-based editing for precise modifications
- **Contextual awareness** - Zoning data influences generation
- **Milwaukee-specific** - Generates contextually appropriate architecture

### User Flow

1. Navigate to any location on the map
2. Click purple camera button (bottom-left) to take screenshot
3. Optionally: Open Street View → Navigate → Capture → Visualize
4. Open Site Visualizer (from header or gallery)
5. Select a screenshot from gallery
6. Paint mask over area to modify
7. Enter prompt: "Add a 4-story mixed-use building"
8. Click Generate → Wait for Gemini 3 Pro Image
9. View side-by-side comparison
10. Download or try again with different prompt

### Next Up
- [ ] Voice interface with Gemini Live API
- [ ] Test with various Milwaukee locations
- [ ] Add zoning constraint display in visualizer sidebar

---

## 2026-01-19 - Parcel Highlight Fix & Layer Opacity Controls

### Completed
- [x] Fix parcel highlight not working when clicking on ESRI features
- [x] Add layer opacity sliders to LayersDropdown

### Parcel Highlight Fix

**Problem:** Clicking on parcels didn't show the blue highlight. The ESRI features don't have proper IDs for Mapbox's `feature-state` system to work.

**Root Cause:** Unlike PMTiles which can use `promoteId` to assign feature IDs, ESRI FeatureServer features have inconsistent or missing IDs that Mapbox's `setFeatureState()` can't target.

**Solution:** Switched from `feature-state` approach to dedicated GeoJSON source:

```typescript
// Constants for highlight source/layers
const HIGHLIGHT_SOURCE_ID = 'parcel-highlight-source'
const HIGHLIGHT_FILL_LAYER_ID = 'parcel-highlight-fill'
const HIGHLIGHT_LINE_LAYER_ID = 'parcel-highlight-line'

// Initialize empty GeoJSON source for highlights
initializeHighlightLayers(): void {
  this.map.addSource(HIGHLIGHT_SOURCE_ID, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] }
  })

  // Add fill layer (semi-transparent blue)
  this.map.addLayer({
    id: HIGHLIGHT_FILL_LAYER_ID,
    type: 'fill',
    source: HIGHLIGHT_SOURCE_ID,
    paint: { 'fill-color': '#3B82F6', 'fill-opacity': 0.35 }
  })

  // Add line layer (bold outline)
  this.map.addLayer({
    id: HIGHLIGHT_LINE_LAYER_ID,
    type: 'line',
    source: HIGHLIGHT_SOURCE_ID,
    paint: { 'line-color': '#2563EB', 'line-width': 3.5 }
  })
}

// Update highlight with clicked feature's geometry
updateHighlightGeometry(geometry: GeoJSON.Geometry | null): void {
  const source = this.map.getSource(HIGHLIGHT_SOURCE_ID)
  source.setData(geometry ? {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry }]
  } : { type: 'FeatureCollection', features: [] })
}
```

**Changes to Click Handler:**
```typescript
this.map.on('click', parcelsFillLayer, (e) => {
  const feature = e.features[0]
  if (feature.geometry) {
    this.selectedFeatureGeometry = feature.geometry
    this.updateHighlightGeometry(this.selectedFeatureGeometry)
  }
})
```

### Layer Opacity Controls

**Problem:** LayersDropdown only had on/off checkboxes, no opacity sliders.

**Solution:** Added expandable opacity sliders for each active layer:

| Feature | Description |
|---------|-------------|
| Expand chevron | Click to reveal opacity slider for active layers |
| Range slider | 0-100% opacity with visual percentage display |
| Real-time update | Calls `setLayerOpacity()` from MapContext |
| Default values | Each layer has appropriate default (zoning 50%, parcels 0%, etc.) |

**UI Flow:**
1. Toggle layer on with checkbox
2. Click chevron (>) to expand opacity controls
3. Drag slider to adjust transparency
4. Percentage shown on right side

### Files Modified

| File | Changes |
|------|---------|
| `esri-layer-manager.ts` | GeoJSON source highlight instead of feature-state |
| `LayersDropdown.tsx` | Added expandable opacity sliders with chevron toggle |

### Git Commits

```
b9df741 fix(map): Fix parcel highlight and add layer opacity controls
```

### Technical Notes

1. **GeoJSON source vs feature-state** - More reliable for ESRI data since we capture actual geometry
2. **Cleanup in destroy()** - Now removes highlight source and layers on unmount
3. **Removed unused field** - `selectedFeatureId` no longer needed since highlight uses geometry
4. **PMTiles highlight works** - Uses feature-state which works with PMTiles' `promoteId`

### Next Up
- [ ] Add Gemini Live voice interface
- [ ] Production deployment preparation

---

## 2026-01-20 - Hackathon Documentation & Landing Page Polish

### Completed
- [x] Fix PMTiles parcel highlight (same GeoJSON source approach as ESRI)
- [x] Add AI Visualizer section to landing page
- [x] Expand visualizer gallery with two use cases
- [x] Create hackathon newsletter documentation
- [x] Fix image file extensions and paths

### Landing Page AI Visualizer

**Added two showcase use cases:**

| Use Case | Images | Prompt |
|----------|--------|--------|
| Home Renovation | `house-to-bungalow.png`, `bungalow-detail.jpg` | "Turn this house into a modern bungalow with nice landscaping" |
| Community Vision | `lot-to-park.png`, `park-detail.jpg` | "Transform this into a community park with walking paths and trees" |

**Layout:**
- Side-by-side cards with before/after comparison (2/3 width)
- Detail card with category badge, description, and prompt
- Detail image showing generated result
- Alternating layout for visual interest

### Hackathon Documentation Created

**Files in `agent-os/product/`:**

| File | Purpose |
|------|---------|
| `ai-visualizer-deep-dive.md` | Newsletter content for Site Visualizer feature |
| `context-caching-deep-dive.md` | Newsletter content for 1M context + caching |
| `zoning-ai-demo-questions.md` | Demo questions for hackathon presentation |

### Context Caching Deep Dive

**Key points documented:**
- Problem with traditional RAG (chunking, retrieval misses)
- Solution: Full 500K+ token zoning code in context
- Context caching reduces costs by 99% ($2,500/day → $10/day)
- Technical implementation with code examples
- Example conversations showing multi-section analysis

### PMTiles Parcel Highlight Fix

**Same issue as ESRI:** PMTiles features don't have proper IDs for `feature-state`.

**Solution:** Applied same GeoJSON source approach:
```typescript
const HIGHLIGHT_SOURCE_ID = 'pmtiles-parcel-highlight-source'
const HIGHLIGHT_FILL_LAYER_ID = 'pmtiles-parcel-highlight-fill-geojson'
const HIGHLIGHT_LINE_LAYER_ID = 'pmtiles-parcel-highlight-line-geojson'

// Capture geometry on click, update GeoJSON source
this.selectedFeatureGeometry = feature.geometry
this.updateHighlightGeometry(this.selectedFeatureGeometry)
```

### Git Commits Today

```
1dd616a feat(landing): Expand AI Visualizer gallery with two use cases
63045b5 docs(product): Add hackathon documentation and fix visualizer image
add6d5c feat(landing): Replace visualizer examples with better house transformation
fdbf163 feat(landing): Add AI Site Visualizer section with screenshots
e4d6686 fix(map): Fix parcel highlight for PMTiles layer manager
```

### Notes
- Landing page only visible when signed out (SignedOut wrapper)
- Image files needed correct extensions (JPEG files were named .png)
- Hackathon deadline: February 10, 2026 (3 weeks remaining)

### Next Up
- [ ] Add Gemini Live voice interface
- [ ] Production deployment preparation
- [ ] Final hackathon submission materials

---

*Log entries below will be added as development progresses*
