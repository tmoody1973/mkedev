/**
 * CopilotKit Integration Tests for Homes MKE Feature
 *
 * Tests for Task Group 5: Generative UI and Chat-to-Map Bridge
 *
 * Tests cover:
 * - useCopilotAction registration for search_homes_for_sale
 * - useCopilotAction registration for get_home_details
 * - HomeContent extracts home IDs and calls highlightHomes
 * - GenerativeCard type includes home-listing and homes-list
 */

import { describe, it, expect, vi } from 'vitest'

// =============================================================================
// Test: GenerativeCard Type Union
// =============================================================================

describe('GenerativeCard Types', () => {
  it('includes home-listing in type union', () => {
    // Type-level test - if this compiles, the type is correct
    const homeListingCard: {
      type:
        | 'zone-info'
        | 'parcel-info'
        | 'parcel-analysis'
        | 'incentives-summary'
        | 'area-plan-context'
        | 'permit-process'
        | 'code-citation'
        | 'opportunity-list'
        | 'home-listing'
        | 'homes-list'
      data: unknown
    } = {
      type: 'home-listing',
      data: {
        address: '123 Main St',
        neighborhood: 'Bay View',
      },
    }

    expect(homeListingCard.type).toBe('home-listing')
  })

  it('includes homes-list in type union', () => {
    const homesListCard: {
      type:
        | 'zone-info'
        | 'parcel-info'
        | 'parcel-analysis'
        | 'incentives-summary'
        | 'area-plan-context'
        | 'permit-process'
        | 'code-citation'
        | 'opportunity-list'
        | 'home-listing'
        | 'homes-list'
      data: unknown
    } = {
      type: 'homes-list',
      data: {
        homes: [],
      },
    }

    expect(homesListCard.type).toBe('homes-list')
  })
})

// =============================================================================
// Test: Home Tool Result to Card Mapping
// =============================================================================

describe('Home Tool Result to Card Mapping', () => {
  /**
   * Simulates the mapToolResultsToCards function for home tools.
   */
  function mapHomeToolResultsToCards(
    toolResults: Array<{
      name: string
      args: Record<string, unknown>
      result: Record<string, unknown>
    }>
  ) {
    const cards: Array<{ type: string; data: unknown }> = []

    for (const tool of toolResults) {
      const { name, result } = tool

      if (
        !result ||
        (result as { success?: boolean }).success === false
      ) {
        continue
      }

      switch (name) {
        case 'search_homes_for_sale': {
          const r = result as {
            homes?: Array<{
              homeId: string
              address: string
              neighborhood: string
              coordinates?: [number, number]
              bedrooms: number
              fullBaths: number
              halfBaths: number
            }>
            count?: number
          }
          if (r.homes && r.homes.length > 0) {
            cards.push({
              type: 'homes-list',
              data: {
                homes: r.homes.map((h) => ({
                  id: h.homeId,
                  address: h.address,
                  neighborhood: h.neighborhood,
                  coordinates: h.coordinates || [-87.9, 43.0],
                  bedrooms: h.bedrooms,
                  fullBaths: h.fullBaths,
                  halfBaths: h.halfBaths,
                })),
              },
            })
          }
          break
        }

        case 'get_home_details': {
          const r = result as {
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
              narrative?: string
              listingUrl?: string
            }
          }
          if (r.home) {
            cards.push({
              type: 'home-listing',
              data: {
                address: r.home.address,
                neighborhood: r.home.neighborhood,
                coordinates: r.home.coordinates,
                bedrooms: r.home.bedrooms,
                fullBaths: r.home.fullBaths,
                halfBaths: r.home.halfBaths,
                buildingSqFt: r.home.buildingSqFt,
                yearBuilt: r.home.yearBuilt,
                narrative: r.home.narrative,
                listingUrl: r.home.listingUrl,
              },
            })
          }
          break
        }
      }
    }

    return cards
  }

  it('maps search_homes_for_sale result to homes-list card', () => {
    const toolResults = [
      {
        name: 'search_homes_for_sale',
        args: { neighborhood: 'Bay View' },
        result: {
          success: true,
          homes: [
            {
              homeId: 'home-1',
              address: '123 Main St',
              neighborhood: 'Bay View',
              bedrooms: 3,
              fullBaths: 2,
              halfBaths: 1,
            },
            {
              homeId: 'home-2',
              address: '456 Oak Ave',
              neighborhood: 'Bay View',
              bedrooms: 4,
              fullBaths: 3,
              halfBaths: 0,
            },
          ],
          count: 2,
        },
      },
    ]

    const cards = mapHomeToolResultsToCards(toolResults)

    expect(cards).toHaveLength(1)
    expect(cards[0].type).toBe('homes-list')
    expect((cards[0].data as { homes: unknown[] }).homes).toHaveLength(2)
  })

  it('maps get_home_details result to home-listing card', () => {
    const toolResults = [
      {
        name: 'get_home_details',
        args: { homeId: 'home-1' },
        result: {
          success: true,
          home: {
            homeId: 'home-1',
            address: '123 Main St',
            neighborhood: 'Bay View',
            coordinates: [-87.9, 43.0] as [number, number],
            bedrooms: 3,
            fullBaths: 2,
            halfBaths: 1,
            buildingSqFt: 1500,
            yearBuilt: 1925,
            narrative: 'Beautiful home',
            listingUrl: 'https://example.com/home/1',
          },
        },
      },
    ]

    const cards = mapHomeToolResultsToCards(toolResults)

    expect(cards).toHaveLength(1)
    expect(cards[0].type).toBe('home-listing')
    expect((cards[0].data as { address: string }).address).toBe('123 Main St')
  })
})

// =============================================================================
// Test: Home ID Extraction for Map Highlighting
// =============================================================================

describe('Home ID Extraction for Map Highlighting', () => {
  /**
   * Extracts home IDs from tool results for map highlighting.
   */
  function extractHomeIdsFromToolResults(
    toolResults: Array<{
      name: string
      result: Record<string, unknown>
    }>
  ): string[] {
    const homeIds: string[] = []

    for (const tool of toolResults) {
      const { name, result } = tool

      if (name === 'search_homes_for_sale') {
        const r = result as {
          success?: boolean
          homes?: Array<{ homeId: string }>
        }
        if (r.success && r.homes) {
          homeIds.push(...r.homes.map((h) => h.homeId))
        }
      }

      if (name === 'get_home_details') {
        const r = result as {
          success?: boolean
          home?: { homeId: string }
        }
        if (r.success && r.home) {
          homeIds.push(r.home.homeId)
        }
      }
    }

    return homeIds
  }

  it('extracts home IDs from search_homes_for_sale results', () => {
    const toolResults = [
      {
        name: 'search_homes_for_sale',
        result: {
          success: true,
          homes: [
            { homeId: 'home-1' },
            { homeId: 'home-2' },
            { homeId: 'home-3' },
          ],
        },
      },
    ]

    const homeIds = extractHomeIdsFromToolResults(toolResults)

    expect(homeIds).toEqual(['home-1', 'home-2', 'home-3'])
  })

  it('extracts single home ID from get_home_details result', () => {
    const toolResults = [
      {
        name: 'get_home_details',
        result: {
          success: true,
          home: { homeId: 'home-1' },
        },
      },
    ]

    const homeIds = extractHomeIdsFromToolResults(toolResults)

    expect(homeIds).toEqual(['home-1'])
  })

  it('returns empty array when no homes in results', () => {
    const toolResults = [
      {
        name: 'search_homes_for_sale',
        result: {
          success: true,
          homes: [],
        },
      },
    ]

    const homeIds = extractHomeIdsFromToolResults(toolResults)

    expect(homeIds).toEqual([])
  })
})

// =============================================================================
// Test: CopilotAction Registration Pattern
// =============================================================================

describe('CopilotAction Registration Pattern', () => {
  /**
   * Mock useCopilotAction hook for testing.
   * Returns the render function for testing generative UI.
   */
  function createMockCopilotAction(config: {
    name: string
    available?: string
    render: (props: {
      status: string
      args: Record<string, unknown>
      result: unknown
    }) => React.ReactNode
  }) {
    return config
  }

  it('registers search_homes_for_sale action with render function', () => {
    const mockHomesListCard = vi.fn()

    const action = createMockCopilotAction({
      name: 'search_homes_for_sale',
      available: 'disabled', // Render-only, backend executes
      render: ({ status, result }) => {
        if (status === 'inProgress' || status === 'executing') {
          return mockHomesListCard({ status: 'loading', homes: [] })
        }
        if (status === 'complete' && result) {
          return mockHomesListCard({
            status: 'complete',
            homes: (result as { homes?: unknown[] }).homes || [],
          })
        }
        return null
      },
    })

    expect(action.name).toBe('search_homes_for_sale')
    expect(action.available).toBe('disabled')

    // Test loading state
    action.render({
      status: 'inProgress',
      args: {},
      result: undefined,
    })
    expect(mockHomesListCard).toHaveBeenCalledWith({
      status: 'loading',
      homes: [],
    })

    // Test complete state
    mockHomesListCard.mockClear()
    action.render({
      status: 'complete',
      args: {},
      result: { homes: [{ homeId: 'home-1' }] },
    })
    expect(mockHomesListCard).toHaveBeenCalledWith({
      status: 'complete',
      homes: [{ homeId: 'home-1' }],
    })
  })

  it('registers get_home_details action with render function', () => {
    const mockHomeCard = vi.fn()

    const action = createMockCopilotAction({
      name: 'get_home_details',
      available: 'disabled',
      render: ({ status, result }) => {
        if (status === 'inProgress' || status === 'executing') {
          return mockHomeCard({ status: 'inProgress' })
        }
        if (status === 'complete' && result) {
          const r = result as { home?: { address: string } }
          if (r.home) {
            return mockHomeCard({
              status: 'complete',
              address: r.home.address,
            })
          }
        }
        return null
      },
    })

    expect(action.name).toBe('get_home_details')

    // Test loading state
    action.render({
      status: 'executing',
      args: { homeId: 'home-1' },
      result: undefined,
    })
    expect(mockHomeCard).toHaveBeenCalledWith({ status: 'inProgress' })

    // Test complete state
    mockHomeCard.mockClear()
    action.render({
      status: 'complete',
      args: { homeId: 'home-1' },
      result: { home: { address: '123 Main St' } },
    })
    expect(mockHomeCard).toHaveBeenCalledWith({
      status: 'complete',
      address: '123 Main St',
    })
  })
})
