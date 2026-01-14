import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MapProvider, useMap } from '@/contexts/MapContext'
import type { ReactNode } from 'react'

// =============================================================================
// Test: MapContext 3D Mode State Management
// Task Group 1 Tests
// =============================================================================

// Helper wrapper component
function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MapProvider>{children}</MapProvider>
  }
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

describe('MapContext 3D Mode State Management', () => {
  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  it('has is3DMode default value of false', () => {
    const { result } = renderHook(() => useMap(), {
      wrapper: createWrapper(),
    })

    expect(result.current.is3DMode).toBe(false)
  })

  it('toggle3DMode flips state correctly', () => {
    const { result } = renderHook(() => useMap(), {
      wrapper: createWrapper(),
    })

    expect(result.current.is3DMode).toBe(false)

    act(() => {
      result.current.toggle3DMode()
    })

    expect(result.current.is3DMode).toBe(true)

    act(() => {
      result.current.toggle3DMode()
    })

    expect(result.current.is3DMode).toBe(false)
  })

  it('setIs3DMode sets explicit value', () => {
    const { result } = renderHook(() => useMap(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.setIs3DMode(true)
    })

    expect(result.current.is3DMode).toBe(true)

    act(() => {
      result.current.setIs3DMode(false)
    })

    expect(result.current.is3DMode).toBe(false)

    // Setting same value should work
    act(() => {
      result.current.setIs3DMode(true)
    })

    expect(result.current.is3DMode).toBe(true)
  })

  it('persists 3D mode state to localStorage', () => {
    const { result } = renderHook(() => useMap(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.setIs3DMode(true)
    })

    expect(localStorageMock.setItem).toHaveBeenCalledWith('mkedev-3d-mode', 'true')
  })
})
