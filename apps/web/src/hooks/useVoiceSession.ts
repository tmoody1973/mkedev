/**
 * useVoiceSession Hook
 *
 * React hook for managing Gemini Live voice sessions.
 * Handles connection, audio capture/playback, and function calling.
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useAction } from 'convex/react'
import { api } from '@convex/_generated/api'
import {
  GeminiLiveClient,
  createGeminiLiveClient,
  getAudioManager,
  destroyAudioManager,
  LAYER_ID_MAP,
  MILWAUKEE_LANDMARKS,
} from '@/lib/voice'
import type {
  VoiceSession,
  VoiceSessionState,
  TranscriptEntry,
  GeminiFunctionCall,
} from '@/lib/voice'
import { useMap } from '@/contexts/MapContext'

// ============================================================================
// Types
// ============================================================================

interface UseVoiceSessionOptions {
  apiKey?: string
  onTranscriptUpdate?: (transcript: TranscriptEntry[]) => void
  onStateChange?: (state: VoiceSessionState) => void
  onError?: (error: Error) => void
}

interface UseVoiceSessionReturn {
  session: VoiceSession
  startSession: () => Promise<void>
  endSession: () => void
  toggleSession: () => Promise<void>
  sendText: (text: string) => void
  clearTranscript: () => void
}

// ============================================================================
// Initial State
// ============================================================================

const initialSession: VoiceSession = {
  state: 'inactive',
  isActive: false,
  error: null,
  transcript: [],
  currentTranscript: null,
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useVoiceSession(
  options: UseVoiceSessionOptions = {}
): UseVoiceSessionReturn {
  const { onTranscriptUpdate, onStateChange, onError } = options

  // State
  const [session, setSession] = useState<VoiceSession>(initialSession)

  // Refs for client instances (persisted across renders)
  const clientRef = useRef<GeminiLiveClient | null>(null)
  const audioManagerRef = useRef(getAudioManager())

  // Map context for function calling
  const {
    flyTo,
    setLayerVisibility,
    setLayerOpacity,
    captureMapScreenshot,
    resetView,
  } = useMap()

  // Convex actions for server-side operations
  const geocodeAddress = useAction(api.mapbox.geocode)
  const queryZoning = useAction(api.agents.zoning.chat)
  const getEphemeralToken = useAction(api.gemini.getEphemeralToken)
  // Note: These actions may need to be created if they don't exist
  // const generateVisualization = useAction(api.visualization.generate.generate)

  // ==========================================================================
  // State Updates
  // ==========================================================================

  const updateState = useCallback((state: VoiceSessionState) => {
    setSession((prev) => ({
      ...prev,
      state,
      isActive: state !== 'inactive' && state !== 'error',
    }))
    onStateChange?.(state)
  }, [onStateChange])

  const addTranscriptEntry = useCallback((entry: TranscriptEntry) => {
    setSession((prev) => {
      const newTranscript = [...prev.transcript, entry]
      onTranscriptUpdate?.(newTranscript)
      return { ...prev, transcript: newTranscript }
    })
  }, [onTranscriptUpdate])

  const setError = useCallback((error: string | null) => {
    setSession((prev) => ({
      ...prev,
      error,
      state: error ? 'error' : prev.state,
    }))
    if (error) {
      onError?.(new Error(error))
    }
  }, [onError])

  // ==========================================================================
  // Function Call Handlers
  // ==========================================================================

  const handleFunctionCall = useCallback(
    async (call: GeminiFunctionCall): Promise<unknown> => {
      console.log(`[useVoiceSession] Handling function: ${call.name}`, call.arguments)

      const args = call.arguments

      switch (call.name) {
        // ---------------------------------------------------------------------
        // Address & Location
        // ---------------------------------------------------------------------
        case 'search_address': {
          const address = args.address as string
          try {
            const result = await geocodeAddress({ query: address })
            if (result && result.features && result.features.length > 0) {
              const feature = result.features[0]
              const [lng, lat] = feature.center
              flyTo([lng, lat], 17)
              return {
                success: true,
                address: feature.place_name,
                coordinates: { lng, lat },
              }
            }
            return { success: false, error: 'Address not found' }
          } catch (error) {
            return { success: false, error: 'Failed to search address' }
          }
        }

        case 'get_parcel_info': {
          // Would query parcel at current location
          // This requires the map to expose parcel query functionality
          return {
            success: true,
            message: 'Parcel info functionality coming soon',
          }
        }

        case 'fly_to_location': {
          const location = (args.location as string).toLowerCase()
          const zoom = (args.zoom as number) || 15

          // Check if it's a known landmark
          if (MILWAUKEE_LANDMARKS[location]) {
            const landmark = MILWAUKEE_LANDMARKS[location]
            flyTo([landmark.lng, landmark.lat], landmark.zoom)
            return { success: true, location }
          }

          // Try geocoding as address
          try {
            const result = await geocodeAddress({ query: `${location}, Milwaukee, WI` })
            if (result && result.features && result.features.length > 0) {
              const [lng, lat] = result.features[0].center
              flyTo([lng, lat], zoom)
              return { success: true, location: result.features[0].place_name }
            }
          } catch {
            // Ignore geocoding errors
          }

          return { success: false, error: 'Location not found' }
        }

        case 'reset_map_view': {
          resetView()
          return { success: true }
        }

        // ---------------------------------------------------------------------
        // Zoning
        // ---------------------------------------------------------------------
        case 'query_zoning_code': {
          const question = args.question as string
          try {
            // Use the zoning agent to answer the question
            const result = await queryZoning({ message: question })
            return {
              success: true,
              answer: result,
            }
          } catch (error) {
            return { success: false, error: 'Failed to query zoning code' }
          }
        }

        case 'explain_zoning_code': {
          const code = args.code as string
          // Use zoning agent to explain the code
          try {
            const result = await queryZoning({
              message: `Explain what zoning code ${code} means in Milwaukee. What uses are allowed and what are the key restrictions?`,
            })
            return {
              success: true,
              explanation: result,
            }
          } catch (error) {
            return { success: false, error: 'Failed to explain zoning code' }
          }
        }

        // ---------------------------------------------------------------------
        // Map Layers
        // ---------------------------------------------------------------------
        case 'toggle_layer': {
          const layerKey = args.layer as string
          const visible = args.visible as boolean
          const layerId = LAYER_ID_MAP[layerKey] || layerKey

          setLayerVisibility(layerId, visible)
          return { success: true, layer: layerKey, visible }
        }

        case 'set_layer_opacity': {
          const layerKey = args.layer as string
          const opacity = args.opacity as number
          const layerId = LAYER_ID_MAP[layerKey] || layerKey

          setLayerOpacity(layerId, opacity / 100) // Convert 0-100 to 0-1
          return { success: true, layer: layerKey, opacity }
        }

        // ---------------------------------------------------------------------
        // Visualizer
        // ---------------------------------------------------------------------
        case 'capture_map_screenshot': {
          try {
            // args.include3D could be used to enable 3D mode before capture
            await captureMapScreenshot()
            return {
              success: true,
              captured: true,
              message: 'Screenshot captured. Ready for visualization.',
            }
          } catch (error) {
            return { success: false, error: 'Failed to capture screenshot' }
          }
        }

        case 'generate_visualization': {
          const prompt = args.prompt as string
          // This would trigger the visualization flow
          // For now, return a placeholder
          return {
            success: true,
            message: `Visualization generation with prompt: "${prompt}" - functionality coming soon`,
          }
        }

        case 'save_visualization': {
          return {
            success: true,
            message: 'Save visualization functionality coming soon',
          }
        }

        // ---------------------------------------------------------------------
        // City Properties
        // ---------------------------------------------------------------------
        case 'show_city_properties': {
          // Toggle the city-owned layer
          setLayerVisibility('cityOwned', true)
          return {
            success: true,
            message: 'Showing city-owned properties',
          }
        }

        case 'get_property_details': {
          return {
            success: true,
            message: 'Property details functionality coming soon',
          }
        }

        // ---------------------------------------------------------------------
        // Unknown Function
        // ---------------------------------------------------------------------
        default:
          console.warn(`[useVoiceSession] Unknown function: ${call.name}`)
          return { success: false, error: `Unknown function: ${call.name}` }
      }
    },
    [
      flyTo,
      resetView,
      setLayerVisibility,
      setLayerOpacity,
      captureMapScreenshot,
      geocodeAddress,
      queryZoning,
    ]
  )

  // ==========================================================================
  // Session Control
  // ==========================================================================

  const startSession = useCallback(async () => {
    if (session.isActive) {
      console.warn('[useVoiceSession] Session already active')
      return
    }

    updateState('connecting')

    try {
      // Get ephemeral token from server (secure - API key never exposed to client)
      console.log('[useVoiceSession] Requesting ephemeral token from server...')
      const tokenResponse = await getEphemeralToken()

      if (!tokenResponse?.token) {
        throw new Error('Failed to get ephemeral token from server')
      }

      console.log('[useVoiceSession] Got ephemeral token, expires:', tokenResponse.expiresAt)

      // Create client
      clientRef.current = createGeminiLiveClient()

      // Set up callbacks
      clientRef.current.setOnAudioReceived((data) => {
        audioManagerRef.current.playAudio(data)
      })

      clientRef.current.setOnTextReceived((text) => {
        addTranscriptEntry({
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: text,
          timestamp: Date.now(),
        })
      })

      clientRef.current.setOnFunctionCall(handleFunctionCall)

      clientRef.current.setOnTurnComplete(() => {
        updateState('listening')
      })

      clientRef.current.setOnError((error) => {
        setError(error.message)
      })

      // Connect to Gemini Live using ephemeral token (secure)
      await clientRef.current.connectWithToken(tokenResponse.token)

      // Start audio capture
      await audioManagerRef.current.startCapture((audioBlob) => {
        clientRef.current?.sendAudio(audioBlob)
      })

      updateState('listening')
      console.log('[useVoiceSession] Session started with ephemeral token')
    } catch (error) {
      console.error('[useVoiceSession] Failed to start session:', error)
      setError(error instanceof Error ? error.message : 'Failed to start voice session')
      updateState('error')
    }
  }, [session.isActive, updateState, setError, addTranscriptEntry, handleFunctionCall, getEphemeralToken])

  const endSession = useCallback(() => {
    // Stop audio
    audioManagerRef.current.stopCapture()
    audioManagerRef.current.stopPlayback()

    // Disconnect client
    clientRef.current?.disconnect()
    clientRef.current = null

    // Reset state
    setSession(initialSession)
    console.log('[useVoiceSession] Session ended')
  }, [])

  const toggleSession = useCallback(async () => {
    if (session.isActive) {
      endSession()
    } else {
      await startSession()
    }
  }, [session.isActive, startSession, endSession])

  const sendText = useCallback((text: string) => {
    if (!clientRef.current?.getIsConnected()) {
      console.warn('[useVoiceSession] Cannot send text: not connected')
      return
    }

    addTranscriptEntry({
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    })

    clientRef.current.sendText(text)
    updateState('processing')
  }, [addTranscriptEntry, updateState])

  const clearTranscript = useCallback(() => {
    setSession((prev) => ({ ...prev, transcript: [] }))
  }, [])

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  useEffect(() => {
    return () => {
      endSession()
      destroyAudioManager()
    }
  }, [endSession])

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    session,
    startSession,
    endSession,
    toggleSession,
    sendText,
    clearTranscript,
  }
}
