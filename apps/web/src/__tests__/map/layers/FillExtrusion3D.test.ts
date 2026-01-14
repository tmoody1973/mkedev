import { describe, it, expect } from 'vitest'
import {
  ZONE_BASE_HEIGHTS,
  type ZoningCategory,
} from '@/components/map/layers/layer-config'

// =============================================================================
// Test: Fill-Extrusion Layer for 3D Zoning
// Task Group 4 Tests
// =============================================================================

describe('Fill-Extrusion Layer Configuration', () => {
  it('exports ZONE_BASE_HEIGHTS with correct values for each category', () => {
    expect(ZONE_BASE_HEIGHTS).toBeDefined()
    expect(ZONE_BASE_HEIGHTS.residential).toBe(10)
    expect(ZONE_BASE_HEIGHTS.commercial).toBe(20)
    expect(ZONE_BASE_HEIGHTS.industrial).toBe(30)
    expect(ZONE_BASE_HEIGHTS['mixed-use']).toBe(25)
    expect(ZONE_BASE_HEIGHTS.special).toBe(15)
  })

  it('ZONE_BASE_HEIGHTS covers all zoning categories', () => {
    const categories: ZoningCategory[] = [
      'residential',
      'commercial',
      'industrial',
      'mixed-use',
      'special',
    ]

    categories.forEach((category) => {
      expect(ZONE_BASE_HEIGHTS[category]).toBeDefined()
      expect(typeof ZONE_BASE_HEIGHTS[category]).toBe('number')
      expect(ZONE_BASE_HEIGHTS[category]).toBeGreaterThan(0)
    })
  })

  it('residential has shortest height (10m)', () => {
    const heights = Object.values(ZONE_BASE_HEIGHTS)
    expect(ZONE_BASE_HEIGHTS.residential).toBe(Math.min(...heights))
  })

  it('industrial has tallest height (30m)', () => {
    const heights = Object.values(ZONE_BASE_HEIGHTS)
    expect(ZONE_BASE_HEIGHTS.industrial).toBe(Math.max(...heights))
  })
})
