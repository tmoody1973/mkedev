import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MapProvider, useMap } from '@/contexts/MapContext'
import { Header } from '@/components/shell/Header'
import {
  ZONE_BASE_HEIGHTS,
  ZONING_CATEGORY_COLORS,
  ZONE_3D_OPACITY,
  getZoningCategory,
  getZoningHeight,
} from '@/components/map/layers/layer-config'
import type { ReactNode } from 'react'

// =============================================================================
// Test: 3D Map Integration Tests
// Task Group 6 - Complete Integration Testing
// =============================================================================

// Helper wrapper for MapContext
function createMapWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MapProvider>{children}</MapProvider>
  }
}

// Mock UserMenu
vi.mock('@/components/user-menu', () => ({
  UserMenu: () => <div data-testid="user-menu">User Menu</div>,
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

describe('3D Map Integration', () => {
  beforeEach(() => {
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

  // ---------------------------------------------------------------------------
  // Integration Test 1: Full 3D toggle flow
  // ---------------------------------------------------------------------------
  it('complete 3D toggle flow: state -> button -> persist', () => {
    const { result } = renderHook(() => useMap(), {
      wrapper: createMapWrapper(),
    })

    // Initial state
    expect(result.current.is3DMode).toBe(false)

    // Toggle to 3D
    act(() => {
      result.current.toggle3DMode()
    })
    expect(result.current.is3DMode).toBe(true)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('mkedev-3d-mode', 'true')

    // Toggle back to 2D
    act(() => {
      result.current.toggle3DMode()
    })
    expect(result.current.is3DMode).toBe(false)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('mkedev-3d-mode', 'false')
  })

  // ---------------------------------------------------------------------------
  // Integration Test 2: Header button reflects state
  // ---------------------------------------------------------------------------
  it('Header 3D button reflects is3DMode state', () => {
    const toggle3DMode = vi.fn()
    const { rerender } = render(
      <Header is3DMode={false} on3DToggle={toggle3DMode} />
    )

    const button = screen.getByLabelText('Toggle 3D view')
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(button.className).toContain('bg-white')

    rerender(<Header is3DMode={true} on3DToggle={toggle3DMode} />)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(button.className).toContain('bg-sky-500')
  })

  // ---------------------------------------------------------------------------
  // Integration Test 3: Zone heights match expected categories
  // ---------------------------------------------------------------------------
  it('all Milwaukee zone codes map to correct heights', () => {
    // Test representative zone codes from each category
    const testCases: Array<{ code: string; expectedCategory: string; expectedHeight: number }> = [
      { code: 'RS1', expectedCategory: 'residential', expectedHeight: 10 },
      { code: 'RS6', expectedCategory: 'residential', expectedHeight: 10 },
      { code: 'RT4', expectedCategory: 'residential', expectedHeight: 10 },
      { code: 'RM3', expectedCategory: 'residential', expectedHeight: 10 },
      { code: 'LB2', expectedCategory: 'commercial', expectedHeight: 20 },
      { code: 'CS', expectedCategory: 'commercial', expectedHeight: 20 },
      { code: 'IM', expectedCategory: 'industrial', expectedHeight: 30 },
      { code: 'IH', expectedCategory: 'industrial', expectedHeight: 30 },
      { code: 'MX2', expectedCategory: 'mixed-use', expectedHeight: 25 },
      { code: 'DX1', expectedCategory: 'mixed-use', expectedHeight: 25 },
      { code: 'PK', expectedCategory: 'special', expectedHeight: 15 },
      { code: 'PD', expectedCategory: 'special', expectedHeight: 15 },
    ]

    testCases.forEach(({ code, expectedCategory, expectedHeight }) => {
      expect(getZoningCategory(code)).toBe(expectedCategory)
      expect(getZoningHeight(code)).toBe(expectedHeight)
    })
  })

  // ---------------------------------------------------------------------------
  // Integration Test 4: Zone colors remain consistent between 2D and 3D
  // ---------------------------------------------------------------------------
  it('zone category colors are consistent for 2D and 3D', () => {
    // Colors should be the same - only opacity/height differ in 3D
    const categories = ['residential', 'commercial', 'industrial', 'mixed-use', 'special'] as const

    categories.forEach((category) => {
      expect(ZONING_CATEGORY_COLORS[category]).toBeDefined()
      expect(ZONE_BASE_HEIGHTS[category]).toBeDefined()
      // Verify colors are valid hex
      expect(ZONING_CATEGORY_COLORS[category]).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
  })

  // ---------------------------------------------------------------------------
  // Integration Test 5: 3D opacity is semi-transparent
  // ---------------------------------------------------------------------------
  it('3D layer opacity is semi-transparent (0.6)', () => {
    expect(ZONE_3D_OPACITY).toBe(0.6)
    // Should allow seeing through to Mapbox Standard 3D buildings
    expect(ZONE_3D_OPACITY).toBeLessThan(1)
    expect(ZONE_3D_OPACITY).toBeGreaterThan(0)
  })

  // ---------------------------------------------------------------------------
  // Integration Test 6: animateTo3DView and animateTo2DView are available
  // ---------------------------------------------------------------------------
  it('MapContext provides animation functions', () => {
    const { result } = renderHook(() => useMap(), {
      wrapper: createMapWrapper(),
    })

    expect(result.current.animateTo3DView).toBeDefined()
    expect(typeof result.current.animateTo3DView).toBe('function')
    expect(result.current.animateTo2DView).toBeDefined()
    expect(typeof result.current.animateTo2DView).toBe('function')

    // Functions should not throw when called (even without map)
    expect(() => result.current.animateTo3DView()).not.toThrow()
    expect(() => result.current.animateTo2DView()).not.toThrow()
  })
})
