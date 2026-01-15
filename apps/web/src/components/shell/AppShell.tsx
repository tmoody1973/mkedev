'use client'

import { useState, useCallback, type ReactNode } from 'react'
import { Header } from './Header'
import { useMap } from '@/contexts/MapContext'

export interface AppShellProps {
  /** Content for the chat panel (left side on desktop) */
  chatPanel: ReactNode
  /** Content for the map panel (right side on desktop) */
  mapPanel: ReactNode
  /** Optional sidebar for conversation history */
  sidebar?: ReactNode
  /** Whether the sidebar is visible */
  isSidebarOpen?: boolean
  /** Callback to toggle sidebar */
  onSidebarToggle?: () => void
  /** Whether voice mode is active */
  isVoiceActive?: boolean
  /** Callback when voice toggle is clicked */
  onVoiceToggle?: () => void
  /** Whether the layers panel is open */
  isLayersPanelOpen?: boolean
  /** Callback when map layers button is clicked */
  onLayersClick?: () => void
  /** Callback when logo is clicked */
  onLogoClick?: () => void
  /** Initial map visibility state for mobile */
  initialMapVisible?: boolean
  /** Callback when address is selected from autocomplete */
  onAddressSelect?: (coordinates: [number, number], address: string) => void
}

/**
 * Main application shell with 40/60 split layout.
 * - Desktop: Chat panel (40%) on left, map panel (60%) on right
 * - Mobile: Stacked layout with chat primary, map as collapsible overlay
 *
 * Follows RetroUI neobrutalist styling with 2px borders.
 */
export function AppShell({
  chatPanel,
  mapPanel,
  sidebar,
  isSidebarOpen = false,
  onSidebarToggle,
  isVoiceActive = false,
  onVoiceToggle,
  isLayersPanelOpen = false,
  onLayersClick,
  onLogoClick,
  initialMapVisible = false,
  onAddressSelect,
}: AppShellProps) {
  const [isMapVisible, setIsMapVisible] = useState(initialMapVisible)
  const { is3DMode, toggle3DMode } = useMap()

  const handleMapToggle = useCallback(() => {
    setIsMapVisible((prev) => !prev)
  }, [])

  return (
    <div
      className="flex flex-col h-screen bg-stone-50 dark:bg-stone-950"
      data-testid="app-shell"
    >
      {/* Header */}
      <Header
        isVoiceActive={isVoiceActive}
        onVoiceToggle={onVoiceToggle}
        is3DMode={is3DMode}
        on3DToggle={toggle3DMode}
        isLayersPanelOpen={isLayersPanelOpen}
        onLayersClick={onLayersClick}
        onLogoClick={onLogoClick}
        onMapToggle={handleMapToggle}
        isMapVisible={isMapVisible}
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={onSidebarToggle}
        showSidebarToggle={!!sidebar}
        onAddressSelect={onAddressSelect}
      />

      {/* Main Content: Split View */}
      <main className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Conversation Sidebar */}
        {sidebar}

        {/* Chat Panel - 40% on desktop, full width on mobile */}
        <div
          className="w-full md:w-2/5 lg:w-[40%] h-full min-h-0 flex flex-col border-r-0 md:border-r-2 border-black dark:border-stone-700"
          data-testid="chat-panel-container"
        >
          {chatPanel}
        </div>

        {/* Map Panel - 60% on desktop, overlay on mobile */}
        <div
          className={`
            absolute inset-0 md:relative md:inset-auto
            md:w-3/5 lg:w-[60%] h-full flex flex-col
            bg-stone-50 dark:bg-stone-950
            transition-transform duration-300 ease-out
            ${isMapVisible ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
          `}
          data-testid="map-panel-container"
        >
          {/* Mobile: Close bar for map overlay */}
          <div className="md:hidden flex items-center justify-center h-10 bg-white dark:bg-stone-900 border-b-2 border-black dark:border-stone-700">
            <button
              onClick={handleMapToggle}
              className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400"
              aria-label="Close map"
            >
              <div className="w-12 h-1 rounded-full bg-stone-300 dark:bg-stone-600" />
            </button>
          </div>
          <div className="flex-1 relative min-h-0">
            <div className="absolute inset-0">
              {mapPanel}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
