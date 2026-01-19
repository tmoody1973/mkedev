'use client'

import { Mic, MicOff, Map, Box, History, Sparkles } from 'lucide-react'
import { UserMenu } from '@/components/user-menu'
import { AddressSearchBox } from './AddressSearchBox'
import { LayersDropdown } from './LayersDropdown'

export interface HeaderProps {
  /** Whether voice mode is active */
  isVoiceActive?: boolean
  /** Callback when voice toggle is clicked */
  onVoiceToggle?: () => void
  /** Whether 3D mode is enabled */
  is3DMode?: boolean
  /** Callback when 3D toggle is clicked */
  on3DToggle?: () => void
  /** Callback when visualize button is clicked */
  onVisualizeClick?: () => void
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
  /** Callback when address is selected from autocomplete (with coordinates) */
  onAddressSelect?: (coordinates: [number, number], address: string) => void
}

/**
 * Header component with MKE.dev logo, Mapbox address search, toggles, and user menu.
 * Uses official Mapbox SearchBox for address autocomplete.
 */
export function Header({
  isVoiceActive = false,
  onVoiceToggle,
  is3DMode = false,
  on3DToggle,
  onVisualizeClick,
  onLogoClick,
  onMapToggle,
  isMapVisible = false,
  isSidebarOpen = false,
  onSidebarToggle,
  showSidebarToggle = false,
  onAddressSelect,
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

      {/* Mapbox Address Search Box */}
      <div className="hidden sm:block flex-1 max-w-md mx-4">
        <AddressSearchBox onAddressSelect={onAddressSelect} />
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

        {/* AI Site Visualizer */}
        <button
          onClick={onVisualizeClick}
          className={`
            flex items-center justify-center w-12 h-12 rounded-lg border-2 border-black
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
            hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            active:translate-y-2 active:shadow-none
            transition-all duration-100
            bg-gradient-to-br from-purple-500 to-pink-500 text-white
            hover:from-purple-600 hover:to-pink-600
          `}
          aria-label="Open AI Site Visualizer"
          title="AI Site Visualizer"
        >
          <Sparkles className="w-6 h-6" />
        </button>

        {/* Map Layers Dropdown */}
        <LayersDropdown />

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
