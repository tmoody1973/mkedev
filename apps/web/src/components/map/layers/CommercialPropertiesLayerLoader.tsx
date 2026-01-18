'use client'

// =============================================================================
// Commercial Properties Layer Loader Component
// Initializes and manages the Commercial Properties layer on the map
// =============================================================================

import { useEffect, useRef } from 'react'
import { useCommercialPropertiesLayer } from './useCommercialPropertiesLayer'
import type { CommercialProperty } from './commercial-layer-manager'

// =============================================================================
// Types
// =============================================================================

export interface CommercialPropertiesLayerLoaderProps {
  /** Callback when a property marker is clicked */
  onPropertyClick?: (property: CommercialProperty) => void
  /** Callback when property selection is cleared */
  onPropertyClear?: () => void
  /** Whether a style change is in progress (for layer re-initialization) */
  isStyleChanging?: boolean
}

// =============================================================================
// Component
// =============================================================================

/**
 * Component that loads and manages the Commercial Properties layer on the map
 * Should be rendered as a child of MapContainer within MapProvider
 */
export function CommercialPropertiesLayerLoader({
  onPropertyClick,
  onPropertyClear,
  isStyleChanging = false,
}: CommercialPropertiesLayerLoaderProps) {
  const { selectedProperty, propertyCount, reinitializeLayers } = useCommercialPropertiesLayer()

  const prevSelectedRef = useRef(selectedProperty)
  const prevStyleChangingRef = useRef(isStyleChanging)

  // Re-initialize layers after style change completes
  useEffect(() => {
    // Detect when style change completes (was true, now false)
    if (prevStyleChangingRef.current && !isStyleChanging) {
      reinitializeLayers?.()
    }
    prevStyleChangingRef.current = isStyleChanging
  }, [isStyleChanging, reinitializeLayers])

  // Notify parent when property is selected/cleared
  useEffect(() => {
    if (selectedProperty && selectedProperty !== prevSelectedRef.current) {
      onPropertyClick?.(selectedProperty)
    } else if (!selectedProperty && prevSelectedRef.current) {
      onPropertyClear?.()
    }
    prevSelectedRef.current = selectedProperty
  }, [selectedProperty, onPropertyClick, onPropertyClear])

  // This is a non-visual component that manages the layer
  // It logs the property count for debugging
  useEffect(() => {
    if (propertyCount > 0) {
      console.log(`[CommercialPropertiesLayerLoader] Loaded: ${propertyCount} commercial properties`)
    }
  }, [propertyCount])

  return null
}
