'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'

// =============================================================================
// Types
// =============================================================================

export interface LayerVisibility {
  [layerId: string]: boolean
}

export interface LayerOpacity {
  [layerId: string]: number
}

export interface MapContextValue {
  /** Reference to the Mapbox map instance */
  map: MapboxMap | null
  /** Set the map instance reference */
  setMap: (map: MapboxMap | null) => void
  /** Currently selected parcel ID */
  selectedParcelId: string | null
  /** Set the selected parcel ID */
  setSelectedParcelId: (id: string | null) => void
  /** Layer visibility states */
  layerVisibility: LayerVisibility
  /** Toggle a layer's visibility */
  toggleLayerVisibility: (layerId: string) => void
  /** Set a layer's visibility explicitly */
  setLayerVisibility: (layerId: string, visible: boolean) => void
  /** Layer opacity states (0-1) */
  layerOpacity: LayerOpacity
  /** Set a layer's opacity (0-1) */
  setLayerOpacity: (layerId: string, opacity: number) => void
  /** Fly the map to a specific location */
  flyTo: (center: [number, number], zoom?: number) => void
  /** Reset the map to default Milwaukee view */
  resetView: () => void
  /** Whether the map has finished loading */
  isMapLoaded: boolean
  /** Set map loaded state */
  setIsMapLoaded: (loaded: boolean) => void
  /** Map error state */
  mapError: string | null
  /** Set map error */
  setMapError: (error: string | null) => void
}

// =============================================================================
// Constants
// =============================================================================

/** Milwaukee center coordinates */
export const MILWAUKEE_CENTER: [number, number] = [-87.9065, 43.0389]
/** Default zoom level for city view */
export const DEFAULT_ZOOM = 12

/** Default layer visibility states */
const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  zoning: true,
  parcels: true,
  tif: false,
  opportunityZones: false,
  historic: false,
  arb: false,
  cityOwned: false,
}

/** Default layer opacity states (all start at 100%) */
const DEFAULT_LAYER_OPACITY: LayerOpacity = {
  zoning: 1,
  parcels: 1,
  tif: 1,
  opportunityZones: 1,
  historic: 1,
  arb: 1,
  cityOwned: 1,
}

// =============================================================================
// Context
// =============================================================================

const MapContext = createContext<MapContextValue | null>(null)

// =============================================================================
// Provider
// =============================================================================

export interface MapProviderProps {
  children: ReactNode
  /** Initial layer visibility states */
  initialLayerVisibility?: LayerVisibility
  /** Initial layer opacity states */
  initialLayerOpacity?: LayerOpacity
}

export function MapProvider({
  children,
  initialLayerVisibility = DEFAULT_LAYER_VISIBILITY,
  initialLayerOpacity = DEFAULT_LAYER_OPACITY,
}: MapProviderProps) {
  const mapRef = useRef<MapboxMap | null>(null)
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null)
  const [layerVisibility, setLayerVisibilityState] =
    useState<LayerVisibility>(initialLayerVisibility)
  const [layerOpacity, setLayerOpacityState] =
    useState<LayerOpacity>(initialLayerOpacity)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  const setMap = useCallback((map: MapboxMap | null) => {
    mapRef.current = map
  }, [])

  const toggleLayerVisibility = useCallback((layerId: string) => {
    setLayerVisibilityState((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }))
  }, [])

  const setLayerVisibility = useCallback((layerId: string, visible: boolean) => {
    setLayerVisibilityState((prev) => ({
      ...prev,
      [layerId]: visible,
    }))
  }, [])

  const setLayerOpacity = useCallback((layerId: string, opacity: number) => {
    // Clamp opacity between 0 and 1
    const clampedOpacity = Math.max(0, Math.min(1, opacity))
    setLayerOpacityState((prev) => ({
      ...prev,
      [layerId]: clampedOpacity,
    }))
  }, [])

  const flyTo = useCallback((center: [number, number], zoom?: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center,
        zoom: zoom ?? mapRef.current.getZoom(),
        duration: 1500,
      })
    }
  }, [])

  const resetView = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: MILWAUKEE_CENTER,
        zoom: DEFAULT_ZOOM,
        duration: 1500,
      })
    }
  }, [])

  const value: MapContextValue = {
    map: mapRef.current,
    setMap,
    selectedParcelId,
    setSelectedParcelId,
    layerVisibility,
    toggleLayerVisibility,
    setLayerVisibility,
    layerOpacity,
    setLayerOpacity,
    flyTo,
    resetView,
    isMapLoaded,
    setIsMapLoaded,
    mapError,
    setMapError,
  }

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>
}

// =============================================================================
// Hook
// =============================================================================

export function useMap(): MapContextValue {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error('useMap must be used within a MapProvider')
  }
  return context
}
