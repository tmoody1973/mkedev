# Gemini Live Voice Interface - Tasks

## Overview

Implementation tasks for the Gemini Live Voice Interface with tool-based File Search bridge.

**Spec**: [spec.md](./spec.md)
**Architecture**: [gemini-live-file-search-integration.md](../../docs/architecture/gemini-live-file-search-integration.md)

---

## Task Groups

### Group 1: Backend Infrastructure

#### Task 1.1: Create Live Session API Endpoint
- [ ] Create `/api/gemini-live/session/route.ts`
- [ ] Implement session token generation (server-side API key)
- [ ] Return WebSocket URL and configuration
- [ ] Add rate limiting to prevent abuse

**Files**:
- `apps/web/src/app/api/gemini-live/session/route.ts`

#### Task 1.2: Implement executeLiveTool Action
- [ ] Create `convex/agents/liveSession.ts`
- [ ] Define `LIVE_TOOL_DECLARATIONS` constant
- [ ] Implement `executeLiveTool` action with tool routing
- [ ] Add `getLiveToolDeclarations` action for client config
- [ ] Wire up existing tools:
  - `search_zoning_docs` → `ragV2.queryDocuments`
  - `search_area_plans` → `ragV2.queryDocuments`
  - `geocode_address` → existing tool
  - `query_zoning_at_point` → existing tool
  - `calculate_parking` → existing tool

**Files**:
- `apps/web/convex/agents/liveSession.ts`

#### Task 1.3: Add Opik Tracing for Live Sessions
- [ ] Create trace manager for voice sessions
- [ ] Log tool executions with timing
- [ ] Track session metrics (duration, tools used)
- [ ] Add voice-specific tags

**Files**:
- `apps/web/convex/agents/liveSession.ts` (update)

---

### Group 2: Audio Infrastructure

#### Task 2.1: Create Audio Manager Utility
- [ ] Create `audioManager.ts` with mic/speaker management
- [ ] Implement microphone capture with Web Audio API
- [ ] Add PCM encoding (16kHz mono) for Gemini Live
- [ ] Implement audio playback for responses
- [ ] Handle browser permissions gracefully

**Files**:
- `apps/web/src/lib/audio/audioManager.ts`
- `apps/web/src/lib/audio/pcmEncoder.ts`

#### Task 2.2: Implement Voice Activity Detection
- [ ] Add VAD algorithm (energy-based or WebRTC VAD)
- [ ] Configure sensitivity thresholds
- [ ] Implement auto-start/stop recording
- [ ] Add manual override option

**Files**:
- `apps/web/src/lib/audio/vad.ts`

---

### Group 3: React Integration

#### Task 3.1: Create useGeminiLive Hook
- [ ] Create `useGeminiLive.ts` hook
- [ ] Implement WebSocket connection management
- [ ] Handle session setup message with tools
- [ ] Process incoming messages:
  - Text responses
  - Audio responses
  - Function calls
- [ ] Implement tool execution via Convex
- [ ] Send tool responses back to Live session
- [ ] Handle connection errors and reconnection

**Files**:
- `apps/web/src/hooks/useGeminiLive.ts`

#### Task 3.2: Create VoiceChat Component
- [ ] Create `VoiceChat.tsx` component
- [ ] Add connection button (start/end call)
- [ ] Implement push-to-talk button
- [ ] Display connection status
- [ ] Show tool execution history
- [ ] Handle error states

**Files**:
- `apps/web/src/components/voice/VoiceChat.tsx`

#### Task 3.3: Create VoiceIndicator Component
- [ ] Create `VoiceIndicator.tsx` component
- [ ] Add listening state animation
- [ ] Add speaking state animation
- [ ] Add processing state animation
- [ ] Support different sizes/variants

**Files**:
- `apps/web/src/components/voice/VoiceIndicator.tsx`

#### Task 3.4: Create AudioVisualizer Component (Optional)
- [ ] Create `AudioVisualizer.tsx` component
- [ ] Implement waveform visualization
- [ ] Support both input and output audio
- [ ] Add smooth animations

**Files**:
- `apps/web/src/components/voice/AudioVisualizer.tsx`

---

### Group 4: UI Integration

#### Task 4.1: Integrate Voice Chat into App Shell
- [ ] Add voice button to chat panel header
- [ ] Show voice UI when active
- [ ] Share conversation context between text and voice
- [ ] Update chat history with voice interactions

**Files**:
- `apps/web/src/components/chat/ChatPanel.tsx`
- `apps/web/src/components/shell/AppShell.tsx`

#### Task 4.2: Display Tool Results as Generative UI
- [ ] Render tool results using existing card components
- [ ] Show ZoneInfoCard for zoning queries
- [ ] Show ParcelCard for location queries
- [ ] Show IsochroneCard for spatial queries

**Files**:
- `apps/web/src/components/chat/ChatPanel.tsx`

#### Task 4.3: Add Keyboard Shortcuts
- [ ] Add spacebar for push-to-talk
- [ ] Add Escape to end session
- [ ] Add keyboard navigation for controls
- [ ] Announce state changes for screen readers

**Files**:
- `apps/web/src/components/voice/VoiceChat.tsx`

---

### Group 5: Testing & Polish

#### Task 5.1: Unit Tests
- [ ] Test `useGeminiLive` hook state transitions
- [ ] Test `executeLiveTool` routing
- [ ] Test audio encoding utilities
- [ ] Test VAD algorithm

**Files**:
- `apps/web/src/__tests__/hooks/useGeminiLive.test.ts`
- `apps/web/src/__tests__/lib/audio.test.ts`

#### Task 5.2: Integration Tests
- [ ] Test WebSocket connection lifecycle
- [ ] Test tool execution flow
- [ ] Test error recovery

#### Task 5.3: Browser Testing
- [ ] Test on Chrome (primary)
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Document any browser-specific issues

#### Task 5.4: Performance Optimization
- [ ] Profile audio processing
- [ ] Optimize WebSocket message handling
- [ ] Add connection pooling if needed

---

## Implementation Order

1. **Backend First**: Tasks 1.1, 1.2 (API endpoint + Convex action)
2. **Audio Layer**: Tasks 2.1 (audio manager, skip VAD initially)
3. **React Core**: Tasks 3.1, 3.2 (hook + basic UI)
4. **Integration**: Tasks 4.1 (integrate into app)
5. **Polish**: Tasks 3.3, 2.2, 4.2, 4.3 (visual feedback, VAD, cards)
6. **Testing**: Group 5

---

## Definition of Done

- [ ] User can start/end voice session
- [ ] Voice queries return document-grounded responses
- [ ] All existing tools work via voice
- [ ] Visual feedback for voice states
- [ ] Error handling and graceful fallback
- [ ] Works on Chrome, Firefox, Safari
- [ ] Opik traces for voice sessions
