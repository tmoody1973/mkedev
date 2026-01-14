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

*Log entries below will be added as development progresses*
