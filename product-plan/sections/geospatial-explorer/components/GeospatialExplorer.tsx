'use client'

import { useState, useCallback } from 'react'
import { MapView } from './MapView'
import { MapControls } from './MapControls'
import { AddressSearchBar } from './AddressSearchBar'
import { LayerPanel } from './LayerPanel'
import { SelectedParcelInfo } from './SelectedParcelInfo'
import type {
  GeospatialExplorerProps,
  MapViewState,
  AddressSearchResult,
  MapViewMode,
} from '../types'

export function GeospatialExplorer({
  mapLayers,
  parcels,
  zoningDistricts,
  incentiveZones,
  areaPlans,
  mapViewState,
  onLayerToggle,
  onLayerOpacityChange,
  onAddressSearch,
  onAddressSelect,
  onLocateMe,
  onViewChange,
  onViewModeToggle,
  onParcelClick,
  onParcelHover,
  onVoiceNavigate,
}: GeospatialExplorerProps) {
  const [isLayerPanelExpanded, setIsLayerPanelExpanded] = useState(false)
  const [searchResults, setSearchResults] = useState<AddressSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Get the selected parcel if one is selected
  const selectedParcel = parcels.find(p => p.id === mapViewState.selectedParcelId) || null

  // Handle address search
  const handleSearch = useCallback((query: string) => {
    onAddressSearch?.(query)
    // In a real implementation, this would trigger an API call
    // For demo purposes, we'll simulate search results
    if (query.length > 2) {
      setIsSearching(true)
      // Simulate async search
      setTimeout(() => {
        setSearchResults([
          {
            id: 'result-1',
            address: `${query} N Water St`,
            fullAddress: `${query} N Water St, Milwaukee, WI 53202`,
            parcelId: 'parcel-001',
            coordinates: { lat: 43.0389, lng: -87.9065 },
            neighborhood: 'Downtown',
          },
          {
            id: 'result-2',
            address: `${query} E Wisconsin Ave`,
            fullAddress: `${query} E Wisconsin Ave, Milwaukee, WI 53202`,
            parcelId: 'parcel-002',
            coordinates: { lat: 43.0400, lng: -87.9100 },
            neighborhood: 'East Town',
          },
        ])
        setIsSearching(false)
      }, 300)
    } else {
      setSearchResults([])
    }
  }, [onAddressSearch])

  // Handle address selection
  const handleAddressSelect = useCallback((result: AddressSearchResult) => {
    onAddressSelect?.(result)
    setSearchResults([])
    // Navigate to the selected location
    onViewChange?.({
      center: result.coordinates,
      zoom: 17,
      selectedParcelId: result.parcelId,
    })
  }, [onAddressSelect, onViewChange])

  // Handle search clear
  const handleSearchClear = useCallback(() => {
    setSearchResults([])
    setIsSearching(false)
  }, [])

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    onViewChange?.({ zoom: Math.min(mapViewState.zoom + 1, 20) })
  }, [mapViewState.zoom, onViewChange])

  const handleZoomOut = useCallback(() => {
    onViewChange?.({ zoom: Math.max(mapViewState.zoom - 1, 1) })
  }, [mapViewState.zoom, onViewChange])

  // Handle view mode toggle
  const handleViewModeToggle = useCallback((mode: MapViewMode) => {
    onViewModeToggle?.(mode)
    onViewChange?.({
      viewMode: mode,
      pitch: mode === '3d' ? 45 : 0,
    })
  }, [onViewModeToggle, onViewChange])

  // Handle parcel click
  const handleParcelClick = useCallback((parcelId: string) => {
    onParcelClick?.(parcelId)
    onViewChange?.({ selectedParcelId: parcelId })
  }, [onParcelClick, onViewChange])

  // Handle close parcel info
  const handleCloseParcelInfo = useCallback(() => {
    onViewChange?.({ selectedParcelId: null })
  }, [onViewChange])

  return (
    <div className="relative w-full h-full min-h-[600px] bg-stone-100 dark:bg-stone-900 overflow-hidden">
      {/* Map View */}
      <MapView
        viewState={mapViewState}
        parcels={parcels}
        onParcelClick={handleParcelClick}
        onParcelHover={onParcelHover}
        onViewChange={onViewChange}
      />

      {/* Address Search Bar */}
      <AddressSearchBar
        placeholder="Search Milwaukee addresses..."
        results={searchResults}
        isLoading={isSearching}
        onSearch={handleSearch}
        onSelect={handleAddressSelect}
        onClear={handleSearchClear}
      />

      {/* Map Controls */}
      <MapControls
        viewMode={mapViewState.viewMode}
        isLocating={mapViewState.isLocating}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocateMe={onLocateMe}
        onViewModeToggle={handleViewModeToggle}
      />

      {/* Selected Parcel Info */}
      <SelectedParcelInfo
        parcel={selectedParcel}
        onClose={handleCloseParcelInfo}
        onViewDetails={(parcelId) => {
          // This would trigger the chat panel to show ParcelAnalysisCard
          console.log('View details for parcel:', parcelId)
        }}
      />

      {/* Layer Panel */}
      <LayerPanel
        layers={mapLayers}
        isExpanded={isLayerPanelExpanded}
        onLayerToggle={onLayerToggle}
        onOpacityChange={onLayerOpacityChange}
        onExpandChange={setIsLayerPanelExpanded}
      />

      {/* Attribution */}
      <div className="absolute bottom-20 right-4 text-right">
        <p className="font-mono text-[10px] text-stone-400 dark:text-stone-500">
          Map data © Mapbox © OpenStreetMap
        </p>
        <p className="font-mono text-[10px] text-stone-400 dark:text-stone-500">
          Layers © City of Milwaukee ESRI ArcGIS
        </p>
      </div>
    </div>
  )
}
