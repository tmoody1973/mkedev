'use client'

import { type ReactNode, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import all providers to avoid SSR issues
const ClerkConvexProvider = dynamic(
  () => import('@/providers/ClerkConvexProvider').then(mod => mod.ClerkConvexProvider),
  { ssr: false }
)

const AppProviders = dynamic(
  () => import('@/providers/AppProviders').then(mod => mod.AppProviders),
  { ssr: false }
)

// PMTiles cache service worker registration
const PMTilesCacheProvider = dynamic(
  () => import('@/components/map/PMTilesCacheProvider').then(mod => mod.PMTilesCacheProvider),
  { ssr: false }
)

interface ClientProvidersProps {
  children: ReactNode
}

/**
 * Client-only providers wrapper
 * All providers are dynamically imported with ssr: false to avoid
 * module evaluation during static prerendering on Vercel
 */
export function ClientProviders({ children }: ClientProvidersProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show nothing until mounted - prevents flash of unstyled content
  // but more importantly, prevents SSR evaluation of provider modules
  if (!mounted) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 bg-stone-200 dark:bg-stone-700 rounded-lg animate-pulse" />
          <div className="w-48 h-2 bg-stone-200 dark:bg-stone-700 rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <ClerkConvexProvider>
      <AppProviders>
        <PMTilesCacheProvider />
        {children}
      </AppProviders>
    </ClerkConvexProvider>
  )
}
