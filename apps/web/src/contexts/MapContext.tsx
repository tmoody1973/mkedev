'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
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
  /** Fly the map to a specific location with optional pitch and bearing */
  flyTo: (
    center: [number, number],
    zoom?: number,
    options?: { pitch?: number; bearing?: number; duration?: number }
  ) => void
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
  /** Whether 3D mode is enabled */
  is3DMode: boolean
  /** Set 3D mode explicitly */
  setIs3DMode: (enabled: boolean) => void
  /** Toggle 3D mode */
  toggle3DMode: () => void
  /** Animate camera to 3D view (pitch 45, bearing -17.6) */
  animateTo3DView: () => void
  /** Animate camera to 2D view (pitch 0, bearing 0) */
  animateTo2DView: () => void
}

// =============================================================================
// Constants
// =============================================================================

/** Milwaukee center coordinates */
export const MILWAUKEE_CENTER: [number, number] = [-87.9065, 43.0389]
/** Default zoom level for city view */
export const DEFAULT_ZOOM = 12

/** 3D Camera Settings */
export const CAMERA_3D_PITCH = 45
export const CAMERA_3D_BEARING = -17.6
export const CAMERA_2D_PITCH = 0
export const CAMERA_2D_BEARING = 0
export const CAMERA_ANIMATION_DURATION = 1500

/** Map Style URLs */
export const MAP_STYLE_2D = 'mapbox://styles/mapbox/streets-v12'
export const MAP_STYLE_3D = 'mapbox://styles/mapbox/standard'

/** localStorage key for 3D mode persistence */
const STORAGE_KEY_3D_MODE = 'mkedev-3d-mode'

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
// Helper Functions
// =============================================================================

/**
 * Read 3D mode from localStorage (client-side only)
 * Returns null if not available or on server
 */
function read3DModeFromStorage(): boolean | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY_3D_MODE)
    return stored === 'true'
  } catch {
    return null
  }
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
  // Always start with false to match server render, sync from localStorage after hydration
  const [is3DMode, setIs3DModeState] = useState<boolean>(false)

  // Sync 3D mode from localStorage after hydration (avoids hydration mismatch)
  useEffect(() => {
    const stored = read3DModeFromStorage()
    if (stored !== null) {
      setIs3DModeState(stored)
    }
  }, [])

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

  const flyTo = useCallback(
    (
      center: [number, number],
      zoom?: number,
      options?: { pitch?: number; bearing?: number; duration?: number }
    ) => {
      if (!mapRef.current) return

      // Validate coordinates to prevent NaN corruption
      const [lng, lat] = center
      if (
        typeof lng !== 'number' ||
        typeof lat !== 'number' ||
        isNaN(lng) ||
        isNaN(lat) ||
        lng < -180 ||
        lng > 180 ||
        lat < -90 ||
        lat > 90
      ) {
        console.warn('flyTo called with invalid coordinates:', center)
        return
      }

      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: zoom ?? mapRef.current.getZoom(),
        duration: options?.duration ?? 1500,
        essential: true,
        ...(typeof options?.pitch === 'number' && !isNaN(options.pitch) ? { pitch: options.pitch } : {}),
        ...(typeof options?.bearing === 'number' && !isNaN(options.bearing) ? { bearing: options.bearing } : {}),
      })
    },
    []
  )

  const resetView = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: MILWAUKEE_CENTER,
        zoom: DEFAULT_ZOOM,
        duration: 1500,
      })
    }
  }, [])

  // 3D Mode state management with localStorage persistence
  const setIs3DMode = useCallback((enabled: boolean) => {
    setIs3DModeState(enabled)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY_3D_MODE, String(enabled))
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [])

  const toggle3DMode = useCallback(() => {
    setIs3DModeState((prev) => {
      const newValue = !prev
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(STORAGE_KEY_3D_MODE, String(newValue))
        } catch {
          // Ignore localStorage errors
        }
      }
      return newValue
    })
  }, [])

  // Animate to 3D view (pitch 45, bearing -17.6)
  const animateTo3DView = useCallback(() => {
    if (mapRef.current) {
      const currentCenter = mapRef.current.getCenter()
      const currentZoom = mapRef.current.getZoom()
      mapRef.current.flyTo({
        center: [currentCenter.lng, currentCenter.lat],
        zoom: currentZoom,
        pitch: CAMERA_3D_PITCH,
        bearing: CAMERA_3D_BEARING,
        duration: CAMERA_ANIMATION_DURATION,
      })
    }
  }, [])

  // Animate to 2D view (pitch 0, bearing 0)
  const animateTo2DView = useCallback(() => {
    if (mapRef.current) {
      const currentCenter = mapRef.current.getCenter()
      const currentZoom = mapRef.current.getZoom()
      mapRef.current.flyTo({
        center: [currentCenter.lng, currentCenter.lat],
        zoom: currentZoom,
        pitch: CAMERA_2D_PITCH,
        bearing: CAMERA_2D_BEARING,
        duration: CAMERA_ANIMATION_DURATION,
      })
    }
  }, [])

  // Persist 3D mode to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY_3D_MODE, String(is3DMode))
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [is3DMode])

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
    is3DMode,
    setIs3DMode,
    toggle3DMode,
    animateTo3DView,
    animateTo2DView,
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
