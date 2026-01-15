'use client'

import { useState, useCallback, useMemo, type ReactNode } from 'react'
import { AppShell } from '@/components/shell'
import { MapContainer, type ParcelData } from '@/components/map'
import { ChatPanel, type ChatMessage, type GenerativeCard } from '@/components/chat'
import { useZoningAgent } from '@/hooks/useZoningAgent'
import { ZoneInfoCard } from '@/components/copilot/ZoneInfoCard'

/**
 * Main application page with chat-first layout.
 * Features the AppShell with 40/60 split view (chat/map).
 * Integrates parcel selection with chat context.
 * Now powered by the Zoning Interpreter Agent with Gemini 3!
 */
export default function Home() {
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  // Layer panel state - will be used in Task Group 7 for LayerPanel integration
  const [_isLayersPanelOpen, setIsLayersPanelOpen] = useState(false)
  const [_selectedParcel, setSelectedParcel] = useState<ParcelData | null>(null)

  // Use the Zoning Agent for chat
  const { messages: agentMessages, isLoading, sendMessage, clearMessages } = useZoningAgent()

  // Convert agent messages to ChatMessage format
  const messages: ChatMessage[] = useMemo(() => {
    return agentMessages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      inputMode: 'text' as const,
      cards: msg.cards, // Pass through generative UI cards
    }))
  }, [agentMessages])

  const handleVoiceToggle = useCallback(() => {
    setIsVoiceActive((prev) => !prev)
  }, [])

  const handleLayersClick = useCallback(() => {
    setIsLayersPanelOpen((prev) => !prev)
  }, [])

  const handleLogoClick = useCallback(() => {
    // Reset to home state
    clearMessages()
    setSelectedParcel(null)
  }, [clearMessages])

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
        return (
          <div className={`p-4 border-2 border-dashed ${isAreaPlan ? 'border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/20' : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'} rounded-lg`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-medium uppercase tracking-wide ${isAreaPlan ? 'text-sky-600 dark:text-sky-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {isAreaPlan ? 'Area Plan Context' : 'Zoning Code Reference'}
              </span>
              {data.confidence && (
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  ({Math.round(data.confidence * 100)}% confidence)
                </span>
              )}
            </div>
            {data.citations && data.citations.length > 0 && (
              <div className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                Sources: {data.citations.map(c => c.sourceName).join(', ')}
              </div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  }, [])

  return (
    <AppShell
      isVoiceActive={isVoiceActive}
      onVoiceToggle={handleVoiceToggle}
      onLayersClick={handleLayersClick}
      onLogoClick={handleLogoClick}
      chatPanel={
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          onVoiceInput={handleVoiceInput}
          isLoading={isLoading}
          placeholder="Ask about zoning, permits, or any property in Milwaukee..."
          renderCard={renderCard}
        />
      }
      mapPanel={
        <MapContainer
          onParcelSelect={handleParcelSelect}
          onParcelClear={handleParcelClear}
          onParcelAsk={handleParcelAsk}
        />
      }
    />
  )
}
