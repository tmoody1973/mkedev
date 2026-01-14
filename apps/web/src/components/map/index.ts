// =============================================================================
// Map Module Exports
// =============================================================================

// Core map components
export { MapContainer, MapPlaceholder } from './MapContainer'
export type { MapContainerProps } from './MapContainer'

// Parcel Popup component
export { ParcelPopup } from './ParcelPopup'
export type { ParcelPopupProps } from './ParcelPopup'

// Layer Panel component
export { LayerPanel } from './LayerPanel'
export type { LayerPanelProps } from './LayerPanel'

// ESRI Layer exports
export {
  // Layer configuration
  MILWAUKEE_GIS_BASE_URL,
  ZONING_CATEGORY_COLORS,
  ZONING_CODE_CATEGORIES,
  getZoningCategory,
  getZoningColor,
  ZONING_LAYER_CONFIG,
  PARCELS_LAYER_CONFIG,
  TIF_LAYER_CONFIG,
  OPPORTUNITY_ZONES_LAYER_CONFIG,
  HISTORIC_LAYER_CONFIG,
  ARB_LAYER_CONFIG,
  CITY_OWNED_LAYER_CONFIG,
  ALL_LAYER_CONFIGS,
  getLayerConfig,
  // Layer manager
  ESRILayerManager,
  // React hook
  useESRILayers,
  // Components
  ZoningTooltip,
  ESRILayerLoader,
} from './layers'

export type {
  // Layer configuration types
  ZoningCategory,
  LayerType,
  LegendItem,
  ESRILayerConfig,
  // Layer manager types
  ParcelData,
  LayerClickEvent,
  ESRILayerManagerOptions,
  // Hook types
  ZoningTooltipData,
  UseESRILayersResult,
} from './layers'
