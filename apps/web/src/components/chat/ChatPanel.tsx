'use client'

import { useState, useRef, useEffect, type ReactNode, type FormEvent } from 'react'
import { Send, Mic, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Generative card type for rendering UI components within messages.
 * Maps to the cards field in the Convex messages schema.
 */
export interface GenerativeCard {
  type:
    | 'zone-info'
    | 'parcel-analysis'
    | 'incentives-summary'
    | 'area-plan-context'
    | 'permit-process'
    | 'code-citation'
    | 'opportunity-list'
  data: unknown
}

/**
 * Message structure for chat display.
 * Supports user, assistant, and system roles with optional generative UI cards.
 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  inputMode?: 'text' | 'voice'
  cards?: GenerativeCard[]
}

export interface ChatPanelProps {
  /** Array of messages to display */
  messages: ChatMessage[]
  /** Callback when a message is sent */
  onSendMessage?: (message: string) => void
  /** Callback when voice input is triggered */
  onVoiceInput?: () => void
  /** Whether the assistant is currently responding */
  isLoading?: boolean
  /** Placeholder text for the input field */
  placeholder?: string
  /** Optional render function for generative cards */
  renderCard?: (card: GenerativeCard) => ReactNode
}

/**
 * Chat panel component with neobrutalist styling.
 * Features:
 * - Empty state with microphone icon and prompt
 * - Message list with role-based styling
 * - Loading indicator with animated bouncing dots
 * - Input area with text field, voice button, and send button
 * - Support for generative UI cards in messages
 */
export function ChatPanel({
  messages,
  onSendMessage,
  onVoiceInput,
  isLoading = false,
  placeholder = 'Ask about zoning, permits, or any property in Milwaukee...',
  renderCard,
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmedInput = input.trim()
    if (trimmedInput && onSendMessage) {
      onSendMessage(trimmedInput)
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div
      className="flex flex-col h-full bg-stone-50 dark:bg-stone-950"
      data-testid="chat-panel"
    >
      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                formatTimestamp={formatTimestamp}
                renderCard={renderCard}
              />
            ))}
          </>
        )}

        {/* Loading indicator */}
        {isLoading && <LoadingIndicator />}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t-2 border-black dark:border-stone-700 bg-white dark:bg-stone-900"
        data-testid="chat-input-form"
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            aria-label="Message input"
            className={cn(
              'flex-1 px-4 py-3 rounded-lg border-2 border-black dark:border-white',
              'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100',
              'placeholder:text-stone-500 dark:placeholder:text-stone-400',
              'font-sans text-sm',
              'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]',
              'focus:outline-none focus:ring-2 focus:ring-sky-500',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            data-testid="chat-input"
          />

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={onVoiceInput}
            disabled={isLoading}
            aria-label="Voice input"
            className={cn(
              'w-12 h-12 rounded-lg border-2 border-black dark:border-white',
              'bg-amber-400 text-stone-900',
              'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]',
              'hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]',
              'active:translate-y-2 active:shadow-none',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
              'transition-all duration-100',
              'flex items-center justify-center'
            )}
            data-testid="voice-input-button"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className={cn(
              'w-12 h-12 rounded-lg border-2 border-black dark:border-white',
              'bg-sky-500 text-white',
              'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]',
              'hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]',
              'active:translate-y-2 active:shadow-none',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
              'transition-all duration-100',
              'flex items-center justify-center'
            )}
            data-testid="send-button"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}

/**
 * Empty state displayed when there are no messages.
 * Features a centered microphone icon with prompt text.
 */
function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full text-center px-4"
      data-testid="empty-state"
    >
      {/* Animated microphone icon container */}
      <div className="relative">
        <div
          className={cn(
            'w-20 h-20 mb-6 rounded-full',
            'bg-sky-100 dark:bg-sky-900/50',
            'flex items-center justify-center',
            'border-2 border-black dark:border-white',
            'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]',
            'animate-pulse'
          )}
        >
          <Mic className="w-10 h-10 text-sky-600 dark:text-sky-400" />
        </div>
        {/* Decorative chat bubble */}
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full border-2 border-black flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-stone-900" />
        </div>
      </div>

      <h2 className="font-heading text-2xl font-bold text-stone-900 dark:text-stone-50 mb-3">
        Hey MKE, what can I build?
      </h2>
      <p className="text-stone-600 dark:text-stone-400 font-sans max-w-sm leading-relaxed">
        Ask about zoning rules, financial incentives, permits, or any property in
        Milwaukee. Try voice or type your question below.
      </p>
    </div>
  )
}

/**
 * Individual message bubble with role-based styling.
 */
interface MessageBubbleProps {
  message: ChatMessage
  formatTimestamp: (date: Date) => string
  renderCard?: (card: GenerativeCard) => ReactNode
}

function MessageBubble({ message, formatTimestamp, renderCard }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  return (
    <div
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
      data-testid={`message-${message.role}`}
    >
      <div
        className={cn(
          'max-w-[85%] p-4 rounded-lg border-2 border-black dark:border-white',
          'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]',
          isUser && 'bg-sky-500 text-white',
          !isUser && !isSystem && 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100',
          isSystem && 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 italic'
        )}
      >
        {/* Message content */}
        <p className="font-sans text-sm whitespace-pre-wrap">{message.content}</p>

        {/* Generative UI cards */}
        {message.cards && message.cards.length > 0 && (
          <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-600 space-y-3">
            {message.cards.map((card, index) => (
              <div key={index} data-testid={`card-${card.type}`}>
                {renderCard ? (
                  renderCard(card)
                ) : (
                  <CardPlaceholder type={card.type} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div
          className={cn(
            'mt-2 text-xs',
            isUser ? 'text-sky-100' : 'text-stone-500 dark:text-stone-400'
          )}
        >
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  )
}

/**
 * Placeholder for generative cards (Week 2 implementation).
 */
function CardPlaceholder({ type }: { type: string }) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg border-2 border-dashed border-stone-300 dark:border-stone-600',
        'bg-stone-100 dark:bg-stone-700/50',
        'text-center text-xs text-stone-500 dark:text-stone-400'
      )}
      data-testid="card-placeholder"
    >
      <span className="font-mono">[{type}]</span>
      <span className="block mt-1">Card component - Coming in Week 2</span>
    </div>
  )
}

/**
 * Loading indicator with animated bouncing dots.
 */
function LoadingIndicator() {
  return (
    <div className="flex justify-start" data-testid="loading-indicator">
      <div
        className={cn(
          'p-4 rounded-lg border-2 border-black dark:border-white',
          'bg-white dark:bg-stone-800',
          'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]'
        )}
        role="status"
        aria-label="Assistant is typing"
      >
        <div className="flex space-x-2">
          <div
            className="w-2 h-2 bg-sky-500 rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <div
            className="w-2 h-2 bg-sky-500 rounded-full animate-bounce"
            style={{ animationDelay: '100ms' }}
          />
          <div
            className="w-2 h-2 bg-sky-500 rounded-full animate-bounce"
            style={{ animationDelay: '200ms' }}
          />
        </div>
        <span className="sr-only">Assistant is typing a response</span>
      </div>
    </div>
  )
}
