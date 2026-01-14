// =============================================================================
// Data Types
// =============================================================================

/** Icon names available for agents */
export type AgentIcon =
  | 'building-library'
  | 'currency-dollar'
  | 'chart-bar'
  | 'paint-brush'
  | 'document-check'
  | 'shield-check'

/** Color themes for agents (Tailwind color names) */
export type AgentColor = 'sky' | 'emerald' | 'amber' | 'violet' | 'rose' | 'teal'

/** A specialist AI agent in the system */
export interface Agent {
  id: string
  name: string
  icon: AgentIcon
  color: AgentColor
  description: string
  capabilities: string[]
}

/** Status of an agent during query processing */
export type AgentStatus = 'pending' | 'in_progress' | 'completed' | 'error'

/** Real-time activity state for a single agent */
export interface AgentActivityItem {
  agentId: string
  status: AgentStatus
  progress: number
  startedAt: string | null
  completedAt: string | null
  error?: string
}

/** Overall activity state for a query being processed */
export interface AgentActivity {
  query: string
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  agents: AgentActivityItem[]
}

/** A citation/source reference for an agent's finding */
export interface Citation {
  id: string
  source: string
  section: string
  title: string
  url: string | null
}

/** A single agent's contribution to a response */
export interface AgentContribution {
  agentId: string
  finding: string
  confidence: number
  citations: Citation[]
}

/** Complete agent contributions for a response */
export interface AgentContributions {
  responseId: string
  query: string
  contributions: AgentContribution[]
  summary: string
}

// =============================================================================
// Component Props
// =============================================================================

/** Props for the Agent Roster component showing all available agents */
export interface AgentRosterProps {
  /** List of all specialist agents */
  agents: Agent[]
  /** Currently active agent IDs (for highlighting) */
  activeAgentIds?: string[]
  /** Called when an agent card is clicked */
  onAgentClick?: (agentId: string) => void
}

/** Props for the Agent Activity Indicator component */
export interface AgentActivityIndicatorProps {
  /** The query being processed */
  query: string
  /** List of all agents with their current activity state */
  activityItems: AgentActivityItem[]
  /** Agent definitions for displaying names and icons */
  agents: Agent[]
  /** Whether to show the indicator (controls visibility) */
  isVisible?: boolean
}

/** Props for the Agent Contributors Panel component */
export interface AgentContributorsPanelProps {
  /** Contributions from agents that answered the query */
  contributions: AgentContribution[]
  /** Agent definitions for displaying names and icons */
  agents: Agent[]
  /** Whether the panel is expanded */
  isExpanded?: boolean
  /** Called when expand/collapse is toggled */
  onToggleExpand?: () => void
  /** Called when a citation is clicked */
  onCitationClick?: (citation: Citation) => void
}

/** Props for a single Agent Card component */
export interface AgentCardProps {
  /** The agent to display */
  agent: Agent
  /** Current status of this agent */
  status?: AgentStatus
  /** Progress percentage (0-100) when in_progress */
  progress?: number
  /** Called when the card is clicked */
  onClick?: () => void
}

/** Props for the main Agent Intelligence showcase component */
export interface AgentIntelligenceProps {
  /** All specialist agents in the system */
  agents: Agent[]
  /** Demo activity state showing agents processing a query */
  activityDemo: AgentActivity
  /** Demo contributions showing completed agent findings */
  contributionsDemo: AgentContributions
  /** Called when an agent card is clicked in the roster */
  onAgentClick?: (agentId: string) => void
  /** Called when a citation is clicked */
  onCitationClick?: (citation: Citation) => void
}
