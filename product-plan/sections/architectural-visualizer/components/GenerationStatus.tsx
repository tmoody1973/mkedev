'use client'

import type { GenerationStatusProps } from '../types'

export function GenerationStatus({
  status,
  states,
  progress = 0,
}: GenerationStatusProps) {
  const currentState = states[status]

  // Icon mapping
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'sparkles':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
        )
      case 'brain':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
        )
      case 'map':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
        )
      case 'paintbrush':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
          </svg>
        )
      case 'check':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'alert':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        )
      default:
        return null
    }
  }

  // Color mapping based on status
  const getColorClasses = () => {
    switch (status) {
      case 'idle':
        return {
          bg: 'bg-stone-100 dark:bg-stone-800',
          icon: 'text-stone-500 dark:text-stone-400',
          text: 'text-stone-600 dark:text-stone-400',
        }
      case 'analyzing':
      case 'fetching':
        return {
          bg: 'bg-amber-100 dark:bg-amber-900/30',
          icon: 'text-amber-600 dark:text-amber-400',
          text: 'text-amber-700 dark:text-amber-300',
        }
      case 'generating':
        return {
          bg: 'bg-sky-100 dark:bg-sky-900/30',
          icon: 'text-sky-600 dark:text-sky-400',
          text: 'text-sky-700 dark:text-sky-300',
        }
      case 'completed':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-900/30',
          icon: 'text-emerald-600 dark:text-emerald-400',
          text: 'text-emerald-700 dark:text-emerald-300',
        }
      case 'error':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          icon: 'text-red-600 dark:text-red-400',
          text: 'text-red-700 dark:text-red-300',
        }
      default:
        return {
          bg: 'bg-stone-100 dark:bg-stone-800',
          icon: 'text-stone-500 dark:text-stone-400',
          text: 'text-stone-600 dark:text-stone-400',
        }
    }
  }

  const colors = getColorClasses()
  const isAnimating = ['analyzing', 'fetching', 'generating'].includes(status)
  const showProgress = status === 'generating' && progress > 0

  return (
    <div className={`
      w-full max-w-md px-4 py-3 rounded-xl
      ${colors.bg}
      border-2 border-black dark:border-stone-600
      shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(68,64,60,1)]
    `}>
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
          ${colors.bg}
          ${colors.icon}
          ${isAnimating ? 'animate-pulse' : ''}
        `}>
          {getIcon(currentState.icon)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`font-heading font-bold text-sm ${colors.text}`}>
            {currentState.message}
          </p>

          {/* Progress bar */}
          {showProgress && (
            <div className="mt-2 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Animated dots for loading states */}
          {isAnimating && !showProgress && (
            <div className="mt-1 flex gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${colors.icon} animate-bounce`} style={{ animationDelay: '0ms' }} />
              <span className={`w-1.5 h-1.5 rounded-full ${colors.icon} animate-bounce`} style={{ animationDelay: '150ms' }} />
              <span className={`w-1.5 h-1.5 rounded-full ${colors.icon} animate-bounce`} style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>

        {/* Progress percentage */}
        {showProgress && (
          <span className="font-mono text-sm font-bold text-sky-600 dark:text-sky-400">
            {progress}%
          </span>
        )}
      </div>
    </div>
  )
}
