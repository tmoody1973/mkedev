'use client'

import type { CategoryCardProps } from '../types'

export function CategoryCard({ category, onClick }: CategoryCardProps) {
  const getIcon = () => {
    switch (category.icon) {
      case 'building':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
          </svg>
        )
      case 'map':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
        )
      case 'document':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        )
      case 'gavel':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
          </svg>
        )
      case 'sparkles':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
        )
      default:
        return null
    }
  }

  const getColorClasses = () => {
    switch (category.icon) {
      case 'building':
        return {
          bg: 'bg-sky-100 dark:bg-sky-900/30',
          icon: 'text-sky-600 dark:text-sky-400',
          hover: 'hover:border-sky-400',
        }
      case 'map':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-900/30',
          icon: 'text-emerald-600 dark:text-emerald-400',
          hover: 'hover:border-emerald-400',
        }
      case 'document':
        return {
          bg: 'bg-violet-100 dark:bg-violet-900/30',
          icon: 'text-violet-600 dark:text-violet-400',
          hover: 'hover:border-violet-400',
        }
      case 'gavel':
        return {
          bg: 'bg-amber-100 dark:bg-amber-900/30',
          icon: 'text-amber-600 dark:text-amber-400',
          hover: 'hover:border-amber-400',
        }
      case 'sparkles':
        return {
          bg: 'bg-rose-100 dark:bg-rose-900/30',
          icon: 'text-rose-600 dark:text-rose-400',
          hover: 'hover:border-rose-400',
        }
      default:
        return {
          bg: 'bg-stone-100 dark:bg-stone-800',
          icon: 'text-stone-600 dark:text-stone-400',
          hover: 'hover:border-stone-400',
        }
    }
  }

  const colors = getColorClasses()

  return (
    <button
      onClick={() => onClick?.(category.id)}
      className={`
        w-full p-4 rounded-xl bg-white dark:bg-stone-800
        border-2 border-black dark:border-stone-600
        shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(68,64,60,1)]
        hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]
        ${colors.hover}
        transition-all text-left
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-lg ${colors.bg} ${colors.icon} flex items-center justify-center flex-shrink-0`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading font-bold text-stone-900 dark:text-stone-100 truncate">
              {category.label}
            </h3>
            <span className="font-mono text-sm font-bold text-stone-500 dark:text-stone-400">
              {category.documentCount}
            </span>
          </div>
          <p className="font-body text-sm text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
            {category.description}
          </p>
        </div>
      </div>
    </button>
  )
}
