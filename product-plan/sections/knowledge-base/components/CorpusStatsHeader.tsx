'use client'

import type { CorpusStatsHeaderProps } from '../types'

export function CorpusStatsHeader({ stats }: CorpusStatsHeaderProps) {
  const lastSyncDate = new Date(stats.lastSyncedAt)
  const formattedDate = lastSyncDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="w-full rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 dark:from-sky-600 dark:to-sky-700 p-6 border-2 border-black dark:border-sky-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Title and sync status */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <h2 className="font-heading font-bold text-xl text-white">Knowledge Base</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="font-mono text-sm text-sky-100">
              Last synced: {formattedDate}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 sm:gap-6">
          <div className="text-center">
            <p className="font-heading font-bold text-2xl text-white">
              {stats.totalDocuments.toLocaleString()}
            </p>
            <p className="font-mono text-xs text-sky-200">Documents</p>
          </div>
          <div className="w-px bg-sky-400/30 hidden sm:block" />
          <div className="text-center">
            <p className="font-heading font-bold text-2xl text-white">
              {stats.totalSources}
            </p>
            <p className="font-mono text-xs text-sky-200">Sources</p>
          </div>
          <div className="w-px bg-sky-400/30 hidden sm:block" />
          <div className="text-center">
            <p className="font-heading font-bold text-2xl text-white">
              {stats.totalCategories}
            </p>
            <p className="font-mono text-xs text-sky-200">Categories</p>
          </div>
        </div>
      </div>

      {/* Weekly activity */}
      <div className="mt-4 pt-4 border-t border-sky-400/30 flex flex-wrap gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10">
          <svg className="w-4 h-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="font-mono text-sm text-white">
            <span className="font-bold">{stats.documentsAddedThisWeek}</span> added this week
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10">
          <svg className="w-4 h-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span className="font-mono text-sm text-white">
            <span className="font-bold">{stats.documentsUpdatedThisWeek}</span> updated this week
          </span>
        </div>
      </div>
    </div>
  )
}
