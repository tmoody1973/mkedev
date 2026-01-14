# Milestone 03 — Geospatial Explorer

## Overview

The interactive Mapbox map for exploring Milwaukee's development landscape. Users can toggle 8 data layers (zoning, TIF districts, Opportunity Zones, etc.), search by address or voice, and click parcels to trigger AI-powered analysis in the chat panel. The map works bidirectionally with the Conversational Interface.

---

## User Flows to Implement

1. **Toggle map layers on/off** via a draggable bottom sheet panel
2. **Search for an address** (text or voice) to navigate and highlight that parcel
3. **Click on a parcel** to query its details and display a ParcelAnalysisCard in the chat
4. **Use "locate me"** to center map on current location
5. **Voice-navigate the map** ("Show me Bronzeville", "Zoom to N. Farwell Ave")
6. **View layered data**: zoning districts, TIF areas, Opportunity Zones, city-owned lots, historic districts, design overlays, area plan boundaries

---

## UI Components to Integrate

See `sections/geospatial-explorer/components/` for the following:

### Map Core
- `MapContainer` — Main Mapbox GL JS wrapper
- `MapControls` — Zoom, pan, 2D/3D toggle controls
- `LocationBar` — Selected location info showing address and coordinates

### Layer Controls
- `LayerPanel` — Draggable bottom sheet for layer toggles
- `LayerToggle` — Individual layer toggle with icon and label
- `LayerLegend` — Color legend for active layers

### Search & Navigation
- `AddressSearch` — Search bar with autocomplete
- `LocateButton` — Geolocation "locate me" button
- `ParcelHighlight` — Visual highlight for selected parcel

---

## Backend Requirements

### External Services
- **Mapbox GL JS** — Base map with vector tiles and 3D terrain
- **ESRI ArcGIS** — 8 data layers from Milwaukee city services

### API Endpoints
- `GET /api/parcels/:taxKey` — Get parcel details by tax key
- `GET /api/parcels/search?address=...` — Search parcels by address
- `GET /api/parcels/at?lat=...&lng=...` — Get parcel at coordinates
- `GET /api/layers/:layerId/tiles/:z/:x/:y` — Proxy for ESRI tile services (if needed)

### Data Layers to Integrate

| Layer | Source | Description |
|-------|--------|-------------|
| Zoning Districts | ESRI ArcGIS | RS6, LB2, RM4, etc. color-coded |
| Parcel Boundaries | ESRI ArcGIS | Property lines with tax keys |
| TIF Districts | ESRI ArcGIS | Tax Increment Financing areas |
| Opportunity Zones | ESRI ArcGIS | Federal OZ designations |
| City-Owned Properties | ESRI ArcGIS | Properties owned by Milwaukee |
| Area Plan Boundaries | ESRI ArcGIS | Neighborhood plan coverage |
| Historic Districts | ESRI ArcGIS | Designated historic areas |
| Design Overlay Zones | ESRI ArcGIS | Special design requirements |

### Geocoding
- Implement address autocomplete (Mapbox Geocoding API or similar)
- Handle Milwaukee-specific address formats
- Support voice address input

### Bidirectional Chat Integration
- Map clicks → Send parcel context to chat
- Chat responses → Highlight locations on map
- Voice commands → Navigate map view

---

## Data Models

```typescript
interface MapLayer {
  id: string
  name: string
  icon: string
  color: string
  visible: boolean
  sourceUrl: string
}

interface SelectedLocation {
  taxKey: string
  address: string
  coordinates: [number, number]
  parcel?: Parcel
}

interface MapViewState {
  center: [number, number]
  zoom: number
  pitch: number // 0 for 2D, 60 for 3D
  bearing: number
}
```

---

## Success Criteria

- [ ] Mapbox base map renders with Milwaukee centered
- [ ] All 8 ESRI layers load and toggle correctly
- [ ] Layer panel is draggable on mobile
- [ ] Address search with autocomplete works
- [ ] Clicking a parcel highlights it and shows info
- [ ] Parcel click triggers query in chat panel
- [ ] 2D/3D view toggle works smoothly
- [ ] Geolocation "locate me" button works
- [ ] Voice navigation commands update map view
- [ ] Responsive layout (mobile stacks map above chat)
