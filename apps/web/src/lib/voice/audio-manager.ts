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
  private mediaRecorder: MediaRecorder | null = null
  private audioContext: AudioContext | null = null
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

      // Create MediaRecorder for capturing chunks
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: this.getSupportedMimeType(),
      })

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.onAudioData) {
          this.onAudioData(event.data)
        }
      }

      // Capture audio in 100ms chunks for low latency
      this.mediaRecorder.start(100)

      this.updateState({ isCapturing: true })
      console.log('[AudioManager] Started capturing audio')
    } catch (error) {
      console.error('[AudioManager] Failed to start capture:', error)
      throw error
    }
  }

  /**
   * Stop capturing audio
   */
  stopCapture(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop())
      this.mediaStream = null
    }

    this.mediaRecorder = null
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
      if (!this.audioContext) {
        this.audioContext = new AudioContext({ sampleRate: PLAYBACK_SAMPLE_RATE })
        this.gainNode = this.audioContext.createGain()
        this.gainNode.connect(this.audioContext.destination)
        this.gainNode.gain.value = this.state.volume
      }

      // Resume context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
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

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
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
    if (!this.audioContext) {
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
    const audioBuffer = this.audioContext.createBuffer(
      1, // mono
      floatData.length,
      PLAYBACK_SAMPLE_RATE
    )
    audioBuffer.copyToChannel(floatData, 0)

    return audioBuffer
  }

  private async processAudioQueue(): Promise<void> {
    if (this.isPlayingQueue || this.audioQueue.length === 0) return
    if (!this.audioContext || !this.gainNode) return

    this.isPlayingQueue = true
    this.updateState({ isPlaying: true })

    while (this.audioQueue.length > 0) {
      const buffer = this.audioQueue.shift()!

      await new Promise<void>((resolve) => {
        const source = this.audioContext!.createBufferSource()
        source.buffer = buffer
        source.connect(this.gainNode!)
        source.onended = () => resolve()
        source.start()
      })
    }

    this.isPlayingQueue = false
    this.updateState({ isPlaying: false })
  }

  private getSupportedMimeType(): string {
    // Prefer webm/opus for smaller size, fallback to others
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    // Fallback to default
    return ''
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
