/**
 * Foundation Week 1 - End-to-End Integration Tests
 *
 * These tests verify cross-component integration points:
 * - Map-to-chat parcel context flow
 * - Layer visibility state persistence across components
 * - Provider hierarchy and context access
 * - User workflow completeness
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MapProvider, useMap } from '@/contexts/MapContext'
import { LayerPanel } from '@/components/map/LayerPanel'
import { ChatPanel, type ChatMessage } from '@/components/chat'
import { ParcelPopup } from '@/components/map/ParcelPopup'
import type { ParcelData } from '@/components/map/layers/esri-layer-manager'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'

// =============================================================================
// Mocks
// =============================================================================

// Mock the layer config module for LayerPanel tests
vi.mock('@/components/map/layers', () => ({
  ALL_LAYER_CONFIGS: [
    {
      id: 'zoning',
      name: 'Zoning Districts',
      description: 'Milwaukee zoning districts',
      color: '#3B82F6',
      defaultVisible: true,
      legendItems: [{ label: 'Residential', color: '#22C55E' }],
      dataSource: 'Milwaukee GIS',
    },
    {
      id: 'parcels',
      name: 'Parcels',
      description: 'Property parcels',
      color: '#78716C',
      defaultVisible: true,
      legendItems: [],
      dataSource: 'Milwaukee GIS',
    },
    {
      id: 'tif',
      name: 'TIF Districts',
      description: 'Tax Increment Financing',
      color: '#0EA5E9',
      defaultVisible: false,
      legendItems: [],
      dataSource: 'Milwaukee GIS',
    },
  ],
}))

// =============================================================================
// Helper Components
// =============================================================================

/**
 * Provider wrapper for integration tests
 */
function IntegrationWrapper({ children }: { children: ReactNode }) {
  return <MapProvider>{children}</MapProvider>
}

/**
 * Creates a render wrapper with MapProvider
 */
function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MapProvider>{children}</MapProvider>
  }
}

// =============================================================================
// Integration Tests: Map-to-Chat Parcel Context Flow
// =============================================================================

describe('Integration: Parcel Context Flow', () => {
  it('parcel popup triggers onAskAbout callback with correct data', async () => {
    const user = userEvent.setup()
    const onAskAbout = vi.fn()
    const onClose = vi.fn()

    const mockParcel: ParcelData = {
      taxKey: '3620101110',
      address: '123 N WATER ST',
      zoneCode: 'C9A',
      owner: 'CITY OF MILWAUKEE',
      assessedValue: 500000,
    }

    render(
      <IntegrationWrapper>
        <ParcelPopup
          parcel={mockParcel}
          onClose={onClose}
          onAskAbout={onAskAbout}
        />
      </IntegrationWrapper>
    )

    const askButton = screen.getByTestId('parcel-popup-ask-button')
    await user.click(askButton)

    expect(onAskAbout).toHaveBeenCalledWith(mockParcel)
    expect(onAskAbout).toHaveBeenCalledTimes(1)
  })

  it('parcel data can be used to construct chat message', async () => {
    const user = userEvent.setup()

    const mockParcel: ParcelData = {
      taxKey: '3620101110',
      address: '123 N WATER ST',
      zoneCode: 'C9A',
    }

    // Simulate the flow: parcel -> chat
    const messages: ChatMessage[] = []
    const onSendMessage = vi.fn((content: string) => {
      messages.push({
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      })
    })

    render(
      <IntegrationWrapper>
        <ChatPanel messages={messages} onSendMessage={onSendMessage} />
      </IntegrationWrapper>
    )

    // Simulate what happens when user asks about a parcel
    const expectedMessage = `Tell me about the property at ${mockParcel.address}`
    const input = screen.getByTestId('chat-input')
    await user.type(input, expectedMessage)

    const sendButton = screen.getByTestId('send-button')
    await user.click(sendButton)

    expect(onSendMessage).toHaveBeenCalledWith(expectedMessage)
    expect(messages).toHaveLength(1)
    expect(messages[0].content).toContain(mockParcel.address)
  })
})

// =============================================================================
// Integration Tests: Layer State Persistence
// =============================================================================

describe('Integration: Layer State Persistence', () => {
  it('layer visibility state persists in MapContext', () => {
    const { result } = renderHook(() => useMap(), {
      wrapper: createWrapper(),
    })

    // Initial state
    expect(result.current.layerVisibility.zoning).toBe(true)
    expect(result.current.layerVisibility.tif).toBe(false)

    // Toggle TIF layer
    act(() => {
      result.current.toggleLayerVisibility('tif')
    })

    expect(result.current.layerVisibility.tif).toBe(true)

    // Toggle zoning layer off
    act(() => {
      result.current.setLayerVisibility('zoning', false)
    })

    expect(result.current.layerVisibility.zoning).toBe(false)
  })

  it('LayerPanel reflects MapContext layer state', () => {
    render(
      <IntegrationWrapper>
        <LayerPanel defaultExpanded />
      </IntegrationWrapper>
    )

    // Initial count: zoning and parcels visible by default
    expect(screen.getByTestId('layer-count')).toHaveTextContent('2 of 3 active')

    // Toggle TIF to visible
    const tifToggle = screen.getByTestId('layer-toggle-tif')
    fireEvent.click(tifToggle)

    // Count should update
    expect(screen.getByTestId('layer-count')).toHaveTextContent('3 of 3 active')
  })

  it('layer opacity changes persist in context', () => {
    const { result } = renderHook(() => useMap(), {
      wrapper: createWrapper(),
    })

    // Initial opacity
    expect(result.current.layerOpacity.zoning).toBe(1)

    // Change opacity
    act(() => {
      result.current.setLayerOpacity('zoning', 0.5)
    })

    expect(result.current.layerOpacity.zoning).toBe(0.5)

    // Clamps to valid range
    act(() => {
      result.current.setLayerOpacity('zoning', 1.5)
    })

    expect(result.current.layerOpacity.zoning).toBe(1)
  })
})

// =============================================================================
// Integration Tests: Selected Parcel State
// =============================================================================

describe('Integration: Selected Parcel State', () => {
  it('selected parcel ID persists across context consumers', () => {
    const { result } = renderHook(() => useMap(), {
      wrapper: createWrapper(),
    })

    expect(result.current.selectedParcelId).toBeNull()

    act(() => {
      result.current.setSelectedParcelId('parcel-123-abc')
    })

    expect(result.current.selectedParcelId).toBe('parcel-123-abc')

    // Clear selection
    act(() => {
      result.current.setSelectedParcelId(null)
    })

    expect(result.current.selectedParcelId).toBeNull()
  })

  it('ParcelPopup onClose clears selection via callback', async () => {
    const user = userEvent.setup()
    let selectedId: string | null = 'parcel-123'

    const mockParcel: ParcelData = {
      taxKey: '3620101110',
      address: '123 N WATER ST',
      zoneCode: 'C9A',
    }

    const onClose = vi.fn(() => {
      selectedId = null
    })

    render(
      <IntegrationWrapper>
        <ParcelPopup parcel={mockParcel} onClose={onClose} />
      </IntegrationWrapper>
    )

    expect(selectedId).toBe('parcel-123')

    const closeButton = screen.getByTestId('parcel-popup-close')
    await user.click(closeButton)

    expect(onClose).toHaveBeenCalled()
    expect(selectedId).toBeNull()
  })
})

// =============================================================================
// Integration Tests: Chat Panel Integration
// =============================================================================

describe('Integration: Chat Panel Workflow', () => {
  it('complete message flow: input -> submit -> display', async () => {
    const user = userEvent.setup()
    let messages: ChatMessage[] = []

    const onSendMessage = vi.fn((content: string) => {
      messages = [
        ...messages,
        {
          id: `msg-${Date.now()}`,
          role: 'user' as const,
          content,
          timestamp: new Date(),
        },
      ]
    })

    const { rerender } = render(
      <IntegrationWrapper>
        <ChatPanel messages={messages} onSendMessage={onSendMessage} />
      </IntegrationWrapper>
    )

    // Type and send message
    const input = screen.getByTestId('chat-input')
    await user.type(input, 'What are the zoning rules for downtown Milwaukee?')

    const sendButton = screen.getByTestId('send-button')
    await user.click(sendButton)

    expect(onSendMessage).toHaveBeenCalledWith(
      'What are the zoning rules for downtown Milwaukee?'
    )

    // Rerender with updated messages
    rerender(
      <IntegrationWrapper>
        <ChatPanel messages={messages} onSendMessage={onSendMessage} />
      </IntegrationWrapper>
    )

    // Empty state should be gone
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()

    // Message should be displayed
    expect(screen.getByTestId('message-user')).toHaveTextContent(
      'What are the zoning rules for downtown Milwaukee?'
    )
  })

  it('loading state prevents double submission', async () => {
    const user = userEvent.setup()
    const onSendMessage = vi.fn()

    render(
      <IntegrationWrapper>
        <ChatPanel messages={[]} onSendMessage={onSendMessage} isLoading />
      </IntegrationWrapper>
    )

    // Input should be disabled during loading
    const input = screen.getByTestId('chat-input')
    expect(input).toBeDisabled()

    // Try to type (should not work)
    await user.type(input, 'Test message')
    expect((input as HTMLInputElement).value).toBe('')
  })
})

// =============================================================================
// Integration Tests: Map Context Provider Hierarchy
// =============================================================================

describe('Integration: Provider Hierarchy', () => {
  it('MapProvider provides all required context values', () => {
    const { result } = renderHook(() => useMap(), {
      wrapper: createWrapper(),
    })

    // Verify all context values are present
    expect(result.current).toHaveProperty('map')
    expect(result.current).toHaveProperty('setMap')
    expect(result.current).toHaveProperty('selectedParcelId')
    expect(result.current).toHaveProperty('setSelectedParcelId')
    expect(result.current).toHaveProperty('layerVisibility')
    expect(result.current).toHaveProperty('toggleLayerVisibility')
    expect(result.current).toHaveProperty('setLayerVisibility')
    expect(result.current).toHaveProperty('layerOpacity')
    expect(result.current).toHaveProperty('setLayerOpacity')
    expect(result.current).toHaveProperty('flyTo')
    expect(result.current).toHaveProperty('resetView')
    expect(result.current).toHaveProperty('isMapLoaded')
    expect(result.current).toHaveProperty('mapError')
  })

  it('components can share state through context', async () => {
    // Test that multiple components can read/write shared state
    let externalSelectedId: string | null = null

    function StateReader() {
      const { selectedParcelId } = useMap()
      externalSelectedId = selectedParcelId
      return <div data-testid="state-reader">{selectedParcelId || 'none'}</div>
    }

    function StateWriter() {
      const { setSelectedParcelId } = useMap()
      return (
        <button
          data-testid="state-writer"
          onClick={() => setSelectedParcelId('shared-parcel-123')}
        >
          Set Selection
        </button>
      )
    }

    render(
      <IntegrationWrapper>
        <StateReader />
        <StateWriter />
      </IntegrationWrapper>
    )

    expect(screen.getByTestId('state-reader')).toHaveTextContent('none')
    expect(externalSelectedId).toBeNull()

    // Click to update shared state
    fireEvent.click(screen.getByTestId('state-writer'))

    await waitFor(() => {
      expect(screen.getByTestId('state-reader')).toHaveTextContent(
        'shared-parcel-123'
      )
    })
  })
})
