# Milestone 02 — Conversational Interface

## Overview

The voice-first chat experience where users ask questions about Milwaukee's development information via text or voice, and receive AI-powered answers with rich generative UI cards. All conversations are auto-saved, and users can star important ones for quick access via a slide-out history panel with search.

---

## User Flows to Implement

1. **Ask a question via text input** and receive an AI response with generative UI cards
2. **Ask a question via voice** with real-time visual feedback (pulsing indicator + waveform)
3. **Click on the map** to trigger a context-aware query about that location
4. **Browse conversation history** via slide-out sidebar panel
5. **Search past conversations** by keyword
6. **Star/favorite important conversations** for quick access
7. **Interact with generative UI cards** (expand details, navigate to related info)

---

## UI Components to Integrate

See `sections/conversational-interface/components/` for the following:

### Chat Interface
- `ChatContainer` — Main chat component with message list and input
- `MessageBubble` — Individual message with role differentiation (user vs assistant)
- `ChatInput` — Text input with send button and voice toggle
- `VoiceIndicator` — Pulsing mic indicator with animated waveform

### Generative UI Cards
- `ZoneInfoCard` — Zoning district summary
- `ParcelAnalysisCard` — Feasibility assessment for a parcel
- `IncentivesSummaryCard` — Available incentives list
- `AreaPlanContextCard` — Neighborhood plan alignment
- `PermitProcessCard` — Permit steps timeline
- `CodeCitationCard` — Source code excerpts with citations
- `OpportunityListCard` — Matching properties list

### History Panel
- `HistoryPanel` — Slide-out sidebar overlay
- `ConversationList` — List of recent conversations
- `ConversationItem` — Individual conversation with title, date, star toggle
- `SearchInput` — Search input for filtering conversations

---

## Backend Requirements

### API Endpoints
- `POST /api/conversations` — Create new conversation
- `GET /api/conversations` — List user's conversations (with pagination)
- `GET /api/conversations/:id` — Get single conversation with messages
- `PUT /api/conversations/:id` — Update conversation (star/unstar)
- `DELETE /api/conversations/:id` — Delete conversation
- `POST /api/conversations/:id/messages` — Send message, receive AI response

### AI Integration
- Connect to your LLM provider (Gemini recommended for voice)
- Implement RAG pipeline to query the knowledge base
- Generate appropriate UI card responses based on query type
- Support streaming responses for better UX

### Voice Integration
- Implement speech-to-text for voice input
- Implement text-to-speech for response narration (accessibility)
- Handle voice activation/deactivation states

### Map Bidirectional Integration
- Chat can highlight locations on the map
- Map clicks trigger queries in the chat
- Parcel selection populates context for queries

---

## Data Models

```typescript
interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  starred: boolean
  messages: Message[]
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  cards?: GenerativeCard[]
  agentContributions?: AgentContribution[]
}

interface GenerativeCard {
  type: 'zone-info' | 'parcel-analysis' | 'incentives' | 'area-plan' | 'permit-process' | 'code-citation' | 'opportunity-list'
  data: Record<string, unknown>
}
```

---

## Success Criteria

- [ ] Text chat input sends messages and receives AI responses
- [ ] Voice input works with visual feedback (waveform, pulsing indicator)
- [ ] Generative UI cards render inline with messages
- [ ] Conversation history panel slides out with search and star functionality
- [ ] Map clicks trigger contextual queries
- [ ] Conversations auto-save and persist
- [ ] Loading states with typing indicator
- [ ] Mobile responsive layout
