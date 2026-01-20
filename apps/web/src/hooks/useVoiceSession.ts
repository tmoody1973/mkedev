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
    console.log('[useVoiceSession] emitChatMessage called:', { role, content: content.substring(0, 50), hasCards: !!cards, cardCount: cards?.length, hasCallback: !!onChatMessage })

    if (!onChatMessage) {
      console.warn('[useVoiceSession] onChatMessage callback is not set!')
      return
    }

    const message: VoiceChatMessage = {
      id: `voice-${role}-${Date.now()}`,
      role,
      content,
      timestamp: new Date(),
      inputMode: 'voice',
      cards,
    }
    console.log('[useVoiceSession] Emitting message to chat:', message.id, message.cards?.length, 'cards')
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

              // Emit parcel-info card directly to chat
              emitChatMessage('assistant', '', [{
                type: 'parcel-info',
                data: {
                  address: feature.place_name,
                  coordinates: { latitude: lat, longitude: lng },
                  status: 'complete',
                },
              }])

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

            // Emit code-citation card directly to chat
            emitChatMessage('assistant', '', [{
              type: 'code-citation',
              data: {
                question,
                answer: result.response ? result.response.substring(0, 500) : 'Zoning code information retrieved',
                source: 'Milwaukee Zoning Code (Chapter 295)',
                status: 'complete',
              },
            }])

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

            // Emit zone-info card directly to chat
            emitChatMessage('assistant', '', [{
              type: 'zone-info',
              data: {
                zoningDistrict: code.toUpperCase(),
                zoningDescription: result.response ? result.response.substring(0, 200) : 'Zoning information retrieved',
                zoningCategory: getZoningCategory(code),
                status: 'complete',
              },
            }])

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
            // Turn on the homes layer so results appear on map
            setLayerVisibility('homes', true)

            // Query homes from database
            const homes = await convex.query(api.homes.searchHomes, {
              neighborhood,
              limit: 10,
            })

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

              // Emit card directly to chat (don't wait for transcription)
              emitChatMessage('assistant', '', [{
                type: 'homes-list',
                data: { homes: homeItems, status: 'complete' },
              }])

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

              // Emit card directly to chat
              emitChatMessage('assistant', '', [{
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
              }])

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
        // Commercial Properties
        // ---------------------------------------------------------------------
        case 'search_commercial_properties': {
          const propertyType = args.propertyType as string | undefined
          const minSqFt = args.minSqFt as number | undefined
          const maxSqFt = args.maxSqFt as number | undefined
          const maxPrice = args.maxPrice as number | undefined
          const zoning = args.zoning as string | undefined

          try {
            // Turn on the commercial properties layer so results appear on map
            setLayerVisibility('commercialProperties', true)

            const properties = await convex.query(api.commercialProperties.searchProperties, {
              propertyType: propertyType as 'retail' | 'office' | 'industrial' | 'warehouse' | 'mixed-use' | 'land' | 'all' | undefined,
              minSqFt,
              maxSqFt,
              maxPrice,
              zoning,
              limit: 10,
            })

            if (properties && properties.length > 0) {
              // Transform to card format
              const propertyItems = properties.map((p) => ({
                id: p._id,
                address: p.address,
                propertyType: p.propertyType,
                coordinates: p.coordinates as [number, number],
                buildingSqFt: p.buildingSqFt,
                askingPrice: p.askingPrice,
                zoning: p.zoning,
              }))

              // Emit card directly to chat
              emitChatMessage('assistant', '', [{
                type: 'commercial-properties-list',
                data: { properties: propertyItems, status: 'complete' },
              }])

              // Fly to first property
              if (propertyItems[0]?.coordinates) {
                flyTo(propertyItems[0].coordinates, 14)
              }

              return {
                success: true,
                count: properties.length,
                properties: propertyItems.slice(0, 5).map(p => ({
                  address: p.address,
                  propertyType: p.propertyType,
                  sqFt: p.buildingSqFt,
                  price: p.askingPrice,
                })),
                message: `Found ${properties.length} commercial properties.`,
              }
            }

            return {
              success: true,
              count: 0,
              message: 'No commercial properties found matching those criteria.',
            }
          } catch (error) {
            console.error('[useVoiceSession] Failed to search commercial properties:', error)
            return { success: false, error: 'Failed to search commercial properties' }
          }
        }

        case 'get_commercial_property_details': {
          const propertyId = args.propertyId as string

          try {
            // Get the property by ID
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const property = await convex.query(api.commercialProperties.getById, {
              id: propertyId as any,
            })

            if (property) {
              // Fly to the property
              if (property.coordinates) {
                flyTo(property.coordinates as [number, number], 18)
              }

              // Emit card directly to chat
              emitChatMessage('assistant', '', [{
                type: 'commercial-property',
                data: {
                  id: property._id,
                  address: property.address,
                  propertyType: property.propertyType,
                  coordinates: property.coordinates,
                  buildingSqFt: property.buildingSqFt,
                  lotSizeSqFt: property.lotSizeSqFt,
                  askingPrice: property.askingPrice,
                  zoning: property.zoning,
                  description: property.description,
                  listingUrl: property.listingUrl,
                  status: 'complete',
                },
              }])

              return {
                success: true,
                address: property.address,
                propertyType: property.propertyType,
                sqFt: property.buildingSqFt,
                lotSize: property.lotSizeSqFt,
                price: property.askingPrice,
                zoning: property.zoning,
              }
            }

            return { success: false, error: 'Commercial property not found' }
          } catch (error) {
            console.error('[useVoiceSession] Failed to get commercial property details:', error)
            return { success: false, error: 'Failed to get commercial property details' }
          }
        }

        // ---------------------------------------------------------------------
        // Development Sites
        // ---------------------------------------------------------------------
        case 'search_development_sites': {
          console.log('[useVoiceSession] search_development_sites called with args:', args)
          const minLotSize = args.minLotSize as number | undefined
          const maxPrice = args.maxPrice as number | undefined
          const hasIncentives = args.hasIncentives as boolean | undefined
          const zoning = args.zoning as string | undefined

          try {
            // Turn on the development sites layer so results appear on map
            setLayerVisibility('developmentSites', true)
            console.log('[useVoiceSession] Querying development sites...')

            const sites = await convex.query(api.developmentSites.searchSites, {
              minLotSize,
              maxPrice,
              zoning,
              // Note: hasIncentives filter would need to be applied in-memory if needed
              limit: 10,
            })
            console.log('[useVoiceSession] Development sites query returned:', sites?.length, 'sites')

            // Filter by incentives if requested
            let filteredSites = sites
            if (hasIncentives && sites) {
              filteredSites = sites.filter((s) => s.incentives && s.incentives.length > 0)
            }
            console.log('[useVoiceSession] After filtering:', filteredSites?.length, 'sites')

            if (filteredSites && filteredSites.length > 0) {
              // Transform to card format
              const siteItems = filteredSites.map((s) => ({
                id: s._id,
                address: s.address,
                siteName: s.siteName,
                coordinates: s.coordinates as [number, number],
                lotSizeSqFt: s.lotSizeSqFt,
                askingPrice: s.askingPrice,
                zoning: s.zoning,
                incentives: s.incentives,
              }))

              // Emit card directly to chat
              console.log('[useVoiceSession] Emitting development-sites-list card with', siteItems.length, 'sites')
              emitChatMessage('assistant', '', [{
                type: 'development-sites-list',
                data: { sites: siteItems, status: 'complete' },
              }])
              console.log('[useVoiceSession] Card emitted!')

              // Fly to first site
              if (siteItems[0]?.coordinates) {
                flyTo(siteItems[0].coordinates, 14)
              }

              return {
                success: true,
                count: filteredSites.length,
                sites: siteItems.slice(0, 5).map(s => ({
                  address: s.address,
                  siteName: s.siteName,
                  lotSize: s.lotSizeSqFt,
                  price: s.askingPrice,
                  incentives: s.incentives?.slice(0, 3),
                })),
                message: `Found ${filteredSites.length} development sites.`,
              }
            }

            return {
              success: true,
              count: 0,
              message: 'No development sites found matching those criteria.',
            }
          } catch (error) {
            console.error('[useVoiceSession] Failed to search development sites:', error)
            return { success: false, error: 'Failed to search development sites' }
          }
        }

        case 'get_development_site_details': {
          const siteId = args.siteId as string

          try {
            // Get the site by ID
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const site = await convex.query(api.developmentSites.getById, {
              id: siteId as any,
            })

            if (site) {
              // Fly to the site
              if (site.coordinates) {
                flyTo(site.coordinates as [number, number], 18)
              }

              // Emit card directly to chat
              emitChatMessage('assistant', '', [{
                type: 'development-site',
                data: {
                  id: site._id,
                  address: site.address,
                  siteName: site.siteName,
                  coordinates: site.coordinates,
                  lotSizeSqFt: site.lotSizeSqFt,
                  askingPrice: site.askingPrice,
                  zoning: site.zoning,
                  incentives: site.incentives,
                  proposedUse: site.proposedUse,
                  description: site.description,
                  listingUrl: site.listingUrl,
                  status: 'complete',
                },
              }])

              return {
                success: true,
                address: site.address,
                siteName: site.siteName,
                lotSize: site.lotSizeSqFt,
                price: site.askingPrice,
                zoning: site.zoning,
                incentives: site.incentives,
              }
            }

            return { success: false, error: 'Development site not found' }
          } catch (error) {
            console.error('[useVoiceSession] Failed to get development site details:', error)
            return { success: false, error: 'Failed to get development site details' }
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
      emitChatMessage,
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
