/**
 * Audio Manager
 *
 * Handles audio capture from microphone and playback of Gemini responses.
 * Uses Web Audio API and MediaRecorder for browser audio processing.
 */

import type { AudioConfig, AudioManagerState } from './types'

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: AudioConfig = {
  sampleRate: 16000,    // Gemini Live expects 16kHz input
  channelCount: 1,      // Mono audio
  echoCancellation: true,
  noiseSuppression: true,
}

const PLAYBACK_SAMPLE_RATE = 24000  // Gemini Live outputs 24kHz audio

// ============================================================================
// Audio Manager Class
// ============================================================================

export class AudioManager {
  private config: AudioConfig
  private mediaStream: MediaStream | null = null
  private captureContext: AudioContext | null = null
  private scriptProcessor: ScriptProcessorNode | null = null
  private playbackContext: AudioContext | null = null
  private gainNode: GainNode | null = null
  private audioQueue: AudioBuffer[] = []
  private isPlayingQueue = false
  private state: AudioManagerState = {
    isCapturing: false,
    isPlaying: false,
    volume: 1.0,
    isMuted: false,
  }

  // Callbacks
  private onAudioData: ((data: Blob) => void) | null = null
  private onStateChange: ((state: AudioManagerState) => void) | null = null

  constructor(config: Partial<AudioConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Start capturing audio from the microphone
   * Captures raw PCM audio at 16kHz for Gemini Live API
   */
  async startCapture(onAudioData: (data: Blob) => void): Promise<void> {
    if (this.state.isCapturing) {
      console.warn('[AudioManager] Already capturing')
      return
    }

    try {
      // Request microphone permission
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channelCount,
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseSuppression,
        },
      })

      this.onAudioData = onAudioData

      // Create AudioContext for raw PCM capture
      // Note: Browser may use a different sample rate than requested
      this.captureContext = new AudioContext({ sampleRate: this.config.sampleRate })

      // Create source from microphone stream
      const source = this.captureContext.createMediaStreamSource(this.mediaStream)

      // Use ScriptProcessorNode to capture raw PCM samples
      // Buffer size of 4096 gives ~256ms chunks at 16kHz
      const bufferSize = 4096
      this.scriptProcessor = this.captureContext.createScriptProcessor(bufferSize, 1, 1)

      this.scriptProcessor.onaudioprocess = (event) => {
        if (!this.onAudioData) return

        const inputData = event.inputBuffer.getChannelData(0)

        // Convert Float32 (-1.0 to 1.0) to Int16 PCM
        const pcmData = new Int16Array(inputData.length)
        for (let i = 0; i < inputData.length; i++) {
          // Clamp and convert to 16-bit integer
          const s = Math.max(-1, Math.min(1, inputData[i]))
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff
        }

        // Create Blob with PCM mime type
        const blob = new Blob([pcmData.buffer], { type: 'audio/pcm' })
        this.onAudioData(blob)
      }

      // Connect: microphone -> processor -> destination (required for processing)
      source.connect(this.scriptProcessor)
      this.scriptProcessor.connect(this.captureContext.destination)

      this.updateState({ isCapturing: true })
      console.log('[AudioManager] Started capturing audio (PCM 16kHz)')
    } catch (error) {
      console.error('[AudioManager] Failed to start capture:', error)
      throw error
    }
  }

  /**
   * Stop capturing audio
   */
  stopCapture(): void {
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect()
      this.scriptProcessor = null
    }

    if (this.captureContext) {
      this.captureContext.close()
      this.captureContext = null
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop())
      this.mediaStream = null
    }

    this.onAudioData = null
    this.updateState({ isCapturing: false })
    console.log('[AudioManager] Stopped capturing audio')
  }

  /**
   * Play audio data received from Gemini
   */
  async playAudio(audioData: ArrayBuffer): Promise<void> {
    if (this.state.isMuted) return

    try {
      // Initialize audio context on first play (must be after user gesture)
      if (!this.playbackContext) {
        this.playbackContext = new AudioContext({ sampleRate: PLAYBACK_SAMPLE_RATE })
        this.gainNode = this.playbackContext.createGain()
        this.gainNode.connect(this.playbackContext.destination)
        this.gainNode.gain.value = this.state.volume
      }

      // Resume context if suspended (browser autoplay policy)
      if (this.playbackContext.state === 'suspended') {
        await this.playbackContext.resume()
      }

      // Decode audio data
      const audioBuffer = await this.decodeAudioData(audioData)

      // Add to queue and play
      this.audioQueue.push(audioBuffer)
      this.processAudioQueue()
    } catch (error) {
      console.error('[AudioManager] Failed to play audio:', error)
    }
  }

  /**
   * Stop all audio playback
   */
  stopPlayback(): void {
    this.audioQueue = []
    this.isPlayingQueue = false
    this.updateState({ isPlaying: false })
  }

  /**
   * Set playback volume (0.0 - 1.0)
   */
  setVolume(volume: number): void {
    this.state.volume = Math.max(0, Math.min(1, volume))
    if (this.gainNode) {
      this.gainNode.gain.value = this.state.volume
    }
    this.updateState({ volume: this.state.volume })
  }

  /**
   * Mute/unmute playback
   */
  setMuted(muted: boolean): void {
    this.updateState({ isMuted: muted })
    if (this.gainNode) {
      this.gainNode.gain.value = muted ? 0 : this.state.volume
    }
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    this.stopCapture()
    this.stopPlayback()

    if (this.playbackContext) {
      this.playbackContext.close()
      this.playbackContext = null
    }

    this.gainNode = null
  }

  /**
   * Get current state
   */
  getState(): AudioManagerState {
    return { ...this.state }
  }

  /**
   * Register state change callback
   */
  onStateUpdate(callback: (state: AudioManagerState) => void): void {
    this.onStateChange = callback
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private async decodeAudioData(data: ArrayBuffer): Promise<AudioBuffer> {
    if (!this.playbackContext) {
      throw new Error('AudioContext not initialized')
    }

    // Gemini Live sends raw PCM audio, need to convert to AudioBuffer
    // The audio is 16-bit PCM at 24kHz
    const pcmData = new Int16Array(data)
    const floatData = new Float32Array(pcmData.length)

    // Convert 16-bit PCM to float (-1.0 to 1.0)
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 32768.0
    }

    // Create AudioBuffer
    const audioBuffer = this.playbackContext.createBuffer(
      1, // mono
      floatData.length,
      PLAYBACK_SAMPLE_RATE
    )
    audioBuffer.copyToChannel(floatData, 0)

    return audioBuffer
  }

  private async processAudioQueue(): Promise<void> {
    if (this.isPlayingQueue || this.audioQueue.length === 0) return
    if (!this.playbackContext || !this.gainNode) return

    this.isPlayingQueue = true
    this.updateState({ isPlaying: true })

    while (this.audioQueue.length > 0) {
      const buffer = this.audioQueue.shift()!

      await new Promise<void>((resolve) => {
        const source = this.playbackContext!.createBufferSource()
        source.buffer = buffer
        source.connect(this.gainNode!)
        source.onended = () => resolve()
        source.start()
      })
    }

    this.isPlayingQueue = false
    this.updateState({ isPlaying: false })
  }

  private updateState(updates: Partial<AudioManagerState>): void {
    this.state = { ...this.state, ...updates }
    if (this.onStateChange) {
      this.onStateChange(this.state)
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let audioManagerInstance: AudioManager | null = null

export function getAudioManager(): AudioManager {
  if (!audioManagerInstance) {
    audioManagerInstance = new AudioManager()
  }
  return audioManagerInstance
}

export function destroyAudioManager(): void {
  if (audioManagerInstance) {
    audioManagerInstance.destroy()
    audioManagerInstance = null
  }
}
