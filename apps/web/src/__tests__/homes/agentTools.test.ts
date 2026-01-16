/**
 * Tests for Homes MKE Integration - Agent Tools Layer
 *
 * Tests cover:
 * - search_homes_for_sale tool returns matching homes
 * - search_homes_for_sale handles empty results gracefully
 * - get_home_details returns full property information
 * - get_home_details handles invalid homeId
 * - Tools return Convex document IDs for map highlighting
 */

import { describe, it, expect } from 'vitest'

// =============================================================================
// Mock Data - Simulates homes returned from Convex queries
// =============================================================================

interface MockHome {
  _id: string
  esriObjectId: string
  taxKey: string
  address: string
  neighborhood: string
  coordinates: [number, number]
  bedrooms: number
  fullBaths: number
  halfBaths: number
  buildingSqFt: number
  yearBuilt: number
  status: 'for_sale' | 'sold' | 'unknown'
  narrative?: string
  listingUrl?: string
  developerName?: string
}

const mockHomes: MockHome[] = [
  {
    _id: 'home_001',
    esriObjectId: '12345',
    taxKey: '3210001',
    address: '123 Bay St',
    neighborhood: 'Bay View',
    coordinates: [-87.9, 43.0],
    bedrooms: 3,
    fullBaths: 2,
    halfBaths: 1,
    buildingSqFt: 1500,
    yearBuilt: 1925,
    status: 'for_sale',
    narrative: 'Beautiful renovated home in Bay View',
    listingUrl: 'https://example.com/listing/123',
    developerName: 'MKE Homes',
  },
  {
    _id: 'home_002',
    esriObjectId: '12346',
    taxKey: '3210002',
    address: '456 Third St',
    neighborhood: 'Third Ward',
    coordinates: [-87.91, 43.02],
    bedrooms: 2,
    fullBaths: 1,
    halfBaths: 0,
    buildingSqFt: 1200,
    yearBuilt: 2015,
    status: 'for_sale',
    narrative: 'Modern condo in the heart of Third Ward',
    listingUrl: 'https://example.com/listing/456',
  },
  {
    _id: 'home_003',
    esriObjectId: '12347',
    taxKey: '3210003',
    address: '789 Bay Ave',
    neighborhood: 'Bay View',
    coordinates: [-87.89, 43.01],
    bedrooms: 4,
    fullBaths: 3,
    halfBaths: 1,
    buildingSqFt: 2200,
    yearBuilt: 1960,
    status: 'for_sale',
  },
  {
    _id: 'home_004',
    esriObjectId: '12348',
    taxKey: '3210004',
    address: '101 Walker St',
    neighborhood: 'Walkers Point',
    coordinates: [-87.92, 43.01],
    bedrooms: 1,
    fullBaths: 1,
    halfBaths: 0,
    buildingSqFt: 800,
    yearBuilt: 2020,
    status: 'sold',
  },
]

// =============================================================================
// Tool Implementation Mocks (Match tools.ts patterns)
// =============================================================================

/**
 * Simulates the searchHomesForSale tool implementation.
 * In production, this calls ctx.runQuery(api.homes.searchHomes, ...)
 */
function searchHomesForSale(params: {
  neighborhood?: string
  minBedrooms?: number
  maxBedrooms?: number
  minBaths?: number
  limit?: number
}): {
  success: boolean
  homes?: Array<{
    homeId: string
    address: string
    neighborhood: string
    bedrooms: number
    fullBaths: number
    halfBaths: number
    buildingSqFt: number
  }>
  count?: number
  error?: string
} {
  const limit = params.limit ?? 10

  // Filter homes for sale only
  let filtered = mockHomes.filter((h) => h.status === 'for_sale')

  // Apply filters
  if (params.neighborhood) {
    const neighborhoodLower = params.neighborhood.toLowerCase()
    filtered = filtered.filter((h) =>
      h.neighborhood.toLowerCase().includes(neighborhoodLower)
    )
  }

  if (params.minBedrooms !== undefined) {
    filtered = filtered.filter((h) => h.bedrooms >= params.minBedrooms!)
  }

  if (params.maxBedrooms !== undefined) {
    filtered = filtered.filter((h) => h.bedrooms <= params.maxBedrooms!)
  }

  if (params.minBaths !== undefined) {
    filtered = filtered.filter((h) => {
      const totalBaths = h.fullBaths + h.halfBaths * 0.5
      return totalBaths >= params.minBaths!
    })
  }

  // Apply limit
  const limited = filtered.slice(0, limit)

  return {
    success: true,
    homes: limited.map((h) => ({
      homeId: h._id,
      address: h.address,
      neighborhood: h.neighborhood,
      bedrooms: h.bedrooms,
      fullBaths: h.fullBaths,
      halfBaths: h.halfBaths,
      buildingSqFt: h.buildingSqFt,
    })),
    count: limited.length,
  }
}

/**
 * Simulates the getHomeDetails tool implementation.
 * In production, this calls ctx.runQuery(api.homes.getById, ...)
 */
function getHomeDetails(params: { homeId: string }): {
  success: boolean
  home?: {
    homeId: string
    address: string
    neighborhood: string
    coordinates: [number, number]
    bedrooms: number
    fullBaths: number
    halfBaths: number
    buildingSqFt: number
    yearBuilt: number
    status: string
    narrative?: string
    listingUrl?: string
    developerName?: string
  }
  error?: string
} {
  const home = mockHomes.find((h) => h._id === params.homeId)

  if (!home) {
    return {
      success: false,
      error: `Home not found with ID: ${params.homeId}`,
    }
  }

  return {
    success: true,
    home: {
      homeId: home._id,
      address: home.address,
      neighborhood: home.neighborhood,
      coordinates: home.coordinates,
      bedrooms: home.bedrooms,
      fullBaths: home.fullBaths,
      halfBaths: home.halfBaths,
      buildingSqFt: home.buildingSqFt,
      yearBuilt: home.yearBuilt,
      status: home.status,
      narrative: home.narrative,
      listingUrl: home.listingUrl,
      developerName: home.developerName,
    },
  }
}

// =============================================================================
// Tests: search_homes_for_sale Tool
// =============================================================================

describe('search_homes_for_sale Tool', () => {
  it('returns homes matching neighborhood filter', () => {
    const result = searchHomesForSale({ neighborhood: 'Bay View' })

    expect(result.success).toBe(true)
    expect(result.homes).toBeDefined()
    expect(result.homes!.length).toBeGreaterThan(0)
    expect(result.homes!.every((h) => h.neighborhood === 'Bay View')).toBe(true)
  })

  it('returns homes matching bedroom range filter', () => {
    const result = searchHomesForSale({ minBedrooms: 3, maxBedrooms: 4 })

    expect(result.success).toBe(true)
    expect(result.homes).toBeDefined()
    expect(result.homes!.length).toBeGreaterThan(0)
    expect(
      result.homes!.every((h) => h.bedrooms >= 3 && h.bedrooms <= 4)
    ).toBe(true)
  })

  it('returns homes matching minimum baths filter', () => {
    const result = searchHomesForSale({ minBaths: 2 })

    expect(result.success).toBe(true)
    expect(result.homes).toBeDefined()
    expect(result.homes!.length).toBeGreaterThan(0)
    result.homes!.forEach((h) => {
      const totalBaths = h.fullBaths + h.halfBaths * 0.5
      expect(totalBaths).toBeGreaterThanOrEqual(2)
    })
  })

  it('handles empty results gracefully when no homes match filters', () => {
    const result = searchHomesForSale({
      neighborhood: 'Nonexistent Neighborhood',
    })

    expect(result.success).toBe(true)
    expect(result.homes).toBeDefined()
    expect(result.homes!.length).toBe(0)
    expect(result.count).toBe(0)
  })

  it('respects limit parameter', () => {
    const result = searchHomesForSale({ limit: 2 })

    expect(result.success).toBe(true)
    expect(result.homes).toBeDefined()
    expect(result.homes!.length).toBeLessThanOrEqual(2)
  })

  it('returns Convex document IDs for map highlighting', () => {
    const result = searchHomesForSale({})

    expect(result.success).toBe(true)
    expect(result.homes).toBeDefined()
    expect(result.homes!.length).toBeGreaterThan(0)

    // Each home should have a homeId that matches the Convex _id format
    result.homes!.forEach((h) => {
      expect(h.homeId).toBeDefined()
      expect(typeof h.homeId).toBe('string')
      expect(h.homeId.startsWith('home_')).toBe(true)
    })
  })

  it('excludes sold homes from results', () => {
    const result = searchHomesForSale({})

    expect(result.success).toBe(true)
    // home_004 is sold and should not appear
    const soldHome = result.homes!.find((h) => h.homeId === 'home_004')
    expect(soldHome).toBeUndefined()
  })
})

// =============================================================================
// Tests: get_home_details Tool
// =============================================================================

describe('get_home_details Tool', () => {
  it('returns full property information for valid homeId', () => {
    const result = getHomeDetails({ homeId: 'home_001' })

    expect(result.success).toBe(true)
    expect(result.home).toBeDefined()
    expect(result.home!.homeId).toBe('home_001')
    expect(result.home!.address).toBe('123 Bay St')
    expect(result.home!.neighborhood).toBe('Bay View')
    expect(result.home!.bedrooms).toBe(3)
    expect(result.home!.fullBaths).toBe(2)
    expect(result.home!.halfBaths).toBe(1)
    expect(result.home!.buildingSqFt).toBe(1500)
    expect(result.home!.yearBuilt).toBe(1925)
    expect(result.home!.narrative).toBe('Beautiful renovated home in Bay View')
    expect(result.home!.listingUrl).toBe('https://example.com/listing/123')
    expect(result.home!.developerName).toBe('MKE Homes')
  })

  it('returns coordinates for map flyTo', () => {
    const result = getHomeDetails({ homeId: 'home_001' })

    expect(result.success).toBe(true)
    expect(result.home!.coordinates).toBeDefined()
    expect(Array.isArray(result.home!.coordinates)).toBe(true)
    expect(result.home!.coordinates.length).toBe(2)

    // Check coordinates are valid Milwaukee area
    const [lng, lat] = result.home!.coordinates
    expect(lng).toBeGreaterThan(-89)
    expect(lng).toBeLessThan(-87)
    expect(lat).toBeGreaterThan(42)
    expect(lat).toBeLessThan(44)
  })

  it('handles invalid homeId with error response', () => {
    const result = getHomeDetails({ homeId: 'invalid_id_12345' })

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(result.error).toContain('not found')
    expect(result.home).toBeUndefined()
  })

  it('handles home without optional fields', () => {
    const result = getHomeDetails({ homeId: 'home_003' })

    expect(result.success).toBe(true)
    expect(result.home).toBeDefined()
    // home_003 has no narrative, listingUrl, or developerName
    expect(result.home!.narrative).toBeUndefined()
    expect(result.home!.listingUrl).toBeUndefined()
    expect(result.home!.developerName).toBeUndefined()
  })

  it('returns homeId for map highlighting', () => {
    const result = getHomeDetails({ homeId: 'home_002' })

    expect(result.success).toBe(true)
    expect(result.home!.homeId).toBe('home_002')
    expect(typeof result.home!.homeId).toBe('string')
  })
})
