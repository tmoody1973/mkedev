# Gemini Live + File Search Integration Architecture

## The Problem

Gemini Live API enables real-time voice conversations but **does not natively support File Search**. Your zoning documents (Milwaukee Zoning Code, Area Plans) are stored in Gemini File Search Stores and cannot be directly queried during a Live session.

## The Solution: Tool-Based Bridge

Gemini Live **does support function calling**. We create tools that bridge Live conversations to File Search queries through your existing Convex backend.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         User Voice Interaction                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Gemini Live API                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Voice Input → STT → Model → Tool Calls → TTS → Voice Output    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                      Function Call: search_zoning_docs                  │
│                                    │                                    │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Convex Backend                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  agents/liveTools.ts                                             │   │
│  │  - search_zoning_docs()     → calls ragV2.queryDocuments        │   │
│  │  - search_area_plans()      → calls ragV2.queryDocuments        │   │
│  │  - geocode_address()        → calls existing tool               │   │
│  │  - query_zoning_at_point()  → calls existing tool               │   │
│  │  - calculate_parking()      → calls existing tool               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Gemini File Search API                               │
│  ┌──────────────────────┐  ┌──────────────────────┐                    │
│  │  zoning-codes store  │  │  area-plans store    │                    │
│  │  - CH295-sub1.pdf    │  │  - Downtown Plan     │                    │
│  │  - CH295-sub2.pdf    │  │  - Harbor District   │                    │
│  │  - ...               │  │  - Menomonee Valley  │                    │
│  └──────────────────────┘  └──────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Architecture Components

### 1. Live Session Manager (`apps/web/convex/agents/liveSession.ts`)

Manages WebSocket connections to Gemini Live API and orchestrates tool execution.

```typescript
// apps/web/convex/agents/liveSession.ts

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

// Tool declarations for Gemini Live
const LIVE_TOOL_DECLARATIONS = [
  {
    name: "search_zoning_docs",
    description: "Search Milwaukee zoning code for regulations, requirements, and procedures. Use for questions about permitted uses, setbacks, height limits, parking requirements, and zoning districts.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The zoning question to search for"
        },
        district: {
          type: "string",
          description: "Optional: specific zoning district code (e.g., RS6, LB2, DC)"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "search_area_plans",
    description: "Search Milwaukee neighborhood area plans for development goals, housing strategies, and community vision. Use for questions about neighborhood priorities and city planning.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The area plan question to search for"
        },
        neighborhood: {
          type: "string",
          description: "Optional: specific neighborhood name"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "geocode_address",
    description: "Convert a Milwaukee street address to geographic coordinates.",
    parameters: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "The street address to geocode"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "query_zoning_at_point",
    description: "Get zoning district information for a specific location.",
    parameters: {
      type: "object",
      properties: {
        latitude: { type: "number" },
        longitude: { type: "number" }
      },
      required: ["latitude", "longitude"]
    }
  },
  {
    name: "calculate_parking",
    description: "Calculate required parking spaces for a development.",
    parameters: {
      type: "object",
      properties: {
        useType: {
          type: "string",
          description: "Type of use (restaurant, retail, office, residential, etc.)"
        },
        squareFootage: {
          type: "number",
          description: "Total square footage"
        },
        zoningDistrict: {
          type: "string",
          description: "Zoning district code"
        },
        units: {
          type: "number",
          description: "Number of dwelling units (for residential)"
        }
      },
      required: ["useType", "squareFootage", "zoningDistrict"]
    }
  }
];

/**
 * Execute a tool call from Gemini Live.
 * This is called by the Live session handler when the model requests a tool.
 */
export const executeLiveTool = action({
  args: {
    toolName: v.string(),
    toolArgs: v.any(),
  },
  handler: async (ctx, args) => {
    const { toolName, toolArgs } = args;

    switch (toolName) {
      case "search_zoning_docs": {
        const result = await ctx.runAction(api.ingestion.ragV2.queryDocuments, {
          question: toolArgs.query,
          category: "zoning-codes",
        });
        return {
          success: result.success,
          answer: result.response?.answer,
          citations: result.response?.citations,
        };
      }

      case "search_area_plans": {
        const enhancedQuery = toolArgs.neighborhood
          ? `Regarding ${toolArgs.neighborhood}: ${toolArgs.query}`
          : toolArgs.query;
        const result = await ctx.runAction(api.ingestion.ragV2.queryDocuments, {
          question: enhancedQuery,
          category: "area-plans",
        });
        return {
          success: result.success,
          answer: result.response?.answer,
          citations: result.response?.citations,
        };
      }

      case "geocode_address": {
        const { geocodeAddress } = await import("./tools");
        return await geocodeAddress({ address: toolArgs.address });
      }

      case "query_zoning_at_point": {
        const { queryZoningAtPoint } = await import("./tools");
        return await queryZoningAtPoint({
          latitude: toolArgs.latitude,
          longitude: toolArgs.longitude,
        });
      }

      case "calculate_parking": {
        const { calculateParking } = await import("./tools");
        return calculateParking({
          useType: toolArgs.useType,
          squareFootage: toolArgs.squareFootage,
          zoningDistrict: toolArgs.zoningDistrict,
          units: toolArgs.units,
        });
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  },
});

/**
 * Get tool declarations for Gemini Live session setup.
 */
export const getLiveToolDeclarations = action({
  args: {},
  handler: async () => {
    return LIVE_TOOL_DECLARATIONS;
  },
});
```

### 2. Client-Side Live Session Handler (`apps/web/src/hooks/useGeminiLive.ts`)

React hook that manages the WebSocket connection to Gemini Live and handles tool execution.

```typescript
// apps/web/src/hooks/useGeminiLive.ts

import { useCallback, useRef, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface LiveSessionState {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  response: string;
  error: string | null;
}

interface UseLiveSessionOptions {
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
  onToolCall?: (name: string, args: unknown) => void;
  onError?: (error: string) => void;
}

export function useGeminiLive(options: UseLiveSessionOptions = {}) {
  const [state, setState] = useState<LiveSessionState>({
    isConnected: false,
    isListening: false,
    isSpeaking: false,
    transcript: '',
    response: '',
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const executeTool = useMutation(api.agents.liveSession.executeLiveTool);

  const connect = useCallback(async () => {
    try {
      // Get API key from your backend (never expose in client)
      const response = await fetch('/api/gemini-live/session');
      const { sessionUrl, config } = await response.json();

      // Connect to Gemini Live WebSocket
      const ws = new WebSocket(sessionUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Send session configuration with tool declarations
        ws.send(JSON.stringify({
          setup: {
            model: "models/gemini-2.0-flash-live-001",
            systemInstruction: {
              parts: [{
                text: `You are a helpful Milwaukee zoning and development assistant...`
              }]
            },
            tools: [{ functionDeclarations: config.tools }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Kore" }
                }
              }
            }
          }
        }));

        setState(s => ({ ...s, isConnected: true }));
      };

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);

        // Handle different message types
        if (message.serverContent?.modelTurn?.parts) {
          for (const part of message.serverContent.modelTurn.parts) {
            // Handle text response
            if (part.text) {
              setState(s => ({ ...s, response: s.response + part.text }));
              options.onResponse?.(part.text);
            }

            // Handle audio response
            if (part.inlineData?.mimeType?.startsWith('audio/')) {
              playAudio(part.inlineData.data);
            }

            // Handle function calls - THIS IS THE KEY PART
            if (part.functionCall) {
              const { name, args } = part.functionCall;
              options.onToolCall?.(name, args);

              // Execute tool via Convex backend
              const result = await executeTool({ toolName: name, toolArgs: args });

              // Send tool result back to Live session
              ws.send(JSON.stringify({
                toolResponse: {
                  functionResponses: [{
                    response: result,
                    id: part.functionCall.id
                  }]
                }
              }));
            }
          }
        }

        // Handle turn complete
        if (message.serverContent?.turnComplete) {
          setState(s => ({ ...s, isSpeaking: false }));
        }
      };

      ws.onerror = (error) => {
        setState(s => ({ ...s, error: 'WebSocket error' }));
        options.onError?.('WebSocket error');
      };

      ws.onclose = () => {
        setState(s => ({ ...s, isConnected: false }));
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed';
      setState(s => ({ ...s, error: message }));
      options.onError?.(message);
    }
  }, [executeTool, options]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setState(s => ({ ...s, isConnected: false }));
  }, []);

  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        realtimeInput: {
          mediaChunks: [{
            mimeType: "audio/pcm;rate=16000",
            data: arrayBufferToBase64(audioData)
          }]
        }
      }));
    }
  }, []);

  const sendText = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        clientContent: {
          turns: [{
            role: "user",
            parts: [{ text }]
          }],
          turnComplete: true
        }
      }));
    }
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    sendAudio,
    sendText,
  };
}

// Helper functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function playAudio(base64Data: string) {
  // Decode and play audio response
  // Implementation depends on audio format from Live API
}
```

### 3. Voice Chat Component (`apps/web/src/components/voice/VoiceChat.tsx`)

```typescript
// apps/web/src/components/voice/VoiceChat.tsx

'use client';

import { useState, useCallback, useRef } from 'react';
import { useGeminiLive } from '@/hooks/useGeminiLive';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';

export function VoiceChat() {
  const [toolHistory, setToolHistory] = useState<Array<{
    name: string;
    args: unknown;
    timestamp: number;
  }>>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const {
    isConnected,
    isListening,
    isSpeaking,
    transcript,
    response,
    error,
    connect,
    disconnect,
    sendAudio,
  } = useGeminiLive({
    onToolCall: (name, args) => {
      setToolHistory(h => [...h, { name, args, timestamp: Date.now() }]);
    },
  });

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const buffer = await event.data.arrayBuffer();
          sendAudio(buffer);
        }
      };

      mediaRecorder.start(100); // Send chunks every 100ms
      mediaRecorderRef.current = mediaRecorder;
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  }, [sendAudio]);

  const stopListening = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!isConnected ? (
          <Button onClick={connect}>
            <Phone className="w-4 h-4 mr-2" />
            Start Voice Chat
          </Button>
        ) : (
          <>
            <Button onClick={disconnect} variant="destructive">
              <PhoneOff className="w-4 h-4 mr-2" />
              End Call
            </Button>
            <Button
              onClick={isListening ? stopListening : startListening}
              variant={isListening ? 'default' : 'outline'}
            >
              {isListening ? (
                <><MicOff className="w-4 h-4 mr-2" /> Stop</>
              ) : (
                <><Mic className="w-4 h-4 mr-2" /> Speak</>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="flex items-center gap-2 text-blue-500">
          <div className="animate-pulse">Speaking...</div>
        </div>
      )}

      {/* Tool Calls Display */}
      {toolHistory.length > 0 && (
        <div className="border rounded p-3">
          <h4 className="font-bold mb-2">Tools Used:</h4>
          {toolHistory.map((tool, i) => (
            <div key={i} className="text-sm text-gray-600">
              {tool.name}: {JSON.stringify(tool.args)}
            </div>
          ))}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-red-500 p-2 border border-red-300 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
```

## Sequence Diagram

```
User                    VoiceChat           Gemini Live        Convex Backend       File Search
 │                         │                    │                    │                   │
 │  "What parking for      │                    │                    │                   │
 │   a restaurant at       │                    │                    │                   │
 │   500 N Water St?"      │                    │                    │                   │
 │ ───────────────────────>│                    │                    │                   │
 │                         │                    │                    │                   │
 │                         │  Audio Stream      │                    │                   │
 │                         │ ──────────────────>│                    │                   │
 │                         │                    │                    │                   │
 │                         │                    │  STT + Model       │                   │
 │                         │                    │ ──────────────────>│                   │
 │                         │                    │                    │                   │
 │                         │  functionCall:     │                    │                   │
 │                         │  geocode_address   │                    │                   │
 │                         │ <──────────────────│                    │                   │
 │                         │                    │                    │                   │
 │                         │  executeLiveTool   │                    │                   │
 │                         │ ───────────────────────────────────────>│                   │
 │                         │                    │                    │                   │
 │                         │  { lat, lng }      │                    │                   │
 │                         │ <───────────────────────────────────────│                   │
 │                         │                    │                    │                   │
 │                         │  toolResponse      │                    │                   │
 │                         │ ──────────────────>│                    │                   │
 │                         │                    │                    │                   │
 │                         │  functionCall:     │                    │                   │
 │                         │  query_zoning_at   │                    │                   │
 │                         │  _point            │                    │                   │
 │                         │ <──────────────────│                    │                   │
 │                         │                    │                    │                   │
 │                         │  executeLiveTool   │                    │                   │
 │                         │ ───────────────────────────────────────>│                   │
 │                         │                    │                    │                   │
 │                         │  { district: DC }  │                    │                   │
 │                         │ <───────────────────────────────────────│                   │
 │                         │                    │                    │                   │
 │                         │  toolResponse      │                    │                   │
 │                         │ ──────────────────>│                    │                   │
 │                         │                    │                    │                   │
 │                         │  functionCall:     │                    │                   │
 │                         │  search_zoning_    │                    │                   │
 │                         │  docs              │                    │                   │
 │                         │ <──────────────────│                    │                   │
 │                         │                    │                    │                   │
 │                         │  executeLiveTool   │                    │                   │
 │                         │ ───────────────────────────────────────>│                   │
 │                         │                    │                    │                   │
 │                         │                    │       queryDocuments                   │
 │                         │                    │                    │ ─────────────────>│
 │                         │                    │                    │                   │
 │                         │                    │                    │  Semantic Search  │
 │                         │                    │                    │ <─────────────────│
 │                         │                    │                    │                   │
 │                         │  { answer, cite }  │                    │                   │
 │                         │ <───────────────────────────────────────│                   │
 │                         │                    │                    │                   │
 │                         │  toolResponse      │                    │                   │
 │                         │ ──────────────────>│                    │                   │
 │                         │                    │                    │                   │
 │                         │                    │  Generate + TTS    │                   │
 │                         │                    │ ──────────────────>│                   │
 │                         │                    │                    │                   │
 │                         │  Audio Response    │                    │                   │
 │                         │ <──────────────────│                    │                   │
 │                         │                    │                    │                   │
 │  "In the Downtown       │                    │                    │                   │
 │   Core district, you    │                    │                    │                   │
 │   need 1 space per      │                    │                    │                   │
 │   300 sq ft..."         │                    │                   │                   │
 │ <───────────────────────│                    │                    │                   │
```

## Key Points

### 1. Tools Bridge the Gap
- Gemini Live handles voice I/O and conversation flow
- Tools invoke your existing Convex actions for document retrieval
- File Search happens through standard Gemini API, results feed back to Live

### 2. Convex Orchestrates Everything
- `executeLiveTool` action handles all tool routing
- Reuses your existing tools (`geocodeAddress`, `queryZoningAtPoint`, etc.)
- RAG queries go through `ragV2.queryDocuments` → File Search

### 3. Real-Time Status Updates
- Your existing `agents/status.ts` can track tool execution during voice calls
- UI shows which tools are being invoked for transparency

### 4. Graceful Degradation
- If File Search fails, tool returns error
- Live model can ask clarifying questions or suggest alternatives
- Same fallback logic as your text-based agent

## Migration Path

1. **Phase 1**: Create `liveSession.ts` with tool declarations (reuse existing tools)
2. **Phase 2**: Build client-side WebSocket handler with tool execution
3. **Phase 3**: Add voice UI components
4. **Phase 4**: Integrate with CopilotKit for hybrid voice/text/generative UI

## Environment Variables Needed

```bash
# Gemini Live API access (same key works)
GEMINI_API_KEY=your-key

# WebSocket endpoint (production)
GEMINI_LIVE_WS_URL=wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent
```

## References

- [Gemini Live API Docs](https://ai.google.dev/gemini-api/docs/live)
- [Gemini Function Calling](https://ai.google.dev/gemini-api/docs/function-calling)
- [File Search Stores](https://ai.google.dev/gemini-api/docs/file-search)
