# Google Gemini Live API Documentation

Complete reference for building real-time voice and multimodal applications with Gemini Live.

---

## Overview

**Gemini Live API** enables low-latency, real-time voice and video conversations with Google's Gemini models. It processes continuous streams of audio, video, or text to deliver immediate, human-like spoken responses.

### Key Capabilities

| Feature | Description |
|---------|-------------|
| **Real-time Audio** | Bidirectional audio streaming with natural speech |
| **Voice Activity Detection** | Automatic detection of when users start/stop speaking |
| **Barge-in Support** | Users can interrupt the AI mid-response |
| **Function Calling** | Trigger actions in your app via voice commands |
| **Multilingual** | 24+ supported languages |
| **Affective Dialog** | Adapts tone to match user's expression |
| **Audio Transcription** | Text transcripts of both user and AI speech |

---

## Architecture

### Connection Methods

**1. Server-to-Server (Recommended for Production)**
```
┌─────────────┐     Stream data      ┌─────────────┐    WebSocket     ┌─────────────┐
│   Browser   │ ──────────────────▶  │  Your Server │ ──────────────▶  │ Gemini Live │
│   (Client)  │ ◀────────────────── │   (Backend)  │ ◀────────────── │     API     │
└─────────────┘     Responses        └─────────────┘                  └─────────────┘
```

**2. Client-to-Server (Using Ephemeral Tokens)**
```
┌─────────────┐  1. Request token    ┌─────────────┐
│   Browser   │ ──────────────────▶  │  Your Server │
│             │ ◀────────────────── │  (Convex)    │
└─────────────┘  2. Ephemeral token  └─────────────┘
      │                                     │
      │ 3. WebSocket (token auth)           │ Has API key
      ▼                                     │
┌─────────────┐                             │
│ Gemini Live │ ◀────────────────────────────┘
│     API     │
└─────────────┘
```

---

## Audio Specifications

### Input (Microphone → Gemini)
- **Format**: 16-bit PCM
- **Sample Rate**: 16 kHz
- **Channels**: Mono (1 channel)
- **MIME Type**: `audio/pcm` or `audio/webm`

### Output (Gemini → Speakers)
- **Format**: 16-bit PCM
- **Sample Rate**: 24 kHz
- **Channels**: Mono (1 channel)

### Audio Capture Example (Web Audio API)
```typescript
// Request microphone access
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    sampleRate: 16000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
  }
})

// Create MediaRecorder
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/webm;codecs=opus'
})

mediaRecorder.ondataavailable = (event) => {
  // Send audio chunk to Gemini
  sendAudioToGemini(event.data)
}

mediaRecorder.start(100) // Capture every 100ms
```

### Audio Playback Example
```typescript
const audioContext = new AudioContext({ sampleRate: 24000 })

function playAudio(pcmData: ArrayBuffer) {
  // Convert PCM16 to Float32
  const int16Array = new Int16Array(pcmData)
  const float32Array = new Float32Array(int16Array.length)

  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0
  }

  // Create and play buffer
  const buffer = audioContext.createBuffer(1, float32Array.length, 24000)
  buffer.copyToChannel(float32Array, 0)

  const source = audioContext.createBufferSource()
  source.buffer = buffer
  source.connect(audioContext.destination)
  source.start()
}
```

---

## WebSocket Connection

### Endpoints

| Type | Endpoint |
|------|----------|
| **Ephemeral Token (v1alpha)** | `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent` |
| **API Key (v1beta)** | `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent` |

### Authentication

**With Ephemeral Token (Recommended):**
```
wss://...BidiGenerateContent?access_token=YOUR_EPHEMERAL_TOKEN
```

**With API Key (Development Only):**
```
wss://...BidiGenerateContent?key=YOUR_API_KEY
```

### Connection Example
```typescript
const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?access_token=${ephemeralToken}`

const ws = new WebSocket(wsUrl)

ws.onopen = () => {
  // Send setup message
  ws.send(JSON.stringify(setupMessage))
}

ws.onmessage = (event) => {
  // Handle incoming messages
  handleMessage(event.data)
}
```

---

## Message Protocol

### 1. Setup Message (Client → Server)

Sent immediately after WebSocket connection opens:

```typescript
{
  "setup": {
    "model": "models/gemini-2.5-flash-preview-native-audio-dialog",
    "generationConfig": {
      "responseModalities": ["AUDIO", "TEXT"],
      "speechConfig": {
        "voiceConfig": {
          "prebuiltVoiceConfig": {
            "voiceName": "Puck"  // or "Charon", "Kore", "Fenrir", "Aoede"
          }
        }
      }
    },
    "systemInstruction": {
      "parts": [{ "text": "You are a helpful assistant..." }]
    },
    "tools": [{
      "functionDeclarations": [
        {
          "name": "search_address",
          "description": "Search for an address",
          "parameters": {
            "type": "object",
            "properties": {
              "address": { "type": "string" }
            },
            "required": ["address"]
          }
        }
      ]
    }]
  }
}
```

### 2. Setup Complete (Server → Client)

Confirms session is ready:
```typescript
{
  "setupComplete": {}
}
```

### 3. Audio Input (Client → Server)

Send audio chunks as base64:
```typescript
{
  "realtimeInput": {
    "mediaChunks": [{
      "mimeType": "audio/webm",
      "data": "BASE64_ENCODED_AUDIO"
    }]
  }
}
```

### 4. Text Input (Client → Server)

Send text messages:
```typescript
{
  "clientContent": {
    "turns": [{
      "role": "user",
      "parts": [{ "text": "Hello, how are you?" }]
    }],
    "turnComplete": true
  }
}
```

### 5. Server Content (Server → Client)

Responses with text and/or audio:
```typescript
{
  "serverContent": {
    "modelTurn": {
      "parts": [
        { "text": "I'm doing great!" },
        {
          "inlineData": {
            "mimeType": "audio/pcm",
            "data": "BASE64_ENCODED_AUDIO"
          }
        }
      ]
    },
    "turnComplete": true
  }
}
```

### 6. Tool Call (Server → Client)

Function calling request:
```typescript
{
  "toolCall": {
    "functionCalls": [{
      "id": "call_123",
      "name": "search_address",
      "args": {
        "address": "500 North Water Street"
      }
    }]
  }
}
```

### 7. Tool Response (Client → Server)

Return function result:
```typescript
{
  "toolResponse": {
    "functionResponses": [{
      "id": "call_123",
      "name": "search_address",
      "response": {
        "success": true,
        "coordinates": { "lat": 43.04, "lng": -87.91 }
      }
    }]
  }
}
```

---

## Ephemeral Tokens

### Why Use Ephemeral Tokens?

- **Security**: API keys exposed in client-side code can be stolen
- **Short-lived**: Tokens expire quickly (default 30 minutes)
- **Single-use**: Each token is valid for one session only
- **Restricted**: Can be scoped to specific permissions

### Token Lifetimes

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `newSessionExpireTime` | 1-2 minutes | Time window to initiate connection |
| `expireTime` | 30 minutes | Total session duration |

### Generating Tokens (Server-Side)

**REST API:**
```bash
curl -X POST \
  'https://generativelanguage.googleapis.com/v1alpha/authTokens' \
  -H 'Content-Type: application/json' \
  -H 'x-goog-api-key: YOUR_API_KEY' \
  -d '{
    "config": {
      "uses": 1,
      "expireTime": "2026-01-20T12:30:00Z",
      "newSessionExpireTime": "2026-01-20T12:02:00Z"
    }
  }'
```

**Response:**
```json
{
  "name": "authTokens/abc123",
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expireTime": "2026-01-20T12:30:00Z",
  "newSessionExpireTime": "2026-01-20T12:02:00Z"
}
```

**Convex Action Example:**
```typescript
// convex/gemini.ts
export const getEphemeralToken = action({
  handler: async () => {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1alpha/authTokens',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          config: {
            uses: 1,
            expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            newSessionExpireTime: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
          },
        }),
      }
    )

    return response.json()
  },
})
```

---

## Available Models

| Model | Description | Use Case |
|-------|-------------|----------|
| `gemini-2.5-flash-preview-native-audio-dialog` | Latest native audio model | Production voice apps |
| `gemini-2.5-flash-preview-native-audio` | Native audio without dialog optimization | Custom voice flows |
| `gemini-2.0-flash-live-001` | Older live model | Legacy support |

**Note**: Models starting with `gemini-2.0` will be retired March 3, 2026.

---

## Voice Options

Available voice presets for `prebuiltVoiceConfig.voiceName`:

| Voice | Description |
|-------|-------------|
| `Puck` | Friendly, conversational |
| `Charon` | Professional, authoritative |
| `Kore` | Warm, empathetic |
| `Fenrir` | Energetic, enthusiastic |
| `Aoede` | Calm, soothing |

---

## Function Calling

### Defining Tools

```typescript
const tools = [{
  functionDeclarations: [
    {
      name: 'fly_to_location',
      description: 'Navigate the map to a specific location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'Location name or address'
          },
          zoom: {
            type: 'number',
            description: 'Zoom level (1-20)'
          }
        },
        required: ['location']
      }
    },
    {
      name: 'toggle_layer',
      description: 'Show or hide a map layer',
      parameters: {
        type: 'object',
        properties: {
          layer: {
            type: 'string',
            enum: ['zoning', 'parcels', 'tif', 'historic']
          },
          visible: {
            type: 'boolean'
          }
        },
        required: ['layer', 'visible']
      }
    }
  ]
}]
```

### Handling Function Calls

```typescript
ws.onmessage = async (event) => {
  const message = JSON.parse(event.data)

  if ('toolCall' in message) {
    for (const call of message.toolCall.functionCalls) {
      // Execute the function
      const result = await executeFunction(call.name, call.args)

      // Send response back
      ws.send(JSON.stringify({
        toolResponse: {
          functionResponses: [{
            id: call.id,
            name: call.name,
            response: result
          }]
        }
      }))
    }
  }
}
```

---

## Best Practices

### 1. Audio Quality
- Use echo cancellation to prevent feedback loops
- Apply noise suppression for cleaner input
- Use headphones during development to prevent echo

### 2. Error Handling
```typescript
ws.onerror = (error) => {
  console.error('WebSocket error:', error)
  // Show user-friendly error message
  setError('Voice connection failed. Please try again.')
}

ws.onclose = (event) => {
  if (event.code !== 1000) {
    // Unexpected close - consider reconnection
    console.warn('Connection closed unexpectedly:', event.code, event.reason)
  }
}
```

### 3. Session Management
- Request new ephemeral token for each session
- Don't attempt to reuse ephemeral tokens (single-use)
- Handle session timeouts gracefully (30 min default)

### 4. User Experience
- Show clear state indicators (connecting, listening, processing, speaking)
- Provide visual feedback during audio capture
- Allow users to interrupt AI responses (barge-in)
- Offer text fallback for accessibility

---

## Rate Limits & Quotas

| Limit | Value |
|-------|-------|
| Concurrent sessions per API key | 100 |
| Session duration | 30 minutes (default) |
| Audio chunk size | 1 MB max |
| Function calls per turn | 10 max |

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| No audio output | Wrong sample rate | Ensure 24kHz for playback |
| Echo/feedback | Missing echo cancellation | Enable `echoCancellation: true` |
| Connection rejected | Invalid token | Generate fresh ephemeral token |
| Silence from AI | Audio format mismatch | Check 16kHz PCM input format |
| Function not called | Missing tool declaration | Verify tools in setup message |

### Debug Logging

```typescript
// Enable verbose logging
ws.onmessage = (event) => {
  console.log('[Gemini] Received:', event.data)
  // ... handle message
}

ws.send = ((original) => {
  return (data) => {
    console.log('[Gemini] Sending:', data)
    return original.call(ws, data)
  }
})(ws.send)
```

---

## Resources

### Official Documentation
- [Gemini Live API Overview](https://ai.google.dev/gemini-api/docs/live)
- [Live API Capabilities Guide](https://ai.google.dev/gemini-api/docs/live-guide)
- [WebSocket Tutorial](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/live-api/get-started-websocket)
- [Ephemeral Tokens](https://ai.google.dev/gemini-api/docs/ephemeral-tokens)

### Partner Integrations
- [LiveKit Plugin](https://docs.livekit.io/agents/models/realtime/plugins/gemini/)
- [Firebase AI Logic](https://firebase.google.com/docs/ai-logic/live-api)
- [Pipecat Framework](https://github.com/pipecat-ai/pipecat)

### Code Examples
- [Google AI JavaScript SDK](https://github.com/google/generative-ai-js)
- [Vertex AI Python SDK](https://github.com/googleapis/python-aiplatform)

---

## MKE.dev Implementation

Our implementation uses:

| Component | File | Purpose |
|-----------|------|---------|
| **Convex Action** | `convex/gemini.ts` | Generates ephemeral tokens server-side |
| **WebSocket Client** | `lib/voice/gemini-live-client.ts` | Handles Gemini Live connection |
| **Audio Manager** | `lib/voice/audio-manager.ts` | Captures and plays audio |
| **Voice Hook** | `hooks/useVoiceSession.ts` | React integration with map actions |
| **UI Components** | `components/voice/` | Voice button, indicator, transcript |

### Environment Variables

```bash
# Server-side only (Convex)
GOOGLE_GEMINI_API_KEY=your-api-key

# NO NEXT_PUBLIC_ prefix needed!
# The API key stays secure on the server
```

### Flow Diagram

```
User clicks mic → useVoiceSession.startSession()
                         │
                         ▼
              getEphemeralToken() (Convex action)
                         │
                         ▼
         GeminiLiveClient.connectWithToken(token)
                         │
                         ▼
              WebSocket connection established
                         │
                         ▼
              AudioManager.startCapture()
                         │
                         ▼
           User speaks → Audio sent to Gemini
                         │
                         ▼
       Gemini responds → Audio/text/function calls
                         │
                         ▼
      Function calls executed via MapContext
```

---

*Last updated: January 20, 2026*
