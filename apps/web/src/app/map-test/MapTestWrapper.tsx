'use client'

import dynamic from 'next/dynamic'

// Dynamically import the entire map page content to avoid SSR issues
// mapbox-gl and related packages require browser APIs
const MapTestContent = dynamic(
  () => import('./MapTestContent'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-600 dark:text-stone-400">Loading map...</p>
        </div>
      </div>
    )
  }
)

export function MapTestWrapper() {
  return <MapTestContent />
}
