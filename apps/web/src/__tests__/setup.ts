import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Create a mock Map class
class MockMap {
  on = vi.fn((event, callback) => {
    if (event === 'load') {
      // Simulate map load after a tick
      setTimeout(() => callback(), 0)
    }
    return this
  })
  once = vi.fn((event, callback) => {
    if (event === 'idle') {
      setTimeout(() => callback(), 0)
    }
    return this
  })
  off = vi.fn()
  remove = vi.fn()
  addControl = vi.fn()
  removeControl = vi.fn()
  getZoom = vi.fn(() => 12)
  getCenter = vi.fn(() => ({ lng: -87.9065, lat: 43.0389 }))
  setCenter = vi.fn()
  setZoom = vi.fn()
  flyTo = vi.fn()
  resize = vi.fn()
  addSource = vi.fn()
  removeSource = vi.fn()
  addLayer = vi.fn()
  removeLayer = vi.fn()
  getLayer = vi.fn()
  getSource = vi.fn()
  setLayoutProperty = vi.fn()
  setPaintProperty = vi.fn()
  setStyle = vi.fn()
  queryRenderedFeatures = vi.fn(() => [])
  loaded = vi.fn(() => false)
  getCanvas = vi.fn(() => ({
    style: { cursor: '' },
  }))
}

// Mock mapbox-gl
vi.mock('mapbox-gl', () => {
  return {
    default: {
      accessToken: '',
      Map: MockMap,
      NavigationControl: vi.fn(),
      ScaleControl: vi.fn(),
      GeolocateControl: vi.fn(),
      Popup: vi.fn(() => ({
        setLngLat: vi.fn().mockReturnThis(),
        setHTML: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
        remove: vi.fn(),
      })),
      Marker: vi.fn(() => ({
        setLngLat: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
        remove: vi.fn(),
      })),
    },
    Map: MockMap,
    NavigationControl: vi.fn(),
    ScaleControl: vi.fn(),
    GeolocateControl: vi.fn(),
    Popup: vi.fn(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      setHTML: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
    })),
    Marker: vi.fn(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
    })),
  }
})

// Mock mapbox-gl CSS import
vi.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock Element.scrollIntoView (not implemented in JSDOM)
Element.prototype.scrollIntoView = vi.fn()
