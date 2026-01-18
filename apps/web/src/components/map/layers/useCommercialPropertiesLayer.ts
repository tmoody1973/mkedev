'use client'

// =============================================================================
// useCommercialPropertiesLayer Hook
// React hook for managing the Commercial Properties layer with Convex data
// =============================================================================

import { useEffect, useRef, useCallback, useState } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useMap } from '@/contexts/MapContext'
import {
  CommercialLayerManager,
  type CommercialPropertyClickEvent,
  type CommercialProperty,
} from './commercial-layer-manager'

// =============================================================================
// Types
// =============================================================================

export interface UseCommercialPropertiesLayerResult {
  /** Whether the commercial properties layer is loading */
  isLoading: boolean
  /** Error message if layer loading failed */
  error: string | null
  /** Number of properties currently displayed */
  propertyCount: number
  /** Highlight specific properties on the map */
  highlightProperties: (propertyIds: string[]) => void
  /** Clear all property highlights */
  clearHighlights: () => void
  /** Currently clicked property (if any) */
  selectedProperty: CommercialProperty | null
  /** Clear the selected property */
  clearSelectedProperty: () => void
  /** Re-initialize the layer (after style change) */
  reinitializeLayers: () => void
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for managing the Commercial Properties layer on the map
 * Fetches data from Convex and displays as circle markers
 */
export function useCommercialPropertiesLayer(): UseCommercialPropertiesLayerResult {
  const { map, isMapLoaded, layerVisibility } = useMap()

  const layerManagerRef = useRef<CommercialLayerManager | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProperty, setSelectedProperty] = useState<CommercialProperty | null>(null)
  const [propertyCount, setPropertyCount] = useState(0)
  const [reinitializeCounter, setReinitializeCounter] = useState(0)

  // Fetch commercial properties data from Convex
  const propertiesData = useQuery(api.commercialProperties.getForMap)

  // Handle property click
  const handlePropertyClick = useCallback((event: CommercialPropertyClickEvent) => {
    setSelectedProperty(event.properties)
  }, [])

  // Store callback and data in refs to avoid effect re-runs
  const handlePropertyClickRef = useRef(handlePropertyClick)
  const propertiesDataRef = useRef(propertiesData)
  handlePropertyClickRef.current = handlePropertyClick
  propertiesDataRef.current = propertiesData

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

      const manager = new CommercialLayerManager({
        map: map as MapboxMap,
        onPropertyClick: (event) => handlePropertyClickRef.current(event),
      })

      manager.addLayer()
      layerManagerRef.current = manager
      isInitializedRef.current = true

      // If we have data, update the layer immediately
      if (propertiesDataRef.current && propertiesDataRef.current.length > 0) {
        const properties: CommercialProperty[] = propertiesDataRef.current.map(
          (p) => ({
            _id: String(p.id),
            address: p.address,
            coordinates: p.coordinates as [number, number],
            propertyType: p.propertyType,
            buildingSqFt: p.buildingSqFt,
            askingPrice: p.askingPrice,
            status: 'available' as const, // getForMap only returns available
          })
        )
        manager.updateData(properties)
        setPropertyCount(properties.length)
      }

      setIsLoading(false)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load commercial properties layer'
      console.error('Commercial properties layer initialization error:', err)
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
    if (!layerManagerRef.current || !propertiesData) return

    // Transform Convex data to CommercialProperty format
    const properties: CommercialProperty[] = propertiesData.map(
      (p) => ({
        _id: String(p.id),
        address: p.address,
        coordinates: p.coordinates as [number, number],
        propertyType: p.propertyType,
        buildingSqFt: p.buildingSqFt,
        askingPrice: p.askingPrice,
        status: 'available' as const, // getForMap only returns available
      })
    )

    layerManagerRef.current.updateData(properties)
    setPropertyCount(properties.length)
  }, [propertiesData])

  // Sync layer visibility with MapContext
  useEffect(() => {
    if (!layerManagerRef.current || isLoading) return

    const visible = layerVisibility.commercialProperties ?? false
    layerManagerRef.current.setLayerVisibility(visible)
  }, [layerVisibility.commercialProperties, isLoading])

  // Highlight properties by IDs
  const highlightProperties = useCallback((propertyIds: string[]) => {
    layerManagerRef.current?.highlightProperties(propertyIds)
  }, [])

  // Clear all highlights
  const clearHighlights = useCallback(() => {
    layerManagerRef.current?.clearHighlights()
  }, [])

  // Clear selected property
  const clearSelectedProperty = useCallback(() => {
    setSelectedProperty(null)
  }, [])

  // Re-initialize layers (called after style change)
  const reinitializeLayers = useCallback(() => {
    setReinitializeCounter((prev) => prev + 1)
  }, [])

  return {
    isLoading,
    error,
    propertyCount,
    highlightProperties,
    clearHighlights,
    selectedProperty,
    clearSelectedProperty,
    reinitializeLayers,
  }
}
