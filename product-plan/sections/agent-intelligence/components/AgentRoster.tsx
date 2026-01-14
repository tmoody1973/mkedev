'use client'

import { AgentCard } from './AgentCard'
import type { AgentRosterProps } from '../types'

export function AgentRoster({
  agents,
  activeAgentIds = [],
  onAgentClick,
}: AgentRosterProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-xl text-stone-900 dark:text-stone-100">
            Specialist Agents
          </h2>
          <p className="font-body text-sm text-stone-600 dark:text-stone-400 mt-1">
            6 AI agents working together to answer your questions
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 border-2 border-black dark:border-stone-600">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-xs font-medium text-stone-700 dark:text-stone-300">
            {activeAgentIds.length} Active
          </span>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const isActive = activeAgentIds.includes(agent.id)
          return (
            <AgentCard
              key={agent.id}
              agent={agent}
              status={isActive ? 'in_progress' : 'idle'}
              onClick={() => onAgentClick?.(agent.id)}
            />
          )
        })}
      </div>
    </div>
  )
}
