'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import { MapPin, AlertTriangle, Loader2 } from 'lucide-react'
import { useMap, MILWAUKEE_CENTER, DEFAULT_ZOOM } from '@/contexts/MapContext'
import { ESRILayerLoader } from './layers/ESRILayerLoader'
import { LayerPanel } from './LayerPanel'
import { ParcelPopup } from './ParcelPopup'
import type { ParcelData } from './layers/esri-layer-manager'

// Import Mapbox CSS
import 'mapbox-gl/dist/mapbox-gl.css'

// =============================================================================
// Types
// =============================================================================

export interface MapContainerProps {
  /** Custom class name for the container */
  className?: string
  /** Map style URL (defaults to streets-v12) */
  mapStyle?: string
  /** Initial zoom level */
  initialZoom?: number
  /** Initial center coordinates [lng, lat] */
  initialCenter?: [number, number]
  /** Whether to load ESRI layers */
  enableESRILayers?: boolean
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
}

// =============================================================================
// Component
// =============================================================================

export function MapContainer({
  className = '',
  mapStyle = 'mapbox://styles/mapbox/streets-v12',
  initialZoom = DEFAULT_ZOOM,
  initialCenter = MILWAUKEE_CENTER,
  enableESRILayers = true,
  showZoningTooltip = true,
  showLayerPanel = true,
  showParcelPopup = true,
  onMapLoad,
  onMapError,
  onParcelSelect,
  onParcelClear,
  onParcelAsk,
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedParcel, setSelectedParcel] = useState<ParcelData | null>(null)

  const { setMap, setIsMapLoaded, setMapError, setSelectedParcelId } = useMap()

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

  useEffect(() => {
    // Check for Mapbox access token
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!accessToken) {
      const tokenError = 'Mapbox access token is not configured. Please set NEXT_PUBLIC_MAPBOX_TOKEN in your environment variables.'
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
      // Initialize the map
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
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
        const errorMessage = e.error?.message || 'An error occurred while loading the map'
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize map'
      setError(errorMessage)
      setMapError(errorMessage)
      setIsLoading(false)
      onMapError?.(err instanceof Error ? err : new Error(errorMessage))
      return undefined
    }
  }, [
    mapStyle,
    initialZoom,
    initialCenter,
    setMap,
    setIsMapLoaded,
    setMapError,
    onMapLoad,
    onMapError,
  ])

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
            Map Error
          </p>
          <p className="font-sans text-sm text-neutral-600 dark:text-neutral-400 text-center max-w-md">
            {error}
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
            />
          )}
          {showLayerPanel && <LayerPanel />}
          {showParcelPopup && selectedParcel && (
            <ParcelPopup
              parcel={selectedParcel}
              onClose={handlePopupClose}
              onAskAbout={onParcelAsk ? handleAskAboutParcel : undefined}
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
