/**
 * Voice Module Exports
 *
 * Gemini Live voice interface for MKE.dev
 */

// Types
export type {
  VoiceSessionState,
  VoiceSession,
  TranscriptEntry,
  FunctionCallEntry,
  GeminiLiveConfig,
  GeminiFunctionCall,
  VoiceName,
  VoiceTool,
  VoiceToolParameter,
  VoiceToolHandler,
  VoiceToolRegistry,
  AudioConfig,
  AudioManagerState,
  VoiceEventType,
  VoiceEvent,
  VoiceEventHandler,
  VoiceContextValue,
} from './types'

// Voice Tools
export {
  VOICE_TOOLS,
  VOICE_SYSTEM_INSTRUCTION,
  LAYER_ID_MAP,
  MILWAUKEE_LANDMARKS,
} from './voice-tools'

// Audio Manager
export {
  AudioManager,
  getAudioManager,
  destroyAudioManager,
} from './audio-manager'

// Gemini Live Client
export {
  GeminiLiveClient,
  createGeminiLiveClient,
} from './gemini-live-client'
