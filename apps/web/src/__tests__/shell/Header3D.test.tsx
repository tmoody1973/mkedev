import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '@/components/shell/Header'

// =============================================================================
// Test: Header 3D Toggle Button
// Task Group 2 Tests
// =============================================================================

// Mock the UserMenu component since it depends on Clerk
vi.mock('@/components/user-menu', () => ({
  UserMenu: () => <div data-testid="user-menu">User Menu</div>,
}))

describe('Header 3D Toggle Button', () => {
  it('renders 3D toggle button with Box icon', () => {
    render(<Header />)

    const button = screen.getByLabelText('Toggle 3D view')
    expect(button).toBeInTheDocument()
  })

  it('has correct aria-label and aria-pressed attributes', () => {
    const { rerender } = render(<Header is3DMode={false} />)

    const button = screen.getByLabelText('Toggle 3D view')
    expect(button).toHaveAttribute('aria-pressed', 'false')

    rerender(<Header is3DMode={true} />)
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls on3DToggle callback when clicked', () => {
    const on3DToggle = vi.fn()
    render(<Header on3DToggle={on3DToggle} />)

    const button = screen.getByLabelText('Toggle 3D view')
    fireEvent.click(button)

    expect(on3DToggle).toHaveBeenCalledTimes(1)
  })

  it('shows active state (sky-500 bg) when 3D mode is enabled', () => {
    const { rerender } = render(<Header is3DMode={false} />)

    const button = screen.getByLabelText('Toggle 3D view')

    // When inactive, should have white/stone background
    expect(button.className).toContain('bg-white')
    expect(button.className).not.toContain('bg-sky-500')

    // When active, should have sky-500 background
    rerender(<Header is3DMode={true} />)
    expect(button.className).toContain('bg-sky-500')
  })
})
