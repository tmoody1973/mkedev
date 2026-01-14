'use client'

import { useState } from 'react'
import { AgentRoster } from './AgentRoster'
import { AgentActivityIndicator } from './AgentActivityIndicator'
import { AgentContributorsPanel } from './AgentContributorsPanel'
import type { AgentIntelligenceProps } from '../types'

export function AgentIntelligence({
  agents,
  activityDemo,
  contributionsDemo,
  onAgentClick,
  onCitationClick,
}: AgentIntelligenceProps) {
  const [isContributorsExpanded, setIsContributorsExpanded] = useState(true)

  // Get active agent IDs from the activity demo
  const activeAgentIds = activityDemo.agents
    .filter(a => a.status === 'in_progress' || a.status === 'completed')
    .map(a => a.agentId)

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="font-heading font-bold text-3xl md:text-4xl text-stone-900 dark:text-stone-100">
          Agent Intelligence
        </h1>
        <p className="font-body text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
          A multi-agent system that collaborates to answer complex development questions with transparency and citations.
        </p>
      </div>

      {/* Two-Column Layout for Demo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Activity Indicator (Thinking State) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sky-500 animate-pulse" />
            <h2 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
              Real-time Analysis
            </h2>
          </div>
          <p className="font-body text-sm text-stone-600 dark:text-stone-400">
            Watch as specialist agents work together to analyze your question. Each agent contributes their expertise.
          </p>
          <AgentActivityIndicator
            query={activityDemo.query}
            activityItems={activityDemo.agents}
            agents={agents}
            isVisible={true}
          />
        </div>

        {/* Right: Contributors Panel (Response State) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
              Response with Sources
            </h2>
          </div>
          <p className="font-body text-sm text-stone-600 dark:text-stone-400">
            Every response shows which agents contributed and their source citations for full transparency.
          </p>

          {/* Summary Card */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500 shadow-[4px_4px_0px_0px_rgba(16,185,129,0.3)]">
            <p className="font-body text-stone-800 dark:text-stone-200">
              {contributionsDemo.summary}
            </p>
          </div>

          {/* Contributors Panel */}
          <AgentContributorsPanel
            contributions={contributionsDemo.contributions}
            agents={agents}
            isExpanded={isContributorsExpanded}
            onToggleExpand={() => setIsContributorsExpanded(!isContributorsExpanded)}
            onCitationClick={onCitationClick}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-0.5 bg-stone-200 dark:bg-stone-700" />
        <span className="font-mono text-xs text-stone-400 dark:text-stone-500">MEET THE AGENTS</span>
        <div className="flex-1 h-0.5 bg-stone-200 dark:bg-stone-700" />
      </div>

      {/* Agent Roster */}
      <AgentRoster
        agents={agents}
        activeAgentIds={activeAgentIds}
        onAgentClick={onAgentClick}
      />

      {/* Footer */}
      <div className="text-center pt-4 border-t border-stone-200 dark:border-stone-700">
        <p className="font-body text-sm text-stone-500 dark:text-stone-400">
          Powered by specialized AI agents with access to Milwaukee zoning codes, incentive programs, and development guidelines.
        </p>
      </div>
    </div>
  )
}
