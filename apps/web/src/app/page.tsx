'use client'

import { useState, useCallback, useMemo } from 'react'
import { AppShell } from '@/components/shell'
import { MapContainer, type ParcelData } from '@/components/map'
import { ChatPanel, type ChatMessage } from '@/components/chat'
import { useZoningAgent } from '@/hooks/useZoningAgent'

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
