'use client'

import { useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from 'react'
import { SignedIn, SignedOut, useAuth } from '@clerk/nextjs'
import { AppShell } from '@/components/shell'
import type { ParcelData } from '@/components/map'
import { ChatPanel, ConversationSidebar, type ChatMessage, type GenerativeCard } from '@/components/chat'
import { useZoningAgent } from '@/hooks/useZoningAgent'
import { useConversations } from '@/hooks/useConversations'
import { useReportGenerator } from '@/hooks/useReportGenerator'
import { useMap } from '@/contexts/MapContext'
import {
  ZoneInfoCard,
  ParcelCard,
  HomeCard,
  HomesListCard,
  CommercialPropertyCard,
  CommercialPropertiesListCard,
  DevelopmentSiteCard,
  DevelopmentSitesListCard,
  type HomeListItem,
  type CommercialPropertyListItem,
  type DevelopmentSiteListItem,
} from '@/components/copilot'
import { LandingPage } from '@/components/landing'
import dynamic from 'next/dynamic'

// Dynamic import for MapContainer (client-side only - mapbox-gl needs DOM APIs)
const MapContainer = dynamic(
  () => import('@/components/map').then(mod => mod.MapContainer),
  { ssr: false }
)

// Dynamic import for PDF viewer (client-side only - PDF.js needs DOM APIs)
const PDFViewerModal = dynamic(
  () => import('@/components/ui/PDFViewerModal').then(mod => mod.PDFViewerModal),
  { ssr: false }
)

// Dynamic import for Street View modal (client-side only - Google Maps API needs DOM)
const StreetViewModal = dynamic(
  () => import('@/components/ui/StreetViewModal').then(mod => mod.StreetViewModal),
  { ssr: false }
)
import { matchDocumentUrl } from '@/lib/documentUrls'
import { useVisualizerStore } from '@/stores'

// Dynamic import for Site Visualizer (client-side only - Konva.js needs DOM)
const SiteVisualizer = dynamic(
  () => import('@/components/visualizer').then(mod => mod.SiteVisualizer),
  { ssr: false }
)

// PDF viewer modal state type
interface PDFModalState {
  isOpen: boolean
  pdfUrl: string
  title: string
  initialPage: number
}

// Street View modal state type
interface StreetViewModalState {
  isOpen: boolean
  address: string
  coordinates: { latitude: number; longitude: number } | [number, number] | null
}

/**
 * Main application page with chat-first layout.
 * Features the AppShell with 40/60 split view (chat/map).
 * Integrates parcel selection with chat context.
 * Now powered by the Zoning Interpreter Agent with Gemini 3!
 */
export default function HomeContent() {
  const { isLoaded: isAuthLoaded } = useAuth()
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  // Layer panel state - controlled by header button
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(false)
  const [_selectedParcel, setSelectedParcel] = useState<ParcelData | null>(null)
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  // Track last processed message to avoid duplicate map movements
  const lastProcessedMessageRef = useRef<string | null>(null)
  // Track which agent message IDs have been persisted to avoid duplicates
  const persistedMessageIdsRef = useRef<Set<string>>(new Set())
  // Track which conversation the persisted messages belong to
  const persistedForConversationRef = useRef<string | null>(null)
  // Track if persistence is currently in progress to prevent concurrent calls
  const isPersistingRef = useRef(false)

  // Map context for flying to locations
  const { flyTo } = useMap()

  // PDF viewer modal state
  const [pdfModal, setPdfModal] = useState<PDFModalState>({
    isOpen: false,
    pdfUrl: '',
    title: '',
    initialPage: 1,
  })

  // Open PDF in modal viewer
  const openPdfViewer = useCallback((url: string, title: string, page: number = 1) => {
    setPdfModal({ isOpen: true, pdfUrl: url, title, initialPage: page })
  }, [])

  // Close PDF modal
  const closePdfViewer = useCallback(() => {
    setPdfModal(prev => ({ ...prev, isOpen: false }))
  }, [])

  // Street View modal state
  const [streetViewModal, setStreetViewModal] = useState<StreetViewModalState>({
    isOpen: false,
    address: '',
    coordinates: null,
  })

  // Open Street View modal - handles both coordinate formats
  const openStreetView = useCallback((
    coordinates: { latitude: number; longitude: number } | [number, number],
    address: string
  ) => {
    setStreetViewModal({ isOpen: true, address, coordinates })
  }, [])

  // Close Street View modal
  const closeStreetView = useCallback(() => {
    setStreetViewModal(prev => ({ ...prev, isOpen: false }))
  }, [])

  // Use the Zoning Agent for chat
  const { messages: agentMessages, isLoading, agentStatus, isStreaming, sendMessage, clearMessages } = useZoningAgent()

  // Conversation persistence
  const {
    conversations,
    currentConversation,
    currentConversationId,
    isLoadingList,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    selectConversation,
    addMessage: persistMessage,
    toggleStarred,
    deleteConversation,
    startNewConversation,
  } = useConversations()

  // Report generation
  const { isGenerating: isGeneratingReport, pdfUrl: reportPdfUrl, generateReport, clearPdfUrl: clearReportPdfUrl } = useReportGenerator()

  // Convert agent messages to ChatMessage format, combining with persisted conversation
  const messages: ChatMessage[] = useMemo(() => {
    // Start with persisted conversation messages if viewing one
    const persistedMessages: ChatMessage[] = currentConversation?.messages?.map((msg) => ({
      id: msg._id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      inputMode: (msg.inputMode || 'text') as 'text' | 'voice',
      cards: msg.cards as GenerativeCard[] | undefined,
    })) || []

    // Get content signatures of persisted messages to avoid duplicates
    // Include card types in the signature to differentiate messages with same text but different cards
    const persistedContent = new Set(
      persistedMessages.map((m) => {
        const cardSignature = m.cards?.map(c => c.type).sort().join(',') || ''
        return `${m.role}:${m.content.substring(0, 100)}:${cardSignature}`
      })
    )

    // Add current agent session messages (only those not yet persisted)
    const sessionMessages: ChatMessage[] = agentMessages
      .filter((msg) => {
        const cardSignature = msg.cards?.map(c => c.type).sort().join(',') || ''
        const signature = `${msg.role}:${msg.content.substring(0, 100)}:${cardSignature}`
        return !persistedContent.has(signature)
      })
      .map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        inputMode: 'text' as const,
        cards: msg.cards,
      }))

    // Combine: persisted history + new session messages (deduplicated)
    return [...persistedMessages, ...sessionMessages]
  }, [agentMessages, currentConversation])

  // Clear persisted tracking when conversation changes
  useEffect(() => {
    const convId = currentConversationId ?? 'new'
    if (persistedForConversationRef.current !== convId) {
      persistedMessageIdsRef.current.clear()
      persistedForConversationRef.current = convId
    }
  }, [currentConversationId])

  // Use ref to hold persistMessage to avoid it being a dependency
  const persistMessageRef = useRef(persistMessage)
  persistMessageRef.current = persistMessage

  // Persist messages when agent responds AND streaming is complete
  useEffect(() => {
    // Don't persist while still streaming - content is incomplete
    if (isStreaming) {
      return
    }

    // Prevent concurrent persistence calls
    if (isPersistingRef.current) {
      return
    }

    const lastAgentMsg = agentMessages[agentMessages.length - 1]
    const secondLastMsg = agentMessages[agentMessages.length - 2]

    // When we have a new assistant message with content, persist both messages
    if (lastAgentMsg?.role === 'assistant' && secondLastMsg?.role === 'user') {
      // Skip if we already persisted this message pair
      if (persistedMessageIdsRef.current.has(lastAgentMsg.id)) {
        return
      }

      // Skip if assistant message has no content (shouldn't happen after streaming)
      if (!lastAgentMsg.content || lastAgentMsg.content.trim() === '') {
        return
      }

      // Mark as persisted BEFORE the async calls to prevent race conditions
      persistedMessageIdsRef.current.add(secondLastMsg.id)
      persistedMessageIdsRef.current.add(lastAgentMsg.id)

      // Set persisting flag
      isPersistingRef.current = true

      // Persist both messages sequentially to avoid race conditions
      const doPersist = async () => {
        try {
          // Persist user message first
          await persistMessageRef.current('user', secondLastMsg.content, { inputMode: 'text' })
          // Then persist assistant message with cards
          await persistMessageRef.current('assistant', lastAgentMsg.content, {
            inputMode: 'text',
            cards: lastAgentMsg.cards,
          })
        } catch (error) {
          console.error('[HomeContent] Error persisting messages:', error)
          // Remove from persisted set on error so it can be retried
          persistedMessageIdsRef.current.delete(secondLastMsg.id)
          persistedMessageIdsRef.current.delete(lastAgentMsg.id)
        } finally {
          isPersistingRef.current = false
        }
      }

      doPersist()
    }
  }, [agentMessages.length, isStreaming]) // Removed persistMessage from deps - using ref instead

  // Watch for parcel-info cards in agent messages and fly to location
  useEffect(() => {
    const lastMsg = agentMessages[agentMessages.length - 1]
    if (!lastMsg || lastMsg.role !== 'assistant') return
    if (lastProcessedMessageRef.current === lastMsg.id) return

    // Look for parcel-info card with coordinates
    const parcelCard = lastMsg.cards?.find((card) => card.type === 'parcel-info')
    if (parcelCard) {
      const data = parcelCard.data as { coordinates?: { latitude: number; longitude: number } }
      // Validate coordinates are valid numbers before flying
      if (
        data.coordinates &&
        typeof data.coordinates.longitude === 'number' &&
        typeof data.coordinates.latitude === 'number' &&
        !isNaN(data.coordinates.longitude) &&
        !isNaN(data.coordinates.latitude) &&
        data.coordinates.longitude !== 0 &&
        data.coordinates.latitude !== 0
      ) {
        lastProcessedMessageRef.current = lastMsg.id
        // Fly to the location with a nice zoom level
        flyTo([data.coordinates.longitude, data.coordinates.latitude], 17, {
          pitch: 45,
          duration: 2000,
        })
      }
    }

    // Look for homes-list card and fly to first home (or highlight all)
    const homesListCard = lastMsg.cards?.find((card) => card.type === 'homes-list')
    if (homesListCard) {
      const data = homesListCard.data as { homes?: Array<{ coordinates?: [number, number] }> }
      if (data.homes && data.homes.length > 0) {
        const firstHome = data.homes[0]
        if (firstHome.coordinates && Array.isArray(firstHome.coordinates)) {
          lastProcessedMessageRef.current = lastMsg.id
          // Fly to first home location
          flyTo(firstHome.coordinates, 14, {
            duration: 2000,
          })
        }
      }
    }

    // Look for home-listing card and fly to that specific home
    const homeListingCard = lastMsg.cards?.find((card) => card.type === 'home-listing')
    if (homeListingCard) {
      const data = homeListingCard.data as { coordinates?: [number, number] }
      if (data.coordinates && Array.isArray(data.coordinates)) {
        lastProcessedMessageRef.current = lastMsg.id
        // Fly to the specific home
        flyTo(data.coordinates, 17, {
          pitch: 45,
          duration: 2000,
        })
      }
    }
  }, [agentMessages, flyTo])

  /**
   * Handle address selected from autocomplete dropdown.
   * Coordinates are already available, so we can fly immediately.
   */
  const handleAddressSelect = useCallback(
    (coordinates: [number, number], address: string) => {
      console.log('[handleAddressSelect] Called with:', coordinates, address)

      // Validate coordinates before flying
      if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
        console.error('[handleAddressSelect] Invalid coordinates:', coordinates)
        sendMessage(`Tell me about the property at ${address}`)
        return
      }

      const [lng, lat] = coordinates
      if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
        console.error('[handleAddressSelect] Invalid coordinate values:', lng, lat)
        sendMessage(`Tell me about the property at ${address}`)
        return
      }

      // Fly to the location - use simple flyTo without pitch to avoid Mapbox projection errors
      console.log('[handleAddressSelect] Flying to:', lng, lat)
      flyTo([lng, lat], 17)

      // Send to chat for zoning info
      sendMessage(`Tell me about the property at ${address}`)
    },
    [flyTo, sendMessage]
  )

  const handleVoiceToggle = useCallback(() => {
    setIsVoiceActive((prev) => !prev)
  }, [])

  const handleLayersClick = useCallback(() => {
    setIsLayersPanelOpen((prev) => !prev)
  }, [])

  // Visualizer store
  const { openVisualizer } = useVisualizerStore()

  const handleVisualizeClick = useCallback(() => {
    openVisualizer()
  }, [openVisualizer])

  const handleSidebarToggle = useCallback(() => {
    setIsSidebarOpen((prev) => !prev)
  }, [])

  const handleLogoClick = useCallback(() => {
    // Reset to home state - start new conversation
    clearMessages()
    startNewConversation()
    setSelectedParcel(null)
  }, [clearMessages, startNewConversation])

  const handleNewConversation = useCallback(() => {
    clearMessages()
    startNewConversation()
    setIsSidebarOpen(false) // Close sidebar on mobile after selecting
  }, [clearMessages, startNewConversation])

  const handleSelectConversation = useCallback((id: typeof currentConversationId) => {
    selectConversation(id)
    clearMessages() // Clear agent messages when loading persisted conversation
    setIsSidebarOpen(false) // Close sidebar on mobile
  }, [selectConversation, clearMessages])

  const handleToggleStarred = useCallback(async (id: typeof currentConversationId) => {
    if (id) {
      // Temporarily select to toggle, then restore
      const previousId = currentConversationId
      selectConversation(id)
      await toggleStarred()
      if (previousId !== id) {
        selectConversation(previousId)
      }
    }
  }, [currentConversationId, selectConversation, toggleStarred])

  const handleDeleteConversation = useCallback(async (id: typeof currentConversationId) => {
    if (id) {
      // Pass ID directly to avoid state race condition
      await deleteConversation(id)
      // Only clear messages if we deleted the currently viewed conversation
      if (id === currentConversationId) {
        clearMessages()
      }
    }
  }, [deleteConversation, clearMessages, currentConversationId])

  /**
   * Extract potential address from a message using multiple patterns.
   * Handles various Milwaukee address formats and natural language.
   */
  const extractAddress = useCallback((message: string): string | null => {
    // Normalize the message
    const normalized = message
      .replace(/[?.!,]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim()

    // Pattern 1: Full address with direction (N/S/E/W or North/South/East/West)
    // Matches: "1108 W Chamber St", "500 North Water Street", "123 S. Main Ave"
    const fullPattern = /\b(\d+)\s+(N\.?|S\.?|E\.?|W\.?|North|South|East|West)\s+(\w+(?:\s+\w+)?)\s*(St\.?|Street|Ave\.?|Avenue|Blvd\.?|Boulevard|Dr\.?|Drive|Rd\.?|Road|Ln\.?|Lane|Ct\.?|Court|Way|Pl\.?|Place|Pkwy\.?|Parkway|Ter\.?|Terrace|Cir\.?|Circle)?\b/i

    // Pattern 2: Address without explicit suffix
    // Matches: "1108 W Chamber", "500 N Water"
    const noSuffixPattern = /\b(\d+)\s+(N\.?|S\.?|E\.?|W\.?|North|South|East|West)\s+(\w+(?:\s+\w+)?)\b/i

    // Pattern 3: Simple number + street (no direction)
    // Matches: "123 Main St", "456 Wisconsin Avenue"
    const simplePattern = /\b(\d+)\s+(\w+(?:\s+\w+)?)\s+(St\.?|Street|Ave\.?|Avenue|Blvd\.?|Boulevard|Dr\.?|Drive|Rd\.?|Road|Ln\.?|Lane|Ct\.?|Court|Way|Pl\.?|Place|Pkwy\.?|Parkway|Ter\.?|Terrace|Cir\.?|Circle)\b/i

    // Try patterns in order of specificity
    let match = normalized.match(fullPattern)
    if (match) {
      return match[0]
    }

    match = normalized.match(noSuffixPattern)
    if (match) {
      return match[0]
    }

    match = normalized.match(simplePattern)
    if (match) {
      return match[0]
    }

    return null
  }, [])

  /**
   * Geocode an address using Mapbox and fly to it.
   * Uses multiple strategies for best results.
   */
  const geocodeAndFlyToAddress = useCallback(
    async (message: string) => {
      const address = extractAddress(message)
      if (!address) return

      // Add Milwaukee context
      const searchQuery = address.toLowerCase().includes('milwaukee')
        ? address
        : `${address}, Milwaukee, WI`

      try {
        // First try: strict address geocoding
        let response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?` +
            new URLSearchParams({
              access_token: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
              limit: '1',
              types: 'address',
              bbox: '-88.1,42.8,-87.8,43.2', // Milwaukee bounding box
            })
        )

        let data = await response.json()

        // If no results, try more lenient search (include POI, locality)
        if (!data.features || data.features.length === 0) {
          response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?` +
              new URLSearchParams({
                access_token: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
                limit: '1',
                bbox: '-88.1,42.8,-87.8,43.2',
              })
          )
          data = await response.json()
        }

        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center
          // Fly immediately with smooth animation
          flyTo([lng, lat], 17, { pitch: 45, duration: 1500 })
          console.log('Geocoded and flying to:', data.features[0].place_name)
        }
      } catch (error) {
        console.error('Quick geocode failed:', error)
      }
    },
    [flyTo, extractAddress]
  )

  const handleSendMessage = useCallback((content: string) => {
    // Immediately try to geocode any address in the message
    geocodeAndFlyToAddress(content)
    // Send to agent for full processing
    sendMessage(content)
  }, [sendMessage, geocodeAndFlyToAddress])

  const handleVoiceInput = useCallback(() => {
    // Voice input placeholder - will be implemented in Week 2
    console.log('Voice input triggered - coming in Week 2')
    // Send a message about voice
    sendMessage('Tell me about voice input capabilities')
  }, [sendMessage])

  /**
   * Handle download report button click.
   * Generates a PDF report from the current conversation.
   */
  const handleDownloadReport = useCallback(() => {
    if (currentConversationId) {
      generateReport(currentConversationId)
    }
  }, [currentConversationId, generateReport])

  // Handle parcel selection from map
  const handleParcelSelect = useCallback((parcel: ParcelData) => {
    setSelectedParcel(parcel)
  }, [])

  // Handle parcel selection cleared
  const handleParcelClear = useCallback(() => {
    setSelectedParcel(null)
  }, [])

  // Handle "Ask about this parcel" from map popup
  // This sends the parcel context to chat and triggers an automatic query
  const handleParcelAsk = useCallback((parcel: ParcelData) => {
    const address = parcel.address || 'Unknown Address'
    // Use the agent to analyze the property
    sendMessage(`Tell me about the property at ${address}. What is the zoning and what can be built there?`)
  }, [sendMessage])

  /**
   * Handle home selection from HomesListCard.
   * Flies to the home on the map and asks the agent for full details.
   */
  const handleHomeSelect = useCallback((home: HomeListItem) => {
    console.log('[handleHomeSelect] Home selected:', home.address, home.coordinates)

    // Fly to the selected home
    if (home.coordinates && Array.isArray(home.coordinates)) {
      console.log('[handleHomeSelect] Flying to:', home.coordinates)
      flyTo(home.coordinates, 17, {
        pitch: 45,
        duration: 2000,
      })
    }

    // Ask agent for detailed home info (triggers get_home_details tool → HomeCard with images)
    sendMessage(`Tell me more about the home at ${home.address}`)
  }, [flyTo, sendMessage])

  /**
   * Handle fly to location from HomeCard.
   */
  const handleHomeFlyTo = useCallback((coordinates: [number, number]) => {
    flyTo(coordinates, 17, {
      pitch: 45,
      duration: 2000,
    })
  }, [flyTo])

  /**
   * Handle commercial property selection from list.
   * Flies to the property and asks agent for details.
   */
  const handleCommercialPropertySelect = useCallback((property: CommercialPropertyListItem) => {
    console.log('[handleCommercialPropertySelect] Property selected:', property.address, property.coordinates)

    // Fly to the selected property
    if (property.coordinates && Array.isArray(property.coordinates)) {
      console.log('[handleCommercialPropertySelect] Flying to:', property.coordinates)
      flyTo(property.coordinates, 17, {
        pitch: 45,
        duration: 2000,
      })
    }

    // Ask agent for detailed property info
    sendMessage(`Tell me more about the commercial property at ${property.address}`)
  }, [flyTo, sendMessage])

  /**
   * Handle fly to location from CommercialPropertyCard.
   */
  const handleCommercialFlyTo = useCallback((coordinates: [number, number]) => {
    flyTo(coordinates, 17, {
      pitch: 45,
      duration: 2000,
    })
  }, [flyTo])

  /**
   * Handle development site selection from list.
   * Flies to the site and asks agent for details.
   */
  const handleDevelopmentSiteSelect = useCallback((site: DevelopmentSiteListItem) => {
    console.log('[handleDevelopmentSiteSelect] Site selected:', site.address, site.coordinates)

    // Fly to the selected site
    if (site.coordinates && Array.isArray(site.coordinates)) {
      console.log('[handleDevelopmentSiteSelect] Flying to:', site.coordinates)
      flyTo(site.coordinates, 17, {
        pitch: 45,
        duration: 2000,
      })
    }

    // Ask agent for detailed site info
    sendMessage(`Tell me more about the development site at ${site.address}`)
  }, [flyTo, sendMessage])

  /**
   * Handle fly to location from DevelopmentSiteCard.
   */
  const handleDevelopmentSiteFlyTo = useCallback((coordinates: [number, number]) => {
    flyTo(coordinates, 17, {
      pitch: 45,
      duration: 2000,
    })
  }, [flyTo])

  /**
   * Render generative UI cards based on tool results.
   */
  const renderCard = useCallback((card: GenerativeCard): ReactNode => {
    switch (card.type) {
      case 'zone-info': {
        const data = card.data as {
          zoningDistrict?: string;
          zoningDescription?: string;
          zoningCategory?: string;
          overlayZones?: string[];
        };
        return (
          <ZoneInfoCard
            zoningDistrict={data.zoningDistrict || 'Unknown'}
            zoningDescription={data.zoningDescription}
            zoningCategory={data.zoningCategory}
            overlayZones={data.overlayZones}
            status="complete"
          />
        );
      }

      case 'parcel-analysis': {
        const data = card.data as {
          requiredSpaces?: number;
          calculation?: string;
          codeReference?: string;
          isReducedDistrict?: boolean;
        };
        return (
          <div className="p-4 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
                Required Parking
              </span>
              <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                {data.requiredSpaces} spaces
              </span>
            </div>
            {data.calculation && (
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">
                {data.calculation}
              </p>
            )}
            {data.codeReference && (
              <p className="text-xs text-stone-400 dark:text-stone-500">
                {data.codeReference}
              </p>
            )}
            {data.isReducedDistrict && (
              <div className="mt-2 px-2 py-1 bg-amber-100 dark:bg-amber-900 rounded text-xs text-amber-800 dark:text-amber-200">
                Reduced parking district - lower requirements apply
              </div>
            )}
          </div>
        );
      }

      case 'area-plan-context':
      case 'code-citation': {
        const data = card.data as {
          answer?: string;
          confidence?: number;
          citations?: Array<{ sourceId?: string; sourceName?: string; excerpt?: string; sectionReference?: string; pageNumber?: number }>;
        };
        const isAreaPlan = card.type === 'area-plan-context';

        // Match citations to downloadable PDFs
        // Try sourceId first (more precise), then sourceName
        const citationsWithUrls = data.citations?.map(c => {
          // Try sourceId first - it's the structured key like "zoning-residential"
          let docInfo = c.sourceId ? matchDocumentUrl(c.sourceId) : null;
          // Fall back to sourceName if sourceId didn't match
          if (!docInfo && c.sourceName) {
            docInfo = matchDocumentUrl(c.sourceName);
          }
          return { ...c, docInfo };
        }) || [];

        // Filter out citations without matching documents to avoid showing "undefined"
        const validCitations = citationsWithUrls.filter(c => c.docInfo || c.sourceName);

        return (
          <div className={`p-4 border-2 ${isAreaPlan ? 'border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/20' : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'} rounded-lg`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-medium uppercase tracking-wide ${isAreaPlan ? 'text-sky-600 dark:text-sky-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {isAreaPlan ? 'Area Plan Reference' : 'Zoning Code Reference'}
              </span>
              {data.confidence && (
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  ({Math.round(data.confidence * 100)}% confidence)
                </span>
              )}
            </div>

            {/* Viewable source documents */}
            {validCitations.length > 0 && (
              <div className="mt-3 space-y-2">
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Source Documents ({validCitations.filter(c => c.docInfo).length} viewable):
                </span>
                <div className="flex flex-wrap gap-2">
                  {validCitations.map((c, i) => (
                    c.docInfo ? (
                      <button
                        key={`${c.sourceId || c.sourceName}-${i}`}
                        onClick={() => openPdfViewer(c.docInfo!.url, c.docInfo!.title, c.pageNumber || 1)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border-2 transition-colors cursor-pointer ${
                          isAreaPlan
                            ? 'border-sky-400 dark:border-sky-600 bg-white dark:bg-sky-900 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-800'
                            : 'border-amber-400 dark:border-amber-600 bg-white dark:bg-amber-900 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {c.docInfo.title}
                        {c.sectionReference && (
                          <span className="text-stone-500 dark:text-stone-400 font-normal">
                            ({c.sectionReference})
                          </span>
                        )}
                        {c.pageNumber && (
                          <span className="text-stone-500 dark:text-stone-400 font-normal">
                            p.{c.pageNumber}
                          </span>
                        )}
                      </button>
                    ) : (
                      <span key={`unmatched-${i}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-700 rounded">
                        {c.sourceName}
                      </span>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'parcel-info': {
        const data = card.data as {
          address?: string;
          neighborhood?: string;
          coordinates?: { latitude: number; longitude: number };
          zoningDistrict?: string;
          zoningCategory?: string;
          zoningType?: string;
          zoningDescription?: string;
          overlayZones?: string[];
          areaPlanName?: string;
          areaPlanContext?: string;
          developmentGoals?: string[];
          maxHeight?: string;
          minSetbacks?: string;
          parkingRequired?: string;
          permittedUses?: string[];
        };
        return (
          <ParcelCard
            address={data.address || 'Unknown Address'}
            neighborhood={data.neighborhood}
            coordinates={data.coordinates}
            zoningDistrict={data.zoningDistrict}
            zoningCategory={data.zoningCategory}
            zoningType={data.zoningType}
            zoningDescription={data.zoningDescription}
            overlayZones={data.overlayZones}
            areaPlanName={data.areaPlanName}
            areaPlanContext={data.areaPlanContext}
            developmentGoals={data.developmentGoals}
            maxHeight={data.maxHeight}
            minSetbacks={data.minSetbacks}
            parkingRequired={data.parkingRequired}
            permittedUses={data.permittedUses}
            status="complete"
            onOpenStreetView={openStreetView}
          />
        );
      }

      // ========================================================================
      // Home Cards - Homes MKE Integration (Chat-to-Map Bridge)
      // ========================================================================

      case 'home-listing': {
        const data = card.data as {
          address: string;
          neighborhood?: string;
          districtName?: string;
          coordinates?: [number, number];
          bedrooms?: number;
          fullBaths?: number;
          halfBaths?: number;
          buildingSqFt?: number;
          lotSizeSqFt?: number;
          yearBuilt?: number;
          numberOfUnits?: number;
          hasOutbuildings?: boolean;
          narrative?: string;
          listingUrl?: string;
          developerName?: string;
          primaryImageUrl?: string;
          imageUrls?: string[];
        };
        return (
          <HomeCard
            address={data.address}
            neighborhood={data.neighborhood}
            districtName={data.districtName}
            coordinates={data.coordinates}
            bedrooms={data.bedrooms}
            fullBaths={data.fullBaths}
            halfBaths={data.halfBaths}
            buildingSqFt={data.buildingSqFt}
            lotSizeSqFt={data.lotSizeSqFt}
            yearBuilt={data.yearBuilt}
            numberOfUnits={data.numberOfUnits}
            hasOutbuildings={data.hasOutbuildings}
            narrative={data.narrative}
            listingUrl={data.listingUrl}
            developerName={data.developerName}
            primaryImageUrl={data.primaryImageUrl}
            imageUrls={data.imageUrls}
            status="complete"
            onFlyTo={handleHomeFlyTo}
            onOpenStreetView={openStreetView}
          />
        );
      }

      case 'homes-list': {
        const data = card.data as {
          homes: Array<{
            id: string;
            address: string;
            neighborhood: string;
            coordinates: [number, number];
            bedrooms: number;
            fullBaths: number;
            halfBaths: number;
          }>;
        };
        return (
          <HomesListCard
            homes={data.homes}
            onHomeSelect={handleHomeSelect}
            status="complete"
          />
        );
      }

      // ========================================================================
      // Commercial Properties Cards
      // ========================================================================

      case 'commercial-properties-list': {
        const data = card.data as {
          properties: Array<{
            id: string;
            address: string;
            propertyType?: string;
            buildingSqFt?: number;
            askingPrice?: number;
            coordinates: [number, number];
          }>;
        };
        return (
          <CommercialPropertiesListCard
            properties={data.properties}
            onPropertySelect={handleCommercialPropertySelect}
            status="complete"
          />
        );
      }

      case 'commercial-property': {
        const data = card.data as {
          address: string;
          propertyType?: string;
          buildingSqFt?: number;
          lotSizeSqFt?: number;
          askingPrice?: number;
          zoning?: string;
          description?: string;
          listingUrl?: string;
          propertyImageUrl?: string;
          coordinates?: [number, number];
        };
        return (
          <CommercialPropertyCard
            address={data.address}
            propertyType={data.propertyType}
            buildingSqFt={data.buildingSqFt}
            lotSizeSqFt={data.lotSizeSqFt}
            askingPrice={data.askingPrice}
            zoning={data.zoning}
            description={data.description}
            listingUrl={data.listingUrl}
            coordinates={data.coordinates}
            status="complete"
            onFlyTo={handleCommercialFlyTo}
            onOpenStreetView={openStreetView}
          />
        );
      }

      // ========================================================================
      // Development Sites Cards
      // ========================================================================

      case 'development-sites-list': {
        const data = card.data as {
          sites: Array<{
            id: string;
            address: string;
            siteName?: string;
            lotSizeSqFt?: number;
            askingPrice?: number;
            incentives?: string[];
            coordinates: [number, number];
          }>;
        };
        return (
          <DevelopmentSitesListCard
            sites={data.sites}
            onSiteSelect={handleDevelopmentSiteSelect}
            status="complete"
          />
        );
      }

      case 'development-site': {
        const data = card.data as {
          address: string;
          siteName?: string;
          lotSizeSqFt?: number;
          askingPrice?: number;
          zoning?: string;
          incentives?: string[];
          proposedUse?: string;
          description?: string;
          listingUrl?: string;
          propertyImageUrl?: string;
          coordinates?: [number, number];
        };
        return (
          <DevelopmentSiteCard
            address={data.address}
            siteName={data.siteName}
            lotSizeSqFt={data.lotSizeSqFt}
            askingPrice={data.askingPrice}
            zoning={data.zoning}
            incentives={data.incentives}
            proposedUse={data.proposedUse}
            description={data.description}
            listingUrl={data.listingUrl}
            coordinates={data.coordinates}
            status="complete"
            onFlyTo={handleDevelopmentSiteFlyTo}
            onOpenStreetView={openStreetView}
          />
        );
      }

      default:
        return null;
    }
  }, [openPdfViewer, openStreetView, handleHomeFlyTo, handleHomeSelect, handleCommercialPropertySelect, handleCommercialFlyTo, handleDevelopmentSiteSelect, handleDevelopmentSiteFlyTo])

  // Show loading skeleton while auth state is being determined
  // This prevents hydration mismatch between server and client
  if (!isAuthLoaded) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/mkedev-logo-nolabel.svg"
            alt="MKE.dev"
            className="h-16 w-auto dark:invert animate-pulse"
          />
          <div className="w-48 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
            <div className="h-full bg-sky-500 rounded-full animate-[loading_1s_ease-in-out_infinite]" style={{ width: '40%' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Landing page for unauthenticated users */}
      <SignedOut>
        <LandingPage />
      </SignedOut>

      {/* Main app for authenticated users */}
      <SignedIn>
        <AppShell
          isVoiceActive={isVoiceActive}
          onVoiceToggle={handleVoiceToggle}
          isLayersPanelOpen={isLayersPanelOpen}
          onLayersClick={handleLayersClick}
          onVisualizeClick={handleVisualizeClick}
          onLogoClick={handleLogoClick}
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={handleSidebarToggle}
          onAddressSelect={handleAddressSelect}
          sidebar={
            <ConversationSidebar
              conversations={conversations}
              currentConversationId={currentConversationId}
              searchQuery={searchQuery}
              searchResults={searchResults}
              isSearching={isSearching}
              isOpen={isSidebarOpen}
              isLoading={isLoadingList}
              onSearchChange={setSearchQuery}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              onToggleStarred={handleToggleStarred}
              onDelete={handleDeleteConversation}
              onClose={handleSidebarToggle}
            />
          }
          chatPanel={
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              onVoiceInput={handleVoiceInput}
              isLoading={isLoading}
              agentStatus={agentStatus}
              placeholder="Ask about zoning, permits, or any property in Milwaukee..."
              renderCard={renderCard}
              onDownloadReport={currentConversationId ? handleDownloadReport : undefined}
              isGeneratingReport={isGeneratingReport}
            />
          }
          mapPanel={
            <MapContainer
              onParcelSelect={handleParcelSelect}
              onParcelClear={handleParcelClear}
              onParcelAsk={handleParcelAsk}
              showLayerPanel={isLayersPanelOpen}
            />
          }
        />

        {/* PDF Viewer Modal - for document citations */}
        <PDFViewerModal
          isOpen={pdfModal.isOpen}
          onClose={closePdfViewer}
          pdfUrl={pdfModal.pdfUrl}
          title={pdfModal.title}
          initialPage={pdfModal.initialPage}
        />

        {/* PDF Viewer Modal - for generated reports */}
        {reportPdfUrl && (
          <PDFViewerModal
            isOpen={!!reportPdfUrl}
            onClose={clearReportPdfUrl}
            pdfUrl={reportPdfUrl}
            title="MKE.dev Conversation Report"
            initialPage={1}
          />
        )}

        {/* Street View Modal */}
        {streetViewModal.coordinates && (
          <StreetViewModal
            isOpen={streetViewModal.isOpen}
            onClose={closeStreetView}
            address={streetViewModal.address}
            coordinates={streetViewModal.coordinates}
          />
        )}

        {/* AI Site Visualizer - Gemini 3 Pro Image */}
        <SiteVisualizer />
      </SignedIn>
    </>
  )
}
