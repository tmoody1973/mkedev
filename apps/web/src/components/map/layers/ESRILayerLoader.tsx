'use client'

// =============================================================================
// ESRI Layer Loader Component
// Initializes and manages ESRI layers on the map
// =============================================================================

import { useEffect, useState, useRef } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useESRILayers } from './useESRILayers'
import { ZoningTooltip } from './ZoningTooltip'
import type { ParcelData } from './esri-layer-manager'

// =============================================================================
// Types
// =============================================================================

export interface ESRILayerLoaderProps {
  /** Callback when a parcel is selected */
  onParcelSelect?: (parcel: ParcelData) => void
  /** Callback when parcel selection is cleared */
  onParcelClear?: () => void
  /** Whether to show the loading overlay */
  showLoadingOverlay?: boolean
  /** Whether to show the zoning tooltip on hover */
  showZoningTooltip?: boolean
  /** Whether a style change is in progress (for layer re-initialization) */
  isStyleChanging?: boolean
}

// =============================================================================
// Component
// =============================================================================

/**
 * Component that loads and manages ESRI layers on the map
 * Should be rendered as a child of MapContainer within MapProvider
 */
export function ESRILayerLoader({
  onParcelSelect,
  onParcelClear,
  showLoadingOverlay = true,
  showZoningTooltip = true,
  isStyleChanging = false,
}: ESRILayerLoaderProps) {
  const { isLoading, error, selectedParcel, zoningTooltip, reinitializeLayers } =
    useESRILayers()

  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number
    y: number
  } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevStyleChangingRef = useRef(isStyleChanging)

  // Re-initialize layers after style change completes
  useEffect(() => {
    // Detect when style change completes (was true, now false)
    if (prevStyleChangingRef.current && !isStyleChanging) {
      reinitializeLayers?.()
    }
    prevStyleChangingRef.current = isStyleChanging
  }, [isStyleChanging, reinitializeLayers])

  // Track mouse position for tooltip
  useEffect(() => {
    if (!showZoningTooltip) return

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setTooltipPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [showZoningTooltip])

  // Notify parent when parcel is selected
  useEffect(() => {
    if (selectedParcel) {
      onParcelSelect?.(selectedParcel)
    } else {
      onParcelClear?.()
    }
  }, [selectedParcel, onParcelSelect, onParcelClear])

  // Render loading overlay
  if ((isLoading || isStyleChanging) && showLoadingOverlay) {
    return (
      <div
        ref={containerRef}
        className="absolute inset-0 pointer-events-none z-10"
      >
        <div className="absolute bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-64">
          <div
            className="
            bg-white/95 dark:bg-stone-900/95
            border-2 border-black dark:border-white
            rounded-lg
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
            dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
            p-4
          "
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900 flex items-center justify-center border-2 border-black">
                <Loader2 className="w-5 h-5 text-sky-600 dark:text-sky-400 animate-spin" />
              </div>
              <div>
                <p className="font-sans font-semibold text-stone-900 dark:text-stone-100 text-sm">
                  {isStyleChanging ? 'Switching Style' : 'Loading Layers'}
                </p>
                <p className="font-sans text-xs text-stone-500 dark:text-stone-400">
                  {isStyleChanging
                    ? 'Updating map view...'
                    : 'Connecting to Milwaukee GIS...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Parse error to determine which service failed
  const getErrorDetails = (errorMsg: string) => {
    if (errorMsg.includes('PMTiles')) {
      return {
        title: 'Map Tiles Unavailable',
        description: 'The tile server is not responding. Retrying automatically...',
        service: 'PMTiles (Cloudflare R2)',
      }
    }
    if (errorMsg.includes('ESRI') || errorMsg.includes('arcgis')) {
      return {
        title: 'Milwaukee GIS Unavailable',
        description: 'City of Milwaukee GIS service is not responding.',
        service: 'Milwaukee ESRI ArcGIS',
      }
    }
    if (errorMsg.includes('Mapbox')) {
      return {
        title: 'Map Style Error',
        description: 'Could not load the map style from Mapbox.',
        service: 'Mapbox GL',
      }
    }
    return {
      title: 'Layer Error',
      description: errorMsg,
      service: 'Unknown',
    }
  }

  // Render error state
  if (error && showLoadingOverlay) {
    const errorDetails = getErrorDetails(error)

    return (
      <div
        ref={containerRef}
        className="absolute inset-0 pointer-events-none z-10"
      >
        <div className="absolute bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80">
          <div
            className="
            bg-white/95 dark:bg-stone-900/95
            border-2 border-red-500
            rounded-lg
            shadow-[4px_4px_0px_0px_rgba(239,68,68,0.5)]
            p-4
          "
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center border-2 border-red-500 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="font-sans font-semibold text-stone-900 dark:text-stone-100 text-sm">
                  {errorDetails.title}
                </p>
                <p className="font-sans text-xs text-stone-500 dark:text-stone-400 mt-1">
                  {errorDetails.description}
                </p>
                <p className="font-sans text-[10px] text-stone-400 dark:text-stone-500 mt-2">
                  Service: {errorDetails.service}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render zoning tooltip on hover
  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-10"
    >
      {showZoningTooltip && zoningTooltip && tooltipPosition && (
        <ZoningTooltip
          zoneCode={zoningTooltip.zoneCode}
          position={tooltipPosition}
          visible={true}
        />
      )}
    </div>
  )
}
