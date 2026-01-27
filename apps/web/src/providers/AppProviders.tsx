'use client'

import { type ReactNode } from 'react'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { MapProvider } from '@/contexts/MapContext'
import { VoiceProvider } from '@/components/voice'

interface AppProvidersProps {
  children: ReactNode
}

/**
 * Client-side providers wrapper that includes:
 * - ThemeProvider for dark mode support
 * - MapProvider for map state management
 * - VoiceProvider for voice interaction
 *
 * Note: ClerkConvexProvider is wrapped around this in the layout
 * to ensure authentication is available throughout the app.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <MapProvider>
        <VoiceProvider showIndicator={true} enableTranscript={true}>
          {children}
        </VoiceProvider>
      </MapProvider>
    </ThemeProvider>
  )
}
