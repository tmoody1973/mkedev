'use client'

// =============================================================================
// useESRILayers Hook
// React hook for managing ESRI/PMTiles layers within MapContext
// Automatically uses PMTiles when NEXT_PUBLIC_PMTILES_URL is configured
// =============================================================================

import { useEffect, useRef, useCallback, useState } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'
import { useMap } from '@/contexts/MapContext'
import {
  ESRILayerManager,
  type LayerClickEvent,
  type ParcelData,
} from './esri-layer-manager'
import { add3DBuildings, remove3DBuildings } from './3d-buildings'
// PMTiles is dynamically imported only when needed
const isPMTilesConfigured = () => !!process.env.NEXT_PUBLIC_PMTILES_URL
const getPMTilesUrl = () => process.env.NEXT_PUBLIC_PMTILES_URL
import type { ESRILayerType } from './layer-config'

// =============================================================================
// Types
// =============================================================================

export interface ZoningTooltipData {
  zoneCode: string
  coordinates: [number, number]
}

export interface UseESRILayersResult {
  /** Whether layers are currently loading */
  isLoading: boolean
  /** Error message if layer loading failed */
  error: string | null
  /** Currently selected parcel data */
  selectedParcel: ParcelData | null
  /** Clear the selected parcel */
  clearSelectedParcel: () => void
  /** Zoning tooltip data for hover display */
  zoningTooltip: ZoningTooltipData | null
  /** Highlight a parcel by tax key */
  highlightParcel: (taxKey: string) => void
  /** Re-initialize layers (after style change) */
  reinitializeLayers: () => void
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for managing ESRI layers within a Mapbox GL map
 * Integrates with MapContext for layer visibility management
 * Note: This hook manages ESRI/PMTiles layers only. The homes layer
 * is managed separately by HomesLayerManager.
 */
export function useESRILayers(): UseESRILayersResult {
  const {
    map,
    isMapLoaded,
    layerVisibility,
    layerOpacity,
    setSelectedParcelId,
    is3DMode,
  } = useMap()

  const layerManagerRef = useRef<ESRILayerManager | PMTilesLayerManager | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedParcel, setSelectedParcel] = useState<ParcelData | null>(null)
  const [zoningTooltip, setZoningTooltip] = useState<ZoningTooltipData | null>(
    null
  )
  const [usePMTiles] = useState(() => isPMTilesConfigured())
  const [reinitializeCounter, setReinitializeCounter] = useState(0)

  // Handle feature click events
  const handleFeatureClick = useCallback(
    (event: LayerClickEvent) => {
      if (event.layerId === 'parcels' && event.parcelData) {
        setSelectedParcel(event.parcelData)
        setSelectedParcelId(event.parcelData.taxKey || null)
      }
    },
    [setSelectedParcelId]
  )

  // Handle feature hover events
  const handleFeatureHover = useCallback((event: LayerClickEvent | null) => {
    if (event?.layerId === 'zoning') {
      const zoneCode =
        (event.properties.ZONING as string) ||
        (event.properties.zoning as string) ||
        ''
      setZoningTooltip({
        zoneCode,
        coordinates: event.coordinates,
      })
    } else {
      setZoningTooltip(null)
    }
  }, [])

  // Store callbacks and state in refs to avoid effect re-runs
  const handleFeatureClickRef = useRef(handleFeatureClick)
  const handleFeatureHoverRef = useRef(handleFeatureHover)
  const layerVisibilityRef = useRef(layerVisibility)
  const is3DModeRef = useRef(is3DMode)
  handleFeatureClickRef.current = handleFeatureClick
  handleFeatureHoverRef.current = handleFeatureHover
  layerVisibilityRef.current = layerVisibility
  is3DModeRef.current = is3DMode

  // Track initialization state to prevent double-init in StrictMode
  const isInitializedRef = useRef(false)

  // Helper to format address from parcel properties
  function formatAddress(props: Record<string, unknown>): string {
    const houseNum = props.HOUSE_NR_LO || ''
    const dir = props.SDIR || ''
    const street = props.STREET || ''
    const type = props.STTYPE || ''
    return `${houseNum} ${dir} ${street} ${type}`.trim().replace(/\s+/g, ' ')
  }

  // Initialize layer manager when map is loaded
  useEffect(() => {
    if (!map || !isMapLoaded) return

    // Prevent double initialization in React StrictMode
    // But allow re-initialization when reinitializeCounter changes
    if (isInitializedRef.current && layerManagerRef.current && reinitializeCounter === 0) {
      console.log('Layers already initialized, skipping')
      setIsLoading(false)
      return
    }

    const initializeLayers = async () => {
      try {
        // Destroy existing manager if re-initializing
        if (layerManagerRef.current) {
          layerManagerRef.current.destroy()
          layerManagerRef.current = null
        }

        setIsLoading(true)
        setError(null)

        // Filter to only ESRI layer types (exclude 'homes')
        const esriLayerVisibility = Object.fromEntries(
          Object.entries(layerVisibilityRef.current).filter(
            ([key]) => key !== 'homes'
          )
        ) as Record<ESRILayerType, boolean>

        if (usePMTiles) {
          // Use PMTiles for faster tile loading
          const pmtilesUrl = getPMTilesUrl()!
          console.log('Using PMTiles:', pmtilesUrl)

          // Dynamically import PMTilesLayerManager to avoid bundling issues
          const { PMTilesLayerManager } = await import('./pmtiles-layer-manager')
          const manager = new PMTilesLayerManager({
            map: map as MapboxMap,
            pmtilesUrl,
            onFeatureClick: (event) => {
              // Convert PMTiles event to LayerClickEvent format
              const parcelData: ParcelData = {
                taxKey: event.properties.TAXKEY as string,
                address: formatAddress(event.properties),
                zoneCode: (event.properties.ZONING as string) || '',
                lotSize: event.properties.LOT_AREA as number,
                assessedValue: event.properties.C_A_TOTAL as number,
                owner: (event.properties.OWNER_NAME_1 as string) || '',
              }
              handleFeatureClickRef.current({
                layerId: event.layerId,
                coordinates: event.coordinates,
                properties: event.properties,
                parcelData,
              })
            },
            onFeatureHover: (event) => {
              if (event) {
                handleFeatureHoverRef.current({
                  layerId: event.layerId,
                  coordinates: event.coordinates,
                  properties: event.properties,
                })
              } else {
                handleFeatureHoverRef.current(null)
              }
            },
          })

          layerManagerRef.current = manager
          isInitializedRef.current = true

          await manager.initialize(esriLayerVisibility)

          // Set 3D mode if active after initialization
          if (is3DModeRef.current && manager.setZoning3DMode) {
            manager.setZoning3DMode(true)
          }
        } else {
          // Fall back to ESRI REST API
          console.log('Using ESRI REST API')
          const manager = new ESRILayerManager({
            map: map as MapboxMap,
            onFeatureClick: (event) => handleFeatureClickRef.current(event),
            onFeatureHover: (event) => handleFeatureHoverRef.current(event),
          })

          layerManagerRef.current = manager
          isInitializedRef.current = true

          await manager.initializeLayers(esriLayerVisibility)
        }

        // Add 3D buildings layer (Mapbox composite source)
        // This adds light gray extruded buildings for visual context
        add3DBuildings(map as MapboxMap)

        setIsLoading(false)
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load layers'
        console.error('Layer initialization error:', err)
        setError(errorMessage)
        setIsLoading(false)
      }
    }

    initializeLayers()

    // Cleanup on unmount
    return () => {
      // Remove 3D buildings layer
      if (map) {
        remove3DBuildings(map as MapboxMap)
      }

      if (layerManagerRef.current) {
        layerManagerRef.current.destroy()
        layerManagerRef.current = null
        isInitializedRef.current = false
      }
    }
  }, [map, isMapLoaded, usePMTiles, reinitializeCounter])

  // Sync layer visibility with MapContext (ESRI layers only)
  useEffect(() => {
    if (!layerManagerRef.current || isLoading) return

    const manager = layerManagerRef.current

    // Update visibility for each ESRI layer (skip 'homes' as it's managed separately)
    const visibilityEntries = Object.entries(layerVisibility).filter(
      ([key]) => key !== 'homes'
    ) as [ESRILayerType, boolean][]
    visibilityEntries.forEach(([layerId, visible]) => {
      manager.setLayerVisibility(layerId, visible)
    })
  }, [layerVisibility, isLoading])

  // Sync layer opacity with MapContext (ESRI layers only)
  useEffect(() => {
    if (!layerManagerRef.current || isLoading) return

    const manager = layerManagerRef.current

    // Update opacity for each ESRI layer (skip 'homes' as it's managed separately)
    const opacityEntries = Object.entries(layerOpacity).filter(
      ([key]) => key !== 'homes'
    ) as [ESRILayerType, number][]
    opacityEntries.forEach(([layerId, opacity]) => {
      manager.setLayerOpacity(layerId, opacity)
    })
  }, [layerOpacity, isLoading])

  // Sync 3D mode with layer manager
  useEffect(() => {
    if (!layerManagerRef.current || isLoading) return

    const manager = layerManagerRef.current
    if ('setZoning3DMode' in manager) {
      ;(manager as PMTilesLayerManager).setZoning3DMode(is3DMode)
    }
  }, [is3DMode, isLoading])

  // Clear selected parcel
  const clearSelectedParcel = useCallback(() => {
    setSelectedParcel(null)
    setSelectedParcelId(null)
    layerManagerRef.current?.clearSelection()
  }, [setSelectedParcelId])

  // Highlight a parcel by tax key
  const highlightParcel = useCallback((taxKey: string) => {
    layerManagerRef.current?.highlightParcelByTaxKey(taxKey)
  }, [])

  // Re-initialize layers (called after style change)
  const reinitializeLayers = useCallback(() => {
    setReinitializeCounter((prev) => prev + 1)
  }, [])

  return {
    isLoading,
    error,
    selectedParcel,
    clearSelectedParcel,
    zoningTooltip,
    highlightParcel,
    reinitializeLayers,
  }
}

// Type import for PMTilesLayerManager
type PMTilesLayerManager = import('./pmtiles-layer-manager').PMTilesLayerManager
