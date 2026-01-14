'use client'

import { Map } from 'lucide-react'
import type { MapViewState, Parcel } from '../types'

export interface MapViewProps {
  viewState: MapViewState
  parcels: Parcel[]
  onParcelClick?: (parcelId: string) => void
  onParcelHover?: (parcelId: string | null) => void
  onViewChange?: (viewState: Partial<MapViewState>) => void
}

export function MapView({
  viewState,
  parcels,
  onParcelClick,
  onParcelHover,
  onViewChange,
}: MapViewProps) {
  // This is a placeholder for the actual Mapbox GL JS implementation
  // In production, this would render a full Mapbox map with:
  // - Vector tiles and ESRI ArcGIS layers
  // - 3D terrain support when viewMode is '3d'
  // - Click/hover handlers for parcels
  // - Pan/zoom event handlers

  const selectedParcel = parcels.find(p => p.id === viewState.selectedParcelId)
  const highlightedParcels = parcels.filter(p => viewState.highlightedParcelIds.includes(p.id))

  return (
    <div className="absolute inset-0 bg-stone-200 dark:bg-stone-800">
      {/* Map Background Pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgb(168, 162, 158) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(168, 162, 158) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Placeholder Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="w-24 h-24 rounded-2xl bg-white dark:bg-stone-900 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-4">
          <Map className="w-12 h-12 text-sky-500" />
        </div>
        <p className="font-heading font-bold text-stone-700 dark:text-stone-300 text-lg mb-1">
          Mapbox GL JS
        </p>
        <p className="font-body text-stone-500 dark:text-stone-400 text-sm text-center max-w-xs">
          Interactive map with ESRI ArcGIS layers
        </p>

        {/* View Mode Indicator */}
        <div className="mt-4 px-3 py-1.5 bg-white dark:bg-stone-900 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <span className="font-mono text-xs text-stone-600 dark:text-stone-400">
            {viewState.viewMode.toUpperCase()} View • Zoom {viewState.zoom.toFixed(1)}
          </span>
        </div>

        {/* Coordinates Display */}
        <div className="mt-2 px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
          <span className="font-mono text-xs text-stone-500 dark:text-stone-400">
            {viewState.center.lat.toFixed(4)}°N, {Math.abs(viewState.center.lng).toFixed(4)}°W
          </span>
        </div>
      </div>

      {/* Sample Parcel Markers */}
      <div className="absolute inset-0 pointer-events-none">
        {parcels.map((parcel, index) => {
          const isSelected = parcel.id === viewState.selectedParcelId
          const isHighlighted = viewState.highlightedParcelIds.includes(parcel.id)

          // Distribute markers around the center for visual demo
          const angle = (index / parcels.length) * 2 * Math.PI
          const radius = 100 + (index % 3) * 40
          const x = 50 + (Math.cos(angle) * radius) / 8
          const y = 50 + (Math.sin(angle) * radius) / 8

          return (
            <button
              key={parcel.id}
              onClick={() => onParcelClick?.(parcel.id)}
              onMouseEnter={() => onParcelHover?.(parcel.id)}
              onMouseLeave={() => onParcelHover?.(null)}
              className={`
                absolute pointer-events-auto
                w-6 h-6 rounded-full
                border-2 border-black
                shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                transition-all duration-150
                hover:scale-125
                ${isSelected
                  ? 'bg-amber-400 scale-125 z-10'
                  : isHighlighted
                    ? 'bg-sky-400'
                    : 'bg-white dark:bg-stone-700'
                }
              `}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              aria-label={`Parcel at ${parcel.address}`}
            />
          )
        })}
      </div>

      {/* Status Indicator */}
      {viewState.isLocating && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-16 h-16 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  )
}
