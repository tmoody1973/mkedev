# Gemini Live Voice Interface Specification

## Overview

Implement a voice-first interface using Gemini Live API that allows users to interact with MKE.dev entirely through natural speech. The voice interface can search addresses, query zoning, control map layers, and trigger AI visualizations.

## Goals

1. **Hands-free property research** - Users can research any Milwaukee property without touching keyboard/mouse
2. **Natural conversation** - No memorizing commands, just talk naturally
3. **Function calling integration** - Voice commands trigger real actions in the app
4. **Continuous context** - Multi-turn conversations that remember previous context

## Technical Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Voice System Architecture                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐     ┌─────────────────────┐        │
│  │  useVoiceSession    │────▶│  VoiceSessionContext │       │
│  │  (React Hook)       │     │  (Global State)      │       │
│  └─────────────────────┘     └─────────────────────┘        │
│            │                           │                     │
│            ▼                           ▼                     │
│  ┌─────────────────────┐     ┌─────────────────────┐        │
│  │  GeminiLiveClient   │     │  VoiceFunctionRouter │       │
│  │  (WebSocket)        │     │  (Action Dispatcher) │       │
│  └─────────────────────┘     └─────────────────────┘        │
│            │                           │                     │
│            ▼                           ▼                     │
│  ┌─────────────────────┐     ┌─────────────────────┐        │
│  │  AudioManager       │     │  Map/Visualizer     │        │
│  │  (Capture/Playback) │     │  Actions            │        │
│  └─────────────────────┘     └─────────────────────┘        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
apps/web/src/
├── lib/
│   └── voice/
│       ├── index.ts                 # Exports
│       ├── gemini-live-client.ts    # WebSocket client for Gemini Live
│       ├── audio-manager.ts         # Audio capture and playback
│       ├── voice-tools.ts           # Function definitions
│       └── types.ts                 # TypeScript types
├── hooks/
│   └── useVoiceSession.ts           # React hook for voice sessions
├── contexts/
│   └── VoiceContext.tsx             # Global voice state
└── components/
    └── voice/
        ├── VoiceButton.tsx          # Main voice toggle button
        ├── VoiceIndicator.tsx       # Visual feedback during voice
        └── VoiceTranscript.tsx      # Live transcript display
```

## Voice Tools (Functions)

### 1. search_address
Search for an address and fly the map to that location.

```typescript
{
  name: "search_address",
  description: "Search for an address in Milwaukee and fly the map to that location. Returns the coordinates and basic property info.",
  parameters: {
    type: "object",
    properties: {
      address: {
        type: "string",
        description: "The address to search for (e.g., '500 N Water Street' or '1432 E Brady St')"
      }
    },
    required: ["address"]
  }
}
```

### 2. get_parcel_info
Get information about the currently selected or centered parcel.

```typescript
{
  name: "get_parcel_info",
  description: "Get detailed information about the parcel at the current map center or selected location. Returns address, zoning, lot size, and other property details.",
  parameters: {
    type: "object",
    properties: {
      useMapCenter: {
        type: "boolean",
        description: "If true, query the parcel at map center. If false, use the currently selected parcel."
      }
    }
  }
}
```

### 3. query_zoning_code
Search the Milwaukee Zoning Code for specific regulations.

```typescript
{
  name: "query_zoning_code",
  description: "Search the Milwaukee Zoning Code (Chapter 295) for specific regulations, requirements, or answers to zoning questions.",
  parameters: {
    type: "object",
    properties: {
      question: {
        type: "string",
        description: "The zoning question to answer (e.g., 'What are the height limits in LB2?' or 'What uses are allowed in RM4?')"
      }
    },
    required: ["question"]
  }
}
```

### 4. toggle_layer
Show or hide a map layer.

```typescript
{
  name: "toggle_layer",
  description: "Show or hide a map layer to visualize different data overlays.",
  parameters: {
    type: "object",
    properties: {
      layer: {
        type: "string",
        enum: ["zoning", "parcels", "tif", "opportunity-zones", "historic", "arb", "city-owned"],
        description: "The layer to toggle"
      },
      visible: {
        type: "boolean",
        description: "Whether to show (true) or hide (false) the layer"
      }
    },
    required: ["layer", "visible"]
  }
}
```

### 5. capture_map_screenshot
Take a screenshot of the current map view for visualization.

```typescript
{
  name: "capture_map_screenshot",
  description: "Capture a screenshot of the current map view. This prepares the image for AI visualization.",
  parameters: {
    type: "object",
    properties: {}
  }
}
```

### 6. generate_visualization
Generate an AI architectural visualization.

```typescript
{
  name: "generate_visualization",
  description: "Generate an AI architectural visualization using Gemini 3 Pro Image. Requires a screenshot to be captured first.",
  parameters: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "Description of what to visualize (e.g., 'a 3-story mixed-use building with retail on ground floor')"
      }
    },
    required: ["prompt"]
  }
}
```

### 7. show_city_properties
Show city-owned properties on the map.

```typescript
{
  name: "show_city_properties",
  description: "Display city-owned properties available for development. Can filter by neighborhood or price range.",
  parameters: {
    type: "object",
    properties: {
      neighborhood: {
        type: "string",
        description: "Optional neighborhood to filter by"
      },
      maxPrice: {
        type: "number",
        description: "Optional maximum price filter"
      }
    }
  }
}
```

## API Integration

### Gemini Live Connection

```typescript
// Initialize Gemini Live session
const session = await ai.live.connect({
  model: 'gemini-2.0-flash-live-001',
  config: {
    responseModalities: ['AUDIO', 'TEXT'],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: 'Puck' // Or 'Charon', 'Kore', 'Fenrir', 'Aoede'
        }
      }
    },
    tools: voiceTools
  }
})
```

### Audio Configuration

```typescript
// Audio capture settings
const audioConstraints = {
  audio: {
    sampleRate: 16000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true
  }
}

// Audio playback
const audioContext = new AudioContext({ sampleRate: 24000 })
```

## User Interface

### Voice Button States

| State | Icon | Color | Behavior |
|-------|------|-------|----------|
| Inactive | Mic | Gray | Click to start |
| Connecting | Mic + Spinner | Blue | Establishing connection |
| Listening | Mic + Pulse | Green | Capturing audio |
| Processing | Waveform | Blue | Gemini thinking |
| Speaking | Speaker + Pulse | Purple | Gemini responding |
| Error | Mic + X | Red | Show error, click to retry |

### Voice Indicator

A floating indicator that shows:
- Current state (listening/processing/speaking)
- Live transcript of user speech
- Live transcript of AI response
- Function calls being executed

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `V` | Toggle voice mode |
| `Space` (hold) | Push-to-talk (when voice active) |
| `Escape` | Cancel/stop voice |

## Implementation Phases

### Phase 1: Core Infrastructure
- [ ] Create `gemini-live-client.ts` with WebSocket connection
- [ ] Create `audio-manager.ts` for capture/playback
- [ ] Create `useVoiceSession` hook
- [ ] Create `VoiceContext` for global state

### Phase 2: Function Definitions
- [ ] Define all voice tools in `voice-tools.ts`
- [ ] Create function router to dispatch actions
- [ ] Connect to existing map/visualizer APIs

### Phase 3: UI Components
- [ ] Update `VoiceButton` with proper states
- [ ] Create `VoiceIndicator` component
- [ ] Add transcript display
- [ ] Add keyboard shortcuts

### Phase 4: Integration
- [ ] Wire up map actions (flyTo, toggleLayer, etc.)
- [ ] Wire up visualizer actions
- [ ] Wire up zoning queries
- [ ] Test end-to-end flows

## Success Criteria

1. User can start voice session with one click
2. User can search addresses by speaking
3. User can ask zoning questions and hear answers
4. User can control map layers by voice
5. User can trigger AI visualizations by voice
6. Session maintains conversation context
7. Graceful error handling and recovery

## Demo Script

```
User: "Hey, I'm interested in developing a property in Walker's Point"

Gemini: "Great choice! Walker's Point is an exciting area for development.
Would you like me to show you available city-owned properties there,
or do you have a specific address in mind?"

User: "Show me what's available"

[Gemini calls show_city_properties with neighborhood: "Walker's Point"]
[Map zooms to area, city-owned properties highlighted]

Gemini: "I found 12 city-owned properties in Walker's Point. The prices
range from $5,000 to $45,000. Would you like me to focus on a particular
one, or tell you about the zoning in this area?"

User: "What's the zoning like around here?"

[Gemini calls toggle_layer with layer: "zoning", visible: true]
[Gemini calls query_zoning_code about Walker's Point zoning]

Gemini: "Most of Walker's Point is zoned Industrial-Mixed, which is
very flexible. You can do residential, commercial, light industrial,
or mixed-use. There's no minimum lot size and height limits are
generous at 75 feet. Would you like to see what a new development
might look like on one of these lots?"

User: "Yeah, show me that corner lot as a 4-story apartment building"

[Gemini calls capture_map_screenshot]
[Gemini calls generate_visualization]

Gemini: "I'm creating that visualization now... Done! I've rendered
a 4-story apartment building on that corner lot. The design takes
advantage of the industrial-mixed zoning which allows creative
architectural styles. You can see it in your gallery."
```

## Error Handling

| Error | User Message | Recovery |
|-------|--------------|----------|
| Mic permission denied | "I need microphone access to hear you. Please allow microphone permissions." | Show permission prompt |
| WebSocket disconnect | "Connection lost. Reconnecting..." | Auto-reconnect with backoff |
| Function call failed | "I had trouble with that. Let me try again." | Retry or suggest alternative |
| Audio playback failed | "I couldn't play the audio. You can read my response above." | Show text transcript |

## Security Considerations

1. **Audio data** - Never persist raw audio, only transcripts if needed
2. **API keys** - Gemini API key stays server-side (via Convex action)
3. **Permissions** - Request mic permission only when user clicks voice button
4. **Rate limiting** - Implement client-side rate limiting to prevent abuse

---

*Spec created: 2026-01-20*
*Target completion: 2026-01-22*
