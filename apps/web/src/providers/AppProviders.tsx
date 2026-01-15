'use client'

import { type ReactNode, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { MapProvider } from '@/contexts/MapContext'

// Dynamically import CopilotKit to avoid SSR issues
const CopilotKit = dynamic(
  () => import('@copilotkit/react-core').then((mod) => mod.CopilotKit),
  { ssr: false }
)

interface AppProvidersProps {
  children: ReactNode
}

// CopilotKit API key (optional - only needed for cloud runtime features)
const COPILOTKIT_API_KEY = process.env.NEXT_PUBLIC_COPILOTKIT_API_KEY

/**
 * Client-side providers wrapper that includes:
 * - ThemeProvider for dark mode support
 * - MapProvider for map state management
 * - CopilotKit for generative UI (optional, wraps only if API key provided)
 *
 * Note: ClerkConvexProvider is wrapped around this in the layout
 * to ensure authentication is available throughout the app.
 */
export function AppProviders({ children }: AppProvidersProps) {
  // Track if we're mounted on the client to avoid SSR issues with CopilotKit
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Content with map provider
  const content = <MapProvider>{children}</MapProvider>

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {isMounted && COPILOTKIT_API_KEY ? (
        <CopilotKit
          publicApiKey={COPILOTKIT_API_KEY}
          showDevConsole={process.env.NODE_ENV === 'development'}
        >
          {content}
        </CopilotKit>
      ) : (
        content
      )}
    </ThemeProvider>
  )
}
