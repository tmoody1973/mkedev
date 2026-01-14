'use client'

import type { SourceStatusPanelProps } from '../types'
import { SourceStatusCard } from './SourceStatusCard'

export function SourceStatusPanel({ sources, onRetrySource }: SourceStatusPanelProps) {
  const syncedCount = sources.filter(s => s.status === 'synced').length
  const syncingCount = sources.filter(s => s.status === 'syncing').length
  const errorCount = sources.filter(s => s.status === 'error').length

  return (
    <div className="rounded-xl bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(68,64,60,1)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b-2 border-black dark:border-stone-600 bg-stone-50 dark:bg-stone-900">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-stone-900 dark:text-stone-100">
            Data Sources
          </h3>
          <div className="flex items-center gap-2">
            {syncedCount > 0 && (
              <span className="flex items-center gap-1 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {syncedCount}
              </span>
            )}
            {syncingCount > 0 && (
              <span className="flex items-center gap-1 font-mono text-xs text-amber-600 dark:text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {syncingCount}
              </span>
            )}
            {errorCount > 0 && (
              <span className="flex items-center gap-1 font-mono text-xs text-red-600 dark:text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {errorCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Source list */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {sources.map((source) => (
          <SourceStatusCard
            key={source.id}
            source={source}
            onRetry={onRetrySource}
          />
        ))}
      </div>
    </div>
  )
}
