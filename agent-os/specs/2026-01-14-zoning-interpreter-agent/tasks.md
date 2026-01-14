# Task Breakdown: Zoning Interpreter Agent

## Overview
Total Tasks: 5 Task Groups | Google ADK Agent with Conversational Context

This breakdown implements an intelligent zoning assistant that gathers context through conversation, geocodes addresses, and provides grounded answers with citations.

---

## Task List

### Task Group 1: Agent Infrastructure Setup
**Dependencies:** Document Ingestion Pipeline (completed)

- [ ] 1.0 Set up Google ADK agent infrastructure
  - [ ] 1.1 Create apps/agents directory structure
    - Create `/apps/agents/` directory
    - Initialize package.json with ADK dependencies
    - Configure TypeScript for agents
  - [ ] 1.2 Install Google ADK and dependencies
    - `google-adk` - Core agent framework
    - `zod` - Schema validation for tools
    - `@google/generative-ai` - Gemini integration
  - [ ] 1.3 Configure environment variables
    - GOOGLE_GEMINI_API_KEY (already have)
    - MAPBOX_ACCESS_TOKEN (for geocoding)
    - AGENT_API_URL (for Convex integration)
  - [ ] 1.4 Create base agent configuration
    - InMemoryRunner setup
    - Session management utilities
    - Files: `/apps/agents/src/config.ts`

**Acceptance Criteria:**
- ADK installed and imports resolve
- Basic agent runs without errors
- Session can be created and retrieved

---

### Task Group 2: Core Tool Implementation
**Dependencies:** Task Group 1

- [ ] 2.0 Implement agent tools
  - [ ] 2.1 Create geocode_address tool
    - Mapbox Geocoding API integration
    - Milwaukee bounding box filter
    - Return coordinates and confidence
    - Files: `/apps/agents/src/zoning-interpreter/tools/geocode.ts`
  - [ ] 2.2 Create query_zoning_at_point tool
    - ESRI REST zoning layer query
    - ESRI overlay zones query (TIF, Historic)
    - Return district code and overlays
    - Files: `/apps/agents/src/zoning-interpreter/tools/zoning.ts`
  - [ ] 2.3 Create query_rag tool
    - Integration with Convex RAG action
    - Context enhancement (district, use type)
    - Return grounded response with citations
    - Files: `/apps/agents/src/zoning-interpreter/tools/rag.ts`
  - [ ] 2.4 Create calculate_parking tool
    - Parking ratios from Section 295-403
    - Downtown reduced rates
    - Use type multipliers
    - Files: `/apps/agents/src/zoning-interpreter/tools/parking.ts`
  - [ ] 2.5 Write tool unit tests
    - Mock Mapbox geocoding responses
    - Mock ESRI REST responses
    - Verify parking calculations
    - Files: `/apps/agents/src/zoning-interpreter/tools/__tests__/`

**Acceptance Criteria:**
- All tools execute without errors
- Geocoding returns valid Milwaukee coordinates
- Zoning query returns district codes
- Parking calculation matches manual math

---

### Task Group 3: Agent Definition & Prompts
**Dependencies:** Task Group 2

- [ ] 3.0 Create the Zoning Interpreter agent
  - [ ] 3.1 Write system prompt
    - Context gathering guidelines
    - Tool usage instructions
    - Response format specifications
    - Example conversations
    - Files: `/apps/agents/src/zoning-interpreter/prompts.ts`
  - [ ] 3.2 Create LlmAgent definition
    - Configure gemini-2.0-flash model
    - Attach all tools
    - Set temperature and token limits
    - Files: `/apps/agents/src/zoning-interpreter/agent.ts`
  - [ ] 3.3 Implement session management
    - Create session function
    - Chat function with session context
    - Session cleanup/expiration
    - Files: `/apps/agents/src/zoning-interpreter/session.ts`
  - [ ] 3.4 Create agent entry point
    - Export agent and utilities
    - Health check function
    - Files: `/apps/agents/src/zoning-interpreter/index.ts`

**Acceptance Criteria:**
- Agent responds to basic zoning questions
- Agent asks for address when needed
- Session context persists across turns
- Tools are called appropriately

---

### Task Group 4: Convex Integration
**Dependencies:** Task Group 3

- [ ] 4.0 Integrate agent with Convex backend
  - [ ] 4.1 Create Convex agent actions
    - createSession action
    - chat action
    - getSessionHistory query
    - Files: `/apps/web/convex/agents/zoning.ts`
  - [ ] 4.2 Add session storage table
    - Store session IDs and metadata
    - Track last activity timestamp
    - Link to user ID
    - Files: `/apps/web/convex/schema.ts`
  - [ ] 4.3 Create API route for agent
    - POST /api/agents/zoning/chat
    - POST /api/agents/zoning/session
    - Handle authentication
    - Files: `/apps/web/app/api/agents/zoning/route.ts`
  - [ ] 4.4 Implement agent service connection
    - HTTP client for agent API
    - Retry logic
    - Error handling
    - Files: `/apps/web/lib/agent-client.ts`

**Acceptance Criteria:**
- Convex actions call agent successfully
- Sessions persist in database
- API routes work with authentication
- Errors handled gracefully

---

### Task Group 5: Frontend Chat Integration
**Dependencies:** Task Group 4

- [ ] 5.0 Create chat UI integration
  - [ ] 5.1 Create useZoningAgent hook
    - Session initialization
    - Message sending
    - Loading states
    - Files: `/apps/web/src/hooks/useZoningAgent.ts`
  - [ ] 5.2 Update ChatPanel for agent mode
    - Toggle between RAG and agent mode
    - Show context gathering UI
    - Display citations inline
    - Files: `/apps/web/src/components/chat/ChatPanel.tsx`
  - [ ] 5.3 Create ContextIndicator component
    - Show gathered context (address, zoning)
    - Visual feedback for tool calls
    - Files: `/apps/web/src/components/chat/ContextIndicator.tsx`
  - [ ] 5.4 Add map-to-chat coordination
    - Click parcel → set context in chat
    - Agent uses selected parcel context
    - Files: `/apps/web/src/contexts/ChatContext.tsx`
  - [ ] 5.5 End-to-end testing
    - Test parking question flow
    - Test address geocoding
    - Test context persistence
    - Verify citations display

**Acceptance Criteria:**
- Chat UI shows agent responses
- Context indicator updates during conversation
- Map selection populates chat context
- Citations link to relevant sections

---

## Execution Order

```
Task Group 1: Agent Infrastructure (2-3 hours)
    └── Task Group 2: Core Tools (4-5 hours)
        └── Task Group 3: Agent Definition (3-4 hours)
            └── Task Group 4: Convex Integration (3-4 hours)
                └── Task Group 5: Frontend Integration (4-5 hours)
```

---

## Dependencies Graph

```
1 (Infrastructure)
└── 2 (Tools)
    └── 3 (Agent)
        └── 4 (Convex)
            └── 5 (Frontend)
```

---

## Test Conversations for Validation

After implementation, verify with these conversations:

### Test 1: Parking with Address Gathering
```
User: "How many parking spaces do I need for my restaurant?"
Expected Agent: Asks for address and square footage
User: "500 N Water St, 2500 sq ft"
Expected Agent:
- Geocodes address
- Identifies DC district
- Calculates ~7 spaces
- Cites Section 295-403-2
- Mentions downtown reductions
```

### Test 2: Context Persistence
```
User: "Can I build a duplex at 2500 N Fratney St?"
Expected Agent:
- Geocodes address
- Identifies RS5 district
- Explains duplex is conditional use
User: "What about the setback requirements?"
Expected Agent:
- Uses same address from context (doesn't re-ask)
- Provides RS5 setback requirements
```

### Test 3: Overlay Zone Detection
```
User: "Is 123 E Wisconsin Ave in a special district?"
Expected Agent:
- Geocodes address
- Queries overlay zones
- Reports TIF district and downtown overlay
- Explains implications
```

### Test 4: Map Selection Integration
```
[User clicks parcel on map at 1500 N Vel R Phillips Ave]
User: "What can I build here?"
Expected Agent:
- Uses pre-populated coordinates from map
- Doesn't ask for address
- Returns permitted uses for that zoning
```

---

## Environment Variables Required

```bash
# Already configured
GOOGLE_GEMINI_API_KEY=...
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=...

# New for agent
AGENT_API_URL=http://localhost:3001  # or deployed URL
AGENT_API_KEY=...                    # internal API key
```

---

## File Structure After Implementation

```
apps/
├── agents/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── config.ts
│       ├── index.ts
│       └── zoning-interpreter/
│           ├── agent.ts
│           ├── prompts.ts
│           ├── session.ts
│           ├── index.ts
│           └── tools/
│               ├── geocode.ts
│               ├── zoning.ts
│               ├── rag.ts
│               ├── parking.ts
│               └── __tests__/
│                   ├── geocode.test.ts
│                   ├── zoning.test.ts
│                   └── parking.test.ts
└── web/
    ├── convex/
    │   ├── schema.ts              # + agentSessions table
    │   └── agents/
    │       └── zoning.ts          # NEW
    ├── app/
    │   └── api/
    │       └── agents/
    │           └── zoning/
    │               └── route.ts   # NEW
    └── src/
        ├── hooks/
        │   └── useZoningAgent.ts  # NEW
        ├── components/
        │   └── chat/
        │       ├── ChatPanel.tsx  # Updated
        │       └── ContextIndicator.tsx  # NEW
        └── contexts/
            └── ChatContext.tsx    # NEW
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Mapbox geocoding rate limits | Cache geocoded addresses in Convex |
| ESRI REST service downtime | Fallback to cached zoning data |
| Agent response latency | Show typing indicator, stream responses |
| Session storage growth | Auto-expire sessions after 30 min |
| Tool call failures | Retry with exponential backoff |
