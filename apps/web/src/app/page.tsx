'use client'

import { useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'
import { SignedIn, SignedOut, useAuth } from '@clerk/nextjs'
import { AppShell } from '@/components/shell'
import { MapContainer, type ParcelData } from '@/components/map'
import { ChatPanel, ConversationSidebar, type ChatMessage, type GenerativeCard } from '@/components/chat'
import { useZoningAgent } from '@/hooks/useZoningAgent'
import { useConversations } from '@/hooks/useConversations'
import { ZoneInfoCard, ParcelCard } from '@/components/copilot'
import { LandingPage } from '@/components/landing'
import dynamic from 'next/dynamic'

// Dynamic import for PDF viewer (client-side only - PDF.js needs DOM APIs)
const PDFViewerModal = dynamic(
  () => import('@/components/ui/PDFViewerModal').then(mod => mod.PDFViewerModal),
  { ssr: false }
)
import { matchDocumentUrl } from '@/lib/documentUrls'

// PDF viewer modal state type
interface PDFModalState {
  isOpen: boolean
  pdfUrl: string
  title: string
  initialPage: number
}

/**
 * Main application page with chat-first layout.
 * Features the AppShell with 40/60 split view (chat/map).
 * Integrates parcel selection with chat context.
 * Now powered by the Zoning Interpreter Agent with Gemini 3!
 */
export default function Home() {
  const { isLoaded: isAuthLoaded } = useAuth()
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  // Layer panel state - controlled by header button
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(false)
  const [_selectedParcel, setSelectedParcel] = useState<ParcelData | null>(null)
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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

  // Use the Zoning Agent for chat
  const { messages: agentMessages, isLoading, agentStatus, sendMessage, clearMessages } = useZoningAgent()

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

  // Convert agent messages to ChatMessage format, or load from persisted conversation
  const messages: ChatMessage[] = useMemo(() => {
    // If viewing a persisted conversation, show its messages
    if (currentConversation && currentConversation.messages.length > 0) {
      return currentConversation.messages.map((msg) => ({
        id: msg._id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        inputMode: (msg.inputMode || 'text') as 'text' | 'voice',
        cards: msg.cards as GenerativeCard[] | undefined,
      }))
    }
    // Otherwise show current agent session messages
    return agentMessages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      inputMode: 'text' as const,
      cards: msg.cards,
    }))
  }, [agentMessages, currentConversation])

  // Persist messages when agent responds
  useEffect(() => {
    const lastAgentMsg = agentMessages[agentMessages.length - 1]
    const secondLastMsg = agentMessages[agentMessages.length - 2]

    // When we have a new assistant message, persist both user and assistant messages
    if (lastAgentMsg?.role === 'assistant' && secondLastMsg?.role === 'user') {
      // Persist user message
      persistMessage('user', secondLastMsg.content, { inputMode: 'text' })
      // Persist assistant message with cards
      persistMessage('assistant', lastAgentMsg.content, {
        inputMode: 'text',
        cards: lastAgentMsg.cards,
      })
    }
  }, [agentMessages.length]) // Only run when message count changes

  const handleVoiceToggle = useCallback(() => {
    setIsVoiceActive((prev) => !prev)
  }, [])

  const handleLayersClick = useCallback(() => {
    setIsLayersPanelOpen((prev) => !prev)
  }, [])

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
      selectConversation(id)
      await deleteConversation()
      clearMessages()
    }
  }, [selectConversation, deleteConversation, clearMessages])

  const handleSendMessage = useCallback((content: string) => {
    sendMessage(content)
  }, [sendMessage])

  const handleVoiceInput = useCallback(() => {
    // Voice input placeholder - will be implemented in Week 2
    console.log('Voice input triggered - coming in Week 2')
    // Send a message about voice
    sendMessage('Tell me about voice input capabilities')
  }, [sendMessage])

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
          citations?: Array<{ sourceId?: string; sourceName?: string; excerpt?: string }>;
        };
        const isAreaPlan = card.type === 'area-plan-context';

        // Match citations to downloadable PDFs
        const citationsWithUrls = data.citations?.map(c => {
          const docInfo = matchDocumentUrl(c.sourceName || c.sourceId || '');
          return { ...c, docInfo };
        }) || [];

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
            {citationsWithUrls.length > 0 && (
              <div className="mt-3 space-y-2">
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Source Documents:
                </span>
                <div className="flex flex-wrap gap-2">
                  {citationsWithUrls.map((c, i) => (
                    c.docInfo ? (
                      <button
                        key={i}
                        onClick={() => openPdfViewer(c.docInfo!.url, c.docInfo!.title, 1)}
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
                        View: {c.docInfo.title}
                      </button>
                    ) : (
                      <span key={i} className="text-xs text-stone-400 dark:text-stone-500">
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
          />
        );
      }

      default:
        return null;
    }
  }, [openPdfViewer])

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
          onLogoClick={handleLogoClick}
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={handleSidebarToggle}
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

        {/* PDF Viewer Modal */}
        <PDFViewerModal
          isOpen={pdfModal.isOpen}
          onClose={closePdfViewer}
          pdfUrl={pdfModal.pdfUrl}
          title={pdfModal.title}
          initialPage={pdfModal.initialPage}
        />
      </SignedIn>
    </>
  )
}
