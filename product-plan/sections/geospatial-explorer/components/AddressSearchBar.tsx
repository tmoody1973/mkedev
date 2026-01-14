'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, MapPin, Loader2 } from 'lucide-react'
import type { AddressSearchResult } from '../types'

export interface AddressSearchBarProps {
  placeholder?: string
  results: AddressSearchResult[]
  isLoading?: boolean
  onSearch?: (query: string) => void
  onSelect?: (result: AddressSearchResult) => void
  onClear?: () => void
}

export function AddressSearchBar({
  placeholder = 'Search address...',
  results,
  isLoading = false,
  onSearch,
  onSelect,
  onClear,
}: AddressSearchBarProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const showResults = isFocused && query.length > 0 && (results.length > 0 || isLoading)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    onSearch?.(value)
  }

  const handleClear = () => {
    setQuery('')
    onClear?.()
    inputRef.current?.focus()
  }

  const handleSelect = (result: AddressSearchResult) => {
    setQuery(result.address)
    setIsFocused(false)
    onSelect?.(result)
  }

  return (
    <div ref={containerRef} className="absolute left-4 top-4 right-20 md:right-auto md:w-96 z-10">
      {/* Search Input */}
      <div
        className={`
          relative flex items-center
          bg-white dark:bg-stone-800
          border-2 border-black
          rounded-lg
          shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
          ${showResults ? 'rounded-b-none' : ''}
        `}
      >
        <div className="pl-3 text-stone-400">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          className="
            flex-1 px-3 py-3
            bg-transparent
            text-stone-900 dark:text-stone-100
            placeholder:text-stone-400 dark:placeholder:text-stone-500
            font-body text-sm
            focus:outline-none
          "
        />
        {query && (
          <button
            onClick={handleClear}
            className="
              pr-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300
              transition-colors
            "
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && (
        <div
          className="
            absolute left-0 right-0
            bg-white dark:bg-stone-800
            border-2 border-t-0 border-black
            rounded-b-lg
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
            max-h-64 overflow-y-auto
          "
        >
          {isLoading ? (
            <div className="p-4 text-center text-stone-500 dark:text-stone-400 font-body text-sm">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <ul>
              {results.map((result) => (
                <li key={result.id}>
                  <button
                    onClick={() => handleSelect(result)}
                    className="
                      w-full text-left px-4 py-3
                      flex items-start gap-3
                      hover:bg-sky-50 dark:hover:bg-sky-900/30
                      border-b border-stone-200 dark:border-stone-700 last:border-b-0
                      transition-colors
                    "
                  >
                    <MapPin className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-medium text-stone-900 dark:text-stone-100 text-sm truncate">
                        {result.address}
                      </p>
                      <p className="font-body text-xs text-stone-500 dark:text-stone-400">
                        {result.neighborhood}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-stone-500 dark:text-stone-400 font-body text-sm">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
