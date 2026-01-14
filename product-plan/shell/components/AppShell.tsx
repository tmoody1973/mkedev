'use client'

import { Header } from './Header'

export interface AppShellProps {
  /** Content for the chat panel (left side) */
  chatPanel: React.ReactNode
  /** Content for the map panel (right side) */
  mapPanel: React.ReactNode
  /** User information for the header */
  user?: {
    name: string
    avatarUrl?: string
  }
  /** Whether voice mode is active */
  isVoiceActive?: boolean
  /** Callback when voice toggle is clicked */
  onVoiceToggle?: () => void
  /** Callback when map layers button is clicked */
  onLayersClick?: () => void
  /** Callback when user logs out */
  onLogout?: () => void
  /** Callback when logo is clicked */
  onLogoClick?: () => void
}

export function AppShell({
  chatPanel,
  mapPanel,
  user,
  isVoiceActive = false,
  onVoiceToggle,
  onLayersClick,
  onLogout,
  onLogoClick,
}: AppShellProps) {
  return (
    <div className="flex flex-col h-screen bg-stone-50 dark:bg-stone-950">
      {/* Header */}
      <Header
        user={user}
        isVoiceActive={isVoiceActive}
        onVoiceToggle={onVoiceToggle}
        onLayersClick={onLayersClick}
        onLogout={onLogout}
        onLogoClick={onLogoClick}
      />

      {/* Main Content: Split View */}
      <main className="flex flex-1 overflow-hidden">
        {/* Chat Panel - 40% on desktop, full width stacked on mobile */}
        <div className="w-full md:w-2/5 lg:w-[40%] flex flex-col border-r-2 border-black dark:border-stone-700 order-2 md:order-1">
          {chatPanel}
        </div>

        {/* Map Panel - 60% on desktop, collapsible on mobile */}
        <div className="hidden md:flex md:w-3/5 lg:w-[60%] flex-col order-1 md:order-2">
          {mapPanel}
        </div>

        {/* Mobile: Map toggle would appear here as an overlay */}
      </main>
    </div>
  )
}
