'use client'

import { useCallback } from 'react'
import { Ruler, X } from 'lucide-react'
import { useMap } from '@/contexts/MapContext'

/**
 * Floating button on the map for toggling parcel/site measurement mode.
 * When active, users can draw polygons to measure area and perimeter.
 * Positioned above the screenshot button on the left side.
 */
export function MeasurementButton() {
  const { isMeasuring, setIsMeasuring, measurement, setMeasurement } = useMap()

  const handleToggle = useCallback(() => {
    if (isMeasuring) {
      // Deactivate: clear measurement
      setIsMeasuring(false)
      setMeasurement(null)
    } else {
      setIsMeasuring(true)
    }
  }, [isMeasuring, setIsMeasuring, setMeasurement])

  // Format numbers with commas
  const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 })
  const fmtDec = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 })

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className={`
          absolute left-4 bottom-[4.5rem]
          w-12 h-12
          flex items-center justify-center
          rounded-xl
          border-2 border-black dark:border-white
          shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
          dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
          hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
          active:translate-y-2 active:shadow-none
          transition-all duration-100
          ${
            isMeasuring
              ? 'bg-sky-500 text-white ring-2 ring-sky-300'
              : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700'
          }
        `}
        title={isMeasuring ? 'Exit measurement mode' : 'Measure area on map'}
        aria-label={isMeasuring ? 'Exit measurement mode' : 'Measure area'}
      >
        {isMeasuring ? (
          <X className="w-6 h-6" />
        ) : (
          <Ruler className="w-6 h-6" />
        )}
      </button>

      {/* Measurement result overlay */}
      {isMeasuring && measurement && (
        <div
          className="
            absolute left-4 bottom-[8rem]
            bg-white dark:bg-stone-900
            border-2 border-black dark:border-white
            rounded-lg
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
            dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
            px-3 py-2
            min-w-[180px]
            text-sm font-sans
          "
        >
          <div className="font-bold text-stone-900 dark:text-stone-100 mb-1">
            Measurement
          </div>
          <div className="space-y-0.5 text-stone-700 dark:text-stone-300">
            <div className="flex justify-between gap-4">
              <span>Area:</span>
              <span className="font-mono font-semibold">
                {fmt(measurement.areaSqFt)} sq ft
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span />
              <span className="font-mono text-xs text-stone-500">
                ({fmtDec(measurement.areaAcres)} acres)
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Perimeter:</span>
              <span className="font-mono font-semibold">
                {fmt(measurement.perimeterFt)} ft
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Instructions hint when active but no measurement yet */}
      {isMeasuring && !measurement && (
        <div
          className="
            absolute left-4 bottom-[8rem]
            bg-sky-50 dark:bg-sky-950
            border-2 border-sky-400 dark:border-sky-600
            rounded-lg
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
            dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
            px-3 py-2
            min-w-[180px]
            text-sm font-sans
            text-sky-800 dark:text-sky-200
          "
        >
          Click on the map to draw a polygon.
          <br />
          Double-click to finish.
        </div>
      )}
    </>
  )
}
