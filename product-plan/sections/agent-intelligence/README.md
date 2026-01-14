# Agent Intelligence

Visual components that reveal the multi-agent orchestration to users—showing which agents are actively working, their real-time progress, and which agents contributed to each answer.

## Features

- **Activity Indicator**: Real-time progress during query processing
- **Agent Contributors**: Expandable panel showing which agents contributed
- **Source Citations**: Links to knowledge base documents
- **Agent Roster**: Overview of all 6 specialist agents

## Components

| Component | Description |
|-----------|-------------|
| `AgentIntelligence` | Main composite component |
| `AgentActivityIndicator` | Progress bars during processing |
| `AgentContributorsPanel` | Expandable contributions panel |
| `AgentCard` | Individual agent display |
| `AgentRoster` | Grid of all agents |

## The 6 Specialist Agents

| Agent | Specialty |
|-------|-----------|
| Zoning Interpreter | Zoning code analysis |
| Incentives Navigator | Financial programs & grants |
| Feasibility Analyst | Project viability assessment |
| Design Advisor | Architectural guidelines |
| Permit Pathfinder | Permit requirements |
| Compliance Checker | Code compliance verification |

## Usage

```tsx
import { AgentIntelligence } from './components'
import data from './sample-data.json'

<AgentIntelligence
  agents={data.agents}
  activeAgents={data.activeAgents}
  contributions={data.contributions}
  isProcessing={true}
  onAgentClick={(id) => console.log('Agent:', id)}
  onSourceClick={(id) => console.log('Source:', id)}
/>
```

## Design Notes

- Progress bars animate smoothly (not bouncy)
- Checkmarks appear with subtle animation
- Contributors panel expands/collapses
- Each agent has a distinctive icon
- Neobrutalist styling: 2px borders, 4px shadows
