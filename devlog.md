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

*Log entries below will be added as development progresses*
