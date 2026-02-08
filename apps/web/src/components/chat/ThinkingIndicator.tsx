'use client'

import { Zap, MessageCircle, Search, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { THINKING_LEVEL_CONFIG, type ThinkingLevel } from '@/lib/queryComplexity'

/**
 * Icon component map keyed by icon name from THINKING_LEVEL_CONFIG.
 */
const ICON_MAP = {
  Zap,
  MessageCircle,
  Search,
  Brain,
} as const

/**
 * Tailwind color classes for each thinking level.
 */
const COLOR_CLASSES: Record<string, { dot: string; text: string; bg: string }> = {
  green: {
    dot: 'bg-green-500',
    text: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30',
  },
  blue: {
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
  amber: {
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  purple: {
    dot: 'bg-purple-500',
    text: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
  },
}

export interface ThinkingIndicatorProps {
  /** Current thinking level to display */
  thinkingLevel: ThinkingLevel
  /** Whether the agent is actively thinking */
  isActive: boolean
}

/**
 * ThinkingIndicator - Compact inline indicator for AI thinking depth.
 *
 * Shows an icon, label, and colored dot representing the current
 * thinking level. Pulses when the agent is actively processing.
 */
export function ThinkingIndicator({ thinkingLevel, isActive }: ThinkingIndicatorProps) {
  const config = THINKING_LEVEL_CONFIG[thinkingLevel]
  const colors = COLOR_CLASSES[config.color]
  const IconComponent = ICON_MAP[config.icon]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 h-6 px-2 py-0.5 rounded',
        'border border-black/20 dark:border-white/20',
        colors.bg,
        'transition-all duration-200'
      )}
      role="status"
      aria-label={`Thinking level: ${config.label}${isActive ? ' (active)' : ''}`}
    >
      {/* Icon */}
      <IconComponent
        className={cn(
          'w-3 h-3',
          colors.text,
          isActive && 'animate-pulse'
        )}
      />

      {/* Label */}
      <span className={cn('text-xs font-medium', colors.text)}>
        {config.label}
      </span>

      {/* Colored dot */}
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          colors.dot,
          isActive && 'animate-pulse'
        )}
      />
    </div>
  )
}
