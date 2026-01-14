// Type declarations for mapbox-gl-arcgis-featureserver
// This module integrates ESRI ArcGIS FeatureServer with Mapbox GL JS

declare module 'mapbox-gl-arcgis-featureserver' {
  import type { Map as MapboxMap } from 'mapbox-gl'

  interface FeatureServiceOptions {
    /** URL to the ESRI ArcGIS FeatureServer or MapServer layer */
    url: string
    /** Optional: Additional query parameters */
    useStaticZoomLevel?: boolean
    /** Optional: Minimum zoom level to load features */
    minZoom?: number
    /** Optional: Maximum zoom level to load features */
    maxZoom?: number
  }

  /**
   * FeatureService class for loading ESRI ArcGIS FeatureServer data into Mapbox GL
   * Creates a GeoJSON source from ESRI service and manages feature loading
   */
  class FeatureService {
    constructor(
      sourceId: string,
      map: MapboxMap,
      options: FeatureServiceOptions
    )

    /** Destroy the feature service and remove its source from the map */
    destroy(): void

    /** Get the source ID */
    getSourceId(): string
  }

  export default FeatureService
}
