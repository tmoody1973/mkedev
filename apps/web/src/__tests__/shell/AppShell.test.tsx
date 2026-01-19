import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AppShell } from '@/components/shell'

// Mock the UserMenu component since it depends on Clerk
vi.mock('@/components/user-menu', () => ({
  UserMenu: () => <div data-testid="user-menu">User Menu</div>,
}))

// Mock MapProvider to avoid Mapbox initialization
vi.mock('@/contexts/MapContext', () => ({
  MapProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useMap: () => ({
    map: null,
    setMap: vi.fn(),
    selectedParcelId: null,
    setSelectedParcelId: vi.fn(),
    layerVisibility: { parcels: true, zoning: true },
    toggleLayerVisibility: vi.fn(),
    setLayerVisibility: vi.fn(),
    layerOpacity: {},
    setLayerOpacity: vi.fn(),
    flyTo: vi.fn(),
    resetView: vi.fn(),
    isMapLoaded: false,
    setIsMapLoaded: vi.fn(),
    mapError: null,
    setMapError: vi.fn(),
    is3DMode: false,
    setIs3DMode: vi.fn(),
    toggle3DMode: vi.fn(),
    animateTo3DView: vi.fn(),
    animateTo2DView: vi.fn(),
    captureMapScreenshot: vi.fn(),
    highlightParcel: vi.fn(),
    registerHighlightParcel: vi.fn(),
    clearParcelSelection: vi.fn(),
    registerClearParcelSelection: vi.fn(),
  }),
}))

describe('AppShell', () => {
  const mockChatPanel = <div data-testid="chat-content">Chat Panel Content</div>
  const mockMapPanel = <div data-testid="map-content">Map Panel Content</div>

  it('renders with both panels', () => {
    render(<AppShell chatPanel={mockChatPanel} mapPanel={mockMapPanel} />)

    expect(screen.getByTestId('app-shell')).toBeInTheDocument()
    expect(screen.getByTestId('chat-panel-container')).toBeInTheDocument()
    expect(screen.getByTestId('map-panel-container')).toBeInTheDocument()
    expect(screen.getByTestId('chat-content')).toBeInTheDocument()
    expect(screen.getByTestId('map-content')).toBeInTheDocument()
  })

  it('renders header with all required elements', () => {
    render(<AppShell chatPanel={mockChatPanel} mapPanel={mockMapPanel} />)

    expect(screen.getByTestId('app-header')).toBeInTheDocument()
    expect(screen.getByText('MKE.dev')).toBeInTheDocument()
    expect(screen.getByLabelText(/voice mode/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Toggle 3D view')).toBeInTheDocument()
    expect(screen.getByLabelText('Toggle layers menu')).toBeInTheDocument()
    expect(screen.getByTestId('user-menu')).toBeInTheDocument()
  })

  it('opens layers dropdown when layers button is clicked', () => {
    render(<AppShell chatPanel={mockChatPanel} mapPanel={mockMapPanel} />)

    const layersButton = screen.getByLabelText('Toggle layers menu')
    fireEvent.click(layersButton)

    // Check that the dropdown opened with layer options
    expect(screen.getByText('Layers')).toBeInTheDocument()
    expect(screen.getByText('Parcels')).toBeInTheDocument()
    expect(screen.getByText('Zoning')).toBeInTheDocument()
  })

  it('toggles voice state when voice button is clicked', () => {
    const onVoiceToggle = vi.fn()
    render(
      <AppShell
        chatPanel={mockChatPanel}
        mapPanel={mockMapPanel}
        onVoiceToggle={onVoiceToggle}
        isVoiceActive={false}
      />
    )

    const voiceButton = screen.getByLabelText('Enable voice mode')
    fireEvent.click(voiceButton)

    expect(onVoiceToggle).toHaveBeenCalledTimes(1)
  })
})
