'use client'

// =============================================================================
// useDevelopmentSitesLayer Hook
// React hook for managing the Development Sites layer with Convex data
// =============================================================================

import { useEffect, useRef, useCallback, useState } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useMap } from '@/contexts/MapContext'
import {
  DevelopmentSitesLayerManager,
  type DevelopmentSiteClickEvent,
  type DevelopmentSite,
} from './development-sites-layer-manager'

// =============================================================================
// Types
// =============================================================================

export interface UseDevelopmentSitesLayerResult {
  /** Whether the development sites layer is loading */
  isLoading: boolean
  /** Error message if layer loading failed */
  error: string | null
  /** Number of sites currently displayed */
  siteCount: number
  /** Highlight specific sites on the map */
  highlightSites: (siteIds: string[]) => void
  /** Clear all site highlights */
  clearHighlights: () => void
  /** Currently clicked site (if any) */
  selectedSite: DevelopmentSite | null
  /** Clear the selected site */
  clearSelectedSite: () => void
  /** Re-initialize the layer (after style change) */
  reinitializeLayers: () => void
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for managing the Development Sites layer on the map
 * Fetches data from Convex and displays as circle markers
 */
export function useDevelopmentSitesLayer(): UseDevelopmentSitesLayerResult {
  const { map, isMapLoaded, layerVisibility } = useMap()

  const layerManagerRef = useRef<DevelopmentSitesLayerManager | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSite, setSelectedSite] = useState<DevelopmentSite | null>(null)
  const [siteCount, setSiteCount] = useState(0)
  const [reinitializeCounter, setReinitializeCounter] = useState(0)

  // Fetch development sites data from Convex
  const sitesData = useQuery(api.developmentSites.getForMap)

  // Handle site click
  const handleSiteClick = useCallback((event: DevelopmentSiteClickEvent) => {
    setSelectedSite(event.properties)
  }, [])

  // Store callback and data in refs to avoid effect re-runs
  const handleSiteClickRef = useRef(handleSiteClick)
  const sitesDataRef = useRef(sitesData)
  handleSiteClickRef.current = handleSiteClick
  sitesDataRef.current = sitesData

  // Track initialization
  const isInitializedRef = useRef(false)

  // Initialize layer when map is loaded
  useEffect(() => {
    if (!map || !isMapLoaded) return

    // Prevent double initialization in React StrictMode
    // But allow re-initialization when reinitializeCounter changes
    if (isInitializedRef.current && layerManagerRef.current && reinitializeCounter === 0) {
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

      const manager = new DevelopmentSitesLayerManager({
        map: map as MapboxMap,
        onSiteClick: (event) => handleSiteClickRef.current(event),
      })

      manager.addLayer()
      layerManagerRef.current = manager
      isInitializedRef.current = true

      // If we have data, update the layer immediately
      if (sitesDataRef.current && sitesDataRef.current.length > 0) {
        const sites: DevelopmentSite[] = sitesDataRef.current.map(
          (s) => ({
            _id: String(s.id),
            address: s.address,
            coordinates: s.coordinates as [number, number],
            siteName: s.siteName,
            lotSizeSqFt: s.lotSizeSqFt,
            askingPrice: s.askingPrice,
            incentives: s.incentives,
            status: 'available' as const, // getForMap only returns available
          })
        )
        manager.updateData(sites)
        setSiteCount(sites.length)
      }

      setIsLoading(false)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load development sites layer'
      console.error('Development sites layer initialization error:', err)
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
    if (!layerManagerRef.current || !sitesData) return

    // Transform Convex data to DevelopmentSite format
    const sites: DevelopmentSite[] = sitesData.map(
      (s) => ({
        _id: String(s.id),
        address: s.address,
        coordinates: s.coordinates as [number, number],
        siteName: s.siteName,
        lotSizeSqFt: s.lotSizeSqFt,
        askingPrice: s.askingPrice,
        incentives: s.incentives,
        status: 'available' as const, // getForMap only returns available
      })
    )

    layerManagerRef.current.updateData(sites)
    setSiteCount(sites.length)
  }, [sitesData])

  // Sync layer visibility with MapContext
  useEffect(() => {
    if (!layerManagerRef.current || isLoading) return

    const visible = layerVisibility.developmentSites ?? false
    layerManagerRef.current.setLayerVisibility(visible)
  }, [layerVisibility.developmentSites, isLoading])

  // Highlight sites by IDs
  const highlightSites = useCallback((siteIds: string[]) => {
    layerManagerRef.current?.highlightSites(siteIds)
  }, [])

  // Clear all highlights
  const clearHighlights = useCallback(() => {
    layerManagerRef.current?.clearHighlights()
  }, [])

  // Clear selected site
  const clearSelectedSite = useCallback(() => {
    setSelectedSite(null)
  }, [])

  // Re-initialize layers (called after style change)
  const reinitializeLayers = useCallback(() => {
    setReinitializeCounter((prev) => prev + 1)
  }, [])

  return {
    isLoading,
    error,
    siteCount,
    highlightSites,
    clearHighlights,
    selectedSite,
    clearSelectedSite,
    reinitializeLayers,
  }
}
