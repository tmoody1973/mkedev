'use client'

// =============================================================================
// HomePopup Component
// Displays home for sale information in a neobrutalist popup overlay
// =============================================================================

import { useCallback } from 'react'
import { X, Home, MapPin, BedDouble, Bath, Square, ExternalLink, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HomeForSale } from './layers/homes-layer-manager'

// =============================================================================
// Types
// =============================================================================

export interface HomePopupProps {
  /** Home data to display */
  home: HomeForSale
  /** Callback when popup is closed */
  onClose: () => void
  /** Callback when "View Listing" is clicked */
  onViewListing?: (home: HomeForSale) => void
  /** Callback when "Street View" is clicked */
  onStreetView?: (home: HomeForSale) => void
  /** Position of the popup (optional, defaults to bottom-right) */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** Additional class name */
  className?: string
}

// =============================================================================
// Component
// =============================================================================

/**
 * Home for sale information popup with neobrutalist styling.
 * Displays address, neighborhood, beds/baths, and action buttons.
 */
export function HomePopup({
  home,
  onClose,
  onViewListing,
  onStreetView,
  position = 'bottom-right',
  className,
}: HomePopupProps) {
  const handleViewListing = useCallback(() => {
    if (home.listingUrl) {
      window.open(home.listingUrl, '_blank', 'noopener,noreferrer')
    }
    onViewListing?.(home)
  }, [home, onViewListing])

  const handleStreetView = useCallback(() => {
    onStreetView?.(home)
  }, [home, onStreetView])

  const handleClickOutside = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
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

  // Calculate total baths
  const totalBaths = (home.fullBaths || 0) + (home.halfBaths || 0) * 0.5

  return (
    <div
      className="absolute inset-0 z-20"
      onClick={handleClickOutside}
      data-testid="home-popup-backdrop"
    >
      <div
        className={cn(
          'absolute w-80 max-w-[calc(100%-2rem)]',
          positionClasses[position],
          className
        )}
        data-testid="home-popup"
        role="dialog"
        aria-labelledby="home-popup-title"
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
          <div className="flex items-center justify-between p-4 border-b-2 border-black dark:border-stone-700 bg-sky-50 dark:bg-sky-900/30">
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
                id="home-popup-title"
                className="font-heading font-bold text-stone-900 dark:text-stone-50"
              >
                Home For Sale
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
              aria-label="Close home popup"
            >
              <X className="w-4 h-4 text-stone-600 dark:text-stone-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
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
                <p className="font-sans text-sm font-medium text-stone-900 dark:text-stone-100 break-words">
                  {home.address || 'Unknown Address'}
                </p>
              </div>
            </div>

            {/* Neighborhood */}
            {home.neighborhood && (
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg shrink-0',
                    'bg-purple-100 dark:bg-purple-900',
                    'border-2 border-black dark:border-purple-600',
                    'flex items-center justify-center'
                  )}
                >
                  <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Neighborhood
                  </p>
                  <p className="font-sans text-sm text-stone-900 dark:text-stone-100">
                    {home.neighborhood}
                  </p>
                </div>
              </div>
            )}

            {/* Property Details Row */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t-2 border-dashed border-stone-200 dark:border-stone-700">
              {/* Bedrooms */}
              {home.bedrooms !== undefined && (
                <div className="text-center p-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <BedDouble className="w-4 h-4 text-sky-500" />
                    <span className="text-lg font-bold text-stone-900 dark:text-stone-100">
                      {home.bedrooms}
                    </span>
                  </div>
                  <span className="text-xs text-stone-500 dark:text-stone-400">beds</span>
                </div>
              )}

              {/* Bathrooms */}
              {totalBaths > 0 && (
                <div className="text-center p-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Bath className="w-4 h-4 text-sky-500" />
                    <span className="text-lg font-bold text-stone-900 dark:text-stone-100">
                      {totalBaths % 1 === 0 ? totalBaths : totalBaths.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-xs text-stone-500 dark:text-stone-400">baths</span>
                </div>
              )}

              {/* Square Footage */}
              {home.buildingSqFt && (
                <div className="text-center p-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Square className="w-4 h-4 text-sky-500" />
                    <span className="text-lg font-bold text-stone-900 dark:text-stone-100">
                      {home.buildingSqFt.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs text-stone-500 dark:text-stone-400">sqft</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 pt-0 space-y-2">
            {onStreetView && home.coordinates && (
              <button
                onClick={handleStreetView}
                className={cn(
                  'w-full px-4 py-3 rounded-lg',
                  'bg-amber-500 text-white',
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
              >
                <Eye className="w-4 h-4" />
                Street View
              </button>
            )}
            {home.listingUrl && (
              <button
                onClick={handleViewListing}
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
                  'transition-all duration-100',
                  'flex items-center justify-center gap-2'
                )}
              >
                <ExternalLink className="w-4 h-4" />
                View Listing
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
