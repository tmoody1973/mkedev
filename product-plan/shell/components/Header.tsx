'use client'

import { Mic, MicOff, Layers } from 'lucide-react'
import { UserMenu } from './UserMenu'

export interface HeaderProps {
  /** User information */
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

export function Header({
  user,
  isVoiceActive = false,
  onVoiceToggle,
  onLayersClick,
  onLogout,
  onLogoClick,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-16 px-4 border-b-2 border-black dark:border-stone-700 bg-white dark:bg-stone-900">
      {/* Logo */}
      <button
        onClick={onLogoClick}
        className="font-heading text-2xl font-bold text-stone-900 dark:text-stone-50 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
      >
        MKE.dev
      </button>

      {/* Center Controls */}
      <div className="flex items-center gap-2">
        {/* Voice Toggle */}
        <button
          onClick={onVoiceToggle}
          className={`
            flex items-center justify-center w-12 h-12 rounded-lg border-2 border-black
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
            hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            active:translate-y-2 active:shadow-none
            transition-all duration-100
            ${
              isVoiceActive
                ? 'bg-sky-500 text-white'
                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
            }
          `}
          aria-label={isVoiceActive ? 'Disable voice mode' : 'Enable voice mode'}
        >
          {isVoiceActive ? (
            <Mic className="w-6 h-6" />
          ) : (
            <MicOff className="w-6 h-6" />
          )}
        </button>

        {/* Map Layers */}
        <button
          onClick={onLayersClick}
          className="
            flex items-center justify-center w-12 h-12 rounded-lg border-2 border-black
            bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
            hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            active:translate-y-2 active:shadow-none
            transition-all duration-100
          "
          aria-label="Toggle map layers"
        >
          <Layers className="w-6 h-6" />
        </button>
      </div>

      {/* User Menu */}
      <UserMenu user={user} onLogout={onLogout} />
    </header>
  )
}
