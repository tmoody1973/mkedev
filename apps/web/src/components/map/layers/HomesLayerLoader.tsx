'use client'

// =============================================================================
// Homes Layer Loader Component
// Initializes and manages the Homes For Sale layer on the map
// =============================================================================

import { useEffect, useRef } from 'react'
import { useHomesLayer } from './useHomesLayer'
import type { HomeForSale } from './homes-layer-manager'

// =============================================================================
// Types
// =============================================================================

export interface HomesLayerLoaderProps {
  /** Callback when a home marker is clicked */
  onHomeClick?: (home: HomeForSale) => void
  /** Callback when home selection is cleared */
  onHomeClear?: () => void
}

// =============================================================================
// Component
// =============================================================================

/**
 * Component that loads and manages the Homes For Sale layer on the map
 * Should be rendered as a child of MapContainer within MapProvider
 */
export function HomesLayerLoader({
  onHomeClick,
  onHomeClear,
}: HomesLayerLoaderProps) {
  const { selectedHome, homeCount } = useHomesLayer()

  const prevSelectedRef = useRef(selectedHome)

  // Notify parent when home is selected/cleared
  useEffect(() => {
    if (selectedHome && selectedHome !== prevSelectedRef.current) {
      onHomeClick?.(selectedHome)
    } else if (!selectedHome && prevSelectedRef.current) {
      onHomeClear?.()
    }
    prevSelectedRef.current = selectedHome
  }, [selectedHome, onHomeClick, onHomeClear])

  // This is a non-visual component that manages the layer
  // It logs the home count for debugging
  useEffect(() => {
    if (homeCount > 0) {
      console.log(`Homes layer loaded: ${homeCount} homes for sale`)
    }
  }, [homeCount])

  return null
}
