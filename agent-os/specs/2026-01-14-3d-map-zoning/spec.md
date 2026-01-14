# Specification: 3D Map with Zoning-Colored Buildings

## Goal
Enable users to visualize Milwaukee's zoning districts in an immersive 3D perspective with buildings extruded based on zone type and assessed improvement value, providing spatial context for development opportunities.

## User Stories
- As a developer exploring Milwaukee, I want to toggle 3D view to see building heights and zoning context so that I can understand the physical character of neighborhoods
- As a city planner, I want to see semi-transparent zoning colors overlaid on 3D buildings so that I can quickly identify zone boundaries while maintaining building visibility

## Specific Requirements

**3D Mode State Management**
- Add `is3DMode` boolean state to MapContext (default: false)
- Add `setIs3DMode` setter function to MapContext
- Add `toggle3DMode` convenience function to MapContext
- Persist 3D mode preference in localStorage for session continuity
- Ensure 3D state is accessible to all map-related components via the existing useMap hook

**3D Toggle Button in Header**
- Add new button between Voice toggle and Layers button in Header component
- Use `Box` or `Cube` icon from lucide-react (lucide has both available)
- Follow existing button styling pattern with neobrutalist shadow and translate effects
- Button shows active state (sky-500 background) when 3D mode is enabled
- Include aria-label and aria-pressed attributes for accessibility
- Button is visible on both desktop and mobile views

**Map Style Switching**
- When 3D enabled: switch from `streets-v12` to Mapbox Standard style (`mapbox://styles/mapbox/standard`)
- When 3D disabled: revert to `streets-v12` style
- Handle style change gracefully by preserving PMTiles layer state across style switches
- Re-add PMTiles layers after new style loads using map `style.load` event

**Fill-Extrusion Layer for Zoning**
- Create new `pmtiles-zoning-3d` layer as fill-extrusion type when 3D mode activates
- Source: existing `milwaukee-pmtiles` source with `zoning` source-layer
- Base extrusion height by zone category: residential (10m), commercial (20m), industrial (30m), mixed-use (25m), special (15m)
- Height modifier: add scaled value from `C_A_IMPRV` (assessed improvement value) property if available
- Fill color: use same zone-based color expressions from pmtiles-layer-manager.ts
- Fill opacity: 0.6 for semi-transparency over Mapbox 3D buildings
- Remove standard fill layer (`pmtiles-zoning`) and add extrusion layer when 3D enabled; reverse when disabled

**Camera Animation**
- When enabling 3D: animate camera to pitch 45 degrees and bearing -17.6 degrees over 1500ms
- When disabling 3D: animate camera back to pitch 0 and bearing 0 over 1500ms
- Use existing flyTo pattern from MapContext but extend to support pitch and bearing options
- Maintain current center and zoom during the transition

**Layer Compatibility**
- Keep existing layer toggles functional in 3D mode (visibility still controlled via LayerPanel)
- Non-zoning layers remain as fill layers (parcels, tif, opportunityZones, historic, arb, cityOwned)
- Opacity slider in LayerPanel should affect fill-extrusion-opacity when zoning layer is in 3D mode

## Visual Design
No visual mockups provided. Implementation should follow existing RetroUI neobrutalist patterns in the codebase.

## Existing Code to Leverage

**MapContext (`/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/contexts/MapContext.tsx`)**
- Extend with is3DMode state following existing pattern for layerVisibility
- Use same useCallback pattern for toggle functions
- Follow existing flyTo implementation but add pitch/bearing support

**Header (`/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/shell/Header.tsx`)**
- Copy exact button styling from existing Layers button (lines 75-88)
- Add new prop `is3DMode` and `on3DToggle` following existing prop patterns
- Insert button between voice toggle and layers button in the center controls div

**pmtiles-layer-manager.ts (`/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/map/layers/pmtiles-layer-manager.ts`)**
- Reuse ZONING_CATEGORY_COLORS and zone color expressions (lines 56-134)
- Add method to switch zoning between fill and fill-extrusion layer types
- Follow existing setLayerVisibility and setLayerOpacity patterns

**layer-config.ts (`/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/map/layers/layer-config.ts`)**
- Add ZONE_BASE_HEIGHTS constant mapping ZoningCategory to meter values
- Use existing getZoningCategory function for determining height

**MapContainer (`/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/map/MapContainer.tsx`)**
- Follow existing pattern for conditional layer loading
- Handle style URL change via mapStyle prop or internal state

## Out of Scope
- Individual building height data from external sources (use zone-based estimation only)
- Building footprint geometry (rely on Mapbox Standard built-in 3D buildings)
- Sun/shadow simulation or time-of-day lighting
- Click interactions on 3D extruded features (maintain existing 2D click behavior)
- VR or WebXR integration
- 3D labels or floating markers
- Performance optimization for mobile devices beyond standard Mapbox handling
- Custom 3D model import or placement
- Height legend or 3D-specific UI controls beyond the toggle
- Animation of building extrusion (instant appearance on style load is acceptable)
