'use client'

import dynamic from 'next/dynamic'

// Dynamically import the entire home content to avoid SSR issues
const HomeContent = dynamic(
  () => import('./HomeContent'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 bg-stone-200 dark:bg-stone-700 rounded-lg animate-pulse" />
          <div className="w-48 h-2 bg-stone-200 dark:bg-stone-700 rounded-full" />
        </div>
      </div>
    )
  }
)

export function HomeWrapper() {
  return <HomeContent />
}
