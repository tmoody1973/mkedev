/**
 * useVoiceSession Hook
 *
 * React hook for managing Gemini Live voice sessions.
 * Handles connection, audio capture/playback, and function calling.
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useAction, useConvex } from 'convex/react'
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

/**
 * Card data for generative UI rendering in chat
 * Matches the GenerativeCard types from ChatPanel
 */
export interface VoiceGeneratedCard {
  type:
    | 'zone-info'
    | 'parcel-info'
    | 'parcel-analysis'
    | 'incentives-summary'
    | 'area-plan-context'
    | 'permit-process'
    | 'code-citation'
    | 'opportunity-list'
    | 'home-listing'
    | 'homes-list'
    | 'commercial-properties-list'
    | 'commercial-property'
    | 'development-sites-list'
    | 'development-site'
  data: unknown
}

/**
 * Chat message emitted from voice session for integration with chat panel
 */
export interface VoiceChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  inputMode: 'voice'
  cards?: VoiceGeneratedCard[]
}

interface UseVoiceSessionOptions {
  apiKey?: string
  onTranscriptUpdate?: (transcript: TranscriptEntry[]) => void
  onStateChange?: (state: VoiceSessionState) => void
  onError?: (error: Error) => void
  /** Called when a message should be added to chat */
  onChatMessage?: (message: VoiceChatMessage) => void
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
// Helpers
// ============================================================================

/**
 * Get zoning category from code prefix
 * Maps Milwaukee zoning codes to display categories
 */
function getZoningCategory(code: string): string {
  const prefix = code.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 2)

  const categoryMap: Record<string, string> = {
    'RS': 'Residential - Single Family',
    'RT': 'Residential - Two Family',
    'RM': 'Residential - Multi-Family',
    'RO': 'Residential - Office',
    'LB': 'Local Business',
    'NS': 'Neighborhood Shopping',
    'CS': 'Commercial Service',
    'RB': 'Regional Business',
    'IL': 'Industrial - Light',
    'IM': 'Industrial - Mixed',
    'IH': 'Industrial - Heavy',
    'IC': 'Industrial - Commercial',
    'PK': 'Parks',
    'IN': 'Institutional',
    'DT': 'Downtown',
    'PD': 'Planned Development',
  }

  return categoryMap[prefix] || 'Mixed Use / Special'
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
  const { onTranscriptUpdate, onStateChange, onError, onChatMessage } = options

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

  // Convex actions and queries for server-side operations
  const convex = useConvex()
  const geocodeAddress = useAction(api.mapbox.geocode)
  const queryZoning = useAction(api.agents.zoning.chat)
  const getCredentials = useAction(api.gemini.getCredentials)

  // Pending cards to attach to next assistant message
  const pendingCardsRef = useRef<VoiceGeneratedCard[]>([])

  // ==========================================================================
  // Chat Message Emission
  // ==========================================================================

  const emitChatMessage = useCallback((
    role: 'user' | 'assistant',
    content: string,
    cards?: VoiceGeneratedCard[]
  ) => {
    if (!onChatMessage) return

    const message: VoiceChatMessage = {
      id: `voice-${role}-${Date.now()}`,
      role,
      content,
      timestamp: new Date(),
      inputMode: 'voice',
      cards,
    }
    onChatMessage(message)
  }, [onChatMessage])

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

              // Generate a parcel-info card for the searched address
              pendingCardsRef.current.push({
                type: 'parcel-info',
                data: {
                  address: feature.place_name,
                  coordinates: [lng, lat],
                  status: 'complete',
                },
              })

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

            // Generate a code-citation card for zoning questions
            pendingCardsRef.current.push({
              type: 'code-citation',
              data: {
                question,
                answer: result.response ? result.response.substring(0, 500) : 'Zoning code information retrieved',
                source: 'Milwaukee Zoning Code (Chapter 295)',
                status: 'complete',
              },
            })

            return {
              success: true,
              answer: result.response,
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

            // Generate a zone-info card
            pendingCardsRef.current.push({
              type: 'zone-info',
              data: {
                zoningDistrict: code.toUpperCase(),
                zoningDescription: result.response ? result.response.substring(0, 200) : 'Zoning information retrieved',
                zoningCategory: getZoningCategory(code),
                status: 'complete',
              },
            })

            return {
              success: true,
              explanation: result.response,
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
        // City Properties / Homes For Sale
        // ---------------------------------------------------------------------
        case 'show_city_properties': {
          const neighborhood = args.neighborhood as string | undefined

          try {
            // Query homes from database
            const homes = await convex.query(api.homes.searchHomes, {
              neighborhood,
              limit: 10,
            })

            // Toggle the city-owned layer on map
            setLayerVisibility('cityOwned', true)

            if (homes && homes.length > 0) {
              // Transform to card format
              const homeItems = homes.map((h) => ({
                id: h._id,
                address: h.address,
                neighborhood: h.neighborhood,
                coordinates: h.coordinates as [number, number],
                bedrooms: h.bedrooms,
                fullBaths: h.fullBaths,
                halfBaths: h.halfBaths,
              }))

              // Add card to pending (will be attached to next assistant message)
              pendingCardsRef.current.push({
                type: 'homes-list',
                data: { homes: homeItems, status: 'complete' },
              })

              // Fly to first home
              if (homeItems[0]?.coordinates) {
                flyTo(homeItems[0].coordinates, 14)
              }

              return {
                success: true,
                count: homes.length,
                homes: homeItems.slice(0, 5).map(h => ({
                  address: h.address,
                  neighborhood: h.neighborhood,
                  bedrooms: h.bedrooms,
                })),
                message: `Found ${homes.length} homes for sale${neighborhood ? ` in ${neighborhood}` : ''}.`,
              }
            }

            return {
              success: true,
              count: 0,
              message: 'No homes currently for sale matching those criteria.',
            }
          } catch (error) {
            console.error('[useVoiceSession] Failed to search homes:', error)
            return { success: false, error: 'Failed to search homes' }
          }
        }

        case 'get_property_details': {
          const propertyId = args.propertyId as string

          try {
            // Try to find by tax key first
            const home = await convex.query(api.homes.getByTaxKey, {
              taxKey: propertyId,
            })

            if (home) {
              // Fly to the property
              if (home.coordinates) {
                flyTo(home.coordinates as [number, number], 18)
              }

              // Add card to pending
              pendingCardsRef.current.push({
                type: 'home-listing',
                data: {
                  id: home._id,
                  address: home.address,
                  neighborhood: home.neighborhood,
                  coordinates: home.coordinates,
                  bedrooms: home.bedrooms,
                  fullBaths: home.fullBaths,
                  halfBaths: home.halfBaths,
                  status: 'complete',
                },
              })

              return {
                success: true,
                address: home.address,
                neighborhood: home.neighborhood,
                bedrooms: home.bedrooms,
                baths: home.fullBaths + home.halfBaths * 0.5,
              }
            }

            return { success: false, error: 'Property not found' }
          } catch (error) {
            console.error('[useVoiceSession] Failed to get property details:', error)
            return { success: false, error: 'Failed to get property details' }
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
      convex,
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
      // Get credentials from server (API key not bundled in client code)
      console.log('[useVoiceSession] Requesting credentials from server...')
      const credentials = await getCredentials()

      if (!credentials?.apiKey) {
        throw new Error('Failed to get credentials from server')
      }

      console.log('[useVoiceSession] Got credentials, connecting to Gemini Live...')

      // Create client with server-provided model
      clientRef.current = createGeminiLiveClient({
        model: credentials.model,
      })

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

        // Emit to chat with any pending cards from function calls
        const cards = pendingCardsRef.current.length > 0
          ? [...pendingCardsRef.current]
          : undefined
        pendingCardsRef.current = [] // Clear pending cards

        emitChatMessage('assistant', text, cards)
      })

      // Handle user speech transcription (what the user said via voice)
      clientRef.current.setOnUserTranscript((text) => {
        addTranscriptEntry({
          id: `user-${Date.now()}`,
          role: 'user',
          content: text,
          timestamp: Date.now(),
        })
        // Emit user's spoken words to chat
        emitChatMessage('user', text)
      })

      clientRef.current.setOnFunctionCall(handleFunctionCall)

      clientRef.current.setOnTurnComplete(() => {
        updateState('listening')
      })

      clientRef.current.setOnError((error) => {
        setError(error.message)
      })

      // Connect to Gemini Live
      await clientRef.current.connect(credentials.apiKey)

      // Start audio capture
      await audioManagerRef.current.startCapture((audioBlob) => {
        clientRef.current?.sendAudio(audioBlob)
      })

      updateState('listening')
      console.log('[useVoiceSession] Session started')
    } catch (error) {
      console.error('[useVoiceSession] Failed to start session:', error)
      setError(error instanceof Error ? error.message : 'Failed to start voice session')
      updateState('error')
    }
  }, [session.isActive, updateState, setError, addTranscriptEntry, handleFunctionCall, getCredentials, emitChatMessage])

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

    // Emit user message to chat
    emitChatMessage('user', text)

    clientRef.current.sendText(text)
    updateState('processing')
  }, [addTranscriptEntry, updateState, emitChatMessage])

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
