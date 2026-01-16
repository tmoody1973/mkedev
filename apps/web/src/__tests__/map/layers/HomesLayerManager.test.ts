import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  HomesLayerManager,
  type HomeForSale,
} from '@/components/map/layers/homes-layer-manager'
import { HOMES_LAYER_CONFIG } from '@/components/map/layers/layer-config'

// =============================================================================
// Test: HomesLayerManager for Homes For Sale
// Task Group 3 Tests
// =============================================================================

// Mock data for tests
const createMockHome = (overrides: Partial<HomeForSale> = {}): HomeForSale => ({
  _id: 'home-123',
  address: '123 N Water St',
  neighborhood: 'Downtown',
  coordinates: [-87.9065, 43.0389] as [number, number],
  bedrooms: 3,
  fullBaths: 2,
  halfBaths: 1,
  buildingSqFt: 1800,
  yearBuilt: 2020,
  status: 'for_sale',
  narrative: 'Beautiful home in downtown Milwaukee',
  listingUrl: 'https://example.com/home/123',
  developerName: 'Milwaukee Homes',
  ...overrides,
})

// Create mock mapbox map with proper method implementations
const createMockMap = () => {
  const sourceData = { current: null as GeoJSON.FeatureCollection | null }
  const featureStates = new Map<string, Record<string, unknown>>()
  const sources = new Map<string, { setData: (data: GeoJSON.FeatureCollection) => void }>()
  const layers = new Map<string, { visibility: string }>()
  const eventHandlers = new Map<string, Map<string, ((e: unknown) => void)[]>>()

  // Create persistent canvas object so cursor changes persist across calls
  const canvasElement = { style: { cursor: '' } }

  return {
    // Source management
    addSource: vi.fn((id: string) => {
      sources.set(id, {
        setData: (data: GeoJSON.FeatureCollection) => {
          sourceData.current = data
        },
      })
    }),
    getSource: vi.fn((id: string) => sources.get(id)),
    removeSource: vi.fn((id: string) => {
      sources.delete(id)
    }),

    // Layer management
    addLayer: vi.fn((config: { id: string; layout?: { visibility?: string } }) => {
      layers.set(config.id, { visibility: config.layout?.visibility || 'visible' })
    }),
    getLayer: vi.fn((id: string) => layers.has(id) ? { id } : undefined),
    removeLayer: vi.fn((id: string) => {
      layers.delete(id)
    }),
    setLayoutProperty: vi.fn((layerId: string, property: string, value: string) => {
      const layer = layers.get(layerId)
      if (layer && property === 'visibility') {
        layer.visibility = value
      }
    }),

    // Feature state management
    setFeatureState: vi.fn((target: { source: string; id: string }, state: Record<string, unknown>) => {
      const key = `${target.source}:${target.id}`
      const existingState = featureStates.get(key) || {}
      featureStates.set(key, { ...existingState, ...state })
    }),
    getFeatureState: (target: { source: string; id: string }) => {
      return featureStates.get(`${target.source}:${target.id}`)
    },

    // Event handling
    on: vi.fn((event: string, layerOrCallback: string | ((e: unknown) => void), callback?: (e: unknown) => void) => {
      const layer = typeof layerOrCallback === 'string' ? layerOrCallback : ''
      const handler = callback || (typeof layerOrCallback === 'function' ? layerOrCallback : undefined)
      if (!handler) return

      if (!eventHandlers.has(layer)) {
        eventHandlers.set(layer, new Map())
      }
      const layerHandlers = eventHandlers.get(layer)!
      if (!layerHandlers.has(event)) {
        layerHandlers.set(event, [])
      }
      layerHandlers.get(event)!.push(handler)
    }),

    // Canvas for cursor - return same object instance
    getCanvas: vi.fn(() => canvasElement),

    // Helper to simulate events (for testing)
    _simulateEvent: (layer: string, event: string, eventData: unknown) => {
      const layerHandlers = eventHandlers.get(layer)
      if (layerHandlers) {
        const handlers = layerHandlers.get(event)
        if (handlers) {
          handlers.forEach((handler) => handler(eventData))
        }
      }
    },
    _getSourceData: () => sourceData.current,
    _getFeatureStates: () => featureStates,
    _getLayers: () => layers,
    _getCanvas: () => canvasElement,
  }
}

describe('HomesLayerManager', () => {
  let mockMap: ReturnType<typeof createMockMap>
  let manager: HomesLayerManager

  beforeEach(() => {
    mockMap = createMockMap()
    // Reset all mocks
    vi.clearAllMocks()
  })

  describe('Layer Initialization', () => {
    it('initializes layer with GeoJSON source and circle layer', () => {
      manager = new HomesLayerManager({
        map: mockMap as unknown as mapboxgl.Map,
      })

      manager.addLayer()

      // Should add source with promoteId
      expect(mockMap.addSource).toHaveBeenCalledWith(
        'homes-for-sale-source',
        expect.objectContaining({
          type: 'geojson',
          promoteId: 'homeId',
        })
      )

      // Should add circle layer
      expect(mockMap.addLayer).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'homes-for-sale-circles',
          type: 'circle',
          source: 'homes-for-sale-source',
        })
      )
    })

    it('does not re-initialize if already initialized', () => {
      manager = new HomesLayerManager({
        map: mockMap as unknown as mapboxgl.Map,
      })

      manager.addLayer()
      manager.addLayer() // Second call should be ignored

      expect(mockMap.addSource).toHaveBeenCalledTimes(1)
      expect(mockMap.addLayer).toHaveBeenCalledTimes(1)
    })
  })

  describe('highlightHomes()', () => {
    it('highlights correct homes by ID using feature-state', () => {
      manager = new HomesLayerManager({
        map: mockMap as unknown as mapboxgl.Map,
      })

      manager.addLayer()

      // Add some home data first
      const homes = [
        createMockHome({ _id: 'home-1' }),
        createMockHome({ _id: 'home-2' }),
        createMockHome({ _id: 'home-3' }),
      ]
      manager.updateData(homes)

      // Highlight specific homes
      manager.highlightHomes(['home-1', 'home-3'])

      // Should set feature-state for highlighted homes
      expect(mockMap.setFeatureState).toHaveBeenCalledWith(
        { source: 'homes-for-sale-source', id: 'home-1' },
        { highlighted: true }
      )
      expect(mockMap.setFeatureState).toHaveBeenCalledWith(
        { source: 'homes-for-sale-source', id: 'home-3' },
        { highlighted: true }
      )
    })

    it('clears previous highlights before applying new ones', () => {
      manager = new HomesLayerManager({
        map: mockMap as unknown as mapboxgl.Map,
      })

      manager.addLayer()

      const homes = [
        createMockHome({ _id: 'home-1' }),
        createMockHome({ _id: 'home-2' }),
      ]
      manager.updateData(homes)

      // Highlight first home
      manager.highlightHomes(['home-1'])

      // Now highlight second home
      manager.highlightHomes(['home-2'])

      // Should have cleared home-1 highlight
      expect(mockMap.setFeatureState).toHaveBeenCalledWith(
        { source: 'homes-for-sale-source', id: 'home-1' },
        { highlighted: false }
      )

      // And set home-2 highlight
      expect(mockMap.setFeatureState).toHaveBeenCalledWith(
        { source: 'homes-for-sale-source', id: 'home-2' },
        { highlighted: true }
      )
    })
  })

  describe('clearHighlights()', () => {
    it('removes all highlighting', () => {
      manager = new HomesLayerManager({
        map: mockMap as unknown as mapboxgl.Map,
      })

      manager.addLayer()

      const homes = [
        createMockHome({ _id: 'home-1' }),
        createMockHome({ _id: 'home-2' }),
      ]
      manager.updateData(homes)

      // Highlight homes
      manager.highlightHomes(['home-1', 'home-2'])

      // Clear all mocks to track clearHighlights calls
      vi.clearAllMocks()

      // Clear highlights
      manager.clearHighlights()

      // Should remove highlighting from all previously highlighted homes
      expect(mockMap.setFeatureState).toHaveBeenCalledWith(
        { source: 'homes-for-sale-source', id: 'home-1' },
        { highlighted: false }
      )
      expect(mockMap.setFeatureState).toHaveBeenCalledWith(
        { source: 'homes-for-sale-source', id: 'home-2' },
        { highlighted: false }
      )
    })
  })

  describe('Click Handler', () => {
    it('emits home selection event when marker is clicked', () => {
      const onHomeClick = vi.fn()
      manager = new HomesLayerManager({
        map: mockMap as unknown as mapboxgl.Map,
        onHomeClick,
      })

      manager.addLayer()

      const mockHome = createMockHome({ _id: 'clicked-home' })
      manager.updateData([mockHome])

      // Simulate click event
      mockMap._simulateEvent('homes-for-sale-circles', 'click', {
        features: [
          {
            properties: {
              homeId: 'clicked-home',
              address: mockHome.address,
            },
          },
        ],
        lngLat: { lng: mockHome.coordinates[0], lat: mockHome.coordinates[1] },
      })

      // Should emit click event with correct data
      expect(onHomeClick).toHaveBeenCalledWith(
        expect.objectContaining({
          homeId: 'clicked-home',
          coordinates: mockHome.coordinates,
          properties: expect.objectContaining({
            address: mockHome.address,
          }),
        })
      )
    })

    it('changes cursor on hover', () => {
      manager = new HomesLayerManager({
        map: mockMap as unknown as mapboxgl.Map,
      })

      manager.addLayer()

      // Get the canvas reference
      const canvas = mockMap._getCanvas()

      // Simulate mouseenter
      mockMap._simulateEvent('homes-for-sale-circles', 'mouseenter', {})
      expect(canvas.style.cursor).toBe('pointer')

      // Simulate mouseleave
      mockMap._simulateEvent('homes-for-sale-circles', 'mouseleave', {})
      expect(canvas.style.cursor).toBe('')
    })
  })

  describe('Layer Configuration', () => {
    it('HOMES_LAYER_CONFIG has correct colors matching spec', () => {
      expect(HOMES_LAYER_CONFIG.color).toBe('#0ea5e9') // sky-500
      expect(HOMES_LAYER_CONFIG.highlightColor).toBe('#f59e0b') // amber-500
      expect(HOMES_LAYER_CONFIG.strokeColor).toBe('#ffffff')
    })

    it('HOMES_LAYER_CONFIG has correct sizing', () => {
      expect(HOMES_LAYER_CONFIG.circleRadius).toBe(8)
      expect(HOMES_LAYER_CONFIG.highlightRadius).toBe(12)
      expect(HOMES_LAYER_CONFIG.strokeWidth).toBe(2)
    })
  })
})
