'use client'

import { useState, useCallback } from 'react'
import { AppShell } from '@/components/shell'
import { MapContainer, type ParcelData } from '@/components/map'
import { ChatPanel, type ChatMessage } from '@/components/chat'

/**
 * Main application page with chat-first layout.
 * Features the AppShell with 40/60 split view (chat/map).
 * Integrates parcel selection with chat context.
 */
export default function Home() {
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  // Layer panel state - will be used in Task Group 7 for LayerPanel integration
  const [_isLayersPanelOpen, setIsLayersPanelOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [_selectedParcel, setSelectedParcel] = useState<ParcelData | null>(null)

  const handleVoiceToggle = useCallback(() => {
    setIsVoiceActive((prev) => !prev)
  }, [])

  const handleLayersClick = useCallback(() => {
    setIsLayersPanelOpen((prev) => !prev)
  }, [])

  const handleLogoClick = useCallback(() => {
    // Reset to home state
    setMessages([])
    setSelectedParcel(null)
  }, [])

  const handleSendMessage = useCallback((content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      inputMode: 'text',
    }
    setMessages((prev) => [...prev, userMessage])

    // Simulate loading and AI response (placeholder for Week 2 AI integration)
    setIsLoading(true)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: `Thank you for your question about: "${content}"\n\nThis is a placeholder response. AI integration with CopilotKit will be implemented in Week 2, enabling real-time civic intelligence assistance for Milwaukee development questions.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }, [])

  const handleVoiceInput = useCallback(() => {
    // Voice input placeholder - will be implemented in Week 2
    console.log('Voice input triggered - coming in Week 2')
    // For now, show a feedback message
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        role: 'system',
        content: 'Voice input will be available in Week 2 with Gemini Live API integration.',
        timestamp: new Date(),
      },
    ])
  }, [])

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
    const taxKey = parcel.taxKey || 'Unknown'
    const zoning = parcel.zoneCode || 'Unknown'

    // Create user message with parcel context
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: `Tell me about the property at ${address}`,
      timestamp: new Date(),
      inputMode: 'text',
    }
    setMessages((prev) => [...prev, userMessage])

    // Simulate loading and AI response with parcel context
    setIsLoading(true)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: `Here's what I found about **${address}**:\n\n**Tax Key:** ${taxKey}\n**Zoning:** ${zoning}${parcel.lotSize ? `\n**Lot Size:** ${parcel.lotSize.toLocaleString()} sq ft` : ''}${parcel.assessedValue ? `\n**Assessed Value:** $${parcel.assessedValue.toLocaleString()}` : ''}\n\nThis is a placeholder response. Full property analysis with zoning regulations, permitted uses, and development opportunities will be available in Week 2 with AI integration.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
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
