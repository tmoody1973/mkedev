'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Menu } from 'lucide-react'
import { GenerativeCardRenderer } from './GenerativeCards'
import { InlineWaveform } from './VoiceIndicator'
import type {
  Message,
  VoiceState,
  ChatPanelProps,
} from '../types'

export interface EnhancedChatPanelProps extends Omit<ChatPanelProps, 'messages'> {
  messages: Message[]
  voiceState?: VoiceState
  onVoiceStop?: () => void
  onCardAction?: (cardType: string, action: string, data: unknown) => void
  onOpenHistory?: () => void
}

export function EnhancedChatPanel({
  messages,
  isLoading = false,
  onSendMessage,
  onVoiceInput,
  onVoiceStop,
  voiceState = { isActive: false, waveformData: [] },
  onCardAction,
  onOpenHistory,
}: EnhancedChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && onSendMessage) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  const handleVoiceToggle = () => {
    if (voiceState.isActive) {
      onVoiceStop?.()
    } else {
      onVoiceInput?.()
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-950">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onOpenHistory={onOpenHistory} />
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onCardAction={onCardAction}
                formatTime={formatTime}
              />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-stone-800 p-4 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t-2 border-black dark:border-stone-700 bg-white dark:bg-stone-900">
        {/* Voice Active State */}
        {voiceState.isActive ? (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <InlineWaveform
                waveformData={voiceState.waveformData}
                isActive={voiceState.isActive}
              />
            </div>
            <button
              onClick={handleVoiceToggle}
              className="
                w-12 h-12 rounded-lg border-2 border-black
                bg-rose-500 text-white
                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                active:translate-y-2 active:shadow-none
                transition-all duration-100
                flex items-center justify-center
              "
              aria-label="Stop listening"
            >
              <MicOff className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            {/* History Button */}
            <button
              type="button"
              onClick={onOpenHistory}
              className="
                w-12 h-12 rounded-lg border-2 border-black
                bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300
                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
                hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                active:translate-y-2 active:shadow-none
                transition-all duration-100
                flex items-center justify-center flex-shrink-0
              "
              aria-label="Open conversation history"
            >
              <Menu className="w-5 h-5" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about zoning, permits, or any property in Milwaukee..."
              className="
                flex-1 px-4 py-3 rounded-lg border-2 border-black
                bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100
                placeholder:text-stone-500 dark:placeholder:text-stone-400
                font-body text-sm
                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
                focus:outline-none focus:ring-2 focus:ring-sky-500
              "
              disabled={isLoading}
            />

            <button
              type="button"
              onClick={handleVoiceToggle}
              className="
                w-12 h-12 rounded-lg border-2 border-black
                bg-amber-400 text-stone-900
                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                active:translate-y-2 active:shadow-none
                transition-all duration-100
                flex items-center justify-center flex-shrink-0
              "
              aria-label="Voice input"
            >
              <Mic className="w-5 h-5" />
            </button>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="
                w-12 h-12 rounded-lg border-2 border-black
                bg-sky-500 text-white
                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                active:translate-y-2 active:shadow-none
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                transition-all duration-100
                flex items-center justify-center flex-shrink-0
              "
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Message Bubble
// =============================================================================

interface MessageBubbleProps {
  message: Message
  onCardAction?: (cardType: string, action: string, data: unknown) => void
  formatTime: (timestamp: string) => string
}

function MessageBubble({ message, onCardAction, formatTime }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[90%] md:max-w-[80%]">
        {/* Input Mode Badge */}
        {isUser && message.inputMode && (
          <div className="flex justify-end mb-1">
            <span className={`
              text-xs px-2 py-0.5 rounded
              ${message.inputMode === 'voice'
                ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              }
            `}>
              {message.inputMode === 'voice' ? 'Voice' : 'Typed'}
            </span>
          </div>
        )}

        {/* Message Content */}
        <div
          className={`
            p-4 rounded-lg border-2 border-black
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
            ${
              isUser
                ? 'bg-sky-500 text-white'
                : 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100'
            }
          `}
        >
          <p className="font-body text-sm whitespace-pre-wrap">{message.content}</p>

          {/* Generative UI Cards */}
          {message.cards && message.cards.length > 0 && (
            <div className="space-y-3">
              {message.cards.map((card, index) => (
                <GenerativeCardRenderer
                  key={index}
                  card={card}
                  onAction={(action, data) =>
                    onCardAction?.(card.type, action, data)
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mt-1`}>
          <span className="text-xs text-stone-400">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Empty State
// =============================================================================

interface EmptyStateProps {
  onOpenHistory?: () => void
}

function EmptyState({ onOpenHistory }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
      {/* Logo/Icon */}
      <div className="w-20 h-20 mb-6 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <Mic className="w-10 h-10 text-sky-600 dark:text-sky-400" />
      </div>

      <h2 className="font-heading text-2xl font-bold text-stone-900 dark:text-stone-50 mb-3">
        Hey MKE, what can I build?
      </h2>

      <p className="text-stone-600 dark:text-stone-400 font-body max-w-md mb-8">
        Ask about zoning rules, financial incentives, permits, or any property in Milwaukee. Try voice or type your question below.
      </p>

      {/* Suggested Questions */}
      <div className="space-y-2 w-full max-w-md">
        <p className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-3">
          Try asking:
        </p>
        <SuggestedQuestion text="Can I build an ADU in my backyard?" />
        <SuggestedQuestion text="What incentives are available for a project on N King Drive?" />
        <SuggestedQuestion text="What's the zoning at 123 W Wisconsin Ave?" />
      </div>

      {/* View History Link */}
      <button
        onClick={onOpenHistory}
        className="mt-8 text-sm text-sky-600 dark:text-sky-400 hover:underline font-body"
      >
        View conversation history
      </button>
    </div>
  )
}

function SuggestedQuestion({ text }: { text: string }) {
  return (
    <button className="
      w-full text-left px-4 py-3 rounded-lg
      bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700
      text-stone-700 dark:text-stone-300 font-body text-sm
      hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/30
      transition-colors
    ">
      "{text}"
    </button>
  )
}
