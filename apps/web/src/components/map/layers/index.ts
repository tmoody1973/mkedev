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
  COMMERCIAL_LAYER_CONFIG,
  DEVELOPMENT_SITES_LAYER_CONFIG,
  VACANT_LOTS_LAYER_CONFIG,
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
  CommercialLayerConfig,
  DevelopmentSitesLayerConfig,
  VacantLotsLayerConfig,
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

// Commercial properties layer manager
export {
  CommercialLayerManager,
} from './commercial-layer-manager'

export type {
  CommercialProperty,
  CommercialPropertyClickEvent,
  CommercialLayerManagerOptions,
} from './commercial-layer-manager'

// Development sites layer manager
export {
  DevelopmentSitesLayerManager,
} from './development-sites-layer-manager'

export type {
  DevelopmentSite,
  DevelopmentSiteClickEvent,
  DevelopmentSitesLayerManagerOptions,
} from './development-sites-layer-manager'

// Vacant lots layer manager
export {
  VacantLotsLayerManager,
} from './vacant-lots-layer-manager'

export type {
  VacantLot,
  VacantLotClickEvent,
  VacantLotsLayerManagerOptions,
} from './vacant-lots-layer-manager'

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

export {
  useCommercialPropertiesLayer,
} from './useCommercialPropertiesLayer'

export type {
  UseCommercialPropertiesLayerResult,
} from './useCommercialPropertiesLayer'

export {
  useDevelopmentSitesLayer,
} from './useDevelopmentSitesLayer'

export type {
  UseDevelopmentSitesLayerResult,
} from './useDevelopmentSitesLayer'

export {
  useVacantLotsLayer,
} from './useVacantLotsLayer'

export type {
  UseVacantLotsLayerResult,
} from './useVacantLotsLayer'

// Components
export { ZoningTooltip } from './ZoningTooltip'
export { ESRILayerLoader } from './ESRILayerLoader'
export { HomesLayerLoader } from './HomesLayerLoader'
export { CommercialPropertiesLayerLoader } from './CommercialPropertiesLayerLoader'
export { DevelopmentSitesLayerLoader } from './DevelopmentSitesLayerLoader'
export { VacantLotsLayerLoader } from './VacantLotsLayerLoader'

export type { HomesLayerLoaderProps } from './HomesLayerLoader'
export type { CommercialPropertiesLayerLoaderProps } from './CommercialPropertiesLayerLoader'
export type { DevelopmentSitesLayerLoaderProps } from './DevelopmentSitesLayerLoader'
export type { VacantLotsLayerLoaderProps } from './VacantLotsLayerLoader'

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
