# Memory Layer Specification

## Overview

The Memory Layer provides persistent, semantic memory for MKE.dev agents using Supermemory. It enables cross-conversation context, user preference learning, and project tracking - transforming the agent from stateless to personalized.

## Problem Statement

Current limitations without a memory layer:

| Problem | User Impact |
|---------|-------------|
| No cross-session memory | Must re-explain project every visit |
| No preference learning | Same responses for developer vs homeowner |
| No project tracking | Multi-week projects lose context |
| No semantic recall | Can't search past conversations meaningfully |
| Stateless agents | Every conversation starts fresh |

## Solution: Supermemory Integration

[Supermemory](https://supermemory.ai) provides:
- **Memory API** - Save/retrieve facts about users
- **User Profiles** - Auto-evolving learned preferences
- **Semantic Search** - Find past interactions by meaning
- **MCP Server** - Direct integration with AI agents

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MKE.dev Agent System                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Orchestrator Agent                     │   │
│  │                                                           │   │
│  │   1. Load user context from Memory Layer                  │   │
│  │   2. Plan workflow with user preferences in mind          │   │
│  │   3. Execute specialized agents                           │   │
│  │   4. Save important findings to Memory Layer              │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐             │
│         ▼                    ▼                    ▼             │
│  ┌─────────────┐     ┌─────────────┐      ┌─────────────┐      │
│  │   Memory    │     │  Document   │      │ Specialized │      │
│  │   Layer     │     │    RAG      │      │   Agents    │      │
│  │             │     │             │      │             │      │
│  │ Supermemory │     │ Gemini FSS  │      │ Zoning      │      │
│  │             │     │             │      │ Area Plans  │      │
│  │ • User ctx  │     │ • Zoning    │      │ Incentives  │      │
│  │ • Projects  │     │ • Plans     │      │ Spatial     │      │
│  │ • Prefs     │     │ • Policies  │      │             │      │
│  └─────────────┘     └─────────────┘      └─────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Memory Categories

### 1. User Profile (Auto-Learned)

Supermemory automatically builds user profiles from interactions.

```typescript
interface UserProfile {
  // Inferred from conversations
  role?: "developer" | "architect" | "homeowner" | "investor" | "city_staff";
  experienceLevel?: "beginner" | "intermediate" | "expert";
  preferredResponseStyle?: "detailed" | "summary" | "technical";

  // Explicit from user
  name?: string;
  company?: string;
  primaryInterest?: string;
}
```

**Example Profile Evolution:**
```
Session 1: User asks about RS6 setbacks
  → Profile: { interest: "residential" }

Session 2: User asks about commercial parking ratios
  → Profile: { interest: "residential", secondaryInterest: "commercial" }

Session 3: User mentions "my development company"
  → Profile: { role: "developer", interest: ["residential", "commercial"] }
```

### 2. Project Memory (Explicit Save)

Track user's development projects across sessions.

```typescript
interface ProjectMemory {
  projectId: string;
  name: string;
  type: "residential" | "commercial" | "mixed-use" | "industrial";
  status: "exploring" | "planning" | "permitting" | "construction";

  // Location
  address?: string;
  neighborhood?: string;
  parcelTaxKey?: string;
  zoningDistrict?: string;

  // Requirements
  targetSize?: number; // sq ft
  targetUnits?: number;
  targetUse?: string;

  // Findings
  parkingRequired?: number;
  incentivesIdentified?: string[];
  permitsNeeded?: string[];

  // Timeline
  createdAt: string;
  lastUpdatedAt: string;
  conversations: string[]; // conversation IDs
}
```

### 3. Interaction Memory (Auto-Save)

Important facts from conversations.

```typescript
interface InteractionMemory {
  type: "calculation" | "recommendation" | "finding" | "question";
  content: string;
  context: {
    conversationId: string;
    timestamp: string;
    relatedProject?: string;
  };
  tags: string[];
}
```

**Examples:**
```
{ type: "calculation", content: "Parking for 5000 sqft restaurant: 50 spaces", tags: ["parking", "restaurant"] }
{ type: "finding", content: "500 S 1st St is in Opportunity Zone", tags: ["incentives", "opportunity-zone"] }
{ type: "recommendation", content: "Consider IM zoning for brewery with taproom", tags: ["zoning", "brewery"] }
```

## Integration Methods

### Option A: MCP Server (Recommended)

Add Supermemory MCP to agent tool configuration.

```typescript
// Agent has access to these MCP tools:

// Save a memory
supermemory.memory({
  action: "save",
  content: "User's brewery project: 5000 sqft in Third Ward, needs 12 parking spaces"
})

// Recall memories
supermemory.recall({
  query: "user's current project",
  includeProfile: true
})

// Get formatted context for system prompt
supermemory.context()
```

**Convex Integration:**
```typescript
// convex/agents/orchestrator.ts

const SYSTEM_PROMPT_WITH_MEMORY = `
You are MKE.dev's development assistant.

## User Context
{supermemory_context}

## Your Capabilities
...
`;

export const chat = action({
  handler: async (ctx, { userId, message }) => {
    // 1. Fetch user context from Supermemory
    const userContext = await supermemory.recall({
      userId,
      includeProfile: true
    });

    // 2. Build system prompt with context
    const systemPrompt = SYSTEM_PROMPT_WITH_MEMORY
      .replace('{supermemory_context}', formatContext(userContext));

    // 3. Run agent with personalized context
    const response = await runAgent(systemPrompt, message);

    // 4. Save important findings
    if (response.shouldSave) {
      await supermemory.memory({
        userId,
        action: "save",
        content: response.memoryContent,
        tags: response.memoryTags
      });
    }

    return response;
  }
});
```

### Option B: Direct SDK

For more control, use the JavaScript SDK directly.

```typescript
// convex/lib/memory.ts
import { Supermemory } from 'supermemory';

const sm = new Supermemory({
  apiKey: process.env.SUPERMEMORY_API_KEY
});

export async function getUserContext(userId: string) {
  const [profile, memories] = await Promise.all([
    sm.profiles.get(userId),
    sm.memories.search({
      userId,
      query: "active project OR recent finding",
      limit: 10
    })
  ]);

  return { profile, memories };
}

export async function saveProjectUpdate(
  userId: string,
  project: ProjectMemory
) {
  await sm.memories.add({
    userId,
    content: JSON.stringify(project),
    tags: ['project', project.status, project.neighborhood],
    metadata: { projectId: project.projectId }
  });
}
```

## When to Save Memories

### Auto-Save Triggers

| Trigger | What to Save | Tags |
|---------|--------------|------|
| Parking calculation completed | Calculation result + parameters | `calculation`, `parking`, `{use_type}` |
| Zoning lookup for address | Address, district, overlays | `zoning`, `{neighborhood}` |
| Incentives identified | Incentive types + eligibility | `incentives`, `{incentive_type}` |
| User mentions project details | Project name, type, requirements | `project`, `{project_type}` |
| User expresses preference | Preference type + value | `preference`, `{preference_type}` |

### Manual Save (Agent Decision)

Agent should save when:
- User explicitly asks to "remember this"
- Significant finding that user will likely reference
- Project milestone reached
- Complex calculation completed

### What NOT to Save

- Generic greetings
- Failed queries (unless pattern emerges)
- Duplicate information
- Temporary/exploratory questions

## Memory Retrieval Strategy

### At Conversation Start

```typescript
async function initializeConversation(userId: string) {
  // 1. Get user profile (always)
  const profile = await supermemory.profiles.get(userId);

  // 2. Get active projects (if any)
  const activeProjects = await supermemory.memories.search({
    userId,
    query: "active project",
    tags: ["project", "active"],
    limit: 3
  });

  // 3. Get recent interactions (last 7 days)
  const recentMemories = await supermemory.memories.search({
    userId,
    query: "*",
    limit: 5,
    recency: "7d"
  });

  return { profile, activeProjects, recentMemories };
}
```

### During Conversation

```typescript
async function recallRelevantMemories(userId: string, query: string) {
  // Semantic search for relevant past interactions
  return await supermemory.memories.search({
    userId,
    query,
    limit: 5,
    threshold: 0.7 // relevance threshold
  });
}
```

## User Experience Impact

### Before Memory Layer

```
User: "What about parking for my project?"
Agent: "I'd be happy to help with parking calculations.
        What type of use and how many square feet?"
User: "It's a brewery, 5000 square feet, in the Third Ward"
Agent: [calculates] "You'll need approximately 12 spaces..."

--- NEXT SESSION ---

User: "Any updates on incentives for my brewery?"
Agent: "I don't have context about a brewery project.
        Could you tell me more about your project?"
User: 😤
```

### After Memory Layer

```
User: "What about parking for my project?"
Agent: "For your 5000 sq ft brewery in the Third Ward,
        you'll need approximately 12 parking spaces.
        Last time we discussed possibly using the reduced
        parking provisions since you're in an IM district."

--- NEXT SESSION ---

User: "Any updates on incentives for my brewery?"
Agent: "Great question about your Third Ward brewery project!
        Since we last spoke, I should mention the Harbor District
        plan emphasizes support for craft beverage businesses.
        You're also in an Opportunity Zone which offers..."
User: 😊
```

## Privacy & Data Handling

### Data Retention

| Memory Type | Retention | User Control |
|-------------|-----------|--------------|
| User Profile | Until deleted | Can reset anytime |
| Project Memory | 1 year after last update | Can delete individual projects |
| Interaction Memory | 90 days | Can delete any memory |

### User Controls

```typescript
// User can request memory deletion
export const deleteMyMemories = action({
  handler: async (ctx, { userId, scope }) => {
    if (scope === "all") {
      await supermemory.memories.deleteAll(userId);
      await supermemory.profiles.reset(userId);
    } else if (scope === "project") {
      await supermemory.memories.delete({
        userId,
        tags: ["project", args.projectId]
      });
    }
  }
});
```

### Transparency

- User can view their stored memories via profile page
- Clear indication when agent is using remembered context
- Option to "start fresh" for any conversation

## Implementation Plan

### Phase 1: Foundation (Week 1)

1. Set up Supermemory account and API keys
2. Add MCP Server to agent configuration
3. Implement basic save/recall in Orchestrator
4. Test with simple project memory

### Phase 2: Auto-Learning (Week 2)

1. Configure auto-save triggers
2. Implement user profile injection
3. Add memory retrieval at conversation start
4. Test preference learning

### Phase 3: Polish (Week 3)

1. Build user memory management UI
2. Implement privacy controls
3. Add memory indicators in chat UI
4. Performance optimization

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Return user recognition | > 95% | Users with prior sessions correctly identified |
| Project continuity | > 80% | Multi-session projects maintain context |
| Preference accuracy | > 70% | Inferred preferences match user feedback |
| Memory relevance | > 85% | Retrieved memories rated relevant by user |
| User satisfaction | +20% | NPS improvement for returning users |

## Dependencies

- [Orchestrator Agent](../2026-01-15-orchestrator-agent/spec.md) - Primary consumer of memory context
- Clerk Authentication - User identity for memory scoping
- Convex - Conversation history (audit trail, separate from semantic memory)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Supermemory API unavailability | High | Graceful degradation to stateless mode |
| Incorrect memory retrieval | Medium | Confidence thresholds, user correction UI |
| Privacy concerns | High | Clear data policies, user control, transparency |
| Memory bloat | Medium | Retention policies, deduplication |
| Latency impact | Medium | Async memory operations, caching |

## References

- [Supermemory Documentation](https://supermemory.ai/docs/intro)
- [Supermemory MCP Server](https://supermemory.ai/docs/supermemory-mcp/mcp)
- [MKE.dev Orchestrator Spec](../2026-01-15-orchestrator-agent/spec.md)
