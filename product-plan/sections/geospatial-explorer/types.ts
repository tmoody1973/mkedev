// =============================================================================
// Geographic Types
// =============================================================================

export interface Coordinates {
  lat: number
  lng: number
}

export interface Bounds {
  north: number
  south: number
  east: number
  west: number
}

// =============================================================================
// Map Layer Types
// =============================================================================

export interface LegendItem {
  label: string
  color: string
}

export interface MapLayer {
  id: string
  name: string
  description: string
  color: string
  isVisible: boolean
  opacity: number
  dataSource: string
  legendItems: LegendItem[]
}

// =============================================================================
// Parcel & Property Types
// =============================================================================

export interface Parcel {
  id: string
  taxKey: string
  address: string
  city: string
  state: string
  zipCode: string
  coordinates: Coordinates
  bounds: Bounds
  lotSize: number
  lotSizeUnit: string
  lotWidth: number
  lotDepth: number
  currentUse: string
  ownerName: string
  assessedValue: number
  zoningDistrictId: string
  incentiveZoneIds: string[]
  areaPlanId: string | null
  isHistoric: boolean
  hasDesignOverlay: boolean
}

// =============================================================================
// Zoning Types
// =============================================================================

export interface Setbacks {
  front: number
  side: number
  rear: number
}

export interface ZoningDistrict {
  id: string
  code: string
  name: string
  description: string
  color: string
  maxHeight: number
  maxHeightUnit: string
  minLotSize: number
  minLotSizeUnit: string
  maxCoverage: number
  setbacks: Setbacks
  aduPermitted: boolean
  codeSection: string
}

// =============================================================================
// Incentive Zone Types
// =============================================================================

export type IncentiveZoneType = 'TIF' | 'Opportunity Zone' | 'NID' | 'BID'
export type IncentiveZoneStatus = 'active' | 'proposed' | 'expired'

export interface IncentiveZone {
  id: string
  type: IncentiveZoneType
  name: string
  description: string
  color: string
  status: IncentiveZoneStatus
  expirationYear: number | null
  maxFunding: number | null
  fundingUsed: number | null
  eligibleUses: string[]
}

// =============================================================================
// Area Plan Types
// =============================================================================

export interface AreaPlan {
  id: string
  name: string
  adoptedYear: number
  boundaries: Bounds
  color: string
  focusAreas: string[]
  documentUrl: string
}

// =============================================================================
// Search Types
// =============================================================================

export interface AddressSearchResult {
  id: string
  address: string
  fullAddress: string
  parcelId: string
  coordinates: Coordinates
  neighborhood: string
}

// =============================================================================
// Map State Types
// =============================================================================

export type MapViewMode = '2d' | '3d'

export interface MapViewState {
  center: Coordinates
  zoom: number
  pitch: number
  bearing: number
  bounds: Bounds
  viewMode: MapViewMode
  selectedParcelId: string | null
  highlightedParcelIds: string[]
  isLocating: boolean
}

// =============================================================================
// Component Props
// =============================================================================

export interface GeospatialExplorerProps {
  /** The toggleable map layers */
  mapLayers: MapLayer[]
  /** Sample parcels that can be clicked */
  parcels: Parcel[]
  /** Zoning district definitions */
  zoningDistricts: ZoningDistrict[]
  /** Incentive zone definitions */
  incentiveZones: IncentiveZone[]
  /** Area plan definitions */
  areaPlans: AreaPlan[]
  /** Current map view state */
  mapViewState: MapViewState

  // Layer Actions
  /** Called when user toggles a layer's visibility */
  onLayerToggle?: (layerId: string, isVisible: boolean) => void
  /** Called when user adjusts a layer's opacity */
  onLayerOpacityChange?: (layerId: string, opacity: number) => void

  // Map Navigation
  /** Called when user searches for an address */
  onAddressSearch?: (query: string) => void
  /** Called when user selects an address from search results */
  onAddressSelect?: (result: AddressSearchResult) => void
  /** Called when user clicks the "locate me" button */
  onLocateMe?: () => void
  /** Called when map view changes (pan, zoom) */
  onViewChange?: (viewState: Partial<MapViewState>) => void
  /** Called when user toggles between 2D and 3D view */
  onViewModeToggle?: (mode: MapViewMode) => void

  // Parcel Interaction
  /** Called when user clicks on a parcel */
  onParcelClick?: (parcelId: string) => void
  /** Called when user hovers over a parcel */
  onParcelHover?: (parcelId: string | null) => void

  // Voice Navigation
  /** Called when voice navigation command is issued */
  onVoiceNavigate?: (command: string) => void
}

// =============================================================================
// Layer Panel Props
// =============================================================================

export interface LayerPanelProps {
  /** The toggleable map layers */
  layers: MapLayer[]
  /** Whether the panel is expanded */
  isExpanded: boolean
  /** Called when user toggles a layer */
  onLayerToggle?: (layerId: string, isVisible: boolean) => void
  /** Called when user adjusts opacity */
  onOpacityChange?: (layerId: string, opacity: number) => void
  /** Called when panel expand state changes */
  onExpandChange?: (isExpanded: boolean) => void
}

// =============================================================================
// Search Bar Props
// =============================================================================

export interface AddressSearchBarProps {
  /** Placeholder text for the search input */
  placeholder?: string
  /** Search results to display */
  results: AddressSearchResult[]
  /** Whether search is loading */
  isLoading?: boolean
  /** Called when user types in search */
  onSearch?: (query: string) => void
  /** Called when user selects a result */
  onSelect?: (result: AddressSearchResult) => void
  /** Called when search is cleared */
  onClear?: () => void
}
