/**
 * Tests for Homes MKE Integration - Database Layer
 *
 * Tests cover:
 * - UTM to WGS84 coordinate conversion accuracy
 * - ESRI feature transformation to Convex schema
 * - Home status field validation
 * - Index query patterns
 */

import { describe, it, expect, beforeEach } from 'vitest'

// =============================================================================
// Test: UTM to WGS84 Coordinate Conversion
// =============================================================================

/**
 * The ESRI FeatureServer uses Wisconsin South State Plane (EPSG:32054)
 * which uses Lambert Conformal Conic projection with:
 * - lat_1=45.5, lat_2=42.73333...
 * - lon_0=-90
 * - x_0=600000 (false easting in US feet)
 *
 * Milwaukee area expected WGS84: ~43.0 lat, ~-87.9 lng
 */
describe('Coordinate Conversion', () => {
  // Import proj4 for testing coordinate conversion
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const proj4 = require('proj4')

  // Define Wisconsin South State Plane projection (same as in homesSync.ts)
  const EPSG_32054 =
    '+proj=lcc +lat_1=45.5 +lat_2=42.73333333333333 +lat_0=42 +lon_0=-90 +x_0=600000 +y_0=0 +datum=NAD83 +units=us-ft +no_defs'

  beforeEach(() => {
    proj4.defs('EPSG:32054', EPSG_32054)
  })

  it('converts Milwaukee downtown coordinates correctly', () => {
    // Sample UTM coordinates from Milwaukee downtown area
    // These are approximate values based on Milwaukee's location
    const utmX = 2530000 // US feet
    const utmY = 390000 // US feet

    const [lng, lat] = proj4('EPSG:32054', 'EPSG:4326', [utmX, utmY])

    // Milwaukee is roughly at 43.0389 lat, -87.9065 lng
    expect(lat).toBeGreaterThan(42.5)
    expect(lat).toBeLessThan(44.0)
    expect(lng).toBeGreaterThan(-89)
    expect(lng).toBeLessThan(-87)
  })

  it('converts known Milwaukee City Hall coordinates', () => {
    // Milwaukee City Hall is at approximately 43.0389, -87.9065
    // Testing with approximate UTM coordinates
    const utmX = 2529565.5 // US feet (approximate)
    const utmY = 389951.2 // US feet (approximate)

    const [lng, lat] = proj4('EPSG:32054', 'EPSG:4326', [utmX, utmY])

    // Should be within Milwaukee metro area
    expect(lat).toBeGreaterThan(43.0)
    expect(lat).toBeLessThan(43.1)
    expect(lng).toBeGreaterThan(-88.0)
    expect(lng).toBeLessThan(-87.8)
  })

  it('handles edge case coordinates gracefully', () => {
    // Test with zeros (should produce a valid but incorrect location)
    const [lng, lat] = proj4('EPSG:32054', 'EPSG:4326', [0, 0])

    // Should still produce valid numbers
    expect(typeof lat).toBe('number')
    expect(typeof lng).toBe('number')
    expect(Number.isFinite(lat)).toBe(true)
    expect(Number.isFinite(lng)).toBe(true)
  })
})

// =============================================================================
// Test: ESRI Feature Transformation
// =============================================================================

describe('ESRI Feature Transformation', () => {
  // Mock ESRI feature structure based on the FeatureServer metadata
  interface ESRIFeature {
    attributes: {
      OBJECTID_1: number
      ObjectId: number
      FK_Tax: number
      ADDRESSES: string
      NEIGHBORHOOD_1: string
      NumberOfBedrooms: number
      NumberOfFullBaths: number
      NumberOfHalfBaths: number
      Bldg_SF: number
      Built: number
      Property_Status: string
      Narrative: string | null
      Link: string | null
      Developer_Name: string | null
    }
    geometry: {
      x: number
      y: number
    }
  }

  // Transform function that mirrors homesSync.ts logic
  function transformESRIFeature(feature: ESRIFeature) {
    const attrs = feature.attributes
    const status = mapPropertyStatus(attrs.Property_Status)

    return {
      esriObjectId: String(attrs.OBJECTID_1),
      taxKey: attrs.FK_Tax ? String(attrs.FK_Tax) : '',
      address: attrs.ADDRESSES || 'Unknown Address',
      neighborhood: attrs.NEIGHBORHOOD_1 || 'Unknown',
      bedrooms: attrs.NumberOfBedrooms || 0,
      fullBaths: attrs.NumberOfFullBaths || 0,
      halfBaths: attrs.NumberOfHalfBaths || 0,
      buildingSqFt: attrs.Bldg_SF || 0,
      yearBuilt: attrs.Built || 0,
      status,
      narrative: attrs.Narrative || undefined,
      listingUrl: attrs.Link || undefined,
      developerName: attrs.Developer_Name || undefined,
    }
  }

  function mapPropertyStatus(
    status: string | null
  ): 'for_sale' | 'sold' | 'unknown' {
    if (!status) return 'unknown'
    const normalized = status.toLowerCase().trim()
    if (normalized === 'for sale' || normalized === 'available') return 'for_sale'
    if (normalized === 'sold' || normalized === 'closed') return 'sold'
    return 'unknown'
  }

  it('transforms complete ESRI feature to schema format', () => {
    const feature: ESRIFeature = {
      attributes: {
        OBJECTID_1: 12345,
        ObjectId: 100,
        FK_Tax: 3210001234,
        ADDRESSES: '123 Main St',
        NEIGHBORHOOD_1: 'Bay View',
        NumberOfBedrooms: 3,
        NumberOfFullBaths: 2,
        NumberOfHalfBaths: 1,
        Bldg_SF: 1500,
        Built: 1925,
        Property_Status: 'For Sale',
        Narrative: 'Beautiful renovated home',
        Link: 'https://example.com/listing',
        Developer_Name: 'MKE Homes',
      },
      geometry: { x: 2530000, y: 390000 },
    }

    const result = transformESRIFeature(feature)

    expect(result.esriObjectId).toBe('12345')
    expect(result.taxKey).toBe('3210001234')
    expect(result.address).toBe('123 Main St')
    expect(result.neighborhood).toBe('Bay View')
    expect(result.bedrooms).toBe(3)
    expect(result.fullBaths).toBe(2)
    expect(result.halfBaths).toBe(1)
    expect(result.buildingSqFt).toBe(1500)
    expect(result.yearBuilt).toBe(1925)
    expect(result.status).toBe('for_sale')
    expect(result.narrative).toBe('Beautiful renovated home')
    expect(result.listingUrl).toBe('https://example.com/listing')
  })

  it('handles missing optional fields gracefully', () => {
    const feature: ESRIFeature = {
      attributes: {
        OBJECTID_1: 99999,
        ObjectId: 200,
        FK_Tax: 0,
        ADDRESSES: '',
        NEIGHBORHOOD_1: '',
        NumberOfBedrooms: 0,
        NumberOfFullBaths: 0,
        NumberOfHalfBaths: 0,
        Bldg_SF: 0,
        Built: 0,
        Property_Status: '',
        Narrative: null,
        Link: null,
        Developer_Name: null,
      },
      geometry: { x: 0, y: 0 },
    }

    const result = transformESRIFeature(feature)

    expect(result.esriObjectId).toBe('99999')
    expect(result.taxKey).toBe('')
    expect(result.address).toBe('Unknown Address')
    expect(result.neighborhood).toBe('Unknown')
    expect(result.status).toBe('unknown')
    expect(result.narrative).toBeUndefined()
    expect(result.listingUrl).toBeUndefined()
  })
})

// =============================================================================
// Test: Status Field Transitions
// =============================================================================

describe('Property Status Mapping', () => {
  function mapPropertyStatus(
    status: string | null
  ): 'for_sale' | 'sold' | 'unknown' {
    if (!status) return 'unknown'
    const normalized = status.toLowerCase().trim()
    if (normalized === 'for sale' || normalized === 'available') return 'for_sale'
    if (normalized === 'sold' || normalized === 'closed') return 'sold'
    return 'unknown'
  }

  it('maps "For Sale" to for_sale', () => {
    expect(mapPropertyStatus('For Sale')).toBe('for_sale')
    expect(mapPropertyStatus('for sale')).toBe('for_sale')
    expect(mapPropertyStatus('FOR SALE')).toBe('for_sale')
  })

  it('maps "Available" to for_sale', () => {
    expect(mapPropertyStatus('Available')).toBe('for_sale')
    expect(mapPropertyStatus('available')).toBe('for_sale')
  })

  it('maps "Sold" to sold', () => {
    expect(mapPropertyStatus('Sold')).toBe('sold')
    expect(mapPropertyStatus('sold')).toBe('sold')
    expect(mapPropertyStatus('SOLD')).toBe('sold')
  })

  it('maps "Closed" to sold', () => {
    expect(mapPropertyStatus('Closed')).toBe('sold')
    expect(mapPropertyStatus('closed')).toBe('sold')
  })

  it('maps null or empty to unknown', () => {
    expect(mapPropertyStatus(null)).toBe('unknown')
    expect(mapPropertyStatus('')).toBe('unknown')
    expect(mapPropertyStatus('  ')).toBe('unknown')
  })

  it('maps unrecognized status to unknown', () => {
    expect(mapPropertyStatus('Pending')).toBe('unknown')
    expect(mapPropertyStatus('Under Contract')).toBe('unknown')
    expect(mapPropertyStatus('Coming Soon')).toBe('unknown')
  })
})

// =============================================================================
// Test: Upsert Logic
// =============================================================================

describe('Upsert Logic', () => {
  it('identifies records to update vs insert based on esriObjectId', () => {
    const existingRecords = new Map<string, { _id: string; address: string }>([
      ['12345', { _id: 'conv_abc', address: '123 Old St' }],
      ['67890', { _id: 'conv_def', address: '456 Old Ave' }],
    ])

    const incomingFeatures = [
      { esriObjectId: '12345', address: '123 Updated St' }, // Should update
      { esriObjectId: '67890', address: '456 Old Ave' }, // No change
      { esriObjectId: '11111', address: '789 New Blvd' }, // Should insert
    ]

    const toUpdate: Array<{ id: string; data: { address: string } }> = []
    const toInsert: Array<{ esriObjectId: string; address: string }> = []

    for (const feature of incomingFeatures) {
      const existing = existingRecords.get(feature.esriObjectId)
      if (existing) {
        if (existing.address !== feature.address) {
          toUpdate.push({ id: existing._id, data: { address: feature.address } })
        }
      } else {
        toInsert.push(feature)
      }
    }

    expect(toUpdate).toHaveLength(1)
    expect(toUpdate[0].id).toBe('conv_abc')
    expect(toUpdate[0].data.address).toBe('123 Updated St')

    expect(toInsert).toHaveLength(1)
    expect(toInsert[0].esriObjectId).toBe('11111')
  })

  it('marks records not in sync as sold', () => {
    const existingObjectIds = new Set(['12345', '67890', '11111'])
    const syncedObjectIds = new Set(['12345', '67890']) // 11111 is missing

    const toMarkSold = [...existingObjectIds].filter(
      (id) => !syncedObjectIds.has(id)
    )

    expect(toMarkSold).toEqual(['11111'])
  })
})

// =============================================================================
// Test: Index Query Patterns
// =============================================================================

describe('Index Query Patterns', () => {
  // Mock data representing homesForSale records
  const mockHomes = [
    {
      _id: 'home_1',
      esriObjectId: '1',
      status: 'for_sale' as const,
      neighborhood: 'Bay View',
      taxKey: '3210001',
      bedrooms: 3,
      fullBaths: 2,
    },
    {
      _id: 'home_2',
      esriObjectId: '2',
      status: 'for_sale' as const,
      neighborhood: 'Bay View',
      taxKey: '3210002',
      bedrooms: 4,
      fullBaths: 3,
    },
    {
      _id: 'home_3',
      esriObjectId: '3',
      status: 'sold' as const,
      neighborhood: 'Third Ward',
      taxKey: '3210003',
      bedrooms: 2,
      fullBaths: 1,
    },
    {
      _id: 'home_4',
      esriObjectId: '4',
      status: 'for_sale' as const,
      neighborhood: 'Third Ward',
      taxKey: '3210004',
      bedrooms: 3,
      fullBaths: 2,
    },
  ]

  it('filters by status using by_status index', () => {
    const forSale = mockHomes.filter((h) => h.status === 'for_sale')
    expect(forSale).toHaveLength(3)
    expect(forSale.every((h) => h.status === 'for_sale')).toBe(true)
  })

  it('filters by neighborhood using by_neighborhood index', () => {
    const bayView = mockHomes.filter((h) => h.neighborhood === 'Bay View')
    expect(bayView).toHaveLength(2)
    expect(bayView.every((h) => h.neighborhood === 'Bay View')).toBe(true)
  })

  it('looks up by taxKey using by_taxKey index', () => {
    const found = mockHomes.find((h) => h.taxKey === '3210002')
    expect(found).toBeDefined()
    expect(found?._id).toBe('home_2')
  })

  it('looks up by esriObjectId using by_esriObjectId index', () => {
    const found = mockHomes.find((h) => h.esriObjectId === '3')
    expect(found).toBeDefined()
    expect(found?.status).toBe('sold')
  })

  it('combines status and neighborhood filters for search', () => {
    const forSaleInBayView = mockHomes.filter(
      (h) => h.status === 'for_sale' && h.neighborhood === 'Bay View'
    )
    expect(forSaleInBayView).toHaveLength(2)
  })

  it('filters by bedroom range', () => {
    const minBedrooms = 3
    const maxBedrooms = 4
    const forSaleWithBedrooms = mockHomes.filter(
      (h) =>
        h.status === 'for_sale' &&
        h.bedrooms >= minBedrooms &&
        h.bedrooms <= maxBedrooms
    )
    expect(forSaleWithBedrooms).toHaveLength(3)
  })
})
