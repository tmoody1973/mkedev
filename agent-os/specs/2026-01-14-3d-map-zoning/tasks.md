# Task Breakdown: 3D Map with Zoning-Colored Buildings

## Overview
Total Tasks: 6 Task Groups | Estimated Duration: 2-3 Days

This breakdown implements an immersive 3D map view that displays Milwaukee zoning districts with extruded buildings colored by zone type. Users can toggle between 2D and 3D views with smooth camera animations.

---

## Task List

### State Management Layer

#### Task Group 1: MapContext State Management
**Dependencies:** None (builds on existing MapContext)

- [ ] 1.0 Complete 3D mode state management
  - [ ] 1.1 Write 2-4 focused tests for 3D mode state
    - Test is3DMode default value is false
    - Test toggle3DMode flips state correctly
    - Test 3D mode state persists via localStorage
    - Test setIs3DMode sets explicit value
  - [ ] 1.2 Add is3DMode state to MapContext
    - Add `is3DMode: boolean` to MapContextValue interface
    - Add `setIs3DMode: (enabled: boolean) => void` to interface
    - Add `toggle3DMode: () => void` convenience function to interface
    - Initialize state with useState (default: false)
    - Files: `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/contexts/MapContext.tsx`
  - [ ] 1.3 Implement localStorage persistence for 3D mode
    - Read initial value from localStorage on mount
    - Write value to localStorage on state change
    - Use key `mkedev-3d-mode` for storage
    - Handle SSR by checking typeof window
    - Files: `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/contexts/MapContext.tsx`
  - [ ] 1.4 Export 3D mode values from MapContext
    - Add is3DMode, setIs3DMode, toggle3DMode to context value object
    - Ensure useMap hook exposes all new values
    - Files: `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/contexts/MapContext.tsx`
  - [ ] 1.5 Ensure MapContext tests pass
    - Run ONLY the 2-4 tests written in 1.1
    - Verify state management works correctly

**Acceptance Criteria:**
- The 2-4 tests written in 1.1 pass
- is3DMode accessible via useMap() hook
- toggle3DMode flips between true/false
- 3D preference persists across page refresh

---

### UI Components Layer

#### Task Group 2: Header 3D Toggle Button
**Dependencies:** Task Group 1

- [ ] 2.0 Complete 3D toggle button in Header
  - [ ] 2.1 Write 2-4 focused tests for 3D toggle button
    - Test button renders with Box/Cube icon
    - Test button has correct aria-label and aria-pressed attributes
    - Test button calls on3DToggle callback when clicked
    - Test button shows active state (sky-500 bg) when 3D enabled
  - [ ] 2.2 Add 3D toggle props to Header component
    - Add `is3DMode?: boolean` prop (default: false)
    - Add `on3DToggle?: () => void` callback prop
    - Files: `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/shell/Header.tsx`
  - [ ] 2.3 Create 3D toggle button UI element
    - Import Box or Cube icon from lucide-react
    - Insert button between Voice toggle and Layers button (lines 48-88)
    - Copy exact button styling from Layers button (lines 75-88)
    - Apply sky-500 background when is3DMode is true
    - Apply default white/stone-800 background when is3DMode is false
    - Files: `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/shell/Header.tsx`
  - [ ] 2.4 Add accessibility attributes to 3D button
    - Add aria-label="Toggle 3D view" (or similar descriptive label)
    - Add aria-pressed={is3DMode} for toggle state
    - Ensure button is visible on both desktop and mobile (no md:hidden class)
    - Files: `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/shell/Header.tsx`
  - [ ] 2.5 Wire Header to MapContext in AppShell
    - Import useMap hook in AppShell component
    - Pass is3DMode and toggle3DMode to Header component
    - Files: `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/shell/AppShell.tsx`
  - [ ] 2.6 Ensure Header tests pass
    - Run ONLY the 2-4 tests written in 2.1
    - Verify button styling and interactions work

**Acceptance Criteria:**
- The 2-4 tests written in 2.1 pass
- 3D toggle button appears between Voice and Layers buttons
- Button uses neobrutalist styling with shadow and translate effects
- Button shows active state with sky-500 background when 3D enabled
- Accessible with proper aria attributes

---

### Map Style Layer

#### Task Group 3: Map Style Switching
**Dependencies:** Task Groups 1, 2

- [ ] 3.0 Complete map style switching for 3D mode
  - [ ] 3.1 Write 2-4 focused tests for style switching
    - Test map uses streets-v12 style when is3DMode is false
    - Test map switches to Mapbox Standard style when is3DMode is true
    - Test PMTiles layers are re-added after style change
    - Test style change preserves current map center and zoom
  - [ ] 3.2 Add style URL constants
    - Define MAP_STYLE_2D = 'mapbox://styles/mapbox/streets-v12'
    - Define MAP_STYLE_3D = 'mapbox://styles/mapbox/standard'
    - Add to MapContext or layer-config.ts
    - Files: `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/contexts/MapContext.tsx` or `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/map/layers/layer-config.ts`
  - [ ] 3.3 Implement style switch handler in MapContainer
    - Create useEffect that watches is3DMode from MapContext
    - Call map.setStyle() with appropriate style URL when mode changes
    - Store current center/zoom before style change
    - Restore center/zoom after style loads
    - Files: `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/map/MapContainer.tsx`
  - [ ] 3.4 Handle PMTiles layer preservation across style switch
    - Listen for map 'style.load' event after style change
    - Re-initialize PMTilesLayerManager after new style loads
    - Preserve layer visibility states from MapContext
    - Use flag to track if style is changing to avoid double initialization
    - Files: `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/map/layers/ESRILayerLoader.tsx`
  - [ ] 3.5 Ensure style switching tests pass
    - Run ONLY the 2-4 tests written in 3.1
    - Verify style transitions work correctly

**Acceptance Criteria:**
- The 2-4 tests written in 3.1 pass
- Map uses streets-v12 in 2D mode (default)
- Map switches to Mapbox Standard in 3D mode
- PMTiles layers persist and remain functional after style change
- Map center and zoom preserved during transition

---

### 3D Layer Rendering

#### Task Group 4: Zoning Fill-Extrusion Layer
**Dependencies:** Task Groups 1, 3

- [ ] 4.0 Complete fill-extrusion layer for 3D zoning
  - [ ] 4.1 Write 2-4 focused tests for fill-extrusion layer
    - Test pmtiles-zoning-3d layer is added when 3D mode enabled
    - Test layer uses correct zone-based colors from ZONING_CATEGORY_COLORS
    - Test layer has fill-extrusion-opacity of 0.6
    - Test standard pmtiles-zoning fill layer is hidden when 3D mode enabled
  - [ ] 4.2 Add zone base height constants to layer-config.ts
    - Define ZONE_BASE_HEIGHTS: Record<ZoningCategory, number>
    - residential: 10 (meters)
    - commercial: 20 (meters)
    - industrial: 30 (meters)
    - mixed-use: 25 (meters)
    - special: 15 (meters)
    - Files: `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/map/layers/layer-config.ts`
  - [ ] 4.3 Create fill-extrusion style configuration
    - Add ZONING_3D_STYLE to pmtiles-layer-manager.ts
    - Type: 'fill-extrusion'
    - Use same zone color expressions from existing LAYER_STYLES.zoning (lines 56-134)
    - Set fill-extrusion-opacity to 0.6
    - Set fill-extrusion-base to 0
    - Set fill-extrusion-height using zone category expression with ZONE_BASE_HEIGHTS
    - Optional: Add C_A_IMPRV modifier if property available (scaled value)
    - Files: `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/map/layers/pmtiles-layer-manager.ts`
  - [ ] 4.4 Add method to toggle zoning layer type in PMTilesLayerManager
    - Create setZoning3DMode(enabled: boolean) method
    - When enabled: hide 'pmtiles-zoning' fill layer, add 'pmtiles-zoning-3d' fill-extrusion layer
    - When disabled: remove 'pmtiles-zoning-3d' layer, show 'pmtiles-zoning' fill layer
    - Preserve opacity setting during toggle
    - Files: `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/map/layers/pmtiles-layer-manager.ts`
  - [ ] 4.5 Update setLayerOpacity to handle fill-extrusion-opacity
    - Check if zoning layer is in 3D mode
    - If 3D mode: set 'fill-extrusion-opacity' on pmtiles-zoning-3d
    - If 2D mode: set 'fill-opacity' on pmtiles-zoning (existing behavior)
    - Files: `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/map/layers/pmtiles-layer-manager.ts`
  - [ ] 4.6 Wire 3D mode to layer manager in ESRILayerLoader
    - Watch is3DMode from MapContext
    - Call layerManager.setZoning3DMode(is3DMode) when mode changes
    - Ensure this happens after layers are initialized
    - Files: `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/map/layers/ESRILayerLoader.tsx`
  - [ ] 4.7 Ensure fill-extrusion tests pass
    - Run ONLY the 2-4 tests written in 4.1
    - Verify 3D zoning layer renders correctly

**Acceptance Criteria:**
- The 2-4 tests written in 4.1 pass
- 3D zoning layer renders with extruded buildings colored by zone
- Zone heights vary by category (residential shorter, industrial taller)
- Semi-transparent (0.6 opacity) to show Mapbox Standard 3D buildings beneath
- LayerPanel opacity slider affects fill-extrusion layer in 3D mode
- Standard fill layer hidden when 3D enabled, shown when disabled

---

### Camera Animation Layer

#### Task Group 5: Camera Animation
**Dependencies:** Task Groups 1, 3

- [ ] 5.0 Complete camera animation for 3D transitions
  - [ ] 5.1 Write 2-4 focused tests for camera animation
    - Test camera animates to pitch 45 and bearing -17.6 when 3D enabled
    - Test camera animates to pitch 0 and bearing 0 when 3D disabled
    - Test animation duration is approximately 1500ms
    - Test current center and zoom are preserved during animation
  - [ ] 5.2 Add camera constants to MapContext
    - Define CAMERA_3D_PITCH = 45
    - Define CAMERA_3D_BEARING = -17.6
    - Define CAMERA_2D_PITCH = 0
    - Define CAMERA_2D_BEARING = 0
    - Define CAMERA_ANIMATION_DURATION = 1500
    - Files: `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/contexts/MapContext.tsx`
  - [ ] 5.3 Extend flyTo function to support pitch and bearing
    - Update flyTo signature to accept optional pitch and bearing parameters
    - Update MapContextValue interface with new signature
    - Modify existing flyTo implementation to include pitch/bearing in options
    - Files: `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/contexts/MapContext.tsx`
  - [ ] 5.4 Create animateTo3DView function in MapContext
    - Get current center and zoom from map
    - Call map.flyTo with pitch: 45, bearing: -17.6, duration: 1500
    - Preserve center and zoom from current view
    - Files: `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/contexts/MapContext.tsx`
  - [ ] 5.5 Create animateTo2DView function in MapContext
    - Get current center and zoom from map
    - Call map.flyTo with pitch: 0, bearing: 0, duration: 1500
    - Preserve center and zoom from current view
    - Files: `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/contexts/MapContext.tsx`
  - [ ] 5.6 Trigger camera animation on 3D mode toggle
    - Create useEffect in MapContainer that watches is3DMode
    - Call animateTo3DView when is3DMode becomes true
    - Call animateTo2DView when is3DMode becomes false
    - Ensure animation triggers after style switch completes
    - Files: `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/map/MapContainer.tsx`
  - [ ] 5.7 Ensure camera animation tests pass
    - Run ONLY the 2-4 tests written in 5.1
    - Verify smooth transitions work correctly

**Acceptance Criteria:**
- The 2-4 tests written in 5.1 pass
- Enabling 3D animates camera to tilted perspective (pitch 45, bearing -17.6)
- Disabling 3D animates camera back to flat view (pitch 0, bearing 0)
- Animation takes 1500ms for smooth transition
- User's current map location (center/zoom) preserved

---

### Integration & Testing

#### Task Group 6: Integration & Test Review
**Dependencies:** Task Groups 1-5

- [ ] 6.0 Review and verify complete 3D map integration
  - [ ] 6.1 Review all tests from previous task groups
    - Review 2-4 tests from Task 1.1 (MapContext 3D state)
    - Review 2-4 tests from Task 2.1 (Header 3D button)
    - Review 2-4 tests from Task 3.1 (Style switching)
    - Review 2-4 tests from Task 4.1 (Fill-extrusion layer)
    - Review 2-4 tests from Task 5.1 (Camera animation)
    - Total existing tests: approximately 10-20 tests
  - [ ] 6.2 Identify critical integration gaps
    - Focus on cross-component integration points
    - Header toggle -> MapContext -> MapContainer -> Layers
    - Style switch -> Layer preservation -> 3D layer addition
    - Do NOT assess unrelated application areas
  - [ ] 6.3 Write up to 6 additional integration tests if needed
    - Test full toggle flow: click Header 3D button, map transitions to 3D
    - Test layer panel opacity affects 3D extrusion layer
    - Test 3D mode persists after page refresh
    - Test other layers (TIF, Opportunity Zones) remain functional in 3D mode
    - Test parcel click interaction still works in 3D mode
    - Focus on end-to-end user workflows only
  - [ ] 6.4 Run all 3D map feature tests
    - Run only tests related to this spec's features
    - Expected total: approximately 16-26 tests maximum
    - Do NOT run entire application test suite
    - Verify critical workflows pass
  - [ ] 6.5 Manual verification checklist
    - [ ] 3D toggle button visible in Header between Voice and Layers
    - [ ] Clicking 3D toggle changes button to active state
    - [ ] Map style switches from streets-v12 to Mapbox Standard
    - [ ] Camera animates to tilted 3D perspective
    - [ ] Zoning districts appear as extruded 3D shapes
    - [ ] Zone colors match 2D view (greens for residential, blues for commercial, etc.)
    - [ ] Mapbox Standard 3D buildings visible beneath semi-transparent zones
    - [ ] LayerPanel layer toggles still work in 3D mode
    - [ ] LayerPanel opacity slider affects 3D zoning layer
    - [ ] Clicking 3D toggle again returns to flat 2D view
    - [ ] 3D preference persists after page refresh

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 16-26 tests total)
- 3D toggle flows work end-to-end
- Layer controls interact correctly with 3D layers
- No more than 6 additional integration tests added
- Manual verification checklist complete

---

## Execution Order

Recommended implementation sequence accounting for dependencies:

```
Phase 1: State Management (Day 1)
|-- Task Group 1: MapContext State Management

Phase 2: UI + Style Foundation (Day 1-2)
|-- Task Group 2: Header 3D Toggle Button (after 1)
|-- Task Group 3: Map Style Switching (parallel with 2, after 1)

Phase 3: 3D Rendering (Day 2)
|-- Task Group 4: Zoning Fill-Extrusion Layer (after 1, 3)
|-- Task Group 5: Camera Animation (after 1, 3)

Phase 4: Integration (Day 2-3)
|-- Task Group 6: Integration & Test Review (after all)
```

---

## Dependencies Graph

```
1 (MapContext 3D State)
├── 2 (Header 3D Button)
│   └── Wires to AppShell
├── 3 (Map Style Switching)
│   └── Handles PMTiles layer preservation
├── 4 (Fill-Extrusion Layer)
│   └── Adds 3D zoning layer
└── 5 (Camera Animation)
    └── Extends flyTo function

2 + 3 + 4 + 5 → 6 (Integration)
```

---

## Reference Files

**Files to Modify:**
- `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/contexts/MapContext.tsx` - Add 3D state, camera functions
- `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/shell/Header.tsx` - Add 3D toggle button
- `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/shell/AppShell.tsx` - Wire Header to MapContext
- `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/map/MapContainer.tsx` - Handle style switch, camera animation
- `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/map/layers/layer-config.ts` - Add zone height constants
- `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/map/layers/pmtiles-layer-manager.ts` - Add 3D layer, setZoning3DMode
- `/Users/tarikmoody/Documents/Projects/mkedev/apps/web/src/components/map/layers/ESRILayerLoader.tsx` - Wire 3D mode to layer manager

**Reference Code Patterns:**
- Existing layerVisibility state pattern in MapContext (lines 114-137)
- Existing button styling in Header (lines 75-88)
- Existing LAYER_STYLES zoning color expressions (lines 56-134 in pmtiles-layer-manager.ts)
- Existing flyTo implementation (lines 148-156 in MapContext.tsx)

---

## Out of Scope Reminders

The following are explicitly NOT part of this feature:
- Individual building height data from external sources (use zone-based estimation only)
- Building footprint geometry (rely on Mapbox Standard built-in 3D buildings)
- Sun/shadow simulation or time-of-day lighting
- Click interactions on 3D extruded features (maintain existing 2D click behavior)
- VR or WebXR integration
- 3D labels or floating markers
- Performance optimization for mobile beyond standard Mapbox handling
- Custom 3D model import or placement
- Height legend or 3D-specific UI controls beyond the toggle
- Animation of building extrusion (instant appearance on style load is acceptable)
