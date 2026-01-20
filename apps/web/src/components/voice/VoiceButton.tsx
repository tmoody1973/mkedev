/**
 * VoiceButton Component
 *
 * Main button for activating Gemini Live voice interface.
 * Shows different states: inactive, connecting, listening, processing, speaking, error.
 */

'use client'

import { Mic, MicOff, Loader2, Volume2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VoiceSessionState } from '@/lib/voice'

// ============================================================================
// Types
// ============================================================================

interface VoiceButtonProps {
  state: VoiceSessionState
  onClick: () => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

// ============================================================================
// State Configuration
// ============================================================================

const STATE_CONFIG: Record<
  VoiceSessionState,
  {
    icon: typeof Mic
    label: string
    ariaLabel: string
    color: string
    bgColor: string
    animate?: boolean
    pulse?: boolean
  }
> = {
  inactive: {
    icon: Mic,
    label: 'Voice',
    ariaLabel: 'Enable voice mode',
    color: 'text-stone-600 dark:text-stone-400',
    bgColor: 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700',
  },
  connecting: {
    icon: Loader2,
    label: 'Connecting...',
    ariaLabel: 'Connecting to voice service',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    animate: true,
  },
  listening: {
    icon: Mic,
    label: 'Listening',
    ariaLabel: 'Voice mode active - listening',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    pulse: true,
  },
  processing: {
    icon: Loader2,
    label: 'Thinking...',
    ariaLabel: 'Processing your request',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    animate: true,
  },
  speaking: {
    icon: Volume2,
    label: 'Speaking',
    ariaLabel: 'AI is speaking',
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
    pulse: true,
  },
  error: {
    icon: AlertCircle,
    label: 'Error',
    ariaLabel: 'Voice error - click to retry',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
}

const SIZE_CONFIG = {
  sm: {
    button: 'w-8 h-8',
    icon: 'w-4 h-4',
    text: 'text-xs',
  },
  md: {
    button: 'w-10 h-10',
    icon: 'w-5 h-5',
    text: 'text-sm',
  },
  lg: {
    button: 'w-12 h-12',
    icon: 'w-6 h-6',
    text: 'text-base',
  },
}

// ============================================================================
// Component
// ============================================================================

export function VoiceButton({
  state,
  onClick,
  disabled = false,
  size = 'md',
  showLabel = false,
  className,
}: VoiceButtonProps) {
  const config = STATE_CONFIG[state]
  const sizeConfig = SIZE_CONFIG[size]
  const Icon = config.icon

  return (
    <button
      onClick={onClick}
      disabled={disabled || state === 'connecting'}
      aria-label={config.ariaLabel}
      className={cn(
        'relative flex items-center justify-center rounded-lg border-2 border-black transition-all',
        'shadow-[2px_2px_0_0_black] hover:shadow-[3px_3px_0_0_black]',
        'active:shadow-[1px_1px_0_0_black] active:translate-x-[1px] active:translate-y-[1px]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[2px_2px_0_0_black]',
        config.bgColor,
        config.color,
        showLabel ? 'px-3 py-2 gap-2' : sizeConfig.button,
        className
      )}
    >
      {/* Pulse ring for active states */}
      {config.pulse && (
        <span className="absolute inset-0 rounded-lg animate-ping opacity-30 bg-current" />
      )}

      {/* Icon */}
      <Icon
        className={cn(
          sizeConfig.icon,
          config.animate && 'animate-spin',
          'relative z-10'
        )}
      />

      {/* Label */}
      {showLabel && (
        <span className={cn(sizeConfig.text, 'font-medium relative z-10')}>
          {config.label}
        </span>
      )}
    </button>
  )
}

// ============================================================================
// Voice Indicator (floating status)
// ============================================================================

interface VoiceIndicatorProps {
  state: VoiceSessionState
  transcript?: string
  className?: string
}

export function VoiceIndicator({ state, transcript, className }: VoiceIndicatorProps) {
  if (state === 'inactive') return null

  const config = STATE_CONFIG[state]

  return (
    <div
      className={cn(
        'fixed bottom-24 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-3 px-4 py-3 rounded-xl',
        'bg-white dark:bg-stone-900 border-2 border-black shadow-[4px_4px_0_0_black]',
        'animate-in slide-in-from-bottom-4 fade-in duration-300',
        className
      )}
    >
      {/* Status indicator */}
      <div className={cn('flex items-center gap-2', config.color)}>
        {config.pulse && (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-current" />
          </span>
        )}
        {config.animate && <Loader2 className="w-4 h-4 animate-spin" />}
        {!config.pulse && !config.animate && <config.icon className="w-4 h-4" />}
        <span className="text-sm font-medium">{config.label}</span>
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="max-w-md">
          <p className="text-sm text-stone-600 dark:text-stone-400 truncate">
            {transcript}
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Voice Transcript Panel
// ============================================================================

interface TranscriptEntry {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface VoiceTranscriptProps {
  entries: TranscriptEntry[]
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function VoiceTranscript({
  entries,
  isOpen,
  onClose,
  className,
}: VoiceTranscriptProps) {
  if (!isOpen) return null

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 w-80',
        'bg-white dark:bg-stone-900 rounded-xl border-2 border-black shadow-[4px_4px_0_0_black]',
        'animate-in slide-in-from-right-4 fade-in duration-300',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black">
        <h3 className="font-bold text-stone-900 dark:text-white">Voice Transcript</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800"
        >
          <MicOff className="w-4 h-4" />
        </button>
      </div>

      {/* Entries */}
      <div className="max-h-64 overflow-y-auto p-4 space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
            Start speaking to see the transcript here
          </p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                'text-sm',
                entry.role === 'user'
                  ? 'text-stone-900 dark:text-white'
                  : 'text-violet-600 dark:text-violet-400'
              )}
            >
              <span className="font-medium">
                {entry.role === 'user' ? 'You: ' : 'AI: '}
              </span>
              {entry.content}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Exports
// ============================================================================

export default VoiceButton
