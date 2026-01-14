import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  MapProvider,
  useMap,
  MILWAUKEE_CENTER,
  DEFAULT_ZOOM,
} from '@/contexts/MapContext'
import type { ReactNode } from 'react'

// Helper wrapper component
function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MapProvider>{children}</MapProvider>
  }
}

describe('MapContext', () => {
  it('provides default Milwaukee center coordinates', () => {
    expect(MILWAUKEE_CENTER).toEqual([-87.9065, 43.0389])
  })

  it('provides default zoom level of 12', () => {
    expect(DEFAULT_ZOOM).toBe(12)
  })

  it('provides required context values when used within MapProvider', () => {
    const { result } = renderHook(() => useMap(), {
      wrapper: createWrapper(),
    })

    // Check that all required values are present
    expect(result.current).toHaveProperty('map')
    expect(result.current).toHaveProperty('setMap')
    expect(result.current).toHaveProperty('selectedParcelId')
    expect(result.current).toHaveProperty('setSelectedParcelId')
    expect(result.current).toHaveProperty('layerVisibility')
    expect(result.current).toHaveProperty('toggleLayerVisibility')
    expect(result.current).toHaveProperty('setLayerVisibility')
    expect(result.current).toHaveProperty('flyTo')
    expect(result.current).toHaveProperty('resetView')
    expect(result.current).toHaveProperty('isMapLoaded')
    expect(result.current).toHaveProperty('mapError')
  })

  it('throws error when useMap is used outside of MapProvider', () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useMap())
    }).toThrow('useMap must be used within a MapProvider')

    consoleSpy.mockRestore()
  })

  it('allows setting and getting selected parcel ID', () => {
    const { result } = renderHook(() => useMap(), {
      wrapper: createWrapper(),
    })

    expect(result.current.selectedParcelId).toBeNull()

    act(() => {
      result.current.setSelectedParcelId('parcel-123')
    })

    expect(result.current.selectedParcelId).toBe('parcel-123')
  })

  it('manages layer visibility state', () => {
    const { result } = renderHook(() => useMap(), {
      wrapper: createWrapper(),
    })

    // Default state has zoning and parcels visible
    expect(result.current.layerVisibility.zoning).toBe(true)
    expect(result.current.layerVisibility.parcels).toBe(true)
    expect(result.current.layerVisibility.tif).toBe(false)

    // Toggle TIF layer visibility
    act(() => {
      result.current.toggleLayerVisibility('tif')
    })

    expect(result.current.layerVisibility.tif).toBe(true)

    // Set visibility explicitly
    act(() => {
      result.current.setLayerVisibility('zoning', false)
    })

    expect(result.current.layerVisibility.zoning).toBe(false)
  })
})
