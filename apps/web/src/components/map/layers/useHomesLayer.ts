'use client'

// =============================================================================
// useHomesLayer Hook
// React hook for managing the Homes For Sale layer with Convex data
// =============================================================================

import { useEffect, useRef, useCallback, useState } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useMap } from '@/contexts/MapContext'
import {
  HomesLayerManager,
  type HomeClickEvent,
  type HomeForSale,
} from './homes-layer-manager'

// =============================================================================
// Types
// =============================================================================

export interface UseHomesLayerResult {
  /** Whether the homes layer is loading */
  isLoading: boolean
  /** Error message if layer loading failed */
  error: string | null
  /** Number of homes currently displayed */
  homeCount: number
  /** Highlight specific homes on the map */
  highlightHomes: (homeIds: string[]) => void
  /** Clear all home highlights */
  clearHighlights: () => void
  /** Currently clicked home (if any) */
  selectedHome: HomeForSale | null
  /** Clear the selected home */
  clearSelectedHome: () => void
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for managing the Homes For Sale layer on the map
 * Fetches data from Convex and displays as circle markers
 */
export function useHomesLayer(): UseHomesLayerResult {
  const { map, isMapLoaded, layerVisibility } = useMap()

  const layerManagerRef = useRef<HomesLayerManager | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedHome, setSelectedHome] = useState<HomeForSale | null>(null)
  const [homeCount, setHomeCount] = useState(0)

  // Fetch homes data from Convex
  const homesData = useQuery(api.homes.getForMap)

  // Handle home click
  const handleHomeClick = useCallback((event: HomeClickEvent) => {
    setSelectedHome(event.properties)
  }, [])

  // Store callback in ref to avoid effect re-runs
  const handleHomeClickRef = useRef(handleHomeClick)
  handleHomeClickRef.current = handleHomeClick

  // Track initialization
  const isInitializedRef = useRef(false)

  // Initialize layer when map is loaded
  useEffect(() => {
    if (!map || !isMapLoaded) return

    // Prevent double initialization in React StrictMode
    if (isInitializedRef.current && layerManagerRef.current) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const manager = new HomesLayerManager({
        map: map as MapboxMap,
        onHomeClick: (event) => handleHomeClickRef.current(event),
      })

      manager.addLayer()
      layerManagerRef.current = manager
      isInitializedRef.current = true

      setIsLoading(false)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load homes layer'
      console.error('Homes layer initialization error:', err)
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
  }, [map, isMapLoaded])

  // Update layer data when Convex data changes
  useEffect(() => {
    if (!layerManagerRef.current || !homesData) return

    // Transform Convex data to HomeForSale format
    const homes: HomeForSale[] = homesData.map(
      (h: {
        id: string
        address: string
        neighborhood: string
        coordinates: number[]
        bedrooms: number
        fullBaths: number
        halfBaths: number
      }) => ({
        _id: h.id,
        address: h.address,
        neighborhood: h.neighborhood,
        coordinates: h.coordinates as [number, number],
        bedrooms: h.bedrooms,
        fullBaths: h.fullBaths,
        halfBaths: h.halfBaths,
        buildingSqFt: 0, // Not included in getForMap for performance
        yearBuilt: 0,
        status: 'for_sale' as const,
      })
    )

    layerManagerRef.current.updateData(homes)
    setHomeCount(homes.length)
  }, [homesData])

  // Sync layer visibility with MapContext
  useEffect(() => {
    if (!layerManagerRef.current || isLoading) return

    const visible = layerVisibility.homes ?? true
    layerManagerRef.current.setLayerVisibility(visible)
  }, [layerVisibility.homes, isLoading])

  // Highlight homes by IDs
  const highlightHomes = useCallback((homeIds: string[]) => {
    layerManagerRef.current?.highlightHomes(homeIds)
  }, [])

  // Clear all highlights
  const clearHighlights = useCallback(() => {
    layerManagerRef.current?.clearHighlights()
  }, [])

  // Clear selected home
  const clearSelectedHome = useCallback(() => {
    setSelectedHome(null)
  }, [])

  return {
    isLoading,
    error,
    homeCount,
    highlightHomes,
    clearHighlights,
    selectedHome,
    clearSelectedHome,
  }
}
