# Geospatial Explorer

The interactive Mapbox map for exploring Milwaukee's development landscape with 8 toggleable ESRI data layers.

## Features

- **Interactive Map**: Mapbox GL JS with vector tiles and 3D terrain
- **8 Data Layers**: Zoning, TIF, Opportunity Zones, and more
- **Address Search**: Autocomplete search with voice support
- **Parcel Selection**: Click parcels to trigger AI analysis
- **2D/3D Toggle**: Switch between flat and perspective views

## Components

| Component | Description |
|-----------|-------------|
| `GeospatialExplorer` | Main composite component |
| `MapView` | Mapbox GL wrapper |
| `MapControls` | Zoom, pan, 2D/3D controls |
| `LayerPanel` | Draggable layer toggle sheet |
| `AddressSearchBar` | Search with autocomplete |
| `SelectedParcelInfo` | Info bar for selected parcel |

## Data Layers

| Layer | Description |
|-------|-------------|
| Zoning Districts | RS6, LB2, RM4, etc. color-coded |
| Parcel Boundaries | Property lines with tax keys |
| TIF Districts | Tax Increment Financing areas |
| Opportunity Zones | Federal OZ designations |
| City-Owned Properties | Milwaukee-owned parcels |
| Area Plan Boundaries | Neighborhood plan coverage |
| Historic Districts | Designated historic areas |
| Design Overlay Zones | Special design requirements |

## Usage

```tsx
import { GeospatialExplorer } from './components'
import data from './sample-data.json'

<GeospatialExplorer
  layers={data.layers}
  parcels={data.parcels}
  mapConfig={data.mapConfig}
  onParcelClick={(parcel) => console.log('Parcel:', parcel)}
  onLayerToggle={(layerId, visible) => console.log('Toggle:', layerId, visible)}
  onAddressSearch={(address) => console.log('Search:', address)}
  onLocateMe={() => console.log('Locate me')}
/>
```

## Design Notes

- Map fills 60% of shell width on desktop
- Layer panel is draggable bottom sheet on mobile
- Parcel highlight uses primary color (sky)
- 2D/3D toggle animates smoothly
- Full light/dark mode support via Mapbox styles
