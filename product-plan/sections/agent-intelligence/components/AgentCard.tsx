'use client'

import type { AgentCardProps, AgentIcon } from '../types'

// Icon components for each agent type
function AgentIconComponent({ icon, className }: { icon: AgentIcon; className?: string }) {
  const baseClass = className || 'w-6 h-6'

  switch (icon) {
    case 'building-library':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
        </svg>
      )
    case 'currency-dollar':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'chart-bar':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      )
    case 'paint-brush':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
        </svg>
      )
    case 'document-check':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" />
        </svg>
      )
    case 'shield-check':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      )
  }
}

// Color mappings for agent themes
const colorClasses = {
  sky: {
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    border: 'border-sky-500',
    icon: 'text-sky-600 dark:text-sky-400',
    progress: 'bg-sky-500',
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    border: 'border-emerald-500',
    icon: 'text-emerald-600 dark:text-emerald-400',
    progress: 'bg-emerald-500',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-500',
    icon: 'text-amber-600 dark:text-amber-400',
    progress: 'bg-amber-500',
  },
  violet: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    border: 'border-violet-500',
    icon: 'text-violet-600 dark:text-violet-400',
    progress: 'bg-violet-500',
  },
  rose: {
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    border: 'border-rose-500',
    icon: 'text-rose-600 dark:text-rose-400',
    progress: 'bg-rose-500',
  },
  teal: {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    border: 'border-teal-500',
    icon: 'text-teal-600 dark:text-teal-400',
    progress: 'bg-teal-500',
  },
}

export function AgentCard({ agent, status = 'idle', progress = 0, onClick }: AgentCardProps & { status?: string }) {
  const colors = colorClasses[agent.color]
  const isActive = status === 'in_progress'
  const isCompleted = status === 'completed'
  const isPending = status === 'pending'

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full text-left p-4 rounded-lg
        bg-white dark:bg-stone-800
        border-2 border-black dark:border-stone-600
        shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(68,64,60,1)]
        hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(68,64,60,1)]
        hover:translate-x-[2px] hover:translate-y-[2px]
        active:shadow-none active:translate-x-[4px] active:translate-y-[4px]
        transition-all duration-150
        ${isPending ? 'opacity-50' : ''}
      `}
    >
      {/* Icon and status indicator */}
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${colors.bg} ${colors.icon}`}>
          <AgentIconComponent icon={agent.icon} className="w-6 h-6" />
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5">
          {isCompleted && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span className="font-mono text-[10px] font-medium text-emerald-700 dark:text-emerald-300">Done</span>
            </div>
          )}
          {isActive && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30">
              <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <span className="font-mono text-[10px] font-medium text-sky-700 dark:text-sky-300">Working</span>
            </div>
          )}
          {isPending && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-700">
              <span className="font-mono text-[10px] font-medium text-stone-500 dark:text-stone-400">Waiting</span>
            </div>
          )}
        </div>
      </div>

      {/* Agent name and description */}
      <h3 className="font-heading font-bold text-stone-900 dark:text-stone-100 mb-1">
        {agent.name}
      </h3>
      <p className="font-body text-sm text-stone-600 dark:text-stone-400 line-clamp-2">
        {agent.description}
      </p>

      {/* Progress bar (only when active) */}
      {isActive && (
        <div className="mt-3">
          <div className="h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${colors.progress} transition-all duration-300 ease-out`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Capabilities (compact) */}
      <div className="mt-3 flex flex-wrap gap-1">
        {agent.capabilities.slice(0, 3).map((cap, idx) => (
          <span
            key={idx}
            className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400"
          >
            {cap}
          </span>
        ))}
        {agent.capabilities.length > 3 && (
          <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-500">
            +{agent.capabilities.length - 3}
          </span>
        )}
      </div>
    </button>
  )
}
