'use client'

import { MapPin } from 'lucide-react'

export interface MapPanelProps {
  /** Child content (actual map component would go here) */
  children?: React.ReactNode
  /** Callback when a location is selected on the map */
  onLocationSelect?: (location: { lat: number; lng: number; address?: string }) => void
  /** Currently selected location */
  selectedLocation?: { lat: number; lng: number; address?: string }
  /** Whether the map is loading */
  isLoading?: boolean
}

export function MapPanel({
  children,
  selectedLocation,
  isLoading = false,
}: MapPanelProps) {
  return (
    <div className="relative flex flex-col h-full bg-stone-200 dark:bg-stone-900">
      {/* Map Container */}
      <div className="flex-1 relative">
        {children ? (
          children
        ) : (
          /* Placeholder when no map is provided */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-100 dark:bg-stone-800">
            <div className="w-20 h-20 mb-4 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center border-2 border-black">
              <MapPin className="w-10 h-10 text-stone-500 dark:text-stone-400" />
            </div>
            <p className="text-stone-600 dark:text-stone-400 font-body text-center px-4">
              Map will render here
            </p>
            <p className="text-stone-500 dark:text-stone-500 font-body text-sm mt-2">
              Mapbox + ESRI ArcGIS layers
            </p>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-stone-900/50 flex items-center justify-center">
            <div className="bg-white dark:bg-stone-800 p-4 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-sky-500 rounded-full animate-bounce" />
                <div className="w-3 h-3 bg-sky-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-3 h-3 bg-sky-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Location Info Bar */}
      {selectedLocation && (
        <div className="absolute bottom-4 left-4 right-4 p-3 bg-white dark:bg-stone-800 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900 flex items-center justify-center border-2 border-black">
              <MapPin className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-stone-900 dark:text-stone-50 truncate">
                {selectedLocation.address || 'Selected Location'}
              </p>
              <p className="font-mono text-xs text-stone-500 dark:text-stone-400">
                {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
