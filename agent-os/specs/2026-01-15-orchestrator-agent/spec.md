# Orchestrator Agent Specification

## Overview

The Orchestrator Agent (also known as "Feasibility Analyst") is a meta-agent that coordinates multiple specialized agents to answer complex, multi-domain questions about Milwaukee development. It replaces simple single-agent function calling with intelligent workflow planning and result synthesis.

## Problem Statement

Current single-agent approach limitations:
1. **Limited reasoning depth** - Gemini's function calling works well for 1-5 tool calls but struggles with complex workflows requiring 10+ steps
2. **No parallel execution** - Tools are called sequentially, even when they could run in parallel
3. **No workflow memory** - Each tool call is independent; can't build on intermediate results intelligently
4. **Single synthesis point** - All results are combined at the end, rather than iteratively refined

## Use Cases

### Primary Use Case: Feasibility Analysis
> "Find me parcels in the Menomonee Valley that are zoned industrial, city-owned, and align with the area plan's development goals"

**Required workflow:**
1. Query area plan for Menomonee Valley development goals
2. Get list of industrial zoning codes (IM, IL, IH)
3. Query ESRI for parcels with those zoning codes in the Valley boundary
4. Filter for city-owned properties
5. For each parcel, check alignment with area plan goals
6. Rank and present results

### Secondary Use Cases

| Use Case | Complexity | Agents Involved |
|----------|------------|-----------------|
| Site suitability analysis | High | Zoning, Area Plans, Incentives |
| Development scenario comparison | High | Zoning, Parking, Area Plans |
| Permit pathway determination | Medium | Zoning, Forms/Permits |
| Incentive stacking analysis | Medium | Incentives, Area Plans, Zoning |
| Neighborhood impact assessment | High | Area Plans, Zoning, Demographics |

## Architecture

### Option A: Hierarchical Orchestration (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                    Orchestrator Agent                        │
│  (Plans workflow, delegates tasks, synthesizes results)      │
└─────────────────────┬───────────────────────────────────────┘
                      │
         ┌────────────┼────────────┬────────────┐
         ▼            ▼            ▼            ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Zoning    │ │ Area Plans  │ │ Incentives  │ │   Spatial   │
│   Agent     │ │   Agent     │ │   Agent     │ │   Agent     │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

**How it works:**
1. User asks complex question
2. Orchestrator creates execution plan (DAG of tasks)
3. Orchestrator dispatches tasks to specialized agents
4. Agents return structured results
5. Orchestrator synthesizes final response

### Option B: Reactive Agent Network

Agents communicate via shared context/blackboard, reacting to each other's outputs. More flexible but harder to debug.

### Option C: LangGraph-style State Machine

Explicit state transitions with conditional branching. Good for well-defined workflows but less adaptable.

**Recommendation:** Start with Option A for predictability and debuggability.

## Technical Design

### Orchestrator Agent Structure

```typescript
// convex/agents/orchestrator.ts

interface TaskPlan {
  id: string;
  description: string;
  tasks: Task[];
  dependencies: Map<string, string[]>; // task -> depends on tasks
}

interface Task {
  id: string;
  agent: "zoning" | "area-plans" | "incentives" | "spatial";
  action: string;
  parameters: Record<string, unknown>;
  dependsOn: string[];
}

interface TaskResult {
  taskId: string;
  success: boolean;
  data: unknown;
  error?: string;
}

interface OrchestratorState {
  plan: TaskPlan;
  completedTasks: Map<string, TaskResult>;
  pendingTasks: string[];
  finalResult?: string;
}
```

### Planning Phase

The Orchestrator uses a two-phase approach:

**Phase 1: Plan Generation**
```typescript
const planPrompt = `
You are a planning agent for Milwaukee development queries.
Given the user's question, create an execution plan.

Available agents:
- zoning: Zoning code queries, permitted uses, parking calculations
- area-plans: Neighborhood development goals, housing strategies
- incentives: TIF, Opportunity Zones, tax credits
- spatial: Geocoding, parcel search, distance calculations

Output a JSON plan with tasks and dependencies.
`;
```

**Phase 2: Execution**
- Execute tasks in dependency order
- Parallelize independent tasks
- Handle failures gracefully (retry, skip, or abort)

### Agent Communication Protocol

```typescript
interface AgentRequest {
  requestId: string;
  fromAgent: string;
  toAgent: string;
  action: string;
  parameters: Record<string, unknown>;
  context: Record<string, unknown>; // Shared context from previous tasks
}

interface AgentResponse {
  requestId: string;
  success: boolean;
  data: unknown;
  metadata: {
    processingTimeMs: number;
    toolsUsed: string[];
    confidence: number;
  };
}
```

### Specialized Agents

| Agent | Responsibilities | Tools |
|-------|-----------------|-------|
| **Zoning Agent** | Code interpretation, permitted uses, dimensional standards | `query_zoning_code`, `calculate_parking`, `query_zoning_at_point` |
| **Area Plans Agent** | Neighborhood vision, development goals, housing strategies | `query_area_plans` |
| **Incentives Agent** | TIF, OZ, tax credits, grant programs | `query_incentives`, `calculate_tax_benefit` |
| **Spatial Agent** | Geocoding, parcel search, boundary queries | `geocode_address`, `search_parcels`, `query_esri_layer` |

## Implementation Plan

### Phase 1: Foundation (Post-Hackathon)

1. **Refactor existing Zoning Agent** into modular structure
2. **Create Area Plans Agent** (separate from Zoning)
3. **Define agent communication protocol**
4. **Build basic Orchestrator** with sequential execution

### Phase 2: Parallel Execution

1. **Add task dependency analysis**
2. **Implement parallel task dispatch**
3. **Add result caching** for repeated queries

### Phase 3: Advanced Features

1. **Iterative refinement** - Orchestrator can re-query based on intermediate results
2. **User clarification** - Pause execution to ask user for input
3. **Explanation mode** - Show reasoning steps to user

## API Design

### Convex Actions

```typescript
// Query with automatic orchestration
export const analyzeQuery = action({
  args: {
    question: v.string(),
    options: v.optional(v.object({
      maxTasks: v.optional(v.number()),
      timeout: v.optional(v.number()),
      explainPlan: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    // 1. Classify query complexity
    // 2. If simple, use single agent
    // 3. If complex, use orchestrator
  },
});

// Get execution plan without running
export const getQueryPlan = action({
  args: { question: v.string() },
  handler: async (ctx, args) => {
    // Return planned tasks without execution
  },
});
```

## Observability

### Metrics to Track

| Metric | Purpose |
|--------|---------|
| `orchestrator.plan_generation_time` | Time to create execution plan |
| `orchestrator.total_execution_time` | End-to-end latency |
| `orchestrator.tasks_per_query` | Complexity indicator |
| `orchestrator.parallel_efficiency` | Actual vs theoretical parallelism |
| `agent.{name}.success_rate` | Per-agent reliability |
| `agent.{name}.avg_latency` | Per-agent performance |

### Opik Integration

```typescript
@track("orchestrator.analyze")
async function analyzeQuery(question: string) {
  const plan = await generatePlan(question);

  for (const task of plan.tasks) {
    span(`task.${task.agent}.${task.action}`, async () => {
      return await executeTask(task);
    });
  }
}
```

## Success Criteria

| Criteria | Target |
|----------|--------|
| Complex query success rate | > 85% |
| End-to-end latency (complex) | < 30 seconds |
| User satisfaction (complex queries) | > 4.0/5.0 |
| Parallel efficiency | > 60% |

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Plan generation errors | High | Fallback to single-agent mode |
| Cascading agent failures | High | Circuit breaker pattern, partial results |
| Latency explosion | Medium | Timeout per task, parallel execution |
| Context window overflow | Medium | Summarize intermediate results |

## Timeline

| Phase | Timing | Deliverable |
|-------|--------|-------------|
| **Spec Complete** | Jan 15, 2026 | This document |
| **Phase 1** | Feb 15 - Mar 1 | Basic orchestrator |
| **Phase 2** | Mar 1 - Mar 15 | Parallel execution |
| **Phase 3** | Mar 15 - Apr 1 | Advanced features |

## Dependencies

- **[Memory Layer](../2026-01-15-memory-layer/spec.md)** - Provides user context, project history, and preferences
- **Clerk Authentication** - User identity for memory scoping
- **Convex** - Message persistence and agent state management
- **Gemini File Search Stores** - Document RAG for specialized agents

### Memory Layer Integration

The Orchestrator benefits significantly from the Memory Layer:

```typescript
// Orchestrator with user context
export const analyzeQuery = action({
  handler: async (ctx, { userId, question }) => {
    // 1. Load user context from Memory Layer
    const userContext = await supermemory.recall({
      userId,
      includeProfile: true,
      query: "active project OR preferences"
    });

    // 2. Enhance planning with user preferences
    const plan = await generatePlan(question, {
      userRole: userContext.profile?.role, // "developer" vs "homeowner"
      experienceLevel: userContext.profile?.experienceLevel,
      activeProject: userContext.memories?.find(m => m.tags.includes("project")),
    });

    // 3. Execute with personalized context
    const result = await executePlan(plan);

    // 4. Save important findings
    if (result.shouldSave) {
      await supermemory.memory({
        userId,
        action: "save",
        content: result.summary,
        tags: ["finding", question.category]
      });
    }

    return result;
  },
});
```

**Benefits:**
- **Personalized Planning** - Workflow adapts to user expertise level
- **Project Continuity** - Multi-session feasibility analyses maintain context
- **Preference Learning** - Response style matches user expectations over time
- **Finding Accumulation** - Important discoveries are saved for future reference

## References

- [Google ADK Multi-Agent Patterns](https://ai.google.dev/adk)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [CrewAI Orchestration](https://docs.crewai.com/)
- [MKE.dev Zoning Agent](../2026-01-14-zoning-interpreter-agent/)
- [Memory Layer Spec](../2026-01-15-memory-layer/spec.md)
