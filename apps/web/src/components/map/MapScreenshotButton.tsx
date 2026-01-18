'use client'

import { useCallback, useState, useRef } from 'react'
import { Camera, Check, Loader2 } from 'lucide-react'
import { useMap } from '@/contexts/MapContext'
import { useVisualizerStore } from '@/stores'

// ESRI endpoint for zoning queries
const ESRI_ZONING_URL =
  'https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/planning/zoning/MapServer/11/query'

/**
 * Floating button on the map for taking screenshots.
 * Saves screenshots to the visualizer gallery with address and zoning context.
 */
export function MapScreenshotButton() {
  const { captureMapScreenshot, map } = useMap()
  const { addScreenshot } = useVisualizerStore()
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const mapRef = useRef(map)
  mapRef.current = map

  const handleCapture = useCallback(async () => {
    const currentMap = mapRef.current
    if (!currentMap) {
      console.error('Map not available')
      return
    }

    setIsLoading(true)

    try {
      // 1. Capture the screenshot
      const screenshot = captureMapScreenshot()
      if (!screenshot) {
        console.error('Failed to capture map screenshot')
        setIsLoading(false)
        return
      }

      // 2. Get map center coordinates
      const center = currentMap.getCenter()
      const lng = center.lng
      const lat = center.lat

      // 3. Reverse geocode to get address (Mapbox)
      let address: string | undefined
      try {
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        if (mapboxToken) {
          const geocodeResponse = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=address,poi&limit=1`
          )
          const geocodeData = await geocodeResponse.json()
          if (geocodeData.features?.length > 0) {
            address = geocodeData.features[0].place_name
          }
        }
      } catch (err) {
        console.warn('Reverse geocoding failed:', err)
      }

      // 4. Query zoning at point (Milwaukee ESRI)
      let zoneCode: string | undefined
      try {
        const params = new URLSearchParams({
          geometry: `${lng},${lat}`,
          geometryType: 'esriGeometryPoint',
          inSR: '4326',
          spatialRel: 'esriSpatialRelIntersects',
          outFields: 'Zoning,ZoningCategory',
          returnGeometry: 'false',
          f: 'json',
        })
        const zoningResponse = await fetch(`${ESRI_ZONING_URL}?${params}`)
        const zoningData = await zoningResponse.json()
        if (zoningData.features?.length > 0) {
          const attrs = zoningData.features[0].attributes
          zoneCode = attrs.Zoning || attrs.ZONING
        }
      } catch (err) {
        console.warn('Zoning query failed:', err)
      }

      // 5. Save screenshot with context
      addScreenshot(screenshot, {
        address,
        zoneCode,
        coordinates: [lng, lat],
        sourceType: 'map',
      })

      // Show success feedback
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    } catch (err) {
      console.error('Screenshot capture failed:', err)
    } finally {
      setIsLoading(false)
    }
  }, [captureMapScreenshot, addScreenshot])

  return (
    <button
      onClick={handleCapture}
      disabled={isLoading}
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
        disabled:opacity-70 disabled:cursor-not-allowed
        ${showSuccess
          ? 'bg-green-500 text-white'
          : isLoading
          ? 'bg-purple-400 text-white'
          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
        }
      `}
      title="Take screenshot for visualization"
      aria-label="Take screenshot"
    >
      {showSuccess ? (
        <Check className="w-6 h-6" />
      ) : isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : (
        <Camera className="w-6 h-6" />
      )}
    </button>
  )
}
