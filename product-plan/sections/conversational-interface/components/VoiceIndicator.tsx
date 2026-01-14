'use client'

import { Mic, MicOff } from 'lucide-react'
import type { VoiceState } from '../types'

export interface VoiceIndicatorProps {
  voiceState: VoiceState
  onToggle?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export function VoiceIndicator({
  voiceState,
  onToggle,
  size = 'md',
}: VoiceIndicatorProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  }

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Main Mic Button */}
      <button
        onClick={onToggle}
        className={`
          relative ${sizeClasses[size]} rounded-full border-2 border-black
          flex items-center justify-center
          transition-all duration-200
          ${
            voiceState.isActive
              ? 'bg-sky-500 text-white shadow-[0_0_0_4px_rgba(14,165,233,0.3)]'
              : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
          }
        `}
        aria-label={voiceState.isActive ? 'Stop listening' : 'Start voice input'}
      >
        {/* Pulsing rings when active */}
        {voiceState.isActive && (
          <>
            <span className="absolute inset-0 rounded-full bg-sky-400 animate-ping opacity-20" />
            <span className="absolute inset-[-8px] rounded-full border-2 border-sky-400 animate-pulse opacity-40" />
            <span className="absolute inset-[-16px] rounded-full border border-sky-300 animate-pulse opacity-20 [animation-delay:150ms]" />
          </>
        )}

        {voiceState.isActive ? (
          <Mic className={`${iconSizes[size]} relative z-10`} />
        ) : (
          <MicOff className={iconSizes[size]} />
        )}
      </button>

      {/* Waveform Visualization */}
      {voiceState.isActive && (
        <div className="flex items-center justify-center gap-1 h-8">
          {voiceState.waveformData.map((value, index) => (
            <div
              key={index}
              className="w-1 bg-sky-500 rounded-full transition-all duration-100"
              style={{
                height: `${Math.max(4, value * 32)}px`,
                animationDelay: `${index * 50}ms`,
              }}
            />
          ))}
        </div>
      )}

      {/* Status Text */}
      {voiceState.isActive && (
        <span className="text-sm font-body text-sky-600 dark:text-sky-400 animate-pulse">
          Listening...
        </span>
      )}
    </div>
  )
}

// Inline waveform for input area
export interface InlineWaveformProps {
  waveformData: number[]
  isActive: boolean
}

export function InlineWaveform({ waveformData, isActive }: InlineWaveformProps) {
  if (!isActive) return null

  return (
    <div className="flex items-center justify-center gap-0.5 px-4 py-2 rounded-lg bg-sky-50 dark:bg-sky-900/30 border-2 border-sky-500">
      {waveformData.map((value, index) => (
        <div
          key={index}
          className="w-1 bg-sky-500 rounded-full transition-all duration-75 animate-pulse"
          style={{
            height: `${Math.max(4, value * 24)}px`,
            animationDelay: `${index * 40}ms`,
          }}
        />
      ))}
      <span className="ml-3 text-sm font-body text-sky-600 dark:text-sky-400">
        Listening...
      </span>
    </div>
  )
}
