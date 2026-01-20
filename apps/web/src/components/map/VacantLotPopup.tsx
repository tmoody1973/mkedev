'use client'

// =============================================================================
// VacantLotPopup Component
// Displays city-owned vacant lot information in a neobrutalist popup overlay
// =============================================================================

import { useCallback } from 'react'
import {
  X,
  LandPlot,
  MapPin,
  Building2,
  Eye,
  Sparkles,
  MessageSquare,
  Hash,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VacantLot } from './layers/vacant-lots-layer-manager'

// =============================================================================
// Types
// =============================================================================

export interface VacantLotPopupProps {
  /** Vacant lot data to display */
  lot: VacantLot
  /** Callback when popup is closed */
  onClose: () => void
  /** Callback when "Analyze Lot" is clicked */
  onAnalyze?: (lot: VacantLot) => void
  /** Callback when "Open Street View" is clicked */
  onOpenStreetView?: (lot: VacantLot) => void
  /** Callback when "Visualize" is clicked */
  onVisualize?: (lot: VacantLot) => void
  /** Position of the popup (optional, defaults to bottom-right) */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** Additional class name */
  className?: string
}

// =============================================================================
// Component
// =============================================================================

/**
 * Vacant lot information popup with neobrutalist styling.
 * Displays address, tax key, zoning, property type, disposition status, and neighborhood.
 */
export function VacantLotPopup({
  lot,
  onClose,
  onAnalyze,
  onOpenStreetView,
  onVisualize,
  position = 'bottom-right',
  className,
}: VacantLotPopupProps) {
  const handleAnalyze = useCallback(() => {
    onAnalyze?.(lot)
    onClose()
  }, [onAnalyze, lot, onClose])

  const handleOpenStreetView = useCallback(() => {
    // Open Google Street View at coordinates
    if (lot.coordinates) {
      const [lng, lat] = lot.coordinates
      const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`
      window.open(url, '_blank', 'noopener,noreferrer')
    }
    onOpenStreetView?.(lot)
  }, [lot, onOpenStreetView])

  const handleVisualize = useCallback(() => {
    onVisualize?.(lot)
    onClose()
  }, [onVisualize, lot, onClose])

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

  // Status badge color
  const statusColor = {
    available: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    sold: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    unknown: 'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300',
  }

  return (
    <div
      className="absolute inset-0 z-20"
      onClick={handleClickOutside}
      data-testid="vacant-lot-popup-backdrop"
    >
      <div
        className={cn(
          'absolute w-80 max-w-[calc(100%-2rem)]',
          positionClasses[position],
          className
        )}
        data-testid="vacant-lot-popup"
        role="dialog"
        aria-labelledby="vacant-lot-popup-title"
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
                <LandPlot className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <h2
                id="vacant-lot-popup-title"
                className="font-heading font-bold text-stone-900 dark:text-stone-50"
              >
                Vacant Lot
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
              aria-label="Close vacant lot popup"
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
                  {lot.address || 'Unknown Address'}
                </p>
              </div>
            </div>

            {/* Tax Key */}
            {lot.id && (
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg shrink-0',
                    'bg-stone-100 dark:bg-stone-800',
                    'border-2 border-black dark:border-stone-600',
                    'flex items-center justify-center'
                  )}
                >
                  <Hash className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Tax Key
                  </p>
                  <p className="font-mono text-sm text-stone-900 dark:text-stone-100">
                    {lot.id}
                  </p>
                </div>
              </div>
            )}

            {/* Neighborhood */}
            {lot.neighborhood && (
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
                    {lot.neighborhood}
                  </p>
                </div>
              </div>
            )}

            {/* Property Details Row */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t-2 border-dashed border-stone-200 dark:border-stone-700">
              {/* Zoning */}
              {lot.zoning && (
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-1 mb-1">
                    <Building2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                      Zoning
                    </span>
                  </div>
                  <p className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {lot.zoning}
                  </p>
                </div>
              )}

              {/* Property Type */}
              {lot.propertyType && (
                <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
                  <div className="flex items-center gap-1 mb-1">
                    <FileText className="w-3 h-3 text-stone-500 dark:text-stone-400" />
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                      Type
                    </span>
                  </div>
                  <p className="font-sans text-sm text-stone-900 dark:text-stone-100 capitalize">
                    {lot.propertyType}
                  </p>
                </div>
              )}
            </div>

            {/* Disposition Status */}
            {lot.dispositionStatus && (
              <div className="flex items-center justify-between p-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Status
                </span>
                <span
                  className={cn(
                    'px-2 py-1 rounded text-xs font-semibold',
                    statusColor[lot.status]
                  )}
                >
                  {lot.dispositionStatus}
                </span>
              </div>
            )}

            {/* Lot Size */}
            {lot.lotSizeSqFt && (
              <div className="flex items-center justify-between p-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Lot Size
                </span>
                <span className="font-sans text-sm font-bold text-stone-900 dark:text-stone-100">
                  {lot.lotSizeSqFt.toLocaleString()} sqft
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-4 pt-0 space-y-2">
            {onAnalyze && (
              <button
                onClick={handleAnalyze}
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
                <MessageSquare className="w-4 h-4" />
                Analyze Lot
              </button>
            )}
            {lot.coordinates && (
              <button
                onClick={handleOpenStreetView}
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
                Open Street View
              </button>
            )}
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
                Capture & Visualize
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
