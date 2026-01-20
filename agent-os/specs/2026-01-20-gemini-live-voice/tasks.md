# Gemini Live Voice Interface - Tasks

## Overview
Implementation tasks for the Gemini Live voice interface feature.

---

## Phase 1: Core Infrastructure ✅

- [x] Create voice types (`lib/voice/types.ts`)
- [x] Create voice tools definitions (`lib/voice/voice-tools.ts`)
- [x] Create audio manager (`lib/voice/audio-manager.ts`)
- [x] Create Gemini Live WebSocket client (`lib/voice/gemini-live-client.ts`)
- [x] Create index exports (`lib/voice/index.ts`)

## Phase 2: React Integration ✅

- [x] Create useVoiceSession hook (`hooks/useVoiceSession.ts`)
- [x] Create VoiceButton component with state indicators
- [x] Create VoiceIndicator floating status component
- [x] Create VoiceTranscript panel component
- [x] Create VoiceProvider context

## Phase 3: App Integration 🔄

- [ ] Add VoiceProvider to app layout
- [ ] Update header to use new VoiceButton with useVoice hook
- [ ] Verify MapContext functions work with voice commands
- [ ] Test address search via voice
- [ ] Test layer toggling via voice

## Phase 4: Convex Backend

- [ ] Verify mapbox.geocode action exists and works
- [ ] Verify agents.zoning.chat action exists and works
- [ ] Add visualization action for voice triggering
- [ ] Add parcel query action for voice

## Phase 5: Testing & Polish

- [ ] Test full voice conversation flow
- [ ] Test function calling (search, layers, etc.)
- [ ] Handle edge cases (no mic permission, network errors)
- [ ] Add loading states and error messages
- [ ] Test keyboard shortcuts (V, Escape)

---

## Files Created

| File | Purpose |
|------|---------|
| `lib/voice/types.ts` | TypeScript type definitions |
| `lib/voice/voice-tools.ts` | Function calling tool definitions |
| `lib/voice/audio-manager.ts` | Audio capture and playback |
| `lib/voice/gemini-live-client.ts` | WebSocket client for Gemini Live |
| `lib/voice/index.ts` | Module exports |
| `hooks/useVoiceSession.ts` | React hook for voice sessions |
| `components/voice/VoiceButton.tsx` | Voice button and indicator components |
| `components/voice/VoiceProvider.tsx` | Voice context provider |
| `components/voice/index.ts` | Component exports |

---

## Integration Points

### MapContext Functions Used
- `flyTo(center, zoom)` - Navigate map
- `setLayerVisibility(layerId, visible)` - Toggle layers
- `setLayerOpacity(layerId, opacity)` - Adjust layer transparency
- `captureMapScreenshot()` - Capture for visualizer
- `resetView()` - Reset to default Milwaukee view

### Convex Actions Used
- `api.mapbox.geocode` - Address search
- `api.agents.zoning.chat` - Zoning questions

---

## Next Steps

1. Add VoiceProvider to app layout (wrap around main content)
2. Update AppShell header to use useVoice hook
3. Test with actual Gemini API key
4. Add env variable documentation

---

*Created: 2026-01-20*
