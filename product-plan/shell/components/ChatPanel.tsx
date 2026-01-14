'use client'

import { Send, Mic } from 'lucide-react'
import { useState } from 'react'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
  /** Optional generative UI component to render */
  uiComponent?: React.ReactNode
}

export interface ChatPanelProps {
  /** Array of messages to display */
  messages: Message[]
  /** Callback when a message is sent */
  onSendMessage?: (message: string) => void
  /** Callback when voice input is triggered */
  onVoiceInput?: () => void
  /** Whether the assistant is currently responding */
  isLoading?: boolean
  /** Placeholder text for the input */
  placeholder?: string
}

export function ChatPanel({
  messages,
  onSendMessage,
  onVoiceInput,
  isLoading = false,
  placeholder = 'Ask about zoning, permits, or any property in Milwaukee...',
}: ChatPanelProps) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && onSendMessage) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-950">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 mb-4 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center border-2 border-black">
              <Mic className="w-8 h-8 text-sky-600 dark:text-sky-400" />
            </div>
            <h2 className="font-heading text-xl font-bold text-stone-900 dark:text-stone-50 mb-2">
              Hey MKE, what can I build?
            </h2>
            <p className="text-stone-600 dark:text-stone-400 font-body max-w-sm">
              Ask about zoning rules, financial incentives, permits, or any property in Milwaukee. Try voice or type your question below.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[85%] p-4 rounded-lg border-2 border-black
                  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
                  ${
                    message.role === 'user'
                      ? 'bg-sky-500 text-white'
                      : 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                  }
                `}
              >
                <p className="font-body text-sm whitespace-pre-wrap">{message.content}</p>
                {message.uiComponent && (
                  <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-700">
                    {message.uiComponent}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-stone-800 p-4 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t-2 border-black dark:border-stone-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
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
            onClick={onVoiceInput}
            className="
              w-12 h-12 rounded-lg border-2 border-black
              bg-amber-400 text-stone-900
              shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
              hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
              active:translate-y-2 active:shadow-none
              transition-all duration-100
              flex items-center justify-center
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
              flex items-center justify-center
            "
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
