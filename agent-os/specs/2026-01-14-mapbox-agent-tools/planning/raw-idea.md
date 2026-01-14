# Raw Idea: Mapbox Spatial Tools for MKE.dev Agent

**Feature Name:** Mapbox Spatial Tools for Google ADK Agent

**Description:**
Integrate Mapbox's location intelligence capabilities into the MKE.dev agent system. This enables the agent to perform spatial reasoning, answer location-based questions, and generate visual map responses when helping users explore Milwaukee real estate development opportunities.

## Key Requirements

1. **Geocoding** - Convert addresses to coordinates and vice versa
2. **POI Search** - Find nearby points of interest (restaurants, businesses, amenities)
3. **Isochrone Analysis** - Calculate areas reachable within specific travel times
4. **Directions/Routing** - Calculate travel times and routes between locations
5. **Static Map Generation** - Create map images for visual chat responses
6. **Distance Calculation** - Measure distances between parcels and landmarks

## Use Cases for MKE.dev

- User asks "What's near this parcel?" → POI Search
- User asks "How far is this property from downtown?" → Directions/Distance
- User asks "What can I reach in 15 minutes from this site?" → Isochrone
- User asks "Show me 123 N Water St" → Geocoding + Static Map
- Agent explains a property → Generate static map for visual context

## Technical Approach

- Create Mapbox tools as Google ADK agent tools
- Wrap Mapbox API calls in Convex actions for server-side execution
- Consider using Mapbox MCP server tools if ADK supports MCP
- Implement offline tools using Turf.js for basic spatial operations
- Store isochrone polygons temporarily for analysis

## Integration Points

- apps/agents/ - Google ADK agent with Mapbox tools
- convex/ - Server-side Mapbox API actions
- CopilotKit - May expose tools via AG-UI protocol

## Expected Outcome

The MKE.dev agent gains spatial intelligence, enabling it to answer location-based questions about Milwaukee properties with accurate, data-driven responses and visual map context.
