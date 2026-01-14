// =============================================================================
// ESRI Layers Module Exports
// =============================================================================

// Layer configuration and types
export {
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
} from './layer-config'

export type {
  ZoningCategory,
  LayerType,
  LegendItem,
  ESRILayerConfig,
} from './layer-config'

// Layer manager
export {
  ESRILayerManager,
} from './esri-layer-manager'

export type {
  ParcelData,
  LayerClickEvent,
  ESRILayerManagerOptions,
} from './esri-layer-manager'

// React hook
export {
  useESRILayers,
} from './useESRILayers'

export type {
  ZoningTooltipData,
  UseESRILayersResult,
} from './useESRILayers'

// Components
export { ZoningTooltip } from './ZoningTooltip'
export { ESRILayerLoader } from './ESRILayerLoader'
