# Task Breakdown: Mapbox Spatial Tools for MKE.dev Agent

## Overview
Total Tasks: 4 Task Groups | Estimated Duration: 1-2 Days

This breakdown integrates Mapbox spatial intelligence into the MKE.dev agent system, enabling location-based queries, accessibility analysis, and visual map generation.

**Note:** The core Mapbox tools library (`/apps/web/src/lib/mapbox/`) has already been implemented.

---

## Task List

### Foundation Layer

#### Task Group 1: Convex Actions for Mapbox APIs
**Dependencies:** None (tools library complete)

- [ ] 1.0 Complete Convex actions for Mapbox API calls
  - [ ] 1.1 Create convex/mapbox.ts action file
    - Add "use node" directive for Node.js runtime
    - Import Convex action and validator types
    - Store MAPBOX_ACCESS_TOKEN in Convex environment variables
    - Files: `/apps/web/convex/mapbox.ts`
  - [ ] 1.2 Implement geocodeAddress action
    - Accept address string parameter
    - Call Mapbox Geocoding API
    - Return coordinates and place details
    - Handle errors with user-friendly messages
    - Files: `/apps/web/convex/mapbox.ts`
  - [ ] 1.3 Implement searchNearbyPOIs action
    - Accept coordinates, category, and radius parameters
    - Call Mapbox Search Box API
    - Return array of POI results with distances
    - Files: `/apps/web/convex/mapbox.ts`
  - [ ] 1.4 Implement calculateIsochrone action
    - Accept coordinates, minutes, and profile parameters
    - Call Mapbox Isochrone API
    - Return GeoJSON polygon of reachable area
    - Calculate and include area in square kilometers
    - Files: `/apps/web/convex/mapbox.ts`
  - [ ] 1.5 Implement getTravelTime action
    - Accept origin and destination coordinates
    - Call Mapbox Directions API
    - Return duration (minutes) and distance (km)
    - Support driving, walking, cycling profiles
    - Files: `/apps/web/convex/mapbox.ts`
  - [ ] 1.6 Implement generateStaticMapUrl action
    - Accept center, zoom, markers, and overlays
    - Build Mapbox Static Images API URL
    - Return URL string (not the image itself)
    - Files: `/apps/web/convex/mapbox.ts`

**Acceptance Criteria:**
- All actions callable from frontend via `api.mapbox.*`
- API key secured in Convex environment (not client-exposed)
- Errors return descriptive messages, not raw API errors
- Actions work in development and production

---

### Agent Integration Layer

#### Task Group 2: Google ADK Agent Tool Definitions
**Dependencies:** Task Group 1 (or can use library directly)

- [ ] 2.0 Complete ADK agent tool definitions
  - [ ] 2.1 Create apps/agents/tools/mapbox-tools.ts
    - Import Google ADK tool definition utilities
    - Define tool schemas with Zod or ADK validators
    - Files: `/apps/agents/tools/mapbox-tools.ts`
  - [ ] 2.2 Define geocode_address tool
    - Name: "geocode_address"
    - Description: Clear explanation of when to use
    - Parameters: address (string, required)
    - Handler: Call Convex action or library directly
  - [ ] 2.3 Define search_nearby_pois tool
    - Name: "search_nearby_pois"
    - Description: For "what's near?" questions
    - Parameters: coordinates, category (optional), radius (optional)
  - [ ] 2.4 Define calculate_isochrone tool
    - Name: "calculate_isochrone"
    - Description: For accessibility/reachability questions
    - Parameters: coordinates, minutes, profile (optional)
  - [ ] 2.5 Define get_travel_time tool
    - Name: "get_travel_time"
    - Description: For distance/time questions
    - Parameters: origin, destination, profile (optional)
  - [ ] 2.6 Define generate_map_image tool
    - Name: "generate_map_image"
    - Description: For visual context in responses
    - Parameters: center, zoom, markers (optional)
  - [ ] 2.7 Export tool collection for agent registration
    - Create mapboxTools array of all tool definitions
    - Export for use in agent configuration
    - Files: `/apps/agents/tools/index.ts`

**Acceptance Criteria:**
- All tools have clear, descriptive names and descriptions
- Parameter schemas validate input correctly
- Tools are importable and registerable with ADK agent
- Tool descriptions guide LLM to select appropriate tool

---

### Testing Layer

#### Task Group 3: Tool Testing and Validation
**Dependencies:** Task Groups 1-2

- [ ] 3.0 Complete tool testing
  - [ ] 3.1 Write unit tests for Mapbox tools library
    - Test forwardGeocode with Milwaukee addresses
    - Test calculateDistance accuracy
    - Test pointInPolygon logic
    - Mock API responses for deterministic tests
    - Files: `/apps/web/src/__tests__/lib/mapbox-tools.test.ts`
  - [ ] 3.2 Write integration tests for Convex actions
    - Test geocodeAddress with real API (dev only)
    - Test error handling for invalid inputs
    - Files: `/apps/web/src/__tests__/convex/mapbox.test.ts`
  - [ ] 3.3 Manual verification of each tool
    - [ ] Geocode "Milwaukee Art Museum" → verify coordinates
    - [ ] Search POIs near downtown → verify results
    - [ ] Calculate 15-min isochrone → verify polygon
    - [ ] Get travel time to Fiserv Forum → verify accuracy
    - [ ] Generate static map → verify image URL works
  - [ ] 3.4 Test agent tool selection
    - Ask agent "What restaurants are near 123 N Water St?"
    - Verify agent uses geocode_address then search_nearby_pois
    - Verify response includes relevant POIs

**Acceptance Criteria:**
- Unit tests pass for library functions
- Integration tests pass for Convex actions
- Manual verification confirms accurate results
- Agent correctly selects and uses tools

---

### UI Integration Layer

#### Task Group 4: Chat Panel Integration
**Dependencies:** Task Groups 1-3

- [ ] 4.0 Complete chat panel integration with spatial tools
  - [ ] 4.1 Add map image display capability to chat messages
    - Support image URLs in message rendering
    - Style images appropriately in chat bubble
    - Files: `/apps/web/src/components/chat/MessageList.tsx`
  - [ ] 4.2 Add isochrone visualization to map
    - When agent returns isochrone, display on map
    - Use temporary layer with semi-transparent fill
    - Clear layer when conversation changes
    - Files: `/apps/web/src/components/map/MapContainer.tsx`
  - [ ] 4.3 Add POI markers to map from agent responses
    - When agent returns POIs, show markers on map
    - Use Mapbox markers with category icons
    - Clear markers when conversation changes
    - Files: `/apps/web/src/components/map/MapContainer.tsx`
  - [ ] 4.4 Link agent tool results to map interactions
    - Clicking a POI in chat highlights it on map
    - Clicking "show on map" flies to location
    - Files: `/apps/web/src/contexts/MapContext.tsx`

**Acceptance Criteria:**
- Static map images display in chat messages
- Isochrone polygons render on map when returned
- POI markers appear on map from agent searches
- Chat and map stay synchronized

---

## Execution Order

```
Phase 1: Backend (Day 1)
|-- Task Group 1: Convex Actions

Phase 2: Agent (Day 1-2)
|-- Task Group 2: ADK Tool Definitions

Phase 3: Testing (Day 2)
|-- Task Group 3: Tool Testing

Phase 4: UI (Day 2)
|-- Task Group 4: Chat Integration
```

---

## Dependencies Graph

```
1 (Convex Actions)
└── 2 (ADK Tools)
    └── 3 (Testing)
        └── 4 (UI Integration)
```

---

## Reference Files

**Already Implemented:**
- `/apps/web/src/lib/mapbox/mapbox-tools.ts` - Core tools library
- `/apps/web/src/lib/mapbox/index.ts` - Clean exports
- `/.mcp.json` - Mapbox MCP server configuration

**To Create:**
- `/apps/web/convex/mapbox.ts` - Convex actions
- `/apps/agents/tools/mapbox-tools.ts` - ADK tool definitions
- `/apps/web/src/__tests__/lib/mapbox-tools.test.ts` - Unit tests

**To Modify:**
- `/apps/web/src/components/chat/MessageList.tsx` - Image display
- `/apps/web/src/components/map/MapContainer.tsx` - Dynamic layers
- `/apps/web/src/contexts/MapContext.tsx` - Tool result handlers

---

## Milwaukee Test Data

Use these for testing tools:

```typescript
// Known addresses
"Milwaukee Art Museum" → { lng: -87.897, lat: 43.040 }
"123 N Water St, Milwaukee, WI" → { lng: -87.909, lat: 43.034 }
"Fiserv Forum" → { lng: -87.917, lat: 43.043 }

// Downtown center for POI searches
{ lng: -87.9065, lat: 43.0389 }

// Isochrone test (15 min from downtown)
// Should cover most of central Milwaukee
```
