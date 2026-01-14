# Milestone 04 — Agent Intelligence

## Overview

Visual components that reveal the multi-agent orchestration to users—showing which agents are actively working, their real-time progress, and which agents contributed to each answer. This transparency layer builds trust by making the AI reasoning process visible without overwhelming users.

---

## User Flows to Implement

1. **View animated progress indicator** as agents analyze a complex query
2. **See which specific agents are currently active** (with checkmarks as they complete)
3. **Expand the "Sources & Contributors" panel** on any response to see agent contributions
4. **View each agent's specific finding** with source citations
5. **Understand the role of each specialist agent** in the system

---

## UI Components to Integrate

See `sections/agent-intelligence/components/` for the following:

### Activity Indicators
- `AgentActivityIndicator` — Shows real-time agent progress
- `AgentProgressBar` — Individual agent's progress with animation
- `AgentCheckmark` — Completion indicator

### Contributors Panel
- `AgentContributorsPanel` — Expandable panel showing agent contributions
- `AgentContribution` — Single agent's finding with source citations
- `SourceCitation` — Linked citation to knowledge base document

### Agent Roster
- `AgentRoster` — Grid/list of all 6 specialist agents
- `AgentCard` — Individual agent with icon, name, description, status

---

## The 6 Specialist Agents

| Agent | Specialty | Description |
|-------|-----------|-------------|
| Zoning Interpreter | Zoning code analysis | Interprets zoning classifications, permitted uses, dimensional standards |
| Incentives Navigator | Financial programs & grants | Identifies TIF districts, Opportunity Zones, tax credits, grants |
| Feasibility Analyst | Project viability assessment | Evaluates overall project feasibility combining all factors |
| Design Advisor | Architectural guidelines | Reviews design overlay requirements, historic district rules |
| Permit Pathfinder | Permit requirements | Maps out required permits, timelines, review processes |
| Compliance Checker | Code compliance verification | Verifies compliance with all applicable codes and regulations |

---

## Backend Requirements

### Multi-Agent Orchestration

Implement an orchestration layer that:
1. Receives a user query
2. Determines which agents are relevant
3. Dispatches queries to relevant agents in parallel
4. Collects and synthesizes responses
5. Streams progress updates to the UI

### Progress Streaming
- WebSocket or Server-Sent Events for real-time progress
- Each agent reports: `started`, `processing`, `completed`
- Include intermediate findings as they become available

### Agent Response Format

```typescript
interface AgentResponse {
  agentId: string
  agentName: string
  status: 'idle' | 'processing' | 'completed' | 'error'
  findings: AgentFinding[]
  processingTime: number
}

interface AgentFinding {
  summary: string
  details: string
  confidence: number
  sources: SourceCitation[]
}

interface SourceCitation {
  documentId: string
  documentTitle: string
  excerpt: string
  pageNumber?: number
  url?: string
}
```

### Integration with Chat

- Agent activity indicator appears below user message while processing
- Agent contributions are attached to assistant messages
- Expandable panel reveals which agents contributed to each response

---

## Data Models

```typescript
interface Agent {
  id: string
  name: string
  icon: string
  description: string
  specialty: string
  status: 'idle' | 'active' | 'completed'
}

interface AgentContribution {
  agent: Agent
  finding: string
  sources: SourceCitation[]
  processingTime: number
}

interface QueryProgress {
  queryId: string
  activeAgents: Agent[]
  completedAgents: Agent[]
  totalAgents: number
  estimatedTimeRemaining?: number
}
```

---

## Success Criteria

- [ ] Agent activity indicator shows during query processing
- [ ] Progress bars animate smoothly for each active agent
- [ ] Checkmarks appear as agents complete
- [ ] Contributors panel expands/collapses on responses
- [ ] Each agent's finding shows with source citations
- [ ] Agent roster displays all 6 agents with descriptions
- [ ] Real-time progress streaming via WebSocket/SSE
- [ ] Mobile responsive layout
- [ ] Neobrutalist styling with 2px borders and shadow offsets
