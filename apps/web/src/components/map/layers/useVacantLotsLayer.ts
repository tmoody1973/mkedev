'use client'

// =============================================================================
// useVacantLotsLayer Hook
// React hook for managing the Vacant Lots layer with Convex data
// =============================================================================

import { useEffect, useRef, useCallback, useState } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useMap } from '@/contexts/MapContext'
import {
  VacantLotsLayerManager,
  type VacantLotClickEvent,
  type VacantLot,
} from './vacant-lots-layer-manager'

// =============================================================================
// Types
// =============================================================================

export interface UseVacantLotsLayerResult {
  /** Whether the vacant lots layer is loading */
  isLoading: boolean
  /** Error message if layer loading failed */
  error: string | null
  /** Number of vacant lots currently displayed */
  lotCount: number
  /** Highlight specific lots on the map */
  highlightLots: (lotIds: string[]) => void
  /** Clear all lot highlights */
  clearHighlights: () => void
  /** Currently clicked lot (if any) */
  selectedLot: VacantLot | null
  /** Clear the selected lot */
  clearSelectedLot: () => void
  /** Re-initialize the layer (after style change) */
  reinitializeLayers: () => void
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for managing the Vacant Lots layer on the map
 * Fetches data from Convex and displays as circle markers
 */
export function useVacantLotsLayer(): UseVacantLotsLayerResult {
  const { map, isMapLoaded, layerVisibility } = useMap()

  const layerManagerRef = useRef<VacantLotsLayerManager | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLot, setSelectedLot] = useState<VacantLot | null>(null)
  const [lotCount, setLotCount] = useState(0)
  const [reinitializeCounter, setReinitializeCounter] = useState(0)

  // Fetch vacant lots data from Convex
  const lotsData = useQuery(api.vacantLots.getForMap)

  // Handle lot click
  const handleLotClick = useCallback((event: VacantLotClickEvent) => {
    setSelectedLot(event.properties)
  }, [])

  // Store callback and data in refs to avoid effect re-runs
  const handleLotClickRef = useRef(handleLotClick)
  const lotsDataRef = useRef(lotsData)
  handleLotClickRef.current = handleLotClick
  lotsDataRef.current = lotsData

  // Track initialization
  const isInitializedRef = useRef(false)

  // Initialize layer when map is loaded
  useEffect(() => {
    if (!map || !isMapLoaded) return

    // Prevent double initialization in React StrictMode
    // But allow re-initialization when reinitializeCounter changes
    if (
      isInitializedRef.current &&
      layerManagerRef.current &&
      reinitializeCounter === 0
    ) {
      setIsLoading(false)
      return
    }

    try {
      // Destroy existing manager if re-initializing
      if (layerManagerRef.current) {
        layerManagerRef.current.destroy()
        layerManagerRef.current = null
      }

      setIsLoading(true)
      setError(null)

      const manager = new VacantLotsLayerManager({
        map: map as MapboxMap,
        onLotClick: (event) => handleLotClickRef.current(event),
      })

      manager.addLayer()
      layerManagerRef.current = manager
      isInitializedRef.current = true

      // If we have data, update the layer immediately
      if (lotsDataRef.current && lotsDataRef.current.length > 0) {
        const lots: VacantLot[] = lotsDataRef.current.map(
          (l: {
            id: string
            address: string
            neighborhood?: string
            coordinates: number[]
            status: 'available' | 'pending' | 'sold' | 'unknown'
            zoning?: string
          }) => ({
            id: l.id,
            address: l.address,
            neighborhood: l.neighborhood,
            coordinates: l.coordinates as [number, number],
            status: l.status,
            zoning: l.zoning,
          })
        )
        manager.updateData(lots)
        setLotCount(lots.length)
      }

      setIsLoading(false)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load vacant lots layer'
      console.error('Vacant lots layer initialization error:', err)
      setError(errorMessage)
      setIsLoading(false)
    }

    // Cleanup on unmount
    return () => {
      if (layerManagerRef.current) {
        layerManagerRef.current.destroy()
        layerManagerRef.current = null
        isInitializedRef.current = false
      }
    }
  }, [map, isMapLoaded, reinitializeCounter])

  // Update layer data when Convex data changes
  useEffect(() => {
    if (!layerManagerRef.current || !lotsData) return

    // Transform Convex data to VacantLot format
    const lots: VacantLot[] = lotsData.map(
      (l: {
        id: string
        address: string
        neighborhood?: string
        coordinates: number[]
        status: 'available' | 'pending' | 'sold' | 'unknown'
        zoning?: string
      }) => ({
        id: l.id,
        address: l.address,
        neighborhood: l.neighborhood,
        coordinates: l.coordinates as [number, number],
        status: l.status,
        zoning: l.zoning,
      })
    )

    layerManagerRef.current.updateData(lots)
    setLotCount(lots.length)
  }, [lotsData])

  // Sync layer visibility with MapContext
  useEffect(() => {
    if (!layerManagerRef.current || isLoading) return

    const visible = layerVisibility.vacantLots ?? true
    layerManagerRef.current.setLayerVisibility(visible)
  }, [layerVisibility.vacantLots, isLoading])

  // Highlight lots by IDs
  const highlightLots = useCallback((lotIds: string[]) => {
    layerManagerRef.current?.highlightLots(lotIds)
  }, [])

  // Clear all highlights
  const clearHighlights = useCallback(() => {
    layerManagerRef.current?.clearHighlights()
  }, [])

  // Clear selected lot
  const clearSelectedLot = useCallback(() => {
    setSelectedLot(null)
  }, [])

  // Re-initialize layers (called after style change)
  const reinitializeLayers = useCallback(() => {
    setReinitializeCounter((prev) => prev + 1)
  }, [])

  return {
    isLoading,
    error,
    lotCount,
    highlightLots,
    clearHighlights,
    selectedLot,
    clearSelectedLot,
    reinitializeLayers,
  }
}
