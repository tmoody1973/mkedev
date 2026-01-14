import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MapProvider } from '@/contexts/MapContext'
import { LayerPanel } from '@/components/map/LayerPanel'

// Mock the layer config module
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

// Helper wrapper for tests
function renderWithProvider(ui: React.ReactElement) {
  return render(<MapProvider>{ui}</MapProvider>)
}

describe('LayerPanel', () => {
  it('renders panel with layer count', () => {
    renderWithProvider(<LayerPanel />)

    expect(screen.getByTestId('layer-panel')).toBeInTheDocument()
    expect(screen.getByText('Map Layers')).toBeInTheDocument()
    // Default: 2 visible (zoning, parcels), 1 hidden (tif)
    expect(screen.getByTestId('layer-count')).toHaveTextContent('2 of 3 active')
  })

  it('expands and collapses panel when toggle is clicked', () => {
    renderWithProvider(<LayerPanel />)

    const toggleButton = screen.getByTestId('layer-panel-toggle')
    const content = screen.getByTestId('layer-panel-content')

    // Panel starts collapsed
    expect(content).toHaveClass('max-h-0')
    expect(content).toHaveClass('invisible')

    // Click to expand
    fireEvent.click(toggleButton)

    // Panel should now be expanded
    expect(content).not.toHaveClass('max-h-0')
    expect(content).not.toHaveClass('invisible')

    // Click to collapse
    fireEvent.click(toggleButton)

    // Panel should be collapsed again
    expect(content).toHaveClass('max-h-0')
    expect(content).toHaveClass('invisible')
  })

  it('updates layer count when visibility is toggled', () => {
    renderWithProvider(<LayerPanel defaultExpanded />)

    // Initial count: 2 of 3 active
    expect(screen.getByTestId('layer-count')).toHaveTextContent('2 of 3 active')

    // Find and click the TIF layer toggle to turn it on
    const tifToggle = screen.getByTestId('layer-toggle-tif')
    fireEvent.click(tifToggle)

    // Count should now be 3 of 3 active
    expect(screen.getByTestId('layer-count')).toHaveTextContent('3 of 3 active')

    // Click zoning toggle to turn it off
    const zoningToggle = screen.getByTestId('layer-toggle-zoning')
    fireEvent.click(zoningToggle)

    // Count should now be 2 of 3 active
    expect(screen.getByTestId('layer-count')).toHaveTextContent('2 of 3 active')
  })

  it('displays layer items with correct visibility state', () => {
    renderWithProvider(<LayerPanel defaultExpanded />)

    // Check layer items are rendered
    expect(screen.getByTestId('layer-item-zoning')).toBeInTheDocument()
    expect(screen.getByTestId('layer-item-parcels')).toBeInTheDocument()
    expect(screen.getByTestId('layer-item-tif')).toBeInTheDocument()

    // Visible layers should have sky border
    expect(screen.getByTestId('layer-item-zoning')).toHaveClass('border-sky-500')
    expect(screen.getByTestId('layer-item-parcels')).toHaveClass('border-sky-500')

    // Hidden layer should have stone border
    expect(screen.getByTestId('layer-item-tif')).toHaveClass('border-stone-200')
  })
})
