'use client'

// =============================================================================
// Vacant Lots Layer Loader Component
// Initializes and manages the Vacant Lots layer on the map
// =============================================================================

import { useEffect, useRef } from 'react'
import { useVacantLotsLayer } from './useVacantLotsLayer'
import type { VacantLot } from './vacant-lots-layer-manager'

// =============================================================================
// Types
// =============================================================================

export interface VacantLotsLayerLoaderProps {
  /** Callback when a vacant lot marker is clicked */
  onLotClick?: (lot: VacantLot) => void
  /** Callback when vacant lot selection is cleared */
  onLotClear?: () => void
  /** Whether a style change is in progress (for layer re-initialization) */
  isStyleChanging?: boolean
}

// =============================================================================
// Component
// =============================================================================

/**
 * Component that loads and manages the Vacant Lots layer on the map
 * Should be rendered as a child of MapContainer within MapProvider
 */
export function VacantLotsLayerLoader({
  onLotClick,
  onLotClear,
  isStyleChanging = false,
}: VacantLotsLayerLoaderProps) {
  const { selectedLot, lotCount, reinitializeLayers } = useVacantLotsLayer()

  const prevSelectedRef = useRef(selectedLot)
  const prevStyleChangingRef = useRef(isStyleChanging)

  // Re-initialize layers after style change completes
  useEffect(() => {
    // Detect when style change completes (was true, now false)
    if (prevStyleChangingRef.current && !isStyleChanging) {
      reinitializeLayers?.()
    }
    prevStyleChangingRef.current = isStyleChanging
  }, [isStyleChanging, reinitializeLayers])

  // Notify parent when lot is selected/cleared
  useEffect(() => {
    if (selectedLot && selectedLot !== prevSelectedRef.current) {
      onLotClick?.(selectedLot)
    } else if (!selectedLot && prevSelectedRef.current) {
      onLotClear?.()
    }
    prevSelectedRef.current = selectedLot
  }, [selectedLot, onLotClick, onLotClear])

  // This is a non-visual component that manages the layer
  // It logs the lot count for debugging
  useEffect(() => {
    if (lotCount > 0) {
      console.log(`[VacantLotsLayerLoader] Loaded: ${lotCount} vacant lots`)
    }
  }, [lotCount])

  return null
}
