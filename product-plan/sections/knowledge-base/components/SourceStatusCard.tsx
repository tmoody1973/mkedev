'use client'

import type { SourceStatusCardProps } from '../types'

export function SourceStatusCard({ source, onRetry }: SourceStatusCardProps) {
  const lastCrawled = new Date(source.lastCrawledAt)
  const formattedDate = lastCrawled.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const getStatusBadge = () => {
    switch (source.status) {
      case 'synced':
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Synced
          </span>
        )
      case 'syncing':
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Syncing
          </span>
        )
      case 'error':
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Error
          </span>
        )
    }
  }

  return (
    <div className={`
      p-3 rounded-lg border-2
      ${source.status === 'error'
        ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
        : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800'
      }
    `}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
            {source.name}
          </h4>
          <p className="font-mono text-xs text-stone-500 dark:text-stone-400 truncate">
            {source.domain}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-mono text-stone-500 dark:text-stone-400">
          {source.documentCount} docs • {source.crawlFrequency}
        </span>
        <span className="font-mono text-stone-400 dark:text-stone-500">
          {formattedDate}
        </span>
      </div>

      {source.status === 'error' && source.errorMessage && (
        <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
          <p className="font-mono text-xs text-red-600 dark:text-red-400 mb-2">
            {source.errorMessage}
          </p>
          <button
            onClick={() => onRetry?.(source.id)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-mono text-xs hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
