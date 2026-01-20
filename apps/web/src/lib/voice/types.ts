/**
 * Voice System Types
 *
 * Type definitions for Gemini Live voice interface integration.
 */

// ============================================================================
// Session State
// ============================================================================

export type VoiceSessionState =
  | 'inactive'      // Not connected
  | 'connecting'    // Establishing WebSocket connection
  | 'listening'     // Connected and capturing audio
  | 'processing'    // Gemini is processing/thinking
  | 'speaking'      // Gemini is speaking response
  | 'error'         // Error state

export interface VoiceSession {
  state: VoiceSessionState
  isActive: boolean
  error: string | null
  transcript: TranscriptEntry[]
  currentTranscript: string | null
}

export interface TranscriptEntry {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  functionCalls?: FunctionCallEntry[]
}

export interface FunctionCallEntry {
  name: string
  arguments: Record<string, unknown>
  result?: unknown
  status: 'pending' | 'success' | 'error'
}

// ============================================================================
// Gemini Live API Types
// ============================================================================

export interface GeminiLiveConfig {
  model: string
  systemInstruction?: string
  tools?: VoiceTool[]
  voiceName?: VoiceName
}

export type VoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede'

export interface GeminiLiveMessage {
  type: 'audio' | 'text' | 'function_call' | 'function_response' | 'turn_complete' | 'error'
  data?: unknown
}

export interface GeminiAudioMessage {
  type: 'audio'
  data: ArrayBuffer
}

export interface GeminiTextMessage {
  type: 'text'
  text: string
}

export interface GeminiFunctionCall {
  type: 'function_call'
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface GeminiFunctionResponse {
  type: 'function_response'
  id: string
  result: unknown
}

export interface GeminiTurnComplete {
  type: 'turn_complete'
}

export interface GeminiError {
  type: 'error'
  error: string
  code?: string
}

// ============================================================================
// Voice Tools (Function Calling)
// ============================================================================

export interface VoiceTool {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, VoiceToolParameter>
    required?: string[]
  }
}

export interface VoiceToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  enum?: string[]
  items?: VoiceToolParameter
}

export type VoiceToolHandler = (
  args: Record<string, unknown>
) => Promise<unknown>

export interface VoiceToolRegistry {
  tools: VoiceTool[]
  handlers: Record<string, VoiceToolHandler>
}

// ============================================================================
// Audio Types
// ============================================================================

export interface AudioConfig {
  sampleRate: number
  channelCount: number
  echoCancellation: boolean
  noiseSuppression: boolean
}

export interface AudioManagerState {
  isCapturing: boolean
  isPlaying: boolean
  volume: number
  isMuted: boolean
}

// ============================================================================
// Event Types
// ============================================================================

export type VoiceEventType =
  | 'session_start'
  | 'session_end'
  | 'listening_start'
  | 'listening_end'
  | 'transcript_update'
  | 'function_call'
  | 'function_result'
  | 'speaking_start'
  | 'speaking_end'
  | 'error'

export interface VoiceEvent {
  type: VoiceEventType
  timestamp: number
  data?: unknown
}

export type VoiceEventHandler = (event: VoiceEvent) => void

// ============================================================================
// Context Types
// ============================================================================

export interface VoiceContextValue {
  session: VoiceSession
  startSession: () => Promise<void>
  endSession: () => void
  toggleSession: () => Promise<void>
  sendText: (text: string) => void
  setMuted: (muted: boolean) => void
  clearTranscript: () => void
}
