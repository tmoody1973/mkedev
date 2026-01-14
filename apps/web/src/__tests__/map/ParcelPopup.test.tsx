import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ParcelPopup } from '@/components/map/ParcelPopup'
import type { ParcelData } from '@/components/map/layers/esri-layer-manager'

const mockParcel: ParcelData = {
  taxKey: '3620101110',
  address: '123 N WATER ST',
  zoneCode: 'C9A',
  owner: 'CITY OF MILWAUKEE',
  assessedValue: 500000,
  lotSize: 5000,
}

const mockParcelMinimal: ParcelData = {
  taxKey: '1234567890',
  address: '456 W WISCONSIN AVE',
  zoneCode: 'RS6',
}

describe('ParcelPopup', () => {
  describe('Display', () => {
    it('renders parcel address correctly', () => {
      const onClose = vi.fn()
      render(<ParcelPopup parcel={mockParcel} onClose={onClose} />)

      expect(screen.getByTestId('parcel-popup-address')).toHaveTextContent(
        '123 N WATER ST'
      )
    })

    it('renders parcel tax key correctly', () => {
      const onClose = vi.fn()
      render(<ParcelPopup parcel={mockParcel} onClose={onClose} />)

      expect(screen.getByTestId('parcel-popup-taxkey')).toHaveTextContent(
        '3620101110'
      )
    })

    it('renders parcel zoning code correctly', () => {
      const onClose = vi.fn()
      render(<ParcelPopup parcel={mockParcel} onClose={onClose} />)

      expect(screen.getByTestId('parcel-popup-zoning')).toHaveTextContent('C9A')
    })

    it('displays lot size when available', () => {
      const onClose = vi.fn()
      render(<ParcelPopup parcel={mockParcel} onClose={onClose} />)

      expect(screen.getByText('5,000 sq ft')).toBeInTheDocument()
    })

    it('displays assessed value when available', () => {
      const onClose = vi.fn()
      render(<ParcelPopup parcel={mockParcel} onClose={onClose} />)

      expect(screen.getByText('$500,000')).toBeInTheDocument()
    })

    it('does not display lot size section when not available', () => {
      const onClose = vi.fn()
      render(<ParcelPopup parcel={mockParcelMinimal} onClose={onClose} />)

      expect(screen.queryByText('sq ft')).not.toBeInTheDocument()
    })
  })

  describe('Close Behavior', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<ParcelPopup parcel={mockParcel} onClose={onClose} />)

      const closeButton = screen.getByTestId('parcel-popup-close')
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<ParcelPopup parcel={mockParcel} onClose={onClose} />)

      const backdrop = screen.getByTestId('parcel-popup-backdrop')
      await user.click(backdrop)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does not call onClose when popup content is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<ParcelPopup parcel={mockParcel} onClose={onClose} />)

      const popup = screen.getByTestId('parcel-popup')
      await user.click(popup)

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('Ask About Parcel', () => {
    it('shows ask button when onAskAbout is provided', () => {
      const onClose = vi.fn()
      const onAskAbout = vi.fn()
      render(
        <ParcelPopup
          parcel={mockParcel}
          onClose={onClose}
          onAskAbout={onAskAbout}
        />
      )

      expect(screen.getByTestId('parcel-popup-ask-button')).toBeInTheDocument()
      expect(screen.getByText('Ask about this parcel')).toBeInTheDocument()
    })

    it('does not show ask button when onAskAbout is not provided', () => {
      const onClose = vi.fn()
      render(<ParcelPopup parcel={mockParcel} onClose={onClose} />)

      expect(
        screen.queryByTestId('parcel-popup-ask-button')
      ).not.toBeInTheDocument()
    })

    it('calls onAskAbout with parcel data when ask button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      const onAskAbout = vi.fn()
      render(
        <ParcelPopup
          parcel={mockParcel}
          onClose={onClose}
          onAskAbout={onAskAbout}
        />
      )

      const askButton = screen.getByTestId('parcel-popup-ask-button')
      await user.click(askButton)

      expect(onAskAbout).toHaveBeenCalledWith(mockParcel)
    })
  })

  describe('Accessibility', () => {
    it('has dialog role', () => {
      const onClose = vi.fn()
      render(<ParcelPopup parcel={mockParcel} onClose={onClose} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('has accessible close button', () => {
      const onClose = vi.fn()
      render(<ParcelPopup parcel={mockParcel} onClose={onClose} />)

      expect(screen.getByLabelText('Close parcel popup')).toBeInTheDocument()
    })
  })
})
