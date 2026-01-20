'use client'

// =============================================================================
// DevelopmentSitePopup Component
// Displays development site information in a neobrutalist popup overlay
// =============================================================================

import { useCallback } from 'react'
import { X, Construction, MapPin, LandPlot, DollarSign, Building2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DevelopmentSite } from './layers/development-sites-layer-manager'

// =============================================================================
// Types
// =============================================================================

export interface DevelopmentSitePopupProps {
  /** Development site data to display */
  site: DevelopmentSite
  /** Callback when popup is closed */
  onClose: () => void
  /** Callback when "Ask about site" is clicked */
  onAskAbout?: (site: DevelopmentSite) => void
  /** Callback when "Visualize" is clicked */
  onVisualize?: (site: DevelopmentSite) => void
  /** Position of the popup (optional, defaults to bottom-right) */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** Additional class name */
  className?: string
}

// =============================================================================
// Component
// =============================================================================

/**
 * Development site information popup with neobrutalist styling.
 * Displays address, site name, lot size, price, zoning, and incentives.
 */
export function DevelopmentSitePopup({
  site,
  onClose,
  onAskAbout,
  onVisualize,
  position = 'bottom-right',
  className,
}: DevelopmentSitePopupProps) {
  const handleAskAbout = useCallback(() => {
    onAskAbout?.(site)
    onClose()
  }, [onAskAbout, site, onClose])

  const handleVisualize = useCallback(() => {
    onVisualize?.(site)
    onClose()
  }, [onVisualize, site, onClose])

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
  const formattedPrice = site.askingPrice
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(site.askingPrice)
    : null

  return (
    <div
      className="absolute inset-0 z-20"
      onClick={handleClickOutside}
      data-testid="development-site-popup-backdrop"
    >
      <div
        className={cn(
          'absolute w-80 max-w-[calc(100%-2rem)]',
          positionClasses[position],
          className
        )}
        data-testid="development-site-popup"
        role="dialog"
        aria-labelledby="development-site-popup-title"
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
          <div className="flex items-center justify-between p-4 border-b-2 border-black dark:border-stone-700 bg-green-50 dark:bg-green-900/30">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-lg',
                  'bg-green-100 dark:bg-green-900',
                  'border-2 border-black dark:border-white',
                  'flex items-center justify-center'
                )}
              >
                <Construction className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <h2
                id="development-site-popup-title"
                className="font-heading font-bold text-stone-900 dark:text-stone-50"
              >
                Development Site
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
              aria-label="Close development site popup"
            >
              <X className="w-4 h-4 text-stone-600 dark:text-stone-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Site Name */}
            {site.siteName && (
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg shrink-0',
                    'bg-green-100 dark:bg-green-900',
                    'border-2 border-black dark:border-green-600',
                    'flex items-center justify-center'
                  )}
                >
                  <Construction className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Site Name
                  </p>
                  <p className="font-sans text-sm font-medium text-stone-900 dark:text-stone-100 break-words">
                    {site.siteName}
                  </p>
                </div>
              </div>
            )}

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
                <p className="font-sans text-sm text-stone-900 dark:text-stone-100 break-words">
                  {site.address || 'Unknown Address'}
                </p>
              </div>
            </div>

            {/* Property Details Row */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t-2 border-dashed border-stone-200 dark:border-stone-700">
              {/* Lot Size */}
              {site.lotSizeSqFt && (
                <div className="text-center p-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <LandPlot className="w-4 h-4 text-green-500" />
                    <span className="text-lg font-bold text-stone-900 dark:text-stone-100">
                      {site.lotSizeSqFt.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs text-stone-500 dark:text-stone-400">sqft lot</span>
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
            {site.zoning && (
              <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Zoning
                  </span>
                </div>
                <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {site.zoning}
                </span>
              </div>
            )}

            {/* Incentives */}
            {site.incentives && site.incentives.length > 0 && (
              <div className="pt-2 border-t-2 border-dashed border-stone-200 dark:border-stone-700">
                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
                  Incentives
                </p>
                <div className="flex flex-wrap gap-1">
                  {site.incentives.map((incentive, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-medium rounded border border-amber-300 dark:border-amber-700"
                    >
                      {incentive}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {(onVisualize || onAskAbout) && (
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
                    'bg-green-500 text-white',
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
                  Ask about this site
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
