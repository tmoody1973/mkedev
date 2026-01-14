'use client'

import { useState } from 'react'
import type { PromptInputProps } from '../types'

export function PromptInput({
  value,
  placeholder = "Describe what you'd like to visualize...",
  isVoiceActive = false,
  isDisabled = false,
  onChange,
  onSubmit,
  onVoiceToggle,
}: PromptInputProps) {
  const [localValue, setLocalValue] = useState(value || '')
  const currentValue = value ?? localValue

  const handleChange = (newValue: string) => {
    if (onChange) {
      onChange(newValue)
    } else {
      setLocalValue(newValue)
    }
  }

  const handleSubmit = () => {
    if (currentValue.trim() && onSubmit) {
      onSubmit(currentValue.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="relative">
        {/* Main input container */}
        <div className={`
          flex items-center gap-3 px-4 py-3 rounded-xl
          bg-white dark:bg-stone-800
          border-2 border-black dark:border-stone-600
          shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(68,64,60,1)]
          ${isDisabled ? 'opacity-60' : ''}
          ${isVoiceActive ? 'ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-stone-900' : ''}
        `}>
          {/* Sparkles icon */}
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
          </div>

          {/* Text input */}
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isDisabled}
            className={`
              flex-1 bg-transparent border-none outline-none
              font-body text-stone-900 dark:text-stone-100
              placeholder:text-stone-400 dark:placeholder:text-stone-500
              disabled:cursor-not-allowed
            `}
          />

          {/* Voice button */}
          <button
            onClick={onVoiceToggle}
            disabled={isDisabled}
            className={`
              flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
              transition-all
              ${isVoiceActive
                ? 'bg-sky-500 text-white animate-pulse'
                : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title={isVoiceActive ? 'Stop voice input' : 'Start voice input'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </button>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={isDisabled || !currentValue.trim()}
            className={`
              flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
              bg-sky-500 text-white
              border-2 border-black dark:border-sky-400
              shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
              hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]
              transition-all
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:hover:translate-x-0 disabled:hover:translate-y-0
            `}
            title="Generate visualization"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>

        {/* Voice active indicator */}
        {isVoiceActive && (
          <div className="absolute -bottom-8 left-0 right-0 flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              Listening...
            </div>
          </div>
        )}
      </div>

      {/* Helper text */}
      <p className="mt-3 text-center font-mono text-xs text-stone-500 dark:text-stone-400">
        Try: "Show me a modern duplex" or "What would a 2-story ADU look like?"
      </p>
    </div>
  )
}
