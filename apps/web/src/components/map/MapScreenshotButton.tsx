'use client'

import { useCallback, useState } from 'react'
import { Camera, Check } from 'lucide-react'
import { useMap } from '@/contexts/MapContext'
import { useVisualizerStore } from '@/stores'

/**
 * Floating button on the map for taking screenshots.
 * Saves screenshots to the visualizer gallery.
 */
export function MapScreenshotButton() {
  const { captureMapScreenshot } = useMap()
  const { addScreenshot } = useVisualizerStore()
  const [showSuccess, setShowSuccess] = useState(false)

  const handleCapture = useCallback(() => {
    const screenshot = captureMapScreenshot()
    if (screenshot) {
      addScreenshot(screenshot)
      // Show success feedback
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    } else {
      console.error('Failed to capture map screenshot')
    }
  }, [captureMapScreenshot, addScreenshot])

  return (
    <button
      onClick={handleCapture}
      className={`
        absolute left-4 bottom-4
        w-12 h-12
        flex items-center justify-center
        rounded-xl
        border-2 border-black dark:border-white
        shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
        dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
        hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
        active:translate-y-2 active:shadow-none
        transition-all duration-100
        ${showSuccess
          ? 'bg-green-500 text-white'
          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
        }
      `}
      title="Take screenshot for visualization"
      aria-label="Take screenshot"
    >
      {showSuccess ? (
        <Check className="w-6 h-6" />
      ) : (
        <Camera className="w-6 h-6" />
      )}
    </button>
  )
}
