'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import { MapPin, AlertTriangle, Loader2 } from 'lucide-react'
import {
  useMap,
  MILWAUKEE_CENTER,
  DEFAULT_ZOOM,
  MAP_STYLE_2D,
  MAP_STYLE_3D,
} from '@/contexts/MapContext'
import { ESRILayerLoader } from './layers/ESRILayerLoader'
import { HomesLayerLoader } from './layers/HomesLayerLoader'
import { CommercialPropertiesLayerLoader } from './layers/CommercialPropertiesLayerLoader'
import { DevelopmentSitesLayerLoader } from './layers/DevelopmentSitesLayerLoader'
import { LayerPanel } from './LayerPanel'
import { ParcelPopup } from './ParcelPopup'
import { MapScreenshotButton } from './MapScreenshotButton'
import type { ParcelData } from './layers/esri-layer-manager'
import type { HomeForSale } from './layers/homes-layer-manager'
import type { CommercialProperty } from './layers/commercial-layer-manager'
import type { DevelopmentSite } from './layers/development-sites-layer-manager'

// Import Mapbox CSS
import 'mapbox-gl/dist/mapbox-gl.css'

// =============================================================================
// Types
// =============================================================================

export interface MapContainerProps {
  /** Custom class name for the container */
  className?: string
  /** Map style URL (defaults to streets-v12) - will be overridden by 3D mode */
  mapStyle?: string
  /** Initial zoom level */
  initialZoom?: number
  /** Initial center coordinates [lng, lat] */
  initialCenter?: [number, number]
  /** Whether to load ESRI layers */
  enableESRILayers?: boolean
  /** Whether to load the homes for sale layer */
  enableHomesLayer?: boolean
  /** Whether to load the commercial properties layer */
  enableCommercialLayer?: boolean
  /** Whether to load the development sites layer */
  enableDevelopmentSitesLayer?: boolean
  /** Whether to show the zoning tooltip on hover */
  showZoningTooltip?: boolean
  /** Whether to show the layer panel */
  showLayerPanel?: boolean
  /** Whether to show the parcel popup on selection */
  showParcelPopup?: boolean
  /** Callback when map finishes loading */
  onMapLoad?: (map: mapboxgl.Map) => void
  /** Callback when map encounters an error */
  onMapError?: (error: Error) => void
  /** Callback when a parcel is selected */
  onParcelSelect?: (parcel: ParcelData) => void
  /** Callback when parcel selection is cleared */
  onParcelClear?: () => void
  /** Callback when user wants to ask about a parcel (sends context to chat) */
  onParcelAsk?: (parcel: ParcelData) => void
  /** Callback when user wants to visualize a parcel */
  onParcelVisualize?: (parcel: ParcelData) => void
  /** Callback when a home for sale marker is clicked */
  onHomeClick?: (home: HomeForSale) => void
  /** Callback when a commercial property marker is clicked */
  onCommercialPropertyClick?: (property: CommercialProperty) => void
  /** Callback when a development site marker is clicked */
  onDevelopmentSiteClick?: (site: DevelopmentSite) => void
}

// =============================================================================
// Component
// =============================================================================

export function MapContainer({
  className = '',
  mapStyle,
  initialZoom = DEFAULT_ZOOM,
  initialCenter = MILWAUKEE_CENTER,
  enableESRILayers = true,
  enableHomesLayer = true,
  enableCommercialLayer = true,
  enableDevelopmentSitesLayer = true,
  showZoningTooltip = true,
  showLayerPanel = true,
  showParcelPopup = true,
  onMapLoad,
  onMapError,
  onParcelSelect,
  onParcelClear,
  onParcelAsk,
  onParcelVisualize,
  onHomeClick,
  onCommercialPropertyClick,
  onDevelopmentSiteClick,
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedParcel, setSelectedParcel] = useState<ParcelData | null>(null)
  const [isStyleChanging, setIsStyleChanging] = useState(false)

  const {
    setMap,
    setIsMapLoaded,
    setMapError,
    setSelectedParcelId,
    is3DMode,
    animateTo3DView,
    animateTo2DView,
  } = useMap()

  // Determine the style URL based on 3D mode (prop overrides if provided)
  const effectiveStyle = mapStyle ?? (is3DMode ? MAP_STYLE_3D : MAP_STYLE_2D)

  // Handle parcel selection from ESRI layers
  const handleParcelSelect = useCallback(
    (parcel: ParcelData) => {
      setSelectedParcel(parcel)
      setSelectedParcelId(parcel.taxKey || null)
      onParcelSelect?.(parcel)
    },
    [setSelectedParcelId, onParcelSelect]
  )

  // Handle parcel clear
  const handleParcelClear = useCallback(() => {
    setSelectedParcel(null)
    setSelectedParcelId(null)
    onParcelClear?.()
  }, [setSelectedParcelId, onParcelClear])

  // Handle popup close
  const handlePopupClose = useCallback(() => {
    setSelectedParcel(null)
    // Note: We don't clear the map selection here, just the popup
    // The visual highlight remains until user clicks elsewhere
  }, [])

  // Handle "Ask about this parcel" action
  const handleAskAboutParcel = useCallback(
    (parcel: ParcelData) => {
      onParcelAsk?.(parcel)
      // Close popup after asking
      setSelectedParcel(null)
    },
    [onParcelAsk]
  )

  // Initial map setup
  useEffect(() => {
    // Check for Mapbox access token
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!accessToken) {
      const tokenError =
        'Mapbox access token is not configured. Please set NEXT_PUBLIC_MAPBOX_TOKEN in your environment variables.'
      setError(tokenError)
      setMapError(tokenError)
      setIsLoading(false)
      return undefined
    }

    // Don't initialize if container is not ready or map already exists
    if (!mapContainerRef.current || mapInstanceRef.current) {
      return undefined
    }

    // Set the access token
    mapboxgl.accessToken = accessToken

    try {
      // Initialize the map with the effective style
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: effectiveStyle,
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: true,
        preserveDrawingBuffer: true,
      })

      mapInstanceRef.current = map

      // Add navigation controls
      map.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      )

      // Add scale control
      map.addControl(
        new mapboxgl.ScaleControl({
          maxWidth: 100,
          unit: 'imperial',
        }),
        'bottom-right'
      )

      // Handle map load event
      const handleMapLoaded = () => {
        // Force a resize to ensure the map renders correctly
        // This fixes issues where the container has incorrect dimensions during initial render
        map.resize()

        setIsLoading(false)
        setIsMapLoaded(true)
        setMap(map)
        onMapLoad?.(map)
      }

      map.on('load', handleMapLoaded)

      // Also trigger resize on 'idle' for slower style loads
      map.once('idle', () => {
        map.resize()
      })

      // Check if map is already loaded (can happen with cached styles or fast loads)
      // This handles the race condition where 'load' fires before we attach the listener
      if (map.loaded()) {
        handleMapLoaded()
      }

      // Handle map error event
      map.on('error', (e) => {
        const errorMessage =
          e.error?.message || 'An error occurred while loading the map'
        setError(errorMessage)
        setMapError(errorMessage)
        setIsLoading(false)
        onMapError?.(new Error(errorMessage))
      })

      // Cleanup on unmount
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
          setMap(null)
          setIsMapLoaded(false)
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to initialize map'
      setError(errorMessage)
      setMapError(errorMessage)
      setIsLoading(false)
      onMapError?.(err instanceof Error ? err : new Error(errorMessage))
      return undefined
    }
    // Note: effectiveStyle is intentionally excluded - style changes are handled separately
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialZoom,
    initialCenter,
    setMap,
    setIsMapLoaded,
    setMapError,
    onMapLoad,
    onMapError,
  ])

  // Track previous 3D mode to detect changes
  const prev3DModeRef = useRef(is3DMode)

  // Handle 3D mode style switching and camera animation
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || isLoading) return

    // Only trigger if 3D mode actually changed
    if (prev3DModeRef.current === is3DMode) return
    prev3DModeRef.current = is3DMode

    // Set flag to indicate style is changing
    setIsStyleChanging(true)

    // Get current camera state before style change
    const currentCenter = map.getCenter()
    const currentZoom = map.getZoom()

    // Determine the new style
    const newStyle = is3DMode ? MAP_STYLE_3D : MAP_STYLE_2D

    // Handle style load event
    const handleStyleLoad = () => {
      // Restore center and zoom (with validation to prevent NaN corruption)
      const lng = currentCenter.lng
      const lat = currentCenter.lat
      if (!isNaN(lng) && !isNaN(lat) && lng !== 0 && lat !== 0) {
        map.setCenter([lng, lat])
      } else {
        // Fallback to Milwaukee center if coordinates are invalid
        map.setCenter([-87.9065, 43.0389])
      }
      if (!isNaN(currentZoom) && currentZoom > 0) {
        map.setZoom(currentZoom)
      }

      // Animate camera after style loads
      if (is3DMode) {
        animateTo3DView()
      } else {
        animateTo2DView()
      }

      // Style change complete
      setIsStyleChanging(false)
    }

    // Listen for style load
    map.once('style.load', handleStyleLoad)

    // Switch to the new style
    map.setStyle(newStyle)
  }, [is3DMode, isLoading, animateTo3DView, animateTo2DView])

  // Always render the map container - overlay loading/error states on top
  return (
    <div
      className={`relative h-full ${className}`}
      data-testid="map-container"
    >
      {/* Map container - always rendered so ref is attached */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 z-0"
        style={{ width: '100%', height: '100%' }}
        data-testid="mapbox-container"
      />

      {/* Loading overlay */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-800 z-10">
          <div className="w-20 h-20 mb-4 rounded-lg bg-sky-100 dark:bg-sky-900 flex items-center justify-center border-2 border-black dark:border-white">
            <Loader2 className="w-10 h-10 text-sky-600 dark:text-sky-400 animate-spin" />
          </div>
          <p className="font-sans text-neutral-600 dark:text-neutral-400 text-center px-4">
            Loading map...
          </p>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-800 p-6 z-10">
          <div className="w-20 h-20 mb-4 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center border-2 border-black dark:border-white">
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <p className="font-sans font-semibold text-neutral-900 dark:text-neutral-50 text-center mb-2">
            {error.includes('PMTiles') ? 'Map Tiles Unavailable' :
             error.includes('Mapbox') ? 'Map Failed to Load' :
             error.includes('fetch') ? 'Network Error' :
             'Map Error'}
          </p>
          <p className="font-sans text-sm text-neutral-600 dark:text-neutral-400 text-center max-w-md mb-4">
            {error.includes('fetch')
              ? 'Could not connect to the map server. Please check your internet connection.'
              : error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm rounded border-2 border-black shadow-[2px_2px_0_0_black] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all"
          >
            Refresh Page
          </button>
          <p className="font-sans text-xs text-neutral-500 dark:text-neutral-500 text-center mt-4">
            {error.includes('PMTiles') && 'Service: PMTiles (Cloudflare R2)'}
            {error.includes('Mapbox') && 'Service: Mapbox GL'}
            {error.includes('arcgis') && 'Service: Milwaukee ESRI'}
          </p>
        </div>
      )}

      {/* ESRI layers, controls, and popup - only show when map is loaded */}
      {!isLoading && !error && (
        <>
          {enableESRILayers && (
            <ESRILayerLoader
              onParcelSelect={handleParcelSelect}
              onParcelClear={handleParcelClear}
              showZoningTooltip={showZoningTooltip}
              isStyleChanging={isStyleChanging}
            />
          )}
          {enableHomesLayer && (
            <HomesLayerLoader
              onHomeClick={onHomeClick}
              isStyleChanging={isStyleChanging}
            />
          )}
          {enableCommercialLayer && (
            <CommercialPropertiesLayerLoader
              onPropertyClick={onCommercialPropertyClick}
              isStyleChanging={isStyleChanging}
            />
          )}
          {enableDevelopmentSitesLayer && (
            <DevelopmentSitesLayerLoader
              onSiteClick={onDevelopmentSiteClick}
              isStyleChanging={isStyleChanging}
            />
          )}
          {showLayerPanel && <LayerPanel />}
          <MapScreenshotButton />
          {showParcelPopup && selectedParcel && (
            <ParcelPopup
              parcel={selectedParcel}
              onClose={handlePopupClose}
              onAskAbout={onParcelAsk ? handleAskAboutParcel : undefined}
              onVisualize={onParcelVisualize}
            />
          )}
        </>
      )}
    </div>
  )
}

// =============================================================================
// Placeholder Component (for when MapProvider is not available)
// =============================================================================

export function MapPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative flex flex-col h-full bg-neutral-200 dark:bg-neutral-900 ${className}`}
      data-testid="map-placeholder"
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-800">
        <div className="w-20 h-20 mb-4 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center border-2 border-black dark:border-white">
          <MapPin className="w-10 h-10 text-neutral-500 dark:text-neutral-400" />
        </div>
        <p className="font-sans text-neutral-600 dark:text-neutral-400 text-center px-4">
          Map will render here
        </p>
        <p className="font-sans text-neutral-500 dark:text-neutral-500 text-sm mt-2">
          Mapbox + ESRI ArcGIS layers
        </p>
      </div>
    </div>
  )
}
