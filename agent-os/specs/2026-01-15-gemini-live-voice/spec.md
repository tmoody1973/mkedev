# Gemini Live Voice Interface

## Overview

Implement real-time voice conversations using Gemini Live API with document-grounded responses via a tool-based bridge to Gemini File Search.

**Status**: Planned (Week 2)
**Priority**: P0
**Dependencies**: App Shell, Document Ingestion (RAG), Zoning Interpreter Agent

---

## Problem Statement

The MKE.dev platform needs voice-first interactions for accessibility and hands-free use. However:

1. **Gemini Live API** provides real-time bidirectional voice streaming
2. **Gemini File Search** provides document-grounded RAG responses
3. **These two features are incompatible** - File Search is not supported in Live API

We need an architecture that enables voice conversations while maintaining document grounding.

---

## Solution: Tool-Based Bridge

Gemini Live supports **function calling**. We implement tools that bridge Live sessions to our existing File Search RAG pipeline.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client (Browser)                            │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ VoiceChat.tsx │──│useGeminiLive  │──│ AudioManager  │       │
│  │  (UI + State) │  │   (Hook)      │  │ (Mic/Speaker) │       │
│  └───────────────┘  └───────┬───────┘  └───────────────┘       │
└────────────────────────────┬┼───────────────────────────────────┘
                             ││
              WebSocket      ││  HTTP (tool execution)
                             ││
┌────────────────────────────┼┼───────────────────────────────────┐
│                            ││     Gemini Live API               │
│  ┌─────────────────────────┼┼─────────────────────────────────┐ │
│  │  Audio Stream (PCM) ────┘│                                 │ │
│  │  Function Calls ─────────┘                                 │ │
│  │  Audio Response ←─────────                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │ functionCall
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Convex Backend                              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  agents/liveSession.ts                                     │ │
│  │  - executeLiveTool(name, args)                            │ │
│  │  - Routes to existing tools or RAG                        │ │
│  └───────────────────────────┬───────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────┼───────────────────────────────┐ │
│  │  Existing Tools           │    RAG Pipeline               │ │
│  │  - geocodeAddress         │    - ragV2.queryDocuments     │ │
│  │  - queryZoningAtPoint     │      └── File Search API      │ │
│  │  - calculateParking       │                               │ │
│  └───────────────────────────┴───────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Functional Requirements

### FR-1: Voice Session Management
- **FR-1.1**: Connect to Gemini Live API via WebSocket
- **FR-1.2**: Configure session with system prompt and tool declarations
- **FR-1.3**: Handle session lifecycle (connect, active, disconnect, error)
- **FR-1.4**: Support graceful fallback to text mode on connection failure

### FR-2: Audio Streaming
- **FR-2.1**: Capture microphone audio using Web Audio API
- **FR-2.2**: Stream PCM audio to Gemini Live (16kHz, mono)
- **FR-2.3**: Receive and play audio responses
- **FR-2.4**: Implement Voice Activity Detection (VAD) for auto-triggering

### FR-3: Tool Execution Bridge
- **FR-3.1**: Receive `functionCall` messages from Live API
- **FR-3.2**: Route tool calls to Convex `executeLiveTool` action
- **FR-3.3**: Return tool results to Live session via `toolResponse`
- **FR-3.4**: Support all existing Zoning Agent tools:
  - `search_zoning_docs` (File Search RAG)
  - `search_area_plans` (File Search RAG)
  - `geocode_address`
  - `query_zoning_at_point`
  - `calculate_parking`

### FR-4: User Interface
- **FR-4.1**: Voice call button (start/end session)
- **FR-4.2**: Push-to-talk mode option
- **FR-4.3**: Visual speaking/listening indicators
- **FR-4.4**: Tool execution status display
- **FR-4.5**: Error state handling with retry option

### FR-5: Integration
- **FR-5.1**: Share conversation context with text chat
- **FR-5.2**: Display tool results in Generative UI cards
- **FR-5.3**: Support map interactions during voice session
- **FR-5.4**: Opik tracing for voice sessions

---

## Non-Functional Requirements

### NFR-1: Latency
- Audio-to-response time < 2 seconds (excluding tool execution)
- Tool execution adds latency based on tool type

### NFR-2: Browser Support
- Chrome 90+ (primary)
- Firefox 90+ (secondary)
- Safari 15+ (secondary, may have WebSocket limitations)

### NFR-3: Accessibility
- Keyboard-navigable voice controls
- Screen reader announcements for voice state changes
- Visual feedback for all audio states

### NFR-4: Security
- API key never exposed to client
- Session tokens generated server-side
- Audio data not persisted (streaming only)

---

## Technical Design

### Component: `useGeminiLive` Hook

```typescript
interface UseLiveSessionOptions {
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
  onToolCall?: (name: string, args: unknown) => void;
  onError?: (error: string) => void;
}

interface LiveSessionState {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  response: string;
  error: string | null;
}

function useGeminiLive(options?: UseLiveSessionOptions): {
  ...LiveSessionState;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendAudio: (data: ArrayBuffer) => void;
  sendText: (text: string) => void;
}
```

### Component: `executeLiveTool` Action

```typescript
// convex/agents/liveSession.ts
export const executeLiveTool = action({
  args: {
    toolName: v.string(),
    toolArgs: v.any(),
  },
  handler: async (ctx, { toolName, toolArgs }) => {
    switch (toolName) {
      case "search_zoning_docs":
        return ctx.runAction(api.ingestion.ragV2.queryDocuments, {
          question: toolArgs.query,
          category: "zoning-codes",
        });
      // ... other tools
    }
  },
});
```

### Tool Declarations for Live Session

```typescript
const LIVE_TOOLS = [
  {
    name: "search_zoning_docs",
    description: "Search Milwaukee zoning code for regulations...",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The zoning question" },
        district: { type: "string", description: "Optional district code" }
      },
      required: ["query"]
    }
  },
  {
    name: "search_area_plans",
    description: "Search neighborhood area plans...",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        neighborhood: { type: "string" }
      },
      required: ["query"]
    }
  },
  // geocode_address, query_zoning_at_point, calculate_parking
];
```

---

## API Endpoints

### GET `/api/gemini-live/session`
Returns session configuration and signed WebSocket URL.

**Response**:
```json
{
  "sessionUrl": "wss://generativelanguage.googleapis.com/ws/...",
  "config": {
    "model": "models/gemini-2.0-flash-live-001",
    "tools": [...],
    "voice": "Kore"
  }
}
```

---

## File Structure

```
apps/web/
├── src/
│   ├── app/
│   │   └── api/
│   │       └── gemini-live/
│   │           └── session/
│   │               └── route.ts       # Session endpoint
│   ├── components/
│   │   └── voice/
│   │       ├── VoiceChat.tsx          # Main voice UI
│   │       ├── VoiceIndicator.tsx     # Speaking/listening visual
│   │       └── AudioVisualizer.tsx    # Optional waveform display
│   ├── hooks/
│   │   └── useGeminiLive.ts           # WebSocket + audio hook
│   └── lib/
│       └── audio/
│           ├── audioManager.ts        # Mic/speaker management
│           └── pcmEncoder.ts          # Audio format conversion
├── convex/
│   └── agents/
│       └── liveSession.ts             # Tool execution bridge
```

---

## Testing Strategy

### Unit Tests
- `useGeminiLive` hook state transitions
- Tool routing in `executeLiveTool`
- Audio encoding/decoding utilities

### Integration Tests
- WebSocket connection lifecycle
- Tool call → result → response flow
- Error handling and recovery

### Manual Testing
- Voice quality across browsers
- Latency under various network conditions
- VAD accuracy testing

---

## Rollout Plan

### Phase 1: Core Implementation
1. Create `/api/gemini-live/session` endpoint
2. Implement `useGeminiLive` hook
3. Build `VoiceChat` component with basic controls
4. Add `executeLiveTool` action with existing tools

### Phase 2: Polish
1. Add Voice Activity Detection
2. Implement visual feedback (VoiceIndicator)
3. Add error handling and retry logic
4. Integrate with existing chat UI

### Phase 3: Enhancement
1. Add audio visualizer
2. Implement push-to-talk mode
3. Add Opik tracing for voice sessions
4. Performance optimization

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Voice session success rate | > 95% |
| Tool call success rate | > 98% |
| Audio-to-response latency | < 2s |
| User satisfaction (voice) | > 4/5 |

---

## References

- [Gemini Live API Documentation](https://ai.google.dev/gemini-api/docs/live)
- [Gemini Function Calling](https://ai.google.dev/gemini-api/docs/function-calling)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Architecture Doc](../../docs/architecture/gemini-live-file-search-integration.md)
