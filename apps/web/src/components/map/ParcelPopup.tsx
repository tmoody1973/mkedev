'use client'

// =============================================================================
// ParcelPopup Component
// Displays parcel information in a neobrutalist popup overlay
// =============================================================================

import { useCallback } from 'react'
import { X, Home, Key, Building2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ParcelData } from './layers/esri-layer-manager'

// =============================================================================
// Types
// =============================================================================

export interface ParcelPopupProps {
  /** Parcel data to display */
  parcel: ParcelData
  /** Callback when popup is closed */
  onClose: () => void
  /** Callback when "Ask about this parcel" is clicked */
  onAskAbout?: (parcel: ParcelData) => void
  /** Callback when "Visualize" is clicked - receives parcel for context */
  onVisualize?: (parcel: ParcelData) => void
  /** Position of the popup (optional, defaults to bottom-right) */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** Additional class name */
  className?: string
}

// =============================================================================
// Component
// =============================================================================

/**
 * Parcel information popup with neobrutalist styling.
 * Displays address, tax key, and zoning code for a selected parcel.
 * Includes action button to send parcel context to chat.
 */
export function ParcelPopup({
  parcel,
  onClose,
  onAskAbout,
  onVisualize,
  position = 'bottom-right',
  className,
}: ParcelPopupProps) {
  const handleAskAbout = useCallback(() => {
    onAskAbout?.(parcel)
  }, [onAskAbout, parcel])

  const handleVisualize = useCallback(() => {
    onVisualize?.(parcel)
    // Close popup after clicking visualize
    onClose()
  }, [onVisualize, parcel, onClose])

  const handleClickOutside = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only close if clicking the backdrop, not the popup content
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose]
  )

  // Position classes based on prop
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4 md:bottom-20 md:right-4',
    'bottom-left': 'bottom-4 left-4 md:bottom-20 md:left-4',
    'top-right': 'top-4 right-4 md:top-20 md:right-4',
    'top-left': 'top-4 left-4 md:top-20 md:left-4',
  }

  return (
    <div
      className="absolute inset-0 z-20"
      onClick={handleClickOutside}
      data-testid="parcel-popup-backdrop"
    >
      <div
        className={cn(
          'absolute w-80 max-w-[calc(100%-2rem)]',
          positionClasses[position],
          className
        )}
        data-testid="parcel-popup"
        role="dialog"
        aria-labelledby="parcel-popup-title"
        aria-describedby="parcel-popup-description"
      >
        <div
          className={cn(
            'bg-white dark:bg-stone-900',
            'border-2 border-black dark:border-white',
            'rounded-lg',
            'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
            'dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]',
            'overflow-hidden'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b-2 border-black dark:border-stone-700">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-lg',
                  'bg-sky-100 dark:bg-sky-900',
                  'border-2 border-black dark:border-white',
                  'flex items-center justify-center'
                )}
              >
                <Home className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <h2
                id="parcel-popup-title"
                className="font-heading font-bold text-stone-900 dark:text-stone-50"
              >
                Parcel Info
              </h2>
            </div>
            <button
              onClick={onClose}
              className={cn(
                'w-8 h-8 rounded-lg',
                'bg-stone-100 dark:bg-stone-800',
                'border-2 border-black dark:border-white',
                'flex items-center justify-center',
                'hover:bg-stone-200 dark:hover:bg-stone-700',
                'transition-colors duration-100'
              )}
              aria-label="Close parcel popup"
              data-testid="parcel-popup-close"
            >
              <X className="w-4 h-4 text-stone-600 dark:text-stone-400" />
            </button>
          </div>

          {/* Content */}
          <div
            id="parcel-popup-description"
            className="p-4 space-y-3"
          >
            {/* Address */}
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-8 h-8 rounded-lg shrink-0',
                  'bg-amber-100 dark:bg-amber-900',
                  'border-2 border-black dark:border-amber-600',
                  'flex items-center justify-center'
                )}
              >
                <Home className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Address
                </p>
                <p
                  className="font-sans text-sm text-stone-900 dark:text-stone-100 break-words"
                  data-testid="parcel-popup-address"
                >
                  {parcel.address || 'Unknown Address'}
                </p>
              </div>
            </div>

            {/* Tax Key */}
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-8 h-8 rounded-lg shrink-0',
                  'bg-sky-100 dark:bg-sky-900',
                  'border-2 border-black dark:border-sky-600',
                  'flex items-center justify-center'
                )}
              >
                <Key className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Tax Key
                </p>
                <p
                  className="font-mono text-sm text-stone-900 dark:text-stone-100"
                  data-testid="parcel-popup-taxkey"
                >
                  {parcel.taxKey || 'N/A'}
                </p>
              </div>
            </div>

            {/* Zoning Code */}
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-8 h-8 rounded-lg shrink-0',
                  'bg-emerald-100 dark:bg-emerald-900',
                  'border-2 border-black dark:border-emerald-600',
                  'flex items-center justify-center'
                )}
              >
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Zoning
                </p>
                <p
                  className="font-mono text-sm text-stone-900 dark:text-stone-100"
                  data-testid="parcel-popup-zoning"
                >
                  {parcel.zoneCode || 'N/A'}
                </p>
              </div>
            </div>

            {/* Optional: Lot Size and Assessed Value */}
            {(parcel.lotSize || parcel.assessedValue) && (
              <div className="pt-2 border-t-2 border-dashed border-stone-200 dark:border-stone-700 space-y-2">
                {parcel.lotSize && (
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-500 dark:text-stone-400">
                      Lot Size
                    </span>
                    <span className="font-mono text-stone-700 dark:text-stone-300">
                      {parcel.lotSize.toLocaleString()} sq ft
                    </span>
                  </div>
                )}
                {parcel.assessedValue && (
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-500 dark:text-stone-400">
                      Assessed Value
                    </span>
                    <span className="font-mono text-stone-700 dark:text-stone-300">
                      ${parcel.assessedValue.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {(onAskAbout || onVisualize) && (
            <div className="p-4 pt-0 space-y-2">
              {onVisualize && (
                <button
                  onClick={handleVisualize}
                  className={cn(
                    'w-full px-4 py-3 rounded-lg',
                    'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
                    'border-2 border-black dark:border-white',
                    'font-sans font-semibold text-sm',
                    'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
                    'dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]',
                    'hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                    'dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]',
                    'active:translate-y-2 active:shadow-none',
                    'transition-all duration-100',
                    'flex items-center justify-center gap-2'
                  )}
                  data-testid="parcel-popup-visualize-button"
                >
                  <Sparkles className="w-4 h-4" />
                  Visualize this site
                </button>
              )}
              {onAskAbout && (
                <button
                  onClick={handleAskAbout}
                  className={cn(
                    'w-full px-4 py-3 rounded-lg',
                    'bg-sky-500 text-white',
                    'border-2 border-black dark:border-white',
                    'font-sans font-semibold text-sm',
                    'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
                    'dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]',
                    'hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                    'dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]',
                    'active:translate-y-2 active:shadow-none',
                    'transition-all duration-100'
                  )}
                  data-testid="parcel-popup-ask-button"
                >
                  Ask about this parcel
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
