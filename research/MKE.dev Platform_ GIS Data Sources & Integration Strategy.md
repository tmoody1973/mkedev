# MKE.dev Platform: GIS Data Sources & Integration Strategy

**Author:** Manus AI
**Date:** January 13, 2026

## 1. Introduction

This document outlines the primary Geographic Information System (GIS) data sources required to power the MKE.dev platform. It provides a comprehensive list of ESRI ArcGIS REST API endpoints from the City of Milwaukee and Milwaukee County, details on key data layers, and a strategy for integrating these sources into the application's Mapbox-based interactive map. This guide serves as a technical reference for the development team.

---

## 2. Core Data Providers

The platform will aggregate data from two primary sources:

1.  **City of Milwaukee ArcGIS Services:** The most critical and comprehensive source, providing detailed, up-to-date information on zoning, parcels, and special planning districts.
2.  **Milwaukee County ArcGIS Services:** A supplementary source for county-wide parcel data and administrative boundaries.

All data will be consumed via their public ESRI REST APIs, which provide the flexibility to query and display data dynamically.

---

## 3. City of Milwaukee Data Layers

The City's ArcGIS services are the backbone of the MKE.dev platform. The following table details the essential MapServer endpoints and the specific layers to be used.

| Service / MapServer | Layer ID | Layer Name | REST Endpoint URL |
| :--- | :--- | :--- | :--- |
| **Zoning** | 11 | Zoning Districts | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/planning/zoning/MapServer/11` |
| **Parcels & MPROP** | 2 | Parcels - MPROP_full | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/property/parcels_mprop/MapServer/2` |
| **Special Districts** | 8 | Tax Incremental Districts (TID) | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/planning/special_districts/MapServer/8` |
| **Special Districts** | 9 | Opportunity Zones | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/planning/special_districts/MapServer/9` |
| **Special Districts** | 17 | Local Historic Districts | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/planning/special_districts/MapServer/17` |
| **Special Districts** | 1 | Architectural Review Boards (ARB) | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/planning/special_districts/MapServer/1` |
| **Property** | - | City-Owned Vacant Lots | `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/property/govt_owned/MapServer` |

In addition to these map layers, the City provides a powerful **Geocoding Service** for address and tax key lookups:

-   **Address Locator:** `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/Locator/AddressLL_Top1/GeocodeServer`

---

## 4. Mapbox Integration Strategy

To ensure a high-performance and responsive user experience, the application will not load entire datasets directly. Instead, it will use a specialized library to make tiled requests to the ArcGIS REST endpoints.

### Recommended Library: `mapbox-gl-arcgis-featureserver`

This library is the ideal choice for integrating ArcGIS FeatureServer and MapServer layers with Mapbox GL JS (or its open-source fork, MapLibre GL). It offers several key advantages:

-   **Tiled Requests:** Instead of downloading all features at once, it requests data in small, tiled chunks based on the user's map view, significantly improving performance.
-   **PBF & GeoJSON Support:** It automatically requests data in the efficient PBF (Protocolbuffer Binary Format) when available, falling back to GeoJSON, which minimizes data transfer.
-   **Automatic Projection:** It handles the coordinate system transformation between Milwaukee's State Plane (WKID: 32054) and Mapbox's Web Mercator (EPSG:3857) seamlessly.

### Implementation Example

The following code snippet demonstrates how to add the Zoning layer to the Mapbox map using this library:

```javascript
import FeatureService from 'mapbox-gl-arcgis-featureserver';

// Assuming 'map' is your initialized Mapbox map object
map.on('load', () => {
  const zoningSourceId = 'milwaukee-zoning';

  const zoningService = new FeatureService(zoningSourceId, map, {
    url: 'https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/planning/zoning/MapServer/11',
    where: '1=1', // Optional: Apply a filter query
    outFields: 'ZONING,ZONE_DESC' // Request only necessary fields
  });

  map.addLayer({
    id: 'zoning-fill-layer',
    source: zoningSourceId,
    type: 'fill',
    paint: {
      'fill-color': [
        'match',
        ['get', 'ZONING'],
        'RS1', '#ffffcc',
        'RT1', '#c7e9b4',
        'RM1', '#7fcdbb',
        /* ... add all zoning colors ... */
        '#cccccc' // Default color
      ],
      'fill-opacity': 0.6,
      'fill-outline-color': '#333'
    }
  });
});
```

This pattern will be repeated for each of the required data layers, allowing users to toggle them on and off in the application's UI.

---

## 5. References

[1] City of Milwaukee ArcGIS REST Services Directory. `https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/`
[2] Milwaukee County Land Information Office ArcGIS REST Services. `https://lio.milwaukeecountywi.gov/arcgis/rest/services/`
[3] City of Milwaukee Open Data Portal. `https://data.milwaukee.gov/`
[4] `mapbox-gl-arcgis-featureserver` GitHub Repository. `https://github.com/rowanwins/mapbox-gl-arcgis-featureserver`
