# ESRI Layer Integration Guide for Map Developers

## The Problem

MKE.dev integrates **7 Milwaukee ESRI ArcGIS REST Service layers** (zoning, parcels, TIF, opportunity zones, historic, ARB, city-owned) with Mapbox GL JS to provide comprehensive civic development intelligence. However, the integration requires understanding:

- How to configure ESRI FeatureServer layers within Mapbox
- The zoning category color coding system
- Spatial reference system transformations (inSR=4326)
- Layer visibility, opacity, and interaction patterns
- How to add new ESRI layers to the system

This guide documents the complete ESRI layer integration architecture and provides step-by-step instructions for extending the system.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MKE.dev Map Application                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  MapContext.tsx                                                  │   │
│  │  - Layer visibility state (7 layers)                             │   │
│  │  - Layer opacity state (0-1)                                     │   │
│  │  - Selected parcel state                                         │   │
│  │  - 3D mode toggle                                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ESRILayerManager                                                │   │
│  │  - Manages 7 ESRI FeatureServer layers                           │   │
│  │  - Handles layer visibility/opacity                              │   │
│  │  - Coordinates click/hover events                                │   │
│  │  - Applies category-based styling                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  layer-config.ts                                                 │   │
│  │  - Layer URL definitions                                         │   │
│  │  - Color/opacity configurations                                  │   │
│  │  - Zoning category mapping                                       │   │
│  │  - 3D extrusion heights                                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Mapbox GL JS Map                                │
│  ┌──────────────────────┐  ┌──────────────────────┐                    │
│  │  ESRI Sources        │  │  Mapbox Layers       │                    │
│  │  - esri-source-      │  │  - esri-fill-        │                    │
│  │    zoning            │  │    zoning            │                    │
│  │  - esri-source-      │  │  - esri-stroke-      │                    │
│  │    parcels           │  │    zoning            │                    │
│  │  - esri-source-tif   │  │  - esri-highlight-   │                    │
│  │  - (+ 4 more)        │  │    zoning            │                    │
│  └──────────────────────┘  └──────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  Milwaukee ESRI ArcGIS REST Services                    │
│  https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  1. Zoning Districts        (planning/zoning/MapServer/11)      │   │
│  │  2. Parcels                 (property/parcels_mprop/MapServer/2)     │   │
│  │  3. TIF Districts           (planning/special_districts/8)      │   │
│  │  4. Opportunity Zones       (planning/special_districts/9)      │   │
│  │  5. Historic Districts      (planning/special_districts/17)     │   │
│  │  6. ARB Districts           (planning/special_districts/1)      │   │
│  │  7. City-Owned Properties   (property/govt_owned/MapServer)     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## ESRI REST API Endpoint Structure

All Milwaukee GIS layers are served from the ESRI ArcGIS REST API:

```typescript
const MILWAUKEE_GIS_BASE_URL =
  'https://milwaukeemaps.milwaukee.gov/arcgis/rest/services'
```

### Layer URL Pattern

ESRI layers follow this URL structure:

```
https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/{folder}/{service}/MapServer/{layer}
```

**Example:**
```
https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/planning/zoning/MapServer/11
│                                                         │       │       │         │
│                                                         │       │       │         └─ Layer Number
│                                                         │       │       └─────────── Service Type
│                                                         │       └─────────────────── Service Name
│                                                         └─────────────────────────── Folder
```

### Query Parameters

When querying ESRI layers, you'll commonly use these parameters:

| Parameter | Purpose | Example Value |
|-----------|---------|---------------|
| `f` | Response format | `geojson`, `json`, `pjson` |
| `where` | SQL-style filter | `ZONING='LB2'` |
| `outFields` | Fields to return | `*`, `TAXKEY,ADDRESS` |
| `geometry` | Spatial filter | `-87.9065,43.0389` |
| `geometryType` | Geometry type | `esriGeometryPoint` |
| `inSR` | Input spatial reference | `4326` (WGS84) |
| `outSR` | Output spatial reference | `4326` (WGS84) |
| `returnGeometry` | Include geometry | `true`, `false` |

### Spatial Reference System: `inSR=4326`

**EPSG:4326 (WGS84)** is the standard GPS coordinate system using latitude/longitude in decimal degrees.

- **Mapbox GL JS** uses EPSG:4326 internally
- **Milwaukee ESRI layers** default to EPSG:3857 (Web Mercator)
- **Always specify `inSR=4326`** when querying to avoid coordinate transformation issues

**Example Query:**
```
https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/planning/zoning/MapServer/11/query?
  f=geojson&
  where=1=1&
  outFields=*&
  inSR=4326&
  outSR=4326
```

## The 7 Milwaukee ESRI Layers

### 1. Zoning Districts
- **URL:** `planning/zoning/MapServer/11`
- **Purpose:** Shows Milwaukee zoning districts (residential, commercial, industrial, mixed-use, special)
- **Interactive:** Yes (click for zoning details)
- **Default Visible:** Yes
- **Key Fields:**
  - `ZONING` - Zoning district code (e.g., "RS6", "LB2", "DC")
  - `ZONE_NAME` - Full district name
  - `CATEGORY` - Zoning category

### 2. Parcels (Tax Parcels)
- **URL:** `property/parcels_mprop/MapServer/2`
- **Purpose:** Property boundaries with tax parcel data
- **Interactive:** Yes (click for parcel details)
- **Default Visible:** Yes
- **Key Fields:**
  - `TAXKEY` - Unique 10-digit tax parcel identifier
  - `ADDRESS` - Street address
  - `OWNER_NAME` - Property owner
  - `LAND_USE` - Land use code
  - `ASSESSED_VALUE` - Property assessment

### 3. TIF (Tax Increment Financing) Districts
- **URL:** `planning/special_districts/MapServer/8`
- **Purpose:** Shows active TIF districts for economic development
- **Interactive:** Yes
- **Default Visible:** No
- **Key Fields:**
  - `TIF_ID` - TIF district identifier
  - `TIF_NAME` - District name
  - `STATUS` - Active/Closed status

### 4. Opportunity Zones
- **URL:** `planning/special_districts/MapServer/9`
- **Purpose:** Federal Opportunity Zones for tax-advantaged investment
- **Interactive:** Yes
- **Default Visible:** No
- **Key Fields:**
  - `ZONE_ID` - Opportunity Zone identifier
  - `CENSUS_TRACT` - Census tract number

### 5. Historic Districts
- **URL:** `planning/special_districts/MapServer/17`
- **Purpose:** Designated historic preservation districts
- **Interactive:** Yes
- **Default Visible:** No
- **Key Fields:**
  - `DISTRICT_NAME` - Historic district name
  - `DESIGNATION_DATE` - Date designated

### 6. ARB (Architectural Review Board) Districts
- **URL:** `planning/special_districts/MapServer/1`
- **Purpose:** Districts requiring architectural review
- **Interactive:** Yes
- **Default Visible:** No
- **Key Fields:**
  - `ARB_NAME` - ARB district name
  - `REVIEW_REQUIREMENTS` - Review criteria

### 7. City-Owned Properties
- **URL:** `property/govt_owned/MapServer`
- **Purpose:** Properties owned by the City of Milwaukee
- **Interactive:** Yes
- **Default Visible:** No
- **Key Fields:**
  - `PROPERTY_ID` - Property identifier
  - `DEPARTMENT` - Owning department
  - `STATUS` - Available/In Use/Redevelopment

## Layer Configuration System

All layer configurations are centralized in `apps/web/src/components/map/layers/layer-config.ts`.

### Layer Config Interface

```typescript
export interface ESRILayerConfig {
  /** Unique layer identifier (matches MapContext layerVisibility keys) */
  id: LayerType
  /** Display name for the layer */
  name: string
  /** Layer description */
  description: string
  /** Full URL to the ESRI service */
  url: string
  /** Layer number within the service */
  layerNumber: number | null
  /** Primary fill color for the layer */
  color: string
  /** Fill opacity (0-1) */
  fillOpacity: number
  /** Border/stroke color */
  strokeColor: string
  /** Border/stroke width */
  strokeWidth: number
  /** Whether layer is visible by default */
  defaultVisible: boolean
  /** Whether this layer supports click interaction */
  interactive: boolean
  /** Legend items for categorical display */
  legendItems: LegendItem[]
  /** Data source attribution */
  dataSource: string
}
```

### Example: Zoning Layer Config

```typescript
export const ZONING_LAYER_CONFIG: ESRILayerConfig = {
  id: 'zoning',
  name: 'Zoning Districts',
  description: 'Milwaukee zoning districts with category-based coloring',
  url: `${MILWAUKEE_GIS_BASE_URL}/planning/zoning/MapServer`,
  layerNumber: 11,
  color: '#3B82F6',
  fillOpacity: 0.4,
  strokeColor: '#1E40AF',
  strokeWidth: 1,
  defaultVisible: true,
  interactive: true,
  legendItems: [
    { label: 'Residential', color: '#22C55E' },
    { label: 'Commercial', color: '#3B82F6' },
    { label: 'Industrial', color: '#A855F7' },
    { label: 'Mixed-Use', color: '#F97316' },
    { label: 'Special', color: '#EAB308' },
  ],
  dataSource: 'Milwaukee GIS - Planning Division',
}
```

## Zoning Category Color Mapping

The zoning layer uses **category-based color coding** instead of uniform colors. Each zone code maps to a category, and each category has a distinct color.

### Color Palette (Tailwind CSS)

```typescript
export const ZONING_CATEGORY_COLORS: Record<ZoningCategory, string> = {
  residential: '#22C55E',  // green-500
  commercial: '#3B82F6',   // blue-500
  industrial: '#A855F7',   // purple-500
  'mixed-use': '#F97316',  // orange-500
  special: '#EAB308',      // yellow-500
}
```

### Zone Code Prefix Mapping

Milwaukee zoning codes use a **prefix system** that determines the category:

| Prefix | Category | Examples | Color | Use |
|--------|----------|----------|-------|-----|
| `RS` | Residential | RS1, RS3, RS6 | Green (#22C55E) | Single-family residential |
| `RT` | Residential | RT3, RT4, RT5 | Green (#22C55E) | Two-family residential |
| `RM` | Residential | RM5, RM6 | Green (#22C55E) | Multi-family residential |
| `RO` | Residential | RO1, RO2 | Green (#22C55E) | Residential office |
| `NS` | Commercial | NS1, NS2 | Blue (#3B82F6) | Neighborhood shopping |
| `LB` | Commercial | LB1, LB2, LB3 | Blue (#3B82F6) | Local business |
| `RB` | Commercial | RB1, RB2 | Blue (#3B82F6) | Regional business |
| `CS` | Commercial | CS | Blue (#3B82F6) | Community shopping |
| `IM` | Industrial | IM1, IM2 | Purple (#A855F7) | Industrial mixed |
| `IH` | Industrial | IH | Purple (#A855F7) | Industrial heavy |
| `IL` | Industrial | IL | Purple (#A855F7) | Industrial light |
| `MX` | Mixed-Use | MX1, MX2 | Orange (#F97316) | Mixed-use |
| `DX` | Mixed-Use | DX1, DX2 | Orange (#F97316) | Downtown mixed-use |
| `PD` | Special | PD | Yellow (#EAB308) | Planned development |
| `PK` | Special | PK | Yellow (#EAB308) | Parks |
| `IF` | Special | IF | Yellow (#EAB308) | Institutional |
| `C9` | Special | C9 | Yellow (#EAB308) | Conservancy |

### Category Detection Function

```typescript
export function getZoningCategory(zoneCode: string): ZoningCategory {
  // Extract prefix by removing numbers
  const prefix = zoneCode.replace(/[0-9]/g, '').toUpperCase()
  return ZONING_CODE_CATEGORIES[prefix] || 'special'
}
```

**Example Usage:**
```typescript
getZoningCategory('RS6')  // → 'residential'
getZoningCategory('LB2')  // → 'commercial'
getZoningCategory('IM1')  // → 'industrial'
getZoningCategory('DX2')  // → 'mixed-use'
```

## 3D Visualization with Fill-Extrusion

The zoning layer supports **3D mode** using Mapbox's `fill-extrusion` layer type.

### 3D Configuration

```typescript
// Base extrusion heights for 3D visualization (in meters)
export const ZONE_BASE_HEIGHTS: Record<ZoningCategory, number> = {
  residential: 10,   // ~3 floors
  commercial: 20,    // ~6 floors
  industrial: 30,    // ~9 floors (tall warehouses/factories)
  'mixed-use': 25,   // ~7-8 floors
  special: 15,       // ~4-5 floors (parks, institutional)
}

// Semi-transparent to show Mapbox Standard 3D buildings beneath
export const ZONE_3D_OPACITY = 0.6

// Neutral color for 3D extrusions (stone-500)
export const ZONE_3D_NEUTRAL_COLOR = '#78716c'
```

### 3D Camera Settings

```typescript
// From MapContext.tsx
export const CAMERA_3D_PITCH = 45
export const CAMERA_3D_BEARING = -17.6
export const CAMERA_2D_PITCH = 0
export const CAMERA_2D_BEARING = 0
export const CAMERA_ANIMATION_DURATION = 1500  // ms
```

### 3D Mode Toggle

```typescript
// MapContext provides 3D mode state
const { is3DMode, toggle3DMode, animateTo3DView, animateTo2DView } = useMapContext()

// Toggle 3D mode
toggle3DMode()

// Or animate explicitly
animateTo3DView()  // pitch: 45°, bearing: -17.6°
animateTo2DView()  // pitch: 0°, bearing: 0°
```

## Layer Visibility and Opacity Control

### Layer Visibility State

The `MapContext` manages visibility for all 7 layers:

```typescript
const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  zoning: true,
  parcels: true,
  tif: false,
  opportunityZones: false,
  historic: false,
  arb: false,
  cityOwned: false,
}
```

### Layer Opacity State

Each layer has independent opacity control (0-1):

```typescript
const DEFAULT_LAYER_OPACITY: LayerOpacity = {
  zoning: 1,
  parcels: 1,
  tif: 1,
  opportunityZones: 1,
  historic: 1,
  arb: 1,
  cityOwned: 1,
}
```

### Using Layer Controls in Components

```typescript
import { useMapContext } from '@/contexts/MapContext'

function LayerPanel() {
  const {
    layerVisibility,
    toggleLayerVisibility,
    setLayerVisibility,
    layerOpacity,
    setLayerOpacity
  } = useMapContext()

  return (
    <div>
      {/* Toggle visibility */}
      <button onClick={() => toggleLayerVisibility('zoning')}>
        {layerVisibility.zoning ? 'Hide' : 'Show'} Zoning
      </button>

      {/* Set opacity */}
      <input
        type="range"
        min="0"
        max="100"
        value={layerOpacity.zoning * 100}
        onChange={(e) => setLayerOpacity('zoning', Number(e.target.value) / 100)}
      />
    </div>
  )
}
```

### ESRILayerManager Methods

```typescript
// Set layer visibility explicitly
esriLayerManager.setLayerVisibility('zoning', true)

// Set layer opacity
esriLayerManager.setLayerOpacity('parcels', 0.5)

// Hide all layers
esriLayerManager.hideAllLayers()

// Show all layers
esriLayerManager.showAllLayers()
```

## Click and Hover Interaction Patterns

The `ESRILayerManager` provides event handlers for layer interactions.

### Click Events

When a user clicks on an interactive layer (e.g., parcels, zoning), the manager emits a `LayerClickEvent`:

```typescript
export interface LayerClickEvent {
  layerId: LayerType
  coordinates: [number, number]
  properties: Record<string, unknown>
  parcelData?: ParcelData
}

export interface ParcelData {
  taxKey: string
  address: string
  zoneCode: string
  owner?: string
  assessedValue?: number
  lotSize?: number
}
```

### Setting Up Click Handlers

```typescript
const esriLayerManager = new ESRILayerManager({
  map: mapInstance,
  onFeatureClick: (event: LayerClickEvent) => {
    console.log('Layer clicked:', event.layerId)
    console.log('Coordinates:', event.coordinates)
    console.log('Properties:', event.properties)

    if (event.parcelData) {
      // Show parcel popup
      setSelectedParcel(event.parcelData)
    }
  },
})
```

### Hover Events

Hover events provide real-time feedback as the cursor moves over features:

```typescript
const esriLayerManager = new ESRILayerManager({
  map: mapInstance,
  onFeatureHover: (event: LayerClickEvent | null) => {
    if (event) {
      // Hovering over a feature
      setCursor('pointer')
      setTooltip(`${event.properties.ADDRESS}`)
    } else {
      // Left the feature
      setCursor('default')
      setTooltip(null)
    }
  },
})
```

### Highlight Selected Features

The manager automatically highlights clicked features:

```typescript
// Highlight is managed internally by ESRILayerManager
// When a feature is clicked:
// 1. Previous highlight is removed
// 2. New feature is highlighted with a bright border
// 3. Feature state is updated: { selected: true }
```

### Click Event Flow

```
User clicks map
       │
       ▼
Mapbox GL JS 'click' event
       │
       ▼
ESRILayerManager.setupEventHandlers()
       │
       ▼
Identify clicked layer (zoning, parcels, etc.)
       │
       ▼
Extract feature properties
       │
       ▼
Highlight feature
       │
       ▼
Call onFeatureClick callback
       │
       ▼
Parent component handles event
(Show popup, update state, etc.)
```

## Step-by-Step Guide: Adding a New ESRI Layer

Follow these steps to add a new Milwaukee ESRI layer to the map:

### Step 1: Identify the ESRI Layer

1. Browse Milwaukee GIS REST services:
   ```
   https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/
   ```

2. Find the layer you want to add (e.g., `planning/bike_paths/MapServer/5`)

3. Note the layer number and key fields

### Step 2: Add Layer Type Definition

Edit `apps/web/src/components/map/layers/layer-config.ts`:

```typescript
// Add to LayerType union
export type LayerType =
  | 'zoning'
  | 'parcels'
  | 'tif'
  | 'opportunityZones'
  | 'historic'
  | 'arb'
  | 'cityOwned'
  | 'bikePaths'  // ← NEW LAYER
```

### Step 3: Create Layer Configuration

Add a new configuration object:

```typescript
export const BIKE_PATHS_LAYER_CONFIG: ESRILayerConfig = {
  id: 'bikePaths',
  name: 'Bike Paths',
  description: 'Milwaukee bike paths and bike lanes',
  url: `${MILWAUKEE_GIS_BASE_URL}/planning/bike_paths/MapServer`,
  layerNumber: 5,
  color: '#10B981',        // emerald-500
  fillOpacity: 0.6,
  strokeColor: '#047857',  // emerald-700
  strokeWidth: 2,
  defaultVisible: false,
  interactive: true,
  legendItems: [
    { label: 'Bike Path', color: '#10B981' },
    { label: 'Bike Lane', color: '#34D399' },
  ],
  dataSource: 'Milwaukee GIS - Transportation Division',
}
```

### Step 4: Add to ALL_LAYER_CONFIGS Array

```typescript
export const ALL_LAYER_CONFIGS: ESRILayerConfig[] = [
  ZONING_LAYER_CONFIG,
  PARCELS_LAYER_CONFIG,
  TIF_LAYER_CONFIG,
  OPPORTUNITY_ZONES_LAYER_CONFIG,
  HISTORIC_LAYER_CONFIG,
  ARB_LAYER_CONFIG,
  CITY_OWNED_LAYER_CONFIG,
  BIKE_PATHS_LAYER_CONFIG,  // ← ADD HERE
]
```

### Step 5: Add to MapContext Default State

Edit `apps/web/src/contexts/MapContext.tsx`:

```typescript
const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  zoning: true,
  parcels: true,
  tif: false,
  opportunityZones: false,
  historic: false,
  arb: false,
  cityOwned: false,
  bikePaths: false,  // ← ADD HERE
}

const DEFAULT_LAYER_OPACITY: LayerOpacity = {
  zoning: 1,
  parcels: 1,
  tif: 1,
  opportunityZones: 1,
  historic: 1,
  arb: 1,
  cityOwned: 1,
  bikePaths: 1,  // ← ADD HERE
}
```

### Step 6: Add to Layer Panel UI

Edit your layer control component (e.g., `apps/web/src/components/map/layer-panel.tsx`):

```typescript
<LayerToggle
  layerId="bikePaths"
  label="Bike Paths"
  description="Milwaukee bike paths and bike lanes"
/>
```

### Step 7: Test the Layer

1. Start the dev server:
   ```bash
   pnpm dev
   ```

2. Open the map and toggle the new layer on

3. Verify:
   - Layer loads without errors
   - Colors and styling match config
   - Click/hover interactions work (if `interactive: true`)
   - Layer visibility toggle works
   - Layer opacity slider works

### Step 8: Add Custom Styling (Optional)

For categorical styling (like zoning), modify `ESRILayerManager.addZoningFillLayer()`:

```typescript
private addBikePathsFillLayer(
  layerId: string,
  sourceId: string,
  config: ESRILayerConfig,
  visible: boolean
): void {
  this.map.addLayer({
    id: layerId,
    type: 'line',  // Use 'line' for paths instead of 'fill'
    source: sourceId,
    paint: {
      'line-color': [
        'match',
        ['get', 'TYPE'],
        'BIKE_PATH', '#10B981',
        'BIKE_LANE', '#34D399',
        '#6B7280',  // default gray
      ],
      'line-width': 3,
      'line-opacity': visible ? config.fillOpacity : 0,
    },
  })
}
```

## Troubleshooting Common Issues

### Issue 1: Layer Not Appearing

**Symptoms:** Layer toggle is on but nothing shows on the map

**Causes & Solutions:**

1. **Incorrect layer number:**
   - Verify the layer number at the ESRI REST endpoint
   - Check the service JSON: `{serviceUrl}?f=pjson`

2. **Source not loaded:**
   - Check browser console for errors
   - Verify the FeatureService initialized: `map.getSource('esri-source-layerId')`

3. **Layer added before source:**
   - Ensure `await featureService` completes before adding layers
   - Check the initialization order in `ESRILayerManager.addLayer()`

4. **Opacity set to 0:**
   - Check `layerOpacity` state in MapContext
   - Verify `fillOpacity` in layer config

### Issue 2: Wrong Spatial Reference

**Symptoms:** Features appear in the wrong location (e.g., off the coast of Africa)

**Cause:** Mixing EPSG:4326 (lat/lng) with EPSG:3857 (Web Mercator)

**Solution:**
- Always specify `inSR=4326` when querying ESRI services
- Mapbox GL JS uses EPSG:4326 internally
- Check FeatureService configuration

### Issue 3: Click Events Not Firing

**Symptoms:** Clicking on features does nothing

**Causes & Solutions:**

1. **Layer not interactive:**
   ```typescript
   // Set interactive: true in config
   const config: ESRILayerConfig = {
     id: 'myLayer',
     interactive: true,  // ← Must be true
     // ...
   }
   ```

2. **Layer not registered in event handler:**
   ```typescript
   // Check ESRILayerManager.setupEventHandlers()
   const interactiveLayers = ALL_LAYER_CONFIGS
     .filter(c => c.interactive)
     .map(c => getFillLayerId(c.id))
   ```

3. **Fill layer opacity too low:**
   - Mapbox GL JS requires `fillOpacity > 0` for click events
   - Even invisible layers need `fillOpacity: 0.01` to be clickable

### Issue 4: Zoning Colors Not Showing

**Symptoms:** All zoning districts show the same color

**Cause:** Missing or incorrect `ZONING` field in the data

**Solution:**
1. Verify the field name in ESRI layer metadata
2. Check the paint expression in `addZoningFillLayer()`:
   ```typescript
   'fill-color': [
     'case',
     ['has', 'ZONING'],  // ← Verify this field exists
     // ...
   ]
   ```

### Issue 5: Performance Issues with Many Layers

**Symptoms:** Map is slow or laggy with multiple layers enabled

**Solutions:**

1. **Limit visible layers:**
   - Don't enable all 7 layers by default
   - Use layer groups/categories

2. **Simplify geometries:**
   - Use `geometryPrecision` parameter in ESRI queries
   - Consider using cached/simplified versions for overview zoom levels

3. **Use layer visibility:**
   - Hide layers at certain zoom levels:
     ```typescript
     map.addLayer({
       id: layerId,
       type: 'fill',
       source: sourceId,
       minzoom: 12,  // Only show at zoom 12+
       maxzoom: 20,
     })
     ```

### Issue 6: CORS Errors

**Symptoms:** `Access-Control-Allow-Origin` errors in console

**Cause:** Milwaukee GIS server CORS configuration

**Solution:**
- Milwaukee GIS services **do support CORS** for most layers
- If you encounter CORS issues:
  1. Verify the URL is correct (typos can cause CORS failures)
  2. Check if the layer requires authentication
  3. Contact Milwaukee GIS team for CORS configuration

### Issue 7: 3D Mode Not Working

**Symptoms:** Layer doesn't extrude in 3D mode

**Causes & Solutions:**

1. **Not using fill-extrusion:**
   - 3D mode requires a separate layer type
   - Check `ESRILayerManager.add3DLayer()` implementation

2. **Height property missing:**
   ```typescript
   'fill-extrusion-height': [
     'case',
     ['has', 'HEIGHT_FIELD'],
     ['get', 'HEIGHT_FIELD'],
     15,  // default height
   ]
   ```

3. **Map style doesn't support 3D:**
   - Use `mapbox://styles/mapbox/standard` for 3D buildings
   - Switch styles when toggling 3D mode

## References and Resources

### Milwaukee GIS

- **Milwaukee GIS REST Services:** https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/
- **Milwaukee Open Data Portal:** https://data.milwaukee.gov/
- **Milwaukee Zoning Code (Chapter 295):** https://library.municode.com/wi/milwaukee/codes/code_of_ordinances?nodeId=COORMIWIVOII_CH295ZO

### Mapbox GL JS

- **Mapbox GL JS Documentation:** https://docs.mapbox.com/mapbox-gl-js/
- **Add a GeoJSON Source:** https://docs.mapbox.com/mapbox-gl-js/example/geojson-layer/
- **Extrude polygons for 3D:** https://docs.mapbox.com/mapbox-gl-js/example/3d-extrusion-floorplan/
- **Change a layer's color:** https://docs.mapbox.com/mapbox-gl-js/example/color-switcher/

### ESRI ArcGIS REST API

- **ArcGIS REST API Documentation:** https://developers.arcgis.com/rest/
- **Query (Feature Service):** https://developers.arcgis.com/rest/services-reference/query-feature-service-layer/
- **Spatial References:** https://developers.arcgis.com/rest/services-reference/geographic-coordinate-systems/

### mapbox-gl-arcgis-featureserver

- **GitHub Repository:** https://github.com/odoe/mapbox-gl-arcgis-featureserver
- **NPM Package:** https://www.npmjs.com/package/mapbox-gl-arcgis-featureserver

### Coordinate Systems

- **EPSG:4326 (WGS84):** https://epsg.io/4326
- **EPSG:3857 (Web Mercator):** https://epsg.io/3857
- **Proj4js (Coordinate Transformations):** http://proj4js.org/

### MKE.dev Internal Docs

- **Gemini Live + File Search Integration:** `docs/architecture/gemini-live-file-search-integration.md`
- **MapContext API:** `apps/web/src/contexts/MapContext.tsx`
- **Layer Configuration:** `apps/web/src/components/map/layers/layer-config.ts`
- **ESRI Layer Manager:** `apps/web/src/components/map/layers/esri-layer-manager.ts`

---

## Quick Reference: Layer Configuration Checklist

When adding a new ESRI layer, ensure:

- [ ] Layer type added to `LayerType` union
- [ ] Layer config created with all required fields
- [ ] Config added to `ALL_LAYER_CONFIGS` array
- [ ] Default visibility added to `MapContext`
- [ ] Default opacity added to `MapContext`
- [ ] UI toggle added to layer panel component
- [ ] Layer URL verified in browser
- [ ] Spatial reference set to `inSR=4326`
- [ ] Interactive flag set correctly
- [ ] Legend items provided (if categorical)
- [ ] Data source attribution included
- [ ] Click/hover handlers tested (if interactive)
- [ ] 3D support implemented (if needed)
- [ ] Performance verified with multiple layers enabled

---

**Last Updated:** January 2026
**Maintained By:** MKE.dev Core Team
**Questions?** File an issue or contact the team.
