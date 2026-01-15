'use client'

import dynamic from 'next/dynamic'
import { MapProvider } from '@/contexts/MapContext'

// Dynamically import MapContainer to avoid SSR issues with mapbox-gl
const MapContainer = dynamic(
  () => import('@/components/map').then((mod) => mod.MapContainer),
  { ssr: false }
)

export default function MapTestPage() {
  return (
    <MapProvider>
      <div className="min-h-screen flex flex-col">
        <header className="p-4 border-b-2 border-black dark:border-white bg-stone-50 dark:bg-stone-900">
          <h1 className="font-head text-2xl text-stone-900 dark:text-stone-100">
            Map Test - MKE.dev
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Testing Mapbox GL JS integration with Milwaukee center coordinates
          </p>
        </header>
        <main className="flex-1 relative">
          <MapContainer />
        </main>
      </div>
    </MapProvider>
  )
}
