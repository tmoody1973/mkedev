'use client'

// =============================================================================
// Development Sites Layer Loader Component
// Initializes and manages the Development Sites layer on the map
// =============================================================================

import { useEffect, useRef } from 'react'
import { useDevelopmentSitesLayer } from './useDevelopmentSitesLayer'
import type { DevelopmentSite } from './development-sites-layer-manager'

// =============================================================================
// Types
// =============================================================================

export interface DevelopmentSitesLayerLoaderProps {
  /** Callback when a site marker is clicked */
  onSiteClick?: (site: DevelopmentSite) => void
  /** Callback when site selection is cleared */
  onSiteClear?: () => void
  /** Whether a style change is in progress (for layer re-initialization) */
  isStyleChanging?: boolean
}

// =============================================================================
// Component
// =============================================================================

/**
 * Component that loads and manages the Development Sites layer on the map
 * Should be rendered as a child of MapContainer within MapProvider
 */
export function DevelopmentSitesLayerLoader({
  onSiteClick,
  onSiteClear,
  isStyleChanging = false,
}: DevelopmentSitesLayerLoaderProps) {
  const { selectedSite, siteCount, reinitializeLayers } = useDevelopmentSitesLayer()

  const prevSelectedRef = useRef(selectedSite)
  const prevStyleChangingRef = useRef(isStyleChanging)

  // Re-initialize layers after style change completes
  useEffect(() => {
    // Detect when style change completes (was true, now false)
    if (prevStyleChangingRef.current && !isStyleChanging) {
      reinitializeLayers?.()
    }
    prevStyleChangingRef.current = isStyleChanging
  }, [isStyleChanging, reinitializeLayers])

  // Notify parent when site is selected/cleared
  useEffect(() => {
    if (selectedSite && selectedSite !== prevSelectedRef.current) {
      onSiteClick?.(selectedSite)
    } else if (!selectedSite && prevSelectedRef.current) {
      onSiteClear?.()
    }
    prevSelectedRef.current = selectedSite
  }, [selectedSite, onSiteClick, onSiteClear])

  // This is a non-visual component that manages the layer
  // It logs the site count for debugging
  useEffect(() => {
    if (siteCount > 0) {
      console.log(`[DevelopmentSitesLayerLoader] Loaded: ${siteCount} development sites`)
    }
  }, [siteCount])

  return null
}
