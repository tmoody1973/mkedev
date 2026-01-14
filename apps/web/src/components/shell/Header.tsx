'use client'

import { Mic, MicOff, Layers, Map, Box } from 'lucide-react'
import { UserMenu } from '@/components/user-menu'

export interface HeaderProps {
  /** Whether voice mode is active */
  isVoiceActive?: boolean
  /** Callback when voice toggle is clicked */
  onVoiceToggle?: () => void
  /** Whether 3D mode is enabled */
  is3DMode?: boolean
  /** Callback when 3D toggle is clicked */
  on3DToggle?: () => void
  /** Callback when map layers button is clicked */
  onLayersClick?: () => void
  /** Callback when logo is clicked */
  onLogoClick?: () => void
  /** Callback when map toggle is clicked (mobile) */
  onMapToggle?: () => void
  /** Whether map is visible (mobile) */
  isMapVisible?: boolean
}

/**
 * Header component with MKE.dev logo, voice toggle, 3D toggle, layers button, and user menu.
 * Follows RetroUI neobrutalist styling with translate-y hover effects.
 */
export function Header({
  isVoiceActive = false,
  onVoiceToggle,
  is3DMode = false,
  on3DToggle,
  onLayersClick,
  onLogoClick,
  onMapToggle,
  isMapVisible = false,
}: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between h-16 px-4 border-b-2 border-black dark:border-stone-700 bg-white dark:bg-stone-900"
      data-testid="app-header"
    >
      {/* Logo */}
      <button
        onClick={onLogoClick}
        className="font-head text-2xl font-bold text-stone-900 dark:text-stone-50 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
        aria-label="MKE.dev home"
      >
        MKE.dev
      </button>

      {/* Center Controls */}
      <div className="flex items-center gap-2">
        {/* Voice Toggle - placeholder for Week 2 */}
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
          aria-pressed={isVoiceActive}
        >
          {isVoiceActive ? (
            <Mic className="w-6 h-6" />
          ) : (
            <MicOff className="w-6 h-6" />
          )}
        </button>

        {/* 3D View Toggle */}
        <button
          onClick={on3DToggle}
          className={`
            flex items-center justify-center w-12 h-12 rounded-lg border-2 border-black
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
            hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            active:translate-y-2 active:shadow-none
            transition-all duration-100
            ${
              is3DMode
                ? 'bg-sky-500 text-white'
                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
            }
          `}
          aria-label="Toggle 3D view"
          aria-pressed={is3DMode}
        >
          <Box className="w-6 h-6" />
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
          aria-label="Toggle map layers panel"
        >
          <Layers className="w-6 h-6" />
        </button>

        {/* Mobile Map Toggle */}
        <button
          onClick={onMapToggle}
          className={`
            md:hidden flex items-center justify-center w-12 h-12 rounded-lg border-2 border-black
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
            hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            active:translate-y-2 active:shadow-none
            transition-all duration-100
            ${
              isMapVisible
                ? 'bg-sky-500 text-white'
                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
            }
          `}
          aria-label={isMapVisible ? 'Hide map' : 'Show map'}
          aria-pressed={isMapVisible}
        >
          <Map className="w-6 h-6" />
        </button>
      </div>

      {/* User Menu */}
      <UserMenu />
    </header>
  )
}
