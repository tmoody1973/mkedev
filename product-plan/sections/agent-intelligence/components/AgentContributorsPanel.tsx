'use client'

import { useState } from 'react'
import type { AgentContributorsPanelProps, AgentColor, AgentIcon } from '../types'

// Icon component
function AgentIconComponent({ icon, className }: { icon: AgentIcon; className?: string }) {
  const baseClass = className || 'w-5 h-5'

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

// Color mappings
const colorClasses: Record<AgentColor, { bg: string; icon: string; border: string }> = {
  sky: { bg: 'bg-sky-100 dark:bg-sky-900/30', icon: 'text-sky-600 dark:text-sky-400', border: 'border-sky-300 dark:border-sky-700' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-300 dark:border-emerald-700' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', icon: 'text-amber-600 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-700' },
  violet: { bg: 'bg-violet-100 dark:bg-violet-900/30', icon: 'text-violet-600 dark:text-violet-400', border: 'border-violet-300 dark:border-violet-700' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', icon: 'text-rose-600 dark:text-rose-400', border: 'border-rose-300 dark:border-rose-700' },
  teal: { bg: 'bg-teal-100 dark:bg-teal-900/30', icon: 'text-teal-600 dark:text-teal-400', border: 'border-teal-300 dark:border-teal-700' },
}

export function AgentContributorsPanel({
  contributions,
  agents,
  isExpanded: controlledExpanded,
  onToggleExpand,
  onCitationClick,
}: AgentContributorsPanelProps) {
  const [internalExpanded, setInternalExpanded] = useState(false)
  const isExpanded = controlledExpanded ?? internalExpanded

  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand()
    } else {
      setInternalExpanded(!internalExpanded)
    }
  }

  // Create agent lookup map
  const agentMap = new Map(agents.map(a => [a.id, a]))

  return (
    <div className="w-full rounded-xl bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(68,64,60,1)] overflow-hidden">
      {/* Toggle Header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {contributions.slice(0, 4).map((contribution) => {
              const agent = agentMap.get(contribution.agentId)
              if (!agent) return null
              const colors = colorClasses[agent.color]
              return (
                <div
                  key={contribution.agentId}
                  className={`w-8 h-8 rounded-full ${colors.bg} border-2 border-white dark:border-stone-800 flex items-center justify-center`}
                >
                  <AgentIconComponent icon={agent.icon} className={`w-4 h-4 ${colors.icon}`} />
                </div>
              )
            })}
            {contributions.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 border-2 border-white dark:border-stone-800 flex items-center justify-center">
                <span className="font-mono text-xs font-bold text-stone-600 dark:text-stone-300">
                  +{contributions.length - 4}
                </span>
              </div>
            )}
          </div>
          <div className="text-left">
            <p className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100">
              Sources & Contributors
            </p>
            <p className="font-mono text-xs text-stone-500 dark:text-stone-400">
              {contributions.length} agents contributed
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-stone-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t-2 border-black dark:border-stone-600">
          <div className="divide-y divide-stone-200 dark:divide-stone-700">
            {contributions.map((contribution) => {
              const agent = agentMap.get(contribution.agentId)
              if (!agent) return null
              const colors = colorClasses[agent.color]

              return (
                <div key={contribution.agentId} className="p-4">
                  {/* Agent Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${colors.bg}`}>
                      <AgentIconComponent icon={agent.icon} className={`w-4 h-4 ${colors.icon}`} />
                    </div>
                    <span className={`font-heading font-bold text-sm ${colors.icon}`}>
                      {agent.name}
                    </span>
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400">
                        {Math.round(contribution.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>

                  {/* Finding */}
                  <p className="font-body text-sm text-stone-700 dark:text-stone-300 mb-3">
                    {contribution.finding}
                  </p>

                  {/* Citations */}
                  {contribution.citations.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {contribution.citations.map((citation) => (
                        <button
                          key={citation.id}
                          onClick={() => onCitationClick?.(citation)}
                          className={`
                            inline-flex items-center gap-1.5 px-2 py-1 rounded-lg
                            ${colors.bg} ${colors.border} border
                            hover:opacity-80 transition-opacity
                          `}
                        >
                          <svg className={`w-3 h-3 ${colors.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                          </svg>
                          <span className="font-mono text-[10px] font-medium text-stone-700 dark:text-stone-300">
                            {citation.section || citation.source}
                          </span>
                          {citation.url && (
                            <svg className={`w-3 h-3 ${colors.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
