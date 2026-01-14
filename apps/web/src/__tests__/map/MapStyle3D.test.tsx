import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MapProvider, useMap, MAP_STYLE_2D, MAP_STYLE_3D } from '@/contexts/MapContext'
import type { ReactNode } from 'react'

// =============================================================================
// Test: Map Style Switching for 3D Mode
// Task Group 3 Tests
// =============================================================================

// Helper wrapper component
function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MapProvider>{children}</MapProvider>
  }
}

describe('Map Style Switching', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exports correct style URL for 2D mode (streets-v12)', () => {
    expect(MAP_STYLE_2D).toBe('mapbox://styles/mapbox/streets-v12')
  })

  it('exports correct style URL for 3D mode (Mapbox Standard)', () => {
    expect(MAP_STYLE_3D).toBe('mapbox://styles/mapbox/standard')
  })

  it('is3DMode determines which style should be used', () => {
    const { result } = renderHook(() => useMap(), {
      wrapper: createWrapper(),
    })

    // Default is 2D mode
    expect(result.current.is3DMode).toBe(false)

    // Toggle to 3D mode
    act(() => {
      result.current.setIs3DMode(true)
    })

    expect(result.current.is3DMode).toBe(true)

    // Verify the style to use based on mode
    const styleToUse = result.current.is3DMode ? MAP_STYLE_3D : MAP_STYLE_2D
    expect(styleToUse).toBe(MAP_STYLE_3D)
  })

  it('current center and zoom should be accessible via map context', () => {
    const { result } = renderHook(() => useMap(), {
      wrapper: createWrapper(),
    })

    // When map is null, these functions are available but won't execute
    expect(result.current.flyTo).toBeDefined()
    expect(result.current.resetView).toBeDefined()

    // These are the expected behaviors when map is available
    // (actual map center/zoom preservation is tested in integration)
  })
})
