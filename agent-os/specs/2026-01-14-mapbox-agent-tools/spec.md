# Specification: Mapbox Spatial Tools for MKE.dev Agent

## Goal
Equip the MKE.dev agent with spatial intelligence capabilities, enabling it to answer location-based questions, perform accessibility analysis, and generate visual map context when helping users explore Milwaukee real estate development opportunities.

## User Stories
- As a user asking about a property, I want the agent to tell me what's nearby so that I can understand the neighborhood context
- As a developer comparing sites, I want the agent to calculate travel times between locations so that I can evaluate accessibility
- As a user exploring opportunities, I want the agent to show me areas reachable within a specific drive time so that I can understand the property's reach
- As a user unfamiliar with Milwaukee, I want the agent to show me a map image so that I can visualize locations being discussed

## Specific Requirements

**Mapbox Tool Library (Completed)**
- Created `/apps/web/src/lib/mapbox/mapbox-tools.ts` with high-value spatial functions
- Functions are typed, documented, and ready for integration
- Includes both API-based and offline calculation tools

**Available Tools**

| Tool | Function | Use Case |
|------|----------|----------|
| `forwardGeocode` | Address → Coordinates | "Show me 123 N Water St" |
| `reverseGeocode` | Coordinates → Address | "What address is this?" |
| `searchPOI` | Find nearby places | "What restaurants are nearby?" |
| `getIsochrone` | Reachability analysis | "What's within 15 min drive?" |
| `getDirections` | Route calculation | "How do I get to this property?" |
| `getTravelTime` | Travel time lookup | "How far from downtown?" |
| `getStaticMapUrl` | Generate map image URL | Visual context in responses |
| `getStaticMapImage` | Generate map image data | Embed maps in chat |
| `calculateDistance` | Point-to-point distance | Offline distance checks |
| `pointInPolygon` | Geofencing | "Is this in a TIF district?" |

**Google ADK Agent Integration**
- Create Mapbox tools as ADK-compatible tool definitions
- Each tool should have clear name, description, and parameter schema
- Tools should handle errors gracefully and return user-friendly messages
- Agent should use tools automatically based on user intent

**Convex Actions for Server-Side Execution**
- Wrap Mapbox API calls in Convex actions for:
  - API key security (not exposed to client)
  - Rate limiting and caching
  - Error handling and logging
- Actions should be callable from both agent and UI

**CopilotKit Integration (Optional)**
- Expose spatial tools via AG-UI protocol
- Enable generative UI cards with map visualizations
- Support tool-triggered map interactions

**Mapbox MCP Server (Configured)**
- Added to `.mcp.json` for Claude Code development
- Available at `https://mcp.mapbox.com/mcp`
- Provides additional tools for development assistance

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│  (Chat Panel, Map View, Generative UI Cards)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CopilotKit Runtime                          │
│  (AG-UI Protocol, Tool Orchestration)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Google ADK Agent                             │
│  (Gemini 3, Tool Selection, Response Generation)               │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Mapbox Agent Tools                      │ │
│  │  • geocode_address     • search_nearby_pois               │ │
│  │  • get_travel_time     • calculate_isochrone              │ │
│  │  • generate_map_image  • check_point_in_polygon           │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Convex Backend                             │
│  (Actions for Mapbox API calls, caching, rate limiting)        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Mapbox Platform                             │
│  (Geocoding, Search, Isochrone, Directions, Static Maps)       │
└─────────────────────────────────────────────────────────────────┘
```

## Agent Tool Definitions

**Tool: geocode_address**
```typescript
{
  name: "geocode_address",
  description: "Convert a street address or place name into geographic coordinates. Use when user mentions a specific address or asks 'where is [location]?'",
  parameters: {
    address: { type: "string", description: "The address or place name to geocode" }
  }
}
```

**Tool: search_nearby_pois**
```typescript
{
  name: "search_nearby_pois",
  description: "Find points of interest (restaurants, shops, services) near a location. Use when user asks 'what's near?', 'any restaurants?', or similar.",
  parameters: {
    coordinates: { type: "object", description: "Center point { lng, lat }" },
    category: { type: "string", description: "Type of POI (restaurant, cafe, grocery, etc.)", optional: true },
    radius: { type: "number", description: "Search radius in meters", optional: true }
  }
}
```

**Tool: calculate_isochrone**
```typescript
{
  name: "calculate_isochrone",
  description: "Calculate all areas reachable within a specific travel time. Use when user asks 'what can I reach in X minutes?' or wants accessibility analysis.",
  parameters: {
    coordinates: { type: "object", description: "Starting point { lng, lat }" },
    minutes: { type: "number", description: "Travel time in minutes (1-60)" },
    profile: { type: "string", description: "Travel mode: driving, walking, cycling", optional: true }
  }
}
```

**Tool: get_travel_time**
```typescript
{
  name: "get_travel_time",
  description: "Calculate travel time and distance between two locations. Use when user asks 'how far?', 'how long to get to?', or compares locations.",
  parameters: {
    origin: { type: "object", description: "Starting point { lng, lat }" },
    destination: { type: "object", description: "Ending point { lng, lat }" },
    profile: { type: "string", description: "Travel mode: driving, walking, cycling", optional: true }
  }
}
```

**Tool: generate_map_image**
```typescript
{
  name: "generate_map_image",
  description: "Generate a static map image showing a location with optional markers. Use to provide visual context in responses.",
  parameters: {
    center: { type: "object", description: "Map center { lng, lat }" },
    zoom: { type: "number", description: "Zoom level (1-20)" },
    markers: { type: "array", description: "Optional markers to display", optional: true }
  }
}
```

## Existing Code to Leverage

**Mapbox Tools Library**
- `/apps/web/src/lib/mapbox/mapbox-tools.ts` - Core spatial functions
- `/apps/web/src/lib/mapbox/index.ts` - Clean exports

**MapContext**
- `/apps/web/src/contexts/MapContext.tsx` - Map state, flyTo, selected parcel

**Agent System (to be created)**
- `/apps/agents/` - Google ADK agent system

**Convex (to be extended)**
- `/apps/web/convex/` - Add Mapbox actions

## Out of Scope
- Real-time traffic data integration
- Custom map style creation
- 3D model placement via Mapbox
- Offline map caching
- Turn-by-turn navigation UI
- Address autocomplete in search box (separate feature)
- Batch geocoding of large datasets
- Custom POI data import

## Success Criteria
- Agent can geocode addresses mentioned in conversation
- Agent can answer "what's nearby" questions with relevant POIs
- Agent can calculate and explain travel times between locations
- Agent can generate isochrone analysis for accessibility questions
- Agent can include static map images in responses for visual context
- All tools handle errors gracefully with user-friendly messages
- Tools are callable from both agent and UI components
