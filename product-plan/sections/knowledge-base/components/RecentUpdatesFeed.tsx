'use client'

import type { RecentUpdatesFeedProps } from '../types'

export function RecentUpdatesFeed({ updates, onUpdateClick }: RecentUpdatesFeedProps) {
  const getUpdateIcon = (updateType: string) => {
    switch (updateType) {
      case 'added':
        return (
          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
        )
      case 'updated':
        return (
          <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg className="w-3 h-3 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </div>
        )
      case 'removed':
        return (
          <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="rounded-xl bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(68,64,60,1)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b-2 border-black dark:border-stone-600 bg-stone-50 dark:bg-stone-900">
        <h3 className="font-heading font-bold text-stone-900 dark:text-stone-100">
          Recent Updates
        </h3>
      </div>

      {/* Updates list */}
      <div className="divide-y divide-stone-100 dark:divide-stone-700">
        {updates.map((update) => (
          <button
            key={update.id}
            onClick={() => onUpdateClick?.(update.documentId)}
            className="w-full px-4 py-3 flex items-start gap-3 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors text-left"
          >
            {getUpdateIcon(update.updateType)}
            <div className="flex-1 min-w-0">
              <p className="font-heading font-semibold text-sm text-stone-900 dark:text-stone-100 truncate">
                {update.documentTitle}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs text-stone-500 dark:text-stone-400">
                  {update.source}
                </span>
                <span className="text-stone-300 dark:text-stone-600">•</span>
                <span className="font-mono text-xs text-stone-400 dark:text-stone-500">
                  {formatTimestamp(update.timestamp)}
                </span>
              </div>
            </div>
            <svg className="w-4 h-4 text-stone-400 dark:text-stone-500 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}
