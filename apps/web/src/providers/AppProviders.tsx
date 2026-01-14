'use client'

import { type ReactNode } from 'react'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { MapProvider } from '@/contexts/MapContext'

interface AppProvidersProps {
  children: ReactNode
}

/**
 * Client-side providers wrapper that includes:
 * - ThemeProvider for dark mode support
 * - MapProvider for map state management
 *
 * Note: ClerkConvexProvider is wrapped around this in the layout
 * to ensure authentication is available throughout the app.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <MapProvider>{children}</MapProvider>
    </ThemeProvider>
  )
}
