'use client'

import { useState } from 'react'
import { EnhancedChatPanel } from './EnhancedChatPanel'
import { HistorySidebar } from './HistorySidebar'
import type { ConversationalInterfaceProps } from '../types'

/**
 * ConversationalInterface - Main composite component for the chat experience
 *
 * This component combines the chat panel with the history sidebar and voice state
 * management. It's designed to be embedded within the AppShell.
 */
export function ConversationalInterface({
  conversations,
  activeConversation,
  voiceState,
  onSendMessage,
  onVoiceInput,
  onVoiceStop,
  onSelectConversation,
  onToggleStar,
  onDeleteConversation,
  onSearchConversations,
  onNewConversation,
  onMapClick,
  onCardAction,
}: ConversationalInterfaceProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleOpenHistory = () => {
    setIsHistoryOpen(true)
  }

  const handleCloseHistory = () => {
    setIsHistoryOpen(false)
  }

  const handleSelectConversation = (conversationId: string) => {
    onSelectConversation?.(conversationId)
    setIsHistoryOpen(false)
  }

  const handleNewConversation = () => {
    onNewConversation?.()
    setIsHistoryOpen(false)
  }

  return (
    <div className="relative h-full">
      {/* Main Chat Panel */}
      <EnhancedChatPanel
        messages={activeConversation?.messages ?? []}
        isLoading={isLoading}
        voiceState={voiceState}
        onSendMessage={onSendMessage}
        onVoiceInput={onVoiceInput}
        onVoiceStop={onVoiceStop}
        onCardAction={onCardAction}
        onOpenHistory={handleOpenHistory}
      />

      {/* History Sidebar */}
      <HistorySidebar
        conversations={conversations}
        activeConversationId={activeConversation?.id}
        isOpen={isHistoryOpen}
        onClose={handleCloseHistory}
        onSelectConversation={handleSelectConversation}
        onToggleStar={onToggleStar}
        onDeleteConversation={onDeleteConversation}
        onSearch={onSearchConversations}
        onNewConversation={handleNewConversation}
      />
    </div>
  )
}
