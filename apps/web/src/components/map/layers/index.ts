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
  HOMES_LAYER_CONFIG,
  ALL_LAYER_CONFIGS,
  getLayerConfig,
} from './layer-config'

export type {
  ZoningCategory,
  ESRILayerType,
  LayerType,
  LegendItem,
  ESRILayerConfig,
  HomesLayerConfig,
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

// Homes layer manager
export {
  HomesLayerManager,
} from './homes-layer-manager'

export type {
  HomeForSale,
  HomeClickEvent,
  HomesLayerManagerOptions,
} from './homes-layer-manager'

// React hooks
export {
  useESRILayers,
} from './useESRILayers'

export type {
  ZoningTooltipData,
  UseESRILayersResult,
} from './useESRILayers'

export {
  useHomesLayer,
} from './useHomesLayer'

export type {
  UseHomesLayerResult,
} from './useHomesLayer'

// Components
export { ZoningTooltip } from './ZoningTooltip'
export { ESRILayerLoader } from './ESRILayerLoader'
export { HomesLayerLoader } from './HomesLayerLoader'

export type { HomesLayerLoaderProps } from './HomesLayerLoader'

// 3D Buildings
export {
  BUILDINGS_3D_LAYER_ID,
  BUILDINGS_3D_COLOR,
  BUILDINGS_3D_OPACITY,
  add3DBuildings,
  remove3DBuildings,
  has3DBuildings,
  set3DBuildingsVisibility,
  set3DBuildingsOpacity,
} from './3d-buildings'
