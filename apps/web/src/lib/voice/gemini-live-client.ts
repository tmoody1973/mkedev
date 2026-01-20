/**
 * Gemini Live Client
 *
 * Client for real-time communication with Gemini Live API using the official SDK.
 * Handles bidirectional audio streaming and function calling.
 */

import { GoogleGenAI, Modality, Session, LiveServerMessage, Type } from '@google/genai'
import type { FunctionDeclaration, Schema } from '@google/genai'
import type { GeminiLiveConfig, GeminiFunctionCall, VoiceEventHandler, VoiceEvent, VoiceTool, VoiceToolParameter } from './types'
import { VOICE_TOOLS, VOICE_SYSTEM_INSTRUCTION } from './voice-tools'

// ============================================================================
// Type Conversion Helpers
// ============================================================================

/**
 * Convert our VoiceTool type to SDK's FunctionDeclaration type
 */
function convertToolToSDKFormat(tool: VoiceTool): FunctionDeclaration {
  return {
    name: tool.name,
    description: tool.description,
    parameters: {
      type: Type.OBJECT,
      properties: Object.fromEntries(
        Object.entries(tool.parameters.properties).map(([key, param]) => [
          key,
          convertParameterToSchema(param),
        ])
      ),
      required: tool.parameters.required,
    },
  }
}

/**
 * Convert our VoiceToolParameter to SDK's Schema type
 */
function convertParameterToSchema(param: VoiceToolParameter): Schema {
  const typeMap: Record<string, Type> = {
    string: Type.STRING,
    number: Type.NUMBER,
    boolean: Type.BOOLEAN,
    array: Type.ARRAY,
    object: Type.OBJECT,
  }

  const schema: Schema = {
    type: typeMap[param.type] || Type.STRING,
    description: param.description,
  }

  if (param.enum) {
    schema.enum = param.enum
  }

  if (param.items) {
    schema.items = convertParameterToSchema(param.items)
  }

  return schema
}

// ============================================================================
// Constants
// ============================================================================

const GEMINI_LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025'

// ============================================================================
// Gemini Live Client Class
// ============================================================================

export class GeminiLiveClient {
  private session: Session | null = null
  private config: GeminiLiveConfig
  private isConnected = false
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
   * Connect to Gemini Live API using the official SDK
   */
  async connect(apiKey: string): Promise<void> {
    if (this.isConnected) {
      console.warn('[GeminiLive] Already connected')
      return
    }

    try {
      const ai = new GoogleGenAI({ apiKey })

      // Build config matching SDK format
      const config = {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: this.config.voiceName || 'Puck',
            },
          },
        },
        systemInstruction: this.config.systemInstruction,
        tools: this.config.tools && this.config.tools.length > 0
          ? [{ functionDeclarations: this.config.tools.map(convertToolToSDKFormat) }]
          : undefined,
      }

      console.log('[GeminiLive] Connecting with SDK...')

      this.session = await ai.live.connect({
        model: this.config.model,
        config,
        callbacks: {
          onopen: () => {
            console.log('[GeminiLive] Connected via SDK')
            this.isConnected = true
            this.emitEvent({ type: 'session_start', timestamp: Date.now() })
          },
          onmessage: (message: LiveServerMessage) => {
            this.handleMessage(message)
          },
          onerror: (e: ErrorEvent) => {
            console.error('[GeminiLive] SDK error:', e.message)
            this.onError?.(new Error(e.message))
          },
          onclose: (e: CloseEvent) => {
            console.log('[GeminiLive] SDK closed:', e.reason)
            this.isConnected = false
            this.emitEvent({ type: 'session_end', timestamp: Date.now() })
          },
        },
      })

      console.log('[GeminiLive] Session started')
    } catch (error) {
      console.error('[GeminiLive] Failed to connect:', error)
      throw error
    }
  }

  /**
   * Connect with token (alias for connect for API compatibility)
   */
  async connectWithToken(token: string): Promise<void> {
    return this.connect(token)
  }

  /**
   * Disconnect from Gemini Live API
   */
  disconnect(): void {
    if (this.session) {
      this.session.close()
      this.session = null
    }
    this.isConnected = false
  }

  /**
   * Send audio data to Gemini
   */
  sendAudio(audioBlob: Blob): void {
    if (!this.isConnected || !this.session) {
      console.warn('[GeminiLive] Cannot send audio: not connected')
      return
    }

    // Convert blob to base64 and send via SDK
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]

      try {
        this.session?.sendRealtimeInput({
          audio: {
            data: base64,
            mimeType: audioBlob.type || 'audio/webm',
          },
        })
      } catch (error) {
        console.error('[GeminiLive] Failed to send audio:', error)
      }
    }
    reader.readAsDataURL(audioBlob)
  }

  /**
   * Send text message to Gemini
   */
  sendText(text: string): void {
    if (!this.isConnected || !this.session) {
      console.warn('[GeminiLive] Cannot send text: not connected')
      return
    }

    this.session.sendClientContent({
      turns: [text],
      turnComplete: true,
    })
  }

  /**
   * Send function response back to Gemini
   */
  sendFunctionResponse(id: string, name: string, result: unknown): void {
    if (!this.isConnected || !this.session) {
      console.warn('[GeminiLive] Cannot send function response: not connected')
      return
    }

    this.session.sendToolResponse({
      functionResponses: [
        {
          id,
          name,
          response: result as Record<string, unknown>,
        },
      ],
    })
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

  private async handleMessage(message: LiveServerMessage): Promise<void> {
    try {
      // Handle tool calls
      if (message.toolCall) {
        this.emitEvent({ type: 'function_call', timestamp: Date.now(), data: message.toolCall })

        for (const call of message.toolCall.functionCalls || []) {
          console.log(`[GeminiLive] Function call: ${call.name}`, call.args)

          if (this.onFunctionCall) {
            try {
              const result = await this.onFunctionCall({
                type: 'function_call',
                id: call.id || '',
                name: call.name || '',
                arguments: call.args || {},
              })

              this.emitEvent({
                type: 'function_result',
                timestamp: Date.now(),
                data: { name: call.name, result },
              })

              this.sendFunctionResponse(call.id || '', call.name || '', result)
            } catch (error) {
              console.error(`[GeminiLive] Function ${call.name} failed:`, error)
              this.sendFunctionResponse(call.id || '', call.name || '', {
                error: error instanceof Error ? error.message : 'Unknown error',
              })
            }
          }
        }
        return
      }

      // Handle server content (text/audio)
      if (message.serverContent?.modelTurn?.parts) {
        for (const part of message.serverContent.modelTurn.parts) {
          // Handle text
          if (part.text) {
            this.onTextReceived?.(part.text)
            this.emitEvent({
              type: 'transcript_update',
              timestamp: Date.now(),
              data: { role: 'assistant', text: part.text },
            })
          }

          // Handle audio
          if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/')) {
            // Decode base64 audio
            const binaryString = atob(part.inlineData.data || '')
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            this.onAudioReceived?.(bytes.buffer)
            this.emitEvent({ type: 'speaking_start', timestamp: Date.now() })
          }
        }
      }

      // Handle turn complete
      if (message.serverContent?.turnComplete) {
        this.onTurnComplete?.()
        this.emitEvent({ type: 'speaking_end', timestamp: Date.now() })
      }
    } catch (error) {
      console.error('[GeminiLive] Failed to handle message:', error)
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
