'use client'

// =============================================================================
// CommercialPropertyPopup Component
// Displays commercial property information in a neobrutalist popup overlay
// =============================================================================

import { useCallback } from 'react'
import { X, Building2, MapPin, Square, DollarSign, Building } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CommercialProperty } from './layers/commercial-layer-manager'

// =============================================================================
// Types
// =============================================================================

export interface CommercialPropertyPopupProps {
  /** Commercial property data to display */
  property: CommercialProperty
  /** Callback when popup is closed */
  onClose: () => void
  /** Callback when "Ask about property" is clicked */
  onAskAbout?: (property: CommercialProperty) => void
  /** Position of the popup (optional, defaults to bottom-right) */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** Additional class name */
  className?: string
}

// =============================================================================
// Component
// =============================================================================

/**
 * Commercial property information popup with neobrutalist styling.
 * Displays address, property type, size, price, and zoning.
 */
export function CommercialPropertyPopup({
  property,
  onClose,
  onAskAbout,
  position = 'bottom-right',
  className,
}: CommercialPropertyPopupProps) {
  const handleAskAbout = useCallback(() => {
    onAskAbout?.(property)
    onClose()
  }, [onAskAbout, property, onClose])

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

  // Format price
  const formattedPrice = property.askingPrice
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(property.askingPrice)
    : null

  return (
    <div
      className="absolute inset-0 z-20"
      onClick={handleClickOutside}
      data-testid="commercial-property-popup-backdrop"
    >
      <div
        className={cn(
          'absolute w-80 max-w-[calc(100%-2rem)]',
          positionClasses[position],
          className
        )}
        data-testid="commercial-property-popup"
        role="dialog"
        aria-labelledby="commercial-property-popup-title"
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
          <div className="flex items-center justify-between p-4 border-b-2 border-black dark:border-stone-700 bg-purple-50 dark:bg-purple-900/30">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-lg',
                  'bg-purple-100 dark:bg-purple-900',
                  'border-2 border-black dark:border-white',
                  'flex items-center justify-center'
                )}
              >
                <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h2
                id="commercial-property-popup-title"
                className="font-heading font-bold text-stone-900 dark:text-stone-50"
              >
                Commercial Property
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
              aria-label="Close commercial property popup"
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
                <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Address
                </p>
                <p className="font-sans text-sm font-medium text-stone-900 dark:text-stone-100 break-words">
                  {property.address || 'Unknown Address'}
                </p>
              </div>
            </div>

            {/* Property Type */}
            {property.propertyType && (
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg shrink-0',
                    'bg-purple-100 dark:bg-purple-900',
                    'border-2 border-black dark:border-purple-600',
                    'flex items-center justify-center'
                  )}
                >
                  <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Type
                  </p>
                  <p className="font-sans text-sm text-stone-900 dark:text-stone-100 capitalize">
                    {property.propertyType}
                  </p>
                </div>
              </div>
            )}

            {/* Property Details Row */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t-2 border-dashed border-stone-200 dark:border-stone-700">
              {/* Square Footage */}
              {property.buildingSqFt && (
                <div className="text-center p-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Square className="w-4 h-4 text-purple-500" />
                    <span className="text-lg font-bold text-stone-900 dark:text-stone-100">
                      {property.buildingSqFt.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs text-stone-500 dark:text-stone-400">sqft</span>
                </div>
              )}

              {/* Asking Price */}
              {formattedPrice && (
                <div className="text-center p-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-lg font-bold text-stone-900 dark:text-stone-100">
                      {formattedPrice}
                    </span>
                  </div>
                  <span className="text-xs text-stone-500 dark:text-stone-400">asking</span>
                </div>
              )}
            </div>

            {/* Zoning */}
            {property.zoning && (
              <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Zoning
                </span>
                <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {property.zoning}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {onAskAbout && (
            <div className="p-4 pt-0">
              <button
                onClick={handleAskAbout}
                className={cn(
                  'w-full px-4 py-3 rounded-lg',
                  'bg-purple-500 text-white',
                  'border-2 border-black dark:border-white',
                  'font-sans font-semibold text-sm',
                  'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
                  'dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]',
                  'hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                  'dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]',
                  'active:translate-y-2 active:shadow-none',
                  'transition-all duration-100'
                )}
              >
                Ask about this property
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
