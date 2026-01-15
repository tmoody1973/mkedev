'use client'

import { Mic, MicOff, Layers, Map, Box, History } from 'lucide-react'
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
  /** Whether the layers panel is open */
  isLayersPanelOpen?: boolean
  /** Callback when map layers button is clicked */
  onLayersClick?: () => void
  /** Callback when logo is clicked */
  onLogoClick?: () => void
  /** Callback when map toggle is clicked (mobile) */
  onMapToggle?: () => void
  /** Whether map is visible (mobile) */
  isMapVisible?: boolean
  /** Whether the sidebar is open */
  isSidebarOpen?: boolean
  /** Callback when sidebar toggle is clicked */
  onSidebarToggle?: () => void
  /** Whether to show the sidebar toggle button */
  showSidebarToggle?: boolean
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
  isLayersPanelOpen = false,
  onLayersClick,
  onLogoClick,
  onMapToggle,
  isMapVisible = false,
  isSidebarOpen = false,
  onSidebarToggle,
  showSidebarToggle = false,
}: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between h-16 px-4 border-b-2 border-black dark:border-stone-700 bg-white dark:bg-stone-900"
      data-testid="app-header"
    >
      {/* Logo and History Toggle */}
      <div className="flex items-center gap-3">
        {/* Chat History Toggle */}
        {showSidebarToggle && (
          <button
            onClick={onSidebarToggle}
            className={`
              flex items-center justify-center w-10 h-10 rounded-lg border-2 border-black
              shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)]
              hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
              active:translate-y-1 active:shadow-none
              transition-all duration-100
              ${
                isSidebarOpen
                  ? 'bg-sky-500 text-white'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }
            `}
            aria-label={isSidebarOpen ? 'Hide chat history' : 'Show chat history'}
            aria-pressed={isSidebarOpen}
          >
            <History className="w-5 h-5" />
          </button>
        )}

        {/* Logo */}
        <button
          onClick={onLogoClick}
          className="hover:opacity-80 transition-opacity"
          aria-label="MKE.dev home"
        >
          <img
            src="/mkedev-logo-nolabel.svg"
            alt="MKE.dev"
            className="h-10 w-auto dark:invert"
          />
        </button>
      </div>

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
          className={`
            flex items-center justify-center w-12 h-12 rounded-lg border-2 border-black
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
            hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            active:translate-y-2 active:shadow-none
            transition-all duration-100
            ${
              isLayersPanelOpen
                ? 'bg-sky-500 text-white'
                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
            }
          `}
          aria-label="Toggle map layers panel"
          aria-pressed={isLayersPanelOpen}
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
