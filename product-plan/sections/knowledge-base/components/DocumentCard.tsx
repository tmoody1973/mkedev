'use client'

import type { DocumentCardProps } from '../types'

export function DocumentCard({ document, onClick }: DocumentCardProps) {
  const lastCrawled = new Date(document.lastCrawledAt)
  const formattedDate = lastCrawled.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  const getFreshnessBadge = () => {
    switch (document.freshness) {
      case 'recent':
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
            NEW
          </span>
        )
      case 'stale':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold">
            STALE
          </span>
        )
      default:
        return null
    }
  }

  return (
    <button
      onClick={() => onClick?.(document.id)}
      className="w-full p-4 rounded-lg bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 hover:border-sky-400 dark:hover:border-sky-500 transition-colors text-left"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100 line-clamp-2">
          {document.title}
        </h4>
        {getFreshnessBadge()}
      </div>

      <p className="font-body text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mb-3">
        {document.excerpt}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 font-mono text-[10px]">
            {document.categoryLabel}
          </span>
          <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500">
            {document.wordCount.toLocaleString()} words
          </span>
        </div>
        <div className="flex items-center gap-1 text-stone-400 dark:text-stone-500">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-mono text-[10px]">{formattedDate}</span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-700 flex items-center gap-1">
        <svg className="w-3 h-3 text-stone-400 dark:text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
        <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500 truncate">
          {document.sourceDomain}
        </span>
      </div>
    </button>
  )
}
