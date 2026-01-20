/**
 * Gemini Live Client
 *
 * WebSocket client for real-time communication with Gemini Live API.
 * Handles bidirectional audio streaming and function calling.
 */

import type {
  GeminiLiveConfig,
  GeminiFunctionCall,
  VoiceTool,
  VoiceEventHandler,
  VoiceEvent,
} from './types'
import { VOICE_TOOLS, VOICE_SYSTEM_INSTRUCTION } from './voice-tools'

// ============================================================================
// Constants
// ============================================================================

// Gemini Live model - only native-audio models support bidiGenerateContent
const GEMINI_LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025'
const RECONNECT_DELAY_MS = 1000
const MAX_RECONNECT_ATTEMPTS = 3

// WebSocket endpoint (v1alpha for Gemini 2.5 native-audio models)
const WS_ENDPOINT = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent'

// ============================================================================
// Message Types
// ============================================================================

interface SetupMessage {
  setup: {
    model: string
    generationConfig?: {
      responseModalities: string[]
      speechConfig?: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: string
          }
        }
      }
    }
    systemInstruction?: {
      parts: { text: string }[]
    }
    tools?: {
      functionDeclarations: VoiceTool[]
    }[]
  }
}

interface RealtimeInputMessage {
  realtimeInput: {
    mediaChunks: {
      mimeType: string
      data: string // base64
    }[]
  }
}

interface ClientContentMessage {
  clientContent: {
    turns: {
      role: string
      parts: { text: string }[]
    }[]
    turnComplete: boolean
  }
}

interface ToolResponseMessage {
  toolResponse: {
    functionResponses: {
      id: string
      name: string
      response: unknown
    }[]
  }
}

// Server message types
interface ServerSetupComplete {
  setupComplete: Record<string, unknown>
}

interface ServerContent {
  serverContent: {
    modelTurn?: {
      parts: (
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
        | { functionCall: { id: string; name: string; args: Record<string, unknown> } }
      )[]
    }
    turnComplete?: boolean
  }
}

interface ToolCallMessage {
  toolCall: {
    functionCalls: {
      id: string
      name: string
      args: Record<string, unknown>
    }[]
  }
}

type ServerMessage = ServerSetupComplete | ServerContent | ToolCallMessage

// ============================================================================
// Gemini Live Client Class
// ============================================================================

export class GeminiLiveClient {
  private websocket: WebSocket | null = null
  private config: GeminiLiveConfig
  private isConnected = false
  private reconnectAttempts = 0
  private eventHandlers: VoiceEventHandler[] = []

  // Callbacks
  private onAudioReceived: ((data: ArrayBuffer) => void) | null = null
  private onTextReceived: ((text: string) => void) | null = null
  private onFunctionCall: ((call: GeminiFunctionCall) => Promise<unknown>) | null = null
  private onTurnComplete: (() => void) | null = null
  private onError: ((error: Error) => void) | null = null

  constructor(config: Partial<GeminiLiveConfig> = {}) {
    this.config = {
      model: config.model || GEMINI_LIVE_MODEL,
      systemInstruction: config.systemInstruction || VOICE_SYSTEM_INSTRUCTION,
      tools: config.tools || VOICE_TOOLS,
      voiceName: config.voiceName || 'Puck',
    }
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Connect to Gemini Live API using an ephemeral token (RECOMMENDED)
   *
   * Ephemeral tokens are short-lived credentials generated server-side.
   * This is the secure method for client-side connections.
   *
   * @param token - Ephemeral token from server
   */
  async connectWithToken(token: string): Promise<void> {
    return this.establishConnection(token, true)
  }

  /**
   * Connect to Gemini Live API using API key
   *
   * Note: API key should be fetched from server at runtime,
   * not bundled in client code (no NEXT_PUBLIC_ prefix).
   *
   * @param apiKey - Google API key from server
   */
  async connect(apiKey: string): Promise<void> {
    return this.establishConnection(apiKey, false)
  }

  /**
   * Internal connection method
   */
  private async establishConnection(credential: string, isEphemeral: boolean): Promise<void> {
    if (this.isConnected) {
      console.warn('[GeminiLive] Already connected')
      return
    }

    return new Promise((resolve, reject) => {
      try {
        // Use v1alpha endpoint for all connections (required for Gemini 2.5)
        const authParam = isEphemeral ? `access_token=${credential}` : `key=${credential}`
        const wsUrl = `${WS_ENDPOINT}?${authParam}`

        this.websocket = new WebSocket(wsUrl)

        this.websocket.onopen = () => {
          console.log('[GeminiLive] WebSocket connected')
          this.sendSetupMessage()
        }

        this.websocket.onmessage = async (event) => {
          await this.handleMessage(event.data)

          // Resolve after setup complete
          if (!this.isConnected) {
            this.isConnected = true
            this.reconnectAttempts = 0
            this.emitEvent({ type: 'session_start', timestamp: Date.now() })
            resolve()
          }
        }

        this.websocket.onerror = (event) => {
          console.error('[GeminiLive] WebSocket error:', event)
          const error = new Error('WebSocket connection error')
          this.onError?.(error)
          if (!this.isConnected) {
            reject(error)
          }
        }

        this.websocket.onclose = (event) => {
          console.log('[GeminiLive] WebSocket closed:', event.code, event.reason)
          this.isConnected = false
          this.emitEvent({ type: 'session_end', timestamp: Date.now() })

          // Attempt reconnect if unexpected close (only for API key mode)
          // Ephemeral tokens are single-use, so don't retry
          if (!isEphemeral && event.code !== 1000 && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            this.reconnectAttempts++
            console.log(`[GeminiLive] Attempting reconnect ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`)
            setTimeout(() => this.establishConnection(credential, isEphemeral), RECONNECT_DELAY_MS)
          }
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Disconnect from Gemini Live API
   */
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close(1000, 'Client disconnect')
      this.websocket = null
    }
    this.isConnected = false
  }

  /**
   * Send audio data to Gemini
   */
  sendAudio(audioBlob: Blob): void {
    if (!this.isConnected || !this.websocket) {
      console.warn('[GeminiLive] Cannot send audio: not connected')
      return
    }

    // Convert blob to base64 and send
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]

      const message: RealtimeInputMessage = {
        realtimeInput: {
          mediaChunks: [
            {
              mimeType: audioBlob.type || 'audio/webm',
              data: base64,
            },
          ],
        },
      }

      this.websocket?.send(JSON.stringify(message))
    }
    reader.readAsDataURL(audioBlob)
  }

  /**
   * Send text message to Gemini
   */
  sendText(text: string): void {
    if (!this.isConnected || !this.websocket) {
      console.warn('[GeminiLive] Cannot send text: not connected')
      return
    }

    const message: ClientContentMessage = {
      clientContent: {
        turns: [
          {
            role: 'user',
            parts: [{ text }],
          },
        ],
        turnComplete: true,
      },
    }

    this.websocket.send(JSON.stringify(message))
  }

  /**
   * Send function response back to Gemini
   */
  sendFunctionResponse(id: string, name: string, result: unknown): void {
    if (!this.isConnected || !this.websocket) {
      console.warn('[GeminiLive] Cannot send function response: not connected')
      return
    }

    const message: ToolResponseMessage = {
      toolResponse: {
        functionResponses: [
          {
            id,
            name,
            response: result,
          },
        ],
      },
    }

    this.websocket.send(JSON.stringify(message))
  }

  /**
   * Check if connected
   */
  getIsConnected(): boolean {
    return this.isConnected
  }

  // ==========================================================================
  // Callback Registration
  // ==========================================================================

  setOnAudioReceived(handler: (data: ArrayBuffer) => void): void {
    this.onAudioReceived = handler
  }

  setOnTextReceived(handler: (text: string) => void): void {
    this.onTextReceived = handler
  }

  setOnFunctionCall(handler: (call: GeminiFunctionCall) => Promise<unknown>): void {
    this.onFunctionCall = handler
  }

  setOnTurnComplete(handler: () => void): void {
    this.onTurnComplete = handler
  }

  setOnError(handler: (error: Error) => void): void {
    this.onError = handler
  }

  addEventListener(handler: VoiceEventHandler): void {
    this.eventHandlers.push(handler)
  }

  removeEventListener(handler: VoiceEventHandler): void {
    this.eventHandlers = this.eventHandlers.filter((h) => h !== handler)
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private sendSetupMessage(): void {
    const message: SetupMessage = {
      setup: {
        model: `models/${this.config.model}`,
        generationConfig: {
          responseModalities: ['AUDIO', 'TEXT'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: this.config.voiceName || 'Puck',
              },
            },
          },
        },
        systemInstruction: this.config.systemInstruction
          ? {
              parts: [{ text: this.config.systemInstruction }],
            }
          : undefined,
        tools: this.config.tools
          ? [{ functionDeclarations: this.config.tools }]
          : undefined,
      },
    }

    this.websocket?.send(JSON.stringify(message))
    console.log('[GeminiLive] Sent setup message')
  }

  private async handleMessage(data: string | Blob): Promise<void> {
    try {
      // Handle binary audio data
      if (data instanceof Blob) {
        const arrayBuffer = await data.arrayBuffer()
        this.onAudioReceived?.(arrayBuffer)
        return
      }

      // Handle JSON messages
      const message: ServerMessage = JSON.parse(data)

      // Setup complete
      if ('setupComplete' in message) {
        console.log('[GeminiLive] Setup complete')
        return
      }

      // Tool calls
      if ('toolCall' in message) {
        this.emitEvent({ type: 'function_call', timestamp: Date.now(), data: message.toolCall })

        for (const call of message.toolCall.functionCalls) {
          console.log(`[GeminiLive] Function call: ${call.name}`, call.args)

          if (this.onFunctionCall) {
            try {
              const result = await this.onFunctionCall({
                type: 'function_call',
                id: call.id,
                name: call.name,
                arguments: call.args,
              })

              this.emitEvent({
                type: 'function_result',
                timestamp: Date.now(),
                data: { name: call.name, result },
              })

              this.sendFunctionResponse(call.id, call.name, result)
            } catch (error) {
              console.error(`[GeminiLive] Function ${call.name} failed:`, error)
              this.sendFunctionResponse(call.id, call.name, {
                error: error instanceof Error ? error.message : 'Unknown error',
              })
            }
          }
        }
        return
      }

      // Server content (text/audio)
      if ('serverContent' in message) {
        const content = message.serverContent

        if (content.modelTurn?.parts) {
          for (const part of content.modelTurn.parts) {
            if ('text' in part) {
              this.onTextReceived?.(part.text)
              this.emitEvent({
                type: 'transcript_update',
                timestamp: Date.now(),
                data: { role: 'assistant', text: part.text },
              })
            }

            if ('inlineData' in part && part.inlineData.mimeType.startsWith('audio/')) {
              // Decode base64 audio
              const binaryString = atob(part.inlineData.data)
              const bytes = new Uint8Array(binaryString.length)
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
              }
              this.onAudioReceived?.(bytes.buffer)
              this.emitEvent({ type: 'speaking_start', timestamp: Date.now() })
            }

            if ('functionCall' in part) {
              // Handle inline function call
              const call = part.functionCall
              if (this.onFunctionCall) {
                const result = await this.onFunctionCall({
                  type: 'function_call',
                  id: call.id,
                  name: call.name,
                  arguments: call.args,
                })
                this.sendFunctionResponse(call.id, call.name, result)
              }
            }
          }
        }

        if (content.turnComplete) {
          this.onTurnComplete?.()
          this.emitEvent({ type: 'speaking_end', timestamp: Date.now() })
        }
      }
    } catch (error) {
      console.error('[GeminiLive] Failed to parse message:', error)
    }
  }

  private emitEvent(event: VoiceEvent): void {
    for (const handler of this.eventHandlers) {
      handler(event)
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createGeminiLiveClient(config?: Partial<GeminiLiveConfig>): GeminiLiveClient {
  return new GeminiLiveClient(config)
}
