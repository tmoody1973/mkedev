# Raw Idea: 3D Map with Zoning-Colored Buildings

**Feature Name:** 3D Map with Zoning-Colored Buildings

**Description:**
Add 3D visualization to the MKE.dev map with buildings colored by zoning district. The implementation will use Mapbox Standard style (which has built-in 3D buildings) combined with our PMTiles zoning data.

## Key Requirements

1. Enable 3D view with pitch/bearing controls
2. Use Mapbox Standard style for native 3D buildings
3. Add zoning districts as semi-transparent fill-extrusion overlay
4. Optionally add parcel extrusions using assessed improvement value as height proxy
5. Zone colors should match existing 2D layer colors (greens for residential, blues for commercial, purples for industrial, oranges for mixed-use)
6. Add UI toggle to switch between 2D and 3D views
7. Smooth camera transitions when toggling views

## Technical Approach

- Mapbox Standard style with pitch: 45, bearing: -17.6
- fill-extrusion layers for zoning overlay
- PMTiles source for zoning/parcel data
- Camera animation for view transitions

## Expected Outcome

Users will be able to toggle between 2D and 3D map views, with buildings displayed in 3D and colored according to their zoning district. This will provide an intuitive visual understanding of Milwaukee's zoning landscape and built environment.
