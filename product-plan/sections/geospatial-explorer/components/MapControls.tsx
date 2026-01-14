'use client'

import { Plus, Minus, Locate, Box, Square } from 'lucide-react'
import type { MapViewMode } from '../types'

export interface MapControlsProps {
  viewMode: MapViewMode
  isLocating?: boolean
  onZoomIn?: () => void
  onZoomOut?: () => void
  onLocateMe?: () => void
  onViewModeToggle?: (mode: MapViewMode) => void
}

export function MapControls({
  viewMode,
  isLocating = false,
  onZoomIn,
  onZoomOut,
  onLocateMe,
  onViewModeToggle,
}: MapControlsProps) {
  return (
    <div className="absolute right-4 top-20 flex flex-col gap-2">
      {/* 2D/3D Toggle */}
      <div className="flex flex-col rounded-lg border-2 border-black bg-white dark:bg-stone-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] overflow-hidden">
        <button
          onClick={() => onViewModeToggle?.('2d')}
          className={`
            w-10 h-10 flex items-center justify-center
            transition-colors duration-100
            ${viewMode === '2d'
              ? 'bg-sky-500 text-white'
              : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
            }
          `}
          aria-label="2D view"
          title="2D View"
        >
          <Square className="w-5 h-5" />
        </button>
        <div className="h-px bg-black dark:bg-stone-600" />
        <button
          onClick={() => onViewModeToggle?.('3d')}
          className={`
            w-10 h-10 flex items-center justify-center
            transition-colors duration-100
            ${viewMode === '3d'
              ? 'bg-sky-500 text-white'
              : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
            }
          `}
          aria-label="3D view"
          title="3D View"
        >
          <Box className="w-5 h-5" />
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="flex flex-col rounded-lg border-2 border-black bg-white dark:bg-stone-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] overflow-hidden">
        <button
          onClick={onZoomIn}
          className="
            w-10 h-10 flex items-center justify-center
            text-stone-700 dark:text-stone-300
            hover:bg-stone-100 dark:hover:bg-stone-700
            active:bg-stone-200 dark:active:bg-stone-600
            transition-colors duration-100
          "
          aria-label="Zoom in"
        >
          <Plus className="w-5 h-5" />
        </button>
        <div className="h-px bg-black dark:bg-stone-600" />
        <button
          onClick={onZoomOut}
          className="
            w-10 h-10 flex items-center justify-center
            text-stone-700 dark:text-stone-300
            hover:bg-stone-100 dark:hover:bg-stone-700
            active:bg-stone-200 dark:active:bg-stone-600
            transition-colors duration-100
          "
          aria-label="Zoom out"
        >
          <Minus className="w-5 h-5" />
        </button>
      </div>

      {/* Locate Me Button */}
      <button
        onClick={onLocateMe}
        disabled={isLocating}
        className={`
          w-10 h-10 rounded-lg border-2 border-black
          shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
          flex items-center justify-center
          transition-all duration-100
          ${isLocating
            ? 'bg-sky-500 text-white animate-pulse'
            : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 hover:translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
          }
        `}
        aria-label={isLocating ? 'Locating...' : 'Locate me'}
        title={isLocating ? 'Locating...' : 'Find my location'}
      >
        <Locate className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}
