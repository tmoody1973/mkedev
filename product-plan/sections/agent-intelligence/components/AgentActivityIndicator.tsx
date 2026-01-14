'use client'

import type { AgentActivityIndicatorProps, AgentColor } from '../types'

// Color mappings for progress bars
const colorClasses: Record<AgentColor, { progress: string; icon: string }> = {
  sky: { progress: 'bg-sky-500', icon: 'text-sky-600 dark:text-sky-400' },
  emerald: { progress: 'bg-emerald-500', icon: 'text-emerald-600 dark:text-emerald-400' },
  amber: { progress: 'bg-amber-500', icon: 'text-amber-600 dark:text-amber-400' },
  violet: { progress: 'bg-violet-500', icon: 'text-violet-600 dark:text-violet-400' },
  rose: { progress: 'bg-rose-500', icon: 'text-rose-600 dark:text-rose-400' },
  teal: { progress: 'bg-teal-500', icon: 'text-teal-600 dark:text-teal-400' },
}

export function AgentActivityIndicator({
  query,
  activityItems,
  agents,
  isVisible = true,
}: AgentActivityIndicatorProps) {
  if (!isVisible) return null

  // Create a map for quick agent lookup
  const agentMap = new Map(agents.map(a => [a.id, a]))

  // Sort activity items: completed first, then in_progress, then pending
  const sortedItems = [...activityItems].sort((a, b) => {
    const order = { completed: 0, in_progress: 1, pending: 2, error: 3 }
    return order[a.status] - order[b.status]
  })

  const completedCount = activityItems.filter(i => i.status === 'completed').length
  const totalCount = activityItems.length

  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-xl bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(68,64,60,1)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-sky-600 dark:text-sky-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <p className="font-heading font-bold text-stone-900 dark:text-stone-100">
            Analyzing your question...
          </p>
          <p className="font-mono text-xs text-stone-500 dark:text-stone-400">
            {completedCount} of {totalCount} agents complete
          </p>
        </div>
      </div>

      {/* Query */}
      <div className="mb-4 p-3 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
        <p className="font-body text-sm text-stone-700 dark:text-stone-300 italic">
          "{query}"
        </p>
      </div>

      {/* Agent Progress List */}
      <div className="space-y-3">
        {sortedItems.map((item) => {
          const agent = agentMap.get(item.agentId)
          if (!agent) return null

          const colors = colorClasses[agent.color]
          const isCompleted = item.status === 'completed'
          const isActive = item.status === 'in_progress'
          const isPending = item.status === 'pending'

          return (
            <div key={item.agentId} className={`${isPending ? 'opacity-40' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`font-heading font-semibold text-sm ${colors.icon}`}>
                    {agent.name}
                  </span>
                </div>
                {isCompleted && (
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
                {isActive && (
                  <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400">
                    {item.progress}%
                  </span>
                )}
                {isPending && (
                  <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500">
                    Waiting
                  </span>
                )}
              </div>
              <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors.progress} transition-all duration-500 ease-out ${isActive ? 'animate-pulse' : ''}`}
                  style={{ width: `${isCompleted ? 100 : item.progress}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer hint */}
      <p className="mt-4 font-body text-xs text-stone-500 dark:text-stone-400 text-center">
        Agents collaborate to provide comprehensive answers
      </p>
    </div>
  )
}
