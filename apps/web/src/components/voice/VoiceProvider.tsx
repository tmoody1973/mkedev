/**
 * VoiceProvider Component
 *
 * Context provider for Gemini Live voice functionality.
 * Wraps the app and provides voice session state and controls.
 */

'use client'

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { useVoiceSession } from '@/hooks/useVoiceSession'
import type { VoiceSession } from '@/lib/voice'
import { VoiceIndicator, VoiceTranscript } from './VoiceButton'

// ============================================================================
// Context Types
// ============================================================================

interface VoiceContextValue {
  /** Current voice session state */
  session: VoiceSession
  /** Start a new voice session */
  startSession: () => Promise<void>
  /** End the current voice session */
  endSession: () => void
  /** Toggle voice session on/off */
  toggleSession: () => Promise<void>
  /** Send a text message (for testing without voice) */
  sendText: (text: string) => void
  /** Clear the transcript history */
  clearTranscript: () => void
  /** Whether the transcript panel is open */
  isTranscriptOpen: boolean
  /** Toggle transcript panel visibility */
  toggleTranscript: () => void
}

// ============================================================================
// Context
// ============================================================================

const VoiceContext = createContext<VoiceContextValue | null>(null)

// ============================================================================
// Provider
// ============================================================================

interface VoiceProviderProps {
  children: ReactNode
  /** Show floating voice indicator when active */
  showIndicator?: boolean
  /** Enable transcript panel */
  enableTranscript?: boolean
}

export function VoiceProvider({
  children,
  showIndicator = true,
  enableTranscript = true,
}: VoiceProviderProps) {
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState<string>('')

  // Voice session hook
  const {
    session,
    startSession,
    endSession,
    toggleSession,
    sendText,
    clearTranscript,
  } = useVoiceSession({
    onTranscriptUpdate: (transcript) => {
      // Update current transcript for indicator
      const lastEntry = transcript[transcript.length - 1]
      if (lastEntry) {
        setCurrentTranscript(lastEntry.content)
      }
    },
    onStateChange: (state) => {
      // Auto-clear transcript display after a delay when not active
      if (state === 'inactive') {
        setTimeout(() => setCurrentTranscript(''), 2000)
      }
    },
    onError: (error) => {
      console.error('[VoiceProvider] Error:', error)
    },
  })

  // Toggle transcript panel
  const toggleTranscript = useCallback(() => {
    setIsTranscriptOpen((prev) => !prev)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // V to toggle voice (when not typing in an input)
      if (
        e.key === 'v' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        toggleSession()
      }

      // Escape to end session
      if (e.key === 'Escape' && session.isActive) {
        endSession()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSession, endSession, session.isActive])

  // Context value
  const value: VoiceContextValue = {
    session,
    startSession,
    endSession,
    toggleSession,
    sendText,
    clearTranscript,
    isTranscriptOpen,
    toggleTranscript,
  }

  return (
    <VoiceContext.Provider value={value}>
      {children}

      {/* Floating indicator */}
      {showIndicator && session.state !== 'inactive' && (
        <VoiceIndicator
          state={session.state}
          transcript={currentTranscript}
        />
      )}

      {/* Transcript panel */}
      {enableTranscript && (
        <VoiceTranscript
          entries={session.transcript}
          isOpen={isTranscriptOpen}
          onClose={() => setIsTranscriptOpen(false)}
        />
      )}
    </VoiceContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useVoice(): VoiceContextValue {
  const context = useContext(VoiceContext)

  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider')
  }

  return context
}
