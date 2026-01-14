'use client'

import { X, MapPin, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import type { Parcel } from '../types'

export interface SelectedParcelInfoProps {
  parcel: Parcel | null
  onClose?: () => void
  onViewDetails?: (parcelId: string) => void
}

export function SelectedParcelInfo({
  parcel,
  onClose,
  onViewDetails,
}: SelectedParcelInfoProps) {
  const [copied, setCopied] = useState(false)

  if (!parcel) return null

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(parcel.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const coordsString = `${parcel.coordinates.lat.toFixed(6)}, ${parcel.coordinates.lng.toFixed(6)}`

  return (
    <div
      className="
        absolute left-4 right-4 top-20 md:left-auto md:right-20 md:w-80
        bg-white dark:bg-stone-900
        border-2 border-black
        rounded-xl
        shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
        overflow-hidden
        z-10
      "
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b-2 border-black dark:border-stone-700">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center border-2 border-black flex-shrink-0">
            <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-stone-900 dark:text-stone-50 text-sm truncate">
              {parcel.address}
            </p>
            <p className="font-body text-xs text-stone-500 dark:text-stone-400">
              {parcel.city}, {parcel.state} {parcel.zipCode}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="
            w-8 h-8 rounded-lg flex items-center justify-center
            text-stone-400 hover:text-stone-600 dark:hover:text-stone-300
            hover:bg-stone-100 dark:hover:bg-stone-800
            transition-colors
          "
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Info Grid */}
      <div className="p-4 space-y-3">
        {/* Tax Key */}
        <div className="flex items-center justify-between">
          <span className="font-body text-xs text-stone-500 dark:text-stone-400">Tax Key</span>
          <span className="font-mono text-xs text-stone-900 dark:text-stone-100">
            {parcel.taxKey}
          </span>
        </div>

        {/* Coordinates */}
        <div className="flex items-center justify-between">
          <span className="font-body text-xs text-stone-500 dark:text-stone-400">Coordinates</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-stone-900 dark:text-stone-100">
              {coordsString}
            </span>
            <button
              onClick={handleCopyAddress}
              className="text-stone-400 hover:text-sky-500 transition-colors"
              aria-label="Copy coordinates"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Lot Size */}
        <div className="flex items-center justify-between">
          <span className="font-body text-xs text-stone-500 dark:text-stone-400">Lot Size</span>
          <span className="font-mono text-xs text-stone-900 dark:text-stone-100">
            {parcel.lotSize.toLocaleString()} {parcel.lotSizeUnit}
          </span>
        </div>

        {/* Current Use */}
        <div className="flex items-center justify-between">
          <span className="font-body text-xs text-stone-500 dark:text-stone-400">Current Use</span>
          <span className="font-body text-xs text-stone-900 dark:text-stone-100">
            {parcel.currentUse}
          </span>
        </div>

        {/* Assessed Value */}
        <div className="flex items-center justify-between">
          <span className="font-body text-xs text-stone-500 dark:text-stone-400">Assessed Value</span>
          <span className="font-mono text-xs text-stone-900 dark:text-stone-100 font-medium">
            ${parcel.assessedValue.toLocaleString()}
          </span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 pt-2">
          {parcel.isHistoric && (
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-body rounded border border-purple-300 dark:border-purple-700">
              Historic
            </span>
          )}
          {parcel.hasDesignOverlay && (
            <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-body rounded border border-rose-300 dark:border-rose-700">
              Design Overlay
            </span>
          )}
          {parcel.incentiveZoneIds.length > 0 && (
            <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-body rounded border border-emerald-300 dark:border-emerald-700">
              {parcel.incentiveZoneIds.length} Incentive Zone{parcel.incentiveZoneIds.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="px-4 pb-4">
        <button
          onClick={() => onViewDetails?.(parcel.id)}
          className="
            w-full py-3 px-4
            bg-sky-500 text-white
            font-heading font-bold text-sm
            border-2 border-black
            rounded-lg
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
            hover:translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
            active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            transition-all duration-100
          "
        >
          View Full Analysis
        </button>
      </div>
    </div>
  )
}
