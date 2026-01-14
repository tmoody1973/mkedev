import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MapContainer, MapPlaceholder } from '@/components/map'
import { MapProvider } from '@/contexts/MapContext'

// Mock environment variable
const originalEnv = process.env

describe('MapContainer', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  it('renders map container element', async () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'pk.test_token'

    render(
      <MapProvider>
        <MapContainer />
      </MapProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'pk.test_token'

    render(
      <MapProvider>
        <MapContainer />
      </MapProvider>
    )

    expect(screen.getByText('Loading map...')).toBeInTheDocument()
  })

  it('displays error when Mapbox token is missing', async () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = ''

    render(
      <MapProvider>
        <MapContainer />
      </MapProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Map Error')).toBeInTheDocument()
      expect(
        screen.getByText(/Mapbox access token is not configured/)
      ).toBeInTheDocument()
    })
  })
})

describe('MapPlaceholder', () => {
  it('renders placeholder content', () => {
    render(<MapPlaceholder />)

    expect(screen.getByTestId('map-placeholder')).toBeInTheDocument()
    expect(screen.getByText('Map will render here')).toBeInTheDocument()
    expect(screen.getByText('Mapbox + ESRI ArcGIS layers')).toBeInTheDocument()
  })

  it('accepts custom className', () => {
    render(<MapPlaceholder className="custom-class" />)

    const placeholder = screen.getByTestId('map-placeholder')
    expect(placeholder).toHaveClass('custom-class')
  })
})
